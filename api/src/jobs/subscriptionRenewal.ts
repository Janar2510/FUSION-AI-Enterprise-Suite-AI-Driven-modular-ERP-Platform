/**
 * jobs/subscriptionRenewal — checks subscriptions due for renewal every hour.
 * For each active subscription whose nextBilling <= now, creates a renewal
 * invoice (draft) and advances nextBilling by one billing period.
 *
 * Sprint 19B requirement: renewal billing trigger.
 */

import prisma from '../lib/prisma';
import { logger } from '../core/logger';

const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function computeNextBilling(from: Date, rule: string): Date {
    const d = new Date(from);
    if (rule === 'annual') d.setFullYear(d.getFullYear() + 1);
    else if (rule === 'quarterly') d.setMonth(d.getMonth() + 3);
    else d.setMonth(d.getMonth() + 1); // monthly default
    return d;
}

async function processDueRenewals(): Promise<void> {
    try {
        const now = new Date();
        const due = await prisma.subscription.findMany({
            where: {
                state: 'active',
                nextBilling: { lte: now },
            },
            include: {
                lines: true,
                partner: { select: { id: true, name: true } },
                recurringPlan: true,
            },
        });

        if (due.length === 0) return;

        const journal = await prisma.accountJournal.findFirst({ where: { type: 'sale' } });
        if (!journal) {
            logger.warn('[SubscriptionRenewal] No sales journal found — skipping');
            return;
        }

        for (const sub of due) {
            try {
                const rule = sub.recurringPlan?.code ?? sub.recurringRule ?? 'monthly';
                const total = sub.lines.reduce((s, l) => s + l.priceSubtotal, 0);
                const count = await prisma.accountMove.count({ where: { moveType: 'out_invoice' } });
                const name = `RINV/${now.getFullYear()}/${String(count + 1).padStart(5, '0')}`;

                await prisma.$transaction([
                    prisma.accountMove.create({
                        data: {
                            name,
                            moveType: 'out_invoice',
                            state: 'draft',
                            date: now,
                            dueDate: computeNextBilling(now, rule),
                            amountUntaxed: total,
                            amountTax: 0,
                            amountTotal: total,
                            amountResidual: total,
                            journalId: journal.id,
                            partnerId: sub.partnerId,
                            ref: `Auto-renewal: Subscription ${sub.name ?? sub.id}`,
                            lines: {
                                create: sub.lines.map(l => ({
                                    name: l.name,
                                    quantity: l.quantity,
                                    priceUnit: l.priceUnit,
                                    priceSubtotal: l.priceSubtotal,
                                    priceTotal: l.priceSubtotal,
                                    debit: 0, credit: 0, balance: 0,
                                })),
                            },
                        },
                    }),
                    prisma.subscription.update({
                        where: { id: sub.id },
                        data: { nextBilling: computeNextBilling(sub.nextBilling ?? now, rule) },
                    }),
                ]);

                logger.info({ subId: sub.id, total }, '[SubscriptionRenewal] Renewal invoice created');
            } catch (subErr) {
                logger.error({ err: subErr, subId: sub.id }, '[SubscriptionRenewal] Failed to renew subscription');
            }
        }
    } catch (err) {
        logger.error({ err }, '[SubscriptionRenewal] Error in renewal job');
    }
}

export function startSubscriptionRenewal(): void {
    void processDueRenewals();
    setInterval(() => void processDueRenewals(), INTERVAL_MS);
    logger.info('[SubscriptionRenewal] Renewal billing job started (every 1 hour)');
}
