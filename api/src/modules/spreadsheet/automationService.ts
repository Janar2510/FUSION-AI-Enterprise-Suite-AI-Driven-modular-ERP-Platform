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
            case 'NOTIFICATION':
                console.log(`[Automation] Sending Notification: ${action.config.message || 'Workflow Triggered'}`);
                // In a real app, emit a socket.io event or create a Notify record
                break;
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
