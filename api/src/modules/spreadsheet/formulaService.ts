import prisma from '../../lib/prisma';

import type { WorkflowEventTrigger } from './workflowCondition';
import {
    evaluateStructuredCondition,
    isCronOnlyConditionSpec,
    looksLikeStructuredConditionSpec,
} from './workflowCondition';

export type { WorkflowEventTrigger } from './workflowCondition';

export class FormulaService {
    /**
     * Evaluates a "Neural Formula" by fetching live data from other modules.
     * Format: =MODULE.METRIC
     */
    static async evaluateNeuralFormula(formula: string): Promise<any> {
        if (!formula.startsWith('=') || !formula.includes('.')) {
            return formula;
        }

        const path = formula.substring(1).toUpperCase(); // e.g., CRM.TOTAL_REVENUE
        const [module, metric] = path.split('.');

        try {
            switch (module) {
                case 'CRM':
                    return await this.handleCrmMetric(metric);
                case 'HR':
                    return await this.handleHrMetric(metric);
                case 'ACCOUNTING':
                    return await this.handleAccountingMetric(metric);
                case 'SALES':
                    return await this.handleSalesMetric(metric);
                case 'INVENTORY':
                    return await this.handleInventoryMetric(metric);
                default:
                    return `#UNKNOWN_MODULE:${module}`;
            }
        } catch (e) {
            console.error(`Error evaluating formula ${formula}:`, e);
            return '#REF_ERROR!';
        }
    }

    private static async handleCrmMetric(metric: string): Promise<any> {
        switch (metric) {
            case 'LEAD_COUNT': return await prisma.crmLead.count({ where: { type: 'lead' } });
            case 'OPPORTUNITY_COUNT': return await prisma.crmLead.count({ where: { type: 'opportunity' } });
            case 'TOTAL_EXPECTED_REVENUE':
                const res = await prisma.crmLead.aggregate({ _sum: { expectedRevenue: true } });
                return res._sum.expectedRevenue || 0;
            default: return `#UNKNOWN_METRIC:${metric}`;
        }
    }

    private static async handleHrMetric(metric: string): Promise<any> {
        switch (metric) {
            case 'EMPLOYEE_COUNT': return await prisma.hrEmployee.count({ where: { active: true } });
            case 'DEPARTMENT_COUNT': return await prisma.hrDepartment.count();
            default: return `#UNKNOWN_METRIC:${metric}`;
        }
    }

    private static async handleAccountingMetric(metric: string): Promise<any> {
        switch (metric) {
            case 'TOTAL_RECEIVABLES':
                const res = await prisma.accountMove.aggregate({
                    where: { moveType: 'out_invoice', state: 'posted' },
                    _sum: { amountTotal: true }
                });
                return res._sum.amountTotal || 0;
            default: return `#UNKNOWN_METRIC:${metric}`;
        }
    }

    private static async handleSalesMetric(metric: string): Promise<any> {
        switch (metric) {
            case 'TOTAL_SALES':
                const res = await prisma.saleOrder.aggregate({
                    where: { state: 'sale' },
                    _sum: { amountTotal: true }
                });
                return res._sum.amountTotal || 0;
            default: return `#UNKNOWN_METRIC:${metric}`;
        }
    }

    private static async handleInventoryMetric(metric: string): Promise<any> {
        switch (metric) {
            case 'PRODUCT_COUNT': return await prisma.product.count({ where: { active: true } });
            default: return `#UNKNOWN_METRIC:${metric}`;
        }
    }

    /**
     * Processes an entire spreadsheet data buffer and evaluates neural formulas.
     */
    static async processDataBuffer(data: any): Promise<any> {
        if (!data.rows) return data;

        const processedRows = { ...data.rows };

        for (const rowIdx of Object.keys(processedRows)) {
            const row = processedRows[rowIdx];
            if (!row.cells) continue;

            for (const colKey of Object.keys(row.cells)) {
                const cell = row.cells[colKey];
                if (cell.formula && cell.formula.startsWith('=')) {
                    cell.value = await this.evaluateNeuralFormula(cell.formula);
                }
            }
        }

        return { ...data, rows: processedRows };
    }

    /**
     * Evaluates a formula which could be a Neural Formula or a logic string.
     */
    static async evaluateFormula(formula: string, context: any = {}): Promise<any> {
        if (!formula) return true;

        // If it starts with =, it's a Neural Formula
        if (formula.startsWith('=')) {
            const neuralValue = await this.evaluateNeuralFormula(formula);
            // If the formula has logical operators (e.g. =CRM.COUNT > 5), we need more complex parsing
            // For now, we support simple =METRIC or basic comparison if it's a number
            return neuralValue;
        }

        // Otherwise, try basic JS-like evaluation with context
        try {
            // Very basic parser for condition like "status === 'done'"
            const keys = Object.keys(context);
            const vals = Object.values(context);
            const fn = new Function(...keys, `return ${formula}`);
            return fn(...vals);
        } catch (e) {
            console.error(`Error evaluating condition ${formula}:`, e);
            return false;
        }
    }

    /**
     * Workflow `Workflow.condition`: legacy JS snippet, neural `=CRM.METRIC`, or JSON structured rules.
     * Document events (`ON_CREATE`/`ON_UPDATE`): cron-only `{ "cron": "..." }` JSON must not arm as a rule — returns false.
     * CRON supplementary `action.config.condition` only: pass `supplementaryCronGate: true` so cron-shaped JSON does not veto the tick.
     */
    static async evaluateWorkflowCondition(
        condition: string,
        context: Record<string, unknown>,
        trigger: WorkflowEventTrigger,
        options?: { supplementaryCronGate?: boolean },
    ): Promise<boolean> {
        if (!condition || typeof condition !== 'string') return true;
        const trimmed = condition.trim();
        if (!trimmed.length) return true;

        if (trimmed.startsWith('{')) {
            try {
                const parsed: unknown = JSON.parse(trimmed);
                if (isCronOnlyConditionSpec(parsed)) {
                    return options?.supplementaryCronGate === true ? true : false;
                }
                if (looksLikeStructuredConditionSpec(parsed)) {
                    return evaluateStructuredCondition(parsed, context, trigger);
                }
            } catch {
                // invalid JSON → fall through to legacy evaluator
            }
        }

        return Boolean(await this.evaluateFormula(trimmed, context));
    }
}
