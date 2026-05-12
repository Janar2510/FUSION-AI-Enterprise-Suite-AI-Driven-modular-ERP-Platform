import type { Prisma } from '@prisma/client';

import prisma, { runAutomationSkipped } from '../../lib/prisma';
import { FormulaService } from './formulaService';

/** PascalCase model names blocked for `UPDATE_RECORD` (identity, audit, outbox, workflow meta). */
const AUTOMATION_UPDATE_BLOCKLIST = new Set<string>([
    'Workflow',
    'SpineUser',
    'SpineRole',
    'SpinePermission',
    'SpineUserRole',
    'SpineRolePermission',
    'OutboxEvent',
    'AuditLog',
    'UserPasskey',
    'TimelineEvent',
    'Organization',
]);

function modelToPrismaDelegateKey(model: string): string {
    if (!model.length) return model;
    return model.charAt(0).toLowerCase() + model.slice(1);
}

export class AutomationService {
    /**
     * Handle model change events and trigger workflows
     */
    static async handleEvent(model: string, trigger: 'ON_CREATE' | 'ON_UPDATE', data: any) {
        console.log(`[Automation] Event intercepted: ${model} ${trigger}`);

        const workflows = await prisma.workflow.findMany({
            where: {
                model,
                trigger,
                active: true
            }
        });

        for (const workflow of workflows) {
            try {
                // 1. Evaluate Condition
                if (workflow.condition) {
                    const isConditionMet = await FormulaService.evaluateFormula(workflow.condition, data);
                    if (!isConditionMet) {
                        console.log(`[Automation] Condition not met for workflow: ${workflow.name}`);
                        continue;
                    }
                }

                // 2. Execute Action
                const action = JSON.parse(workflow.action);
                await this.executeAction(action, data, workflow);

                console.log(`[Automation] Workflow executed successfully: ${workflow.name}`);
            } catch (error) {
                console.error(`[Automation] Failed to execute workflow ${workflow.name}:`, error);
            }
        }
    }

    /**
     * Run a single CRON-triggered workflow by id (scheduled from `workflowCronBootstrap`).
     * `Workflow.condition` holds the cron expression for registration; it is not re-evaluated as a formula on tick.
     */
    static async runCronWorkflow(workflowId: number): Promise<void> {
        const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
        if (!workflow || workflow.trigger !== 'CRON' || !workflow.active) {
            return;
        }
        const data: Record<string, unknown> = { organizationId: 'default' };
        let action: any;
        try {
            action = JSON.parse(workflow.action);
        } catch (e) {
            console.error(`[Automation] CRON workflow ${workflowId}: invalid action JSON`, e);
            return;
        }
        const cfg = action?.config && typeof action.config === 'object' ? action.config : {};
        const orgRaw = (cfg as Record<string, unknown>).organizationId;
        if (typeof orgRaw === 'string' && orgRaw.length > 0) {
            data.organizationId = orgRaw;
        }

        const runCondition =
            typeof (cfg as Record<string, unknown>).condition === 'string'
                ? ((cfg as Record<string, unknown>).condition as string)
                : undefined;
        if (runCondition && runCondition.trim().length > 0) {
            const ok = await FormulaService.evaluateFormula(runCondition, data);
            if (!ok) {
                console.log(`[Automation] CRON "${workflow.name}": run condition not met`);
                return;
            }
        }

        try {
            await this.executeAction(action, data, workflow);
            console.log(`[Automation] CRON workflow OK: ${workflow.name}`);
        } catch (error) {
            console.error(`[Automation] CRON workflow failed: ${workflow.name}`, error);
        }
    }

    private static async executeAction(action: any, data: any, workflow: any) {
        switch (action.type) {
            case 'NOTIFICATION': {
                const cfg =
                    action.config && typeof action.config === 'object'
                        ? action.config
                        : ({} as Record<string, unknown>);
                const message = String(cfg.message ?? cfg.title ?? 'Workflow triggered');
                const orgRaw = data.organizationId ?? cfg.organizationId;
                const organizationId =
                    typeof orgRaw === 'string' && orgRaw.length > 0 ? orgRaw : 'default';
                const ownerType =
                    typeof cfg.ownerType === 'string' && cfg.ownerType.length > 0
                        ? cfg.ownerType
                        : workflow.model;
                const rawOwner = cfg.ownerId ?? data?.id;
                const ownerId = rawOwner != null && String(rawOwner).length > 0 ? String(rawOwner) : '';
                if (!ownerId) {
                    console.warn(
                        '[Automation] NOTIFICATION: missing owner — set config.ownerId or ensure record has id'
                    );
                    break;
                }
                let partnerId: string | undefined;
                if (cfg.partnerId != null && String(cfg.partnerId).length > 0) {
                    partnerId = String(cfg.partnerId);
                } else if (data?.partnerId != null && String(data.partnerId).length > 0) {
                    partnerId = String(data.partnerId);
                }
                const eventKey =
                    typeof cfg.eventKey === 'string' && cfg.eventKey.length > 0
                        ? cfg.eventKey
                        : 'workflow.notification';
                const payload: Record<string, unknown> = {
                    workflowId: workflow.id,
                    workflowName: workflow.name,
                    triggerModel: workflow.model,
                    message,
                };
                if (cfg.meta && typeof cfg.meta === 'object' && !Array.isArray(cfg.meta)) {
                    Object.assign(payload, cfg.meta as Record<string, unknown>);
                }
                try {
                    await prisma.timelineEvent.create({
                        data: {
                            organizationId,
                            ...(partnerId ? { partnerId } : {}),
                            ownerType,
                            ownerId,
                            eventKey,
                            summary: message,
                            payload: payload as Prisma.InputJsonValue,
                        },
                    });
                    console.log(`[Automation] NOTIFICATION → timeline (${ownerType}/${ownerId})`);
                } catch (err) {
                    console.error('[Automation] NOTIFICATION timeline write failed:', err);
                }
                break;
            }
            case 'EMAIL': {
                const cfg =
                    action.config && typeof action.config === 'object' ? action.config : ({} as Record<string, unknown>);
                const rawTo = (cfg.to as string | undefined) ?? data.workEmail ?? data.email;
                const to = typeof rawTo === 'string' ? rawTo.trim() : '';
                if (!to) {
                    console.warn('[Automation] EMAIL action: missing recipient (config.to or record email/workEmail)');
                    break;
                }
                const orgRaw = data.organizationId ?? cfg.organizationId;
                const organizationId =
                    typeof orgRaw === 'string' && orgRaw.length > 0 ? orgRaw : 'default';
                const templateKey =
                    typeof cfg.templateKey === 'string' && cfg.templateKey.length > 0
                        ? cfg.templateKey
                        : 'workflow-automation';
                const message = String(
                    cfg.message ?? cfg.body ?? 'A workflow ran for this record.'
                );
                const vars: Record<string, string> = { message };
                if (cfg.vars && typeof cfg.vars === 'object') {
                    for (const [k, v] of Object.entries(cfg.vars as Record<string, unknown>)) {
                        if (v != null) vars[k] = String(v);
                    }
                }
                const { publishEvent } = await import('../../core/outbox');
                const subject =
                    typeof cfg.subject === 'string' && cfg.subject.length > 0 ? cfg.subject : undefined;
                await publishEvent({
                    organizationId,
                    eventKey: 'email.send',
                    payload: {
                        to,
                        templateKey,
                        vars,
                        ...(subject ? { subject } : {}),
                    },
                });
                console.log(`[Automation] EMAIL queued via outbox for ${to} (${templateKey})`);
                break;
            }
            case 'UPDATE_RECORD': {
                const cfg =
                    action.config && typeof action.config === 'object'
                        ? action.config
                        : ({} as Record<string, unknown>);
                const field =
                    typeof cfg.field === 'string' ? cfg.field.trim() : '';
                const value = cfg.value;
                const rawId = data?.id ?? cfg.id;
                if (!field || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
                    console.warn('[Automation] UPDATE_RECORD: invalid or missing field name');
                    break;
                }
                if (rawId == null || String(rawId).length === 0) {
                    console.warn('[Automation] UPDATE_RECORD: missing record id (trigger data or config.id)');
                    break;
                }
                const modelLabel = typeof workflow.model === 'string' ? workflow.model : '';
                if (!modelLabel || !/^[A-Za-z][A-Za-z0-9_]*$/.test(modelLabel)) {
                    console.warn('[Automation] UPDATE_RECORD: invalid workflow.model');
                    break;
                }
                if (AUTOMATION_UPDATE_BLOCKLIST.has(modelLabel)) {
                    console.warn(`[Automation] UPDATE_RECORD: model "${modelLabel}" is not automation-writable`);
                    break;
                }
                const delegateKey = modelToPrismaDelegateKey(modelLabel);
                const delegate = (
                    prisma as unknown as Record<
                        string,
                        { update: (args: Record<string, unknown>) => Promise<unknown> }
                    >
                )[delegateKey];
                if (!delegate || typeof delegate.update !== 'function') {
                    console.warn(
                        `[Automation] UPDATE_RECORD: no Prisma delegate "${delegateKey}" for model "${modelLabel}"`
                    );
                    break;
                }
                await runAutomationSkipped(async () => {
                    await delegate.update({
                        where: { id: rawId },
                        data: { [field]: value },
                    });
                });
                console.log(
                    `[Automation] UPDATE_RECORD → ${delegateKey} id=${rawId} ${field}=`
                );
                break;
            }
            default:
                console.warn(`[Automation] Unknown action type: ${action.type}`);
        }
    }
}
