/**
 * Safe, declarative workflow conditions stored as JSON on `Workflow.condition`
 * (ON_CREATE / ON_UPDATE only — CRON uses the same column for cron syntax).
 */

export type WorkflowEventTrigger = 'ON_CREATE' | 'ON_UPDATE';

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** `Workflow.condition` for CRON is a cron expr or `{ "cron" | "schedule": "..." }` — never a document-event rule. */
export function isCronOnlyConditionSpec(parsed: unknown): boolean {
    if (!isPlainObject(parsed)) return false;
    const keys = Object.keys(parsed);
    if (keys.length !== 1) return false;
    const k = keys[0];
    if (k !== 'cron' && k !== 'schedule') return false;
    return typeof parsed[k] === 'string';
}

export function looksLikeStructuredConditionSpec(parsed: unknown): boolean {
    if (!isPlainObject(parsed)) return false;
    return (
        'all' in parsed ||
        'any' in parsed ||
        'not' in parsed ||
        'field' in parsed ||
        parsed.changed === true
    );
}

export function getPath(obj: unknown, path: string): unknown {
    if (obj == null || !path) return undefined;
    const parts = path.split('.');
    let cur: unknown = obj;
    for (const p of parts) {
        if (cur == null || typeof cur !== 'object') return undefined;
        cur = (cur as Record<string, unknown>)[p];
    }
    return cur;
}

function compareOp(left: unknown, op: string, right: unknown): boolean {
    const ln = typeof left === 'number' ? left : Number(left);
    const rn = typeof right === 'number' ? right : Number(right);
    if (!Number.isFinite(ln) || !Number.isFinite(rn)) return false;
    switch (op) {
        case 'gt':
            return ln > rn;
        case 'gte':
            return ln >= rn;
        case 'lt':
            return ln < rn;
        case 'lte':
            return ln <= rn;
        default:
            return false;
    }
}

function evalLeaf(
    rule: Record<string, unknown>,
    ctx: Record<string, unknown>,
    trigger: WorkflowEventTrigger,
): boolean {
    if (rule.changed === true && typeof rule.field === 'string') {
        if (trigger !== 'ON_UPDATE') return false;
        const prev = ctx.__previous as Record<string, unknown> | undefined;
        if (!prev || !isPlainObject(prev)) return false;
        return getPath(ctx, rule.field) !== getPath(prev, rule.field);
    }

    const field = rule.field;
    if (typeof field !== 'string' || !field.length) return false;

    const val = getPath(ctx, field);

    const hasExplicitPredicate =
        'exists' in rule ||
        'eq' in rule ||
        'ne' in rule ||
        'in' in rule ||
        'notIn' in rule ||
        'gt' in rule ||
        'gte' in rule ||
        'lt' in rule ||
        'lte' in rule;

    if (!hasExplicitPredicate) {
        return Boolean(val);
    }

    if ('exists' in rule) return rule.exists === true ? val != null : val == null;

    if ('eq' in rule) return val === rule.eq;
    if ('ne' in rule) return val !== rule.ne;

    if ('in' in rule && Array.isArray(rule.in)) {
        return rule.in.some((item) => item === val);
    }
    if ('notIn' in rule && Array.isArray(rule.notIn)) {
        return !rule.notIn.some((item) => item === val);
    }

    if ('gt' in rule) return compareOp(val, 'gt', rule.gt);
    if ('gte' in rule) return compareOp(val, 'gte', rule.gte);
    if ('lt' in rule) return compareOp(val, 'lt', rule.lt);
    if ('lte' in rule) return compareOp(val, 'lte', rule.lte);

    return false;
}

/**
 * Evaluate a structured condition object (from JSON).
 */
export function evaluateStructuredCondition(
    spec: unknown,
    ctx: Record<string, unknown>,
    trigger: WorkflowEventTrigger,
): boolean {
    if (spec == null) return true;

    if (!isPlainObject(spec)) return false;

    if ('not' in spec) {
        return !evaluateStructuredCondition(spec.not, ctx, trigger);
    }

    if ('all' in spec) {
        const arr = spec.all;
        if (!Array.isArray(arr)) return false;
        if (arr.length === 0) return true;
        return arr.every((item) => evaluateStructuredCondition(item, ctx, trigger));
    }

    if ('any' in spec) {
        const arr = spec.any;
        if (!Array.isArray(arr)) return false;
        if (arr.length === 0) return false;
        return arr.some((item) => evaluateStructuredCondition(item, ctx, trigger));
    }

    if (spec.changed === true || typeof spec.field === 'string') {
        return evalLeaf(spec, ctx, trigger);
    }

    return false;
}
