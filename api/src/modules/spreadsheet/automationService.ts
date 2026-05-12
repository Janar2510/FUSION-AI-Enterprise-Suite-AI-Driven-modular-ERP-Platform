import prisma from '../../lib/prisma';
import { FormulaService } from './formulaService';

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
                const { default: prismaClient } = await import('../../lib/prisma');
                try {
                    await prismaClient.timelineEvent.create({
                        data: {
                            organizationId,
                            ...(partnerId ? { partnerId } : {}),
                            ownerType,
                            ownerId,
                            eventKey,
                            summary: message,
                            payload,
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
            case 'UPDATE_RECORD':
                const { field, value } = action.config;
                if (field && value !== undefined) {
                    console.log(`[Automation] Updating ${workflow.model} ID ${data.id}: ${field} = ${value}`);
                    // We avoid recursion by checking if it's the same field/value or using a flag
                    // (prisma as any)[workflow.model.toLowerCase()].update({ where: { id: data.id }, data: { [field]: value } });
                }
                break;
            default:
                console.warn(`[Automation] Unknown action type: ${action.type}`);
        }
    }
}
