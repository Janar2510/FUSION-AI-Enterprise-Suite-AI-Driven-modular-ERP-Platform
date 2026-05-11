/**
 * Marketing campaign workflow runner — advances participants through activity
 * chains on a timer. Dispatches email/SMS via transactional OutboxEvent.
 */

import cron from 'node-cron';
import prisma from '../lib/prisma';
import { logger } from '../core/logger';
import {
    addActivityDelay,
    pickNextActivityInChain,
    sortActivitiesForChain,
    type WorkflowActivity,
} from '../lib/marketingWorkflow';

const BATCH_SIZE = 50;

/** Extend with async handlers keyed by `CampaignActivity.serverAction`. */
export const campaignServerActions: Record<
    string,
    (ctx: {
        traceId: number;
        campaignId: number;
        activityId: number;
        participantId: number;
    }) => Promise<void>
> = {};

let isRunning = false;

type ParticipantWithCampaign = {
    id: number;
    campaignId: number;
    lastActivityId: number | null;
    nextActionAt: Date | null;
    state: string;
    email: string | null;
    phone: string | null;
    campaign: {
        id: number;
        state: string;
        activities: WorkflowActivity[];
    };
};

function coerceActivity(row: {
    id: number;
    sequence: number;
    type: string;
    delayValue: number;
    delayUnit: string;
    subject: string | null;
    body: string | null;
    serverAction: string | null;
}): WorkflowActivity {
    return row;
}

export async function runCampaignWorkflowTick(): Promise<void> {
    if (isRunning) return;
    isRunning = true;
    const now = new Date();

    try {
        const participants = (await prisma.campaignParticipant.findMany({
            where: {
                state: { in: ['queued', 'active'] },
                nextActionAt: { lte: now },
                campaign: { state: 'active' },
            },
            take: BATCH_SIZE,
            orderBy: { nextActionAt: 'asc' },
            include: {
                campaign: {
                    include: {
                        activities: {
                            orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
                        },
                    },
                },
            },
        })) as unknown as ParticipantWithCampaign[];

        for (const p of participants) {
            try {
                await processOneParticipant(p, now);
            } catch (err) {
                logger.error({ err, participantId: p.id }, '[CampaignRunner] participant tick failed');
            }
        }
    } catch (err) {
        logger.error({ err }, '[CampaignRunner] tick failed');
    } finally {
        isRunning = false;
    }
}

async function processOneParticipant(participant: ParticipantWithCampaign, now: Date): Promise<void> {
    const sorted = sortActivitiesForChain(
        participant.campaign.activities.map((a) => coerceActivity(a))
    );
    const current = pickNextActivityInChain(sorted, participant.lastActivityId);

    if (!current) {
        await prisma.campaignParticipant.update({
            where: { id: participant.id },
            data: { state: 'completed', nextActionAt: null },
        });
        return;
    }

    const scheduledAt = participant.nextActionAt ?? now;

    await prisma.$transaction(async (tx) => {
        const trace = await tx.campaignTrace.create({
            data: {
                campaignId: participant.campaignId,
                activityId: current.id,
                participantId: participant.id,
                status: 'pending',
                scheduledAt,
            },
        });

        let finalTrace: {
            status: string;
            reason: string | null;
            dispatchedAt: Date | null;
            outboxEventId: string | null;
        };

        let rejectedDelta = 0;

        if (current.type === 'email') {
            const subject = current.subject?.trim();
            const body = current.body?.trim();
            if (!participant.email || !subject || !body) {
                finalTrace = {
                    status: 'rejected',
                    reason: !participant.email ? 'missing_email' : 'missing_content',
                    dispatchedAt: null,
                    outboxEventId: null,
                };
                rejectedDelta = 1;
            } else {
                const ev = await tx.outboxEvent.create({
                    data: {
                        organizationId: '',
                        eventKey: 'email.send',
                        payload: {
                            to: participant.email,
                            templateKey: 'marketing-campaign',
                            vars: { subjectLine: subject, htmlBody: body },
                            traceId: trace.id,
                            activityId: current.id,
                            campaignId: participant.campaignId,
                            participantId: participant.id,
                        },
                    },
                });
                finalTrace = {
                    status: 'dispatched',
                    reason: null,
                    dispatchedAt: now,
                    outboxEventId: ev.id,
                };
            }
        } else if (current.type === 'sms') {
            if (!participant.phone?.trim()) {
                finalTrace = {
                    status: 'rejected',
                    reason: 'missing_phone',
                    dispatchedAt: null,
                    outboxEventId: null,
                };
                rejectedDelta = 1;
            } else {
                const ev = await tx.outboxEvent.create({
                    data: {
                        organizationId: '',
                        eventKey: 'sms.send',
                        payload: {
                            to: participant.phone,
                            traceId: trace.id,
                            activityId: current.id,
                            campaignId: participant.campaignId,
                            participantId: participant.id,
                        },
                    },
                });
                finalTrace = {
                    status: 'dispatched',
                    reason: null,
                    dispatchedAt: now,
                    outboxEventId: ev.id,
                };
            }
        } else if (current.type === 'server_action') {
            const key = current.serverAction?.trim();
            if (!key) {
                finalTrace = {
                    status: 'rejected',
                    reason: 'missing_server_action',
                    dispatchedAt: null,
                    outboxEventId: null,
                };
                rejectedDelta = 1;
            } else {
                const handler = campaignServerActions[key];
                if (!handler) {
                    finalTrace = {
                        status: 'rejected',
                        reason: 'unsupported_action',
                        dispatchedAt: null,
                        outboxEventId: null,
                    };
                    rejectedDelta = 1;
                } else {
                    await handler({
                        traceId: trace.id,
                        campaignId: participant.campaignId,
                        activityId: current.id,
                        participantId: participant.id,
                    });
                    finalTrace = {
                        status: 'delivered',
                        reason: null,
                        dispatchedAt: now,
                        outboxEventId: null,
                    };
                    await tx.campaignActivity.update({
                        where: { id: current.id },
                        data: { successCount: { increment: 1 } },
                    });
                }
            }
        } else {
            finalTrace = {
                status: 'rejected',
                reason: 'unsupported_activity_type',
                dispatchedAt: null,
                outboxEventId: null,
            };
            rejectedDelta = 1;
        }

        await tx.campaignTrace.update({
            where: { id: trace.id },
            data: {
                status: finalTrace.status,
                reason: finalTrace.reason,
                dispatchedAt: finalTrace.dispatchedAt,
                outboxEventId: finalTrace.outboxEventId,
            },
        });

        if (rejectedDelta > 0) {
            await tx.campaignActivity.update({
                where: { id: current.id },
                data: { rejectedCount: { increment: rejectedDelta } },
            });
        }

        const following = pickNextActivityInChain(sorted, current.id);
        if (!following) {
            await tx.campaignParticipant.update({
                where: { id: participant.id },
                data: {
                    lastActivityId: current.id,
                    state: 'completed',
                    nextActionAt: null,
                },
            });
            return;
        }

        const nextAt = addActivityDelay(now, following.delayValue, following.delayUnit, logger);
        await tx.campaignParticipant.update({
            where: { id: participant.id },
            data: {
                lastActivityId: current.id,
                state: 'active',
                nextActionAt: nextAt,
            },
        });
    });
}

export function startCampaignWorkflowRunner(): void {
    void runCampaignWorkflowTick();
    cron.schedule('*/30 * * * * *', () => void runCampaignWorkflowTick());
    logger.info('[CampaignRunner] workflow job scheduled (every 30s)');
}
