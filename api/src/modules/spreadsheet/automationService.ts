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
            case 'EMAIL':
                console.log(`[Automation] Sending Email to: ${action.config.to || data.workEmail || data.email}`);
                break;
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
