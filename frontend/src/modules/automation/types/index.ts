export type WorkflowTrigger = 'ON_CREATE' | 'ON_UPDATE' | 'ON_DELETE' | 'CRON' | 'ON_TIME';

export type ActionType = 'EMAIL' | 'NOTIFICATION' | 'SERVER_ACTION' | 'UPDATE_RECORD' | 'CREATE_RECORD' | 'SMS';

export interface WorkflowAction {
    type: ActionType;
    config: Record<string, any>;
}

export interface Workflow {
    id: number;
    name: string;
    description?: string | null;
    model: string;
    trigger: WorkflowTrigger;
    condition?: string | null;
    action: string; // JSON string in DB
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
