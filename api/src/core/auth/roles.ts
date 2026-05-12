/**
 * Canonical role keys and permission catalogue for all FusionAI modules.
 *
 * These constants are the single source of truth used by:
 *  - requirePermission() guards in route files
 *  - The DB seed script (scripts/seed-roles.ts)
 *  - The Settings → Roles management UI
 *
 * Naming convention:
 *  ROLES  : short identifiers stored in SpineRole.key + JWT roles[]
 *  PERMISSIONS: dot-separated <module>.<verb> stored in SpinePermission.key + JWT permissions[]
 */

// ── Role keys ─────────────────────────────────────────────────────────────────

export const ROLES = {
    // Platform-wide
    ADMIN: 'admin',
    VIEWER: 'viewer',
    // Accounting & Finance
    ACCOUNTING_MANAGER: 'accounting_manager',
    ACCOUNTING_USER: 'accounting_user',
    // Sales & CRM
    SALES_MANAGER: 'sales_manager',
    SALES_USER: 'sales_user',
    CRM_MANAGER: 'crm_manager',
    CRM_USER: 'crm_user',
    // Purchases
    PURCHASE_MANAGER: 'purchase_manager',
    PURCHASE_USER: 'purchase_user',
    // Inventory & Warehouse
    INVENTORY_MANAGER: 'inventory_manager',
    INVENTORY_USER: 'inventory_user',
    // Manufacturing
    MFG_MANAGER: 'mfg_manager',
    MFG_USER: 'mfg_user',
    // HR
    HR_MANAGER: 'hr_manager',
    HR_USER: 'hr_user',
    // Payroll
    PAYROLL_MANAGER: 'payroll_manager',
    // Recruitment
    RECRUITMENT_MANAGER: 'recruitment_manager',
    RECRUITMENT_USER: 'recruitment_user',
    // Helpdesk
    HELPDESK_MANAGER: 'helpdesk_manager',
    HELPDESK_AGENT: 'helpdesk_agent',
    // Projects
    PROJECT_MANAGER: 'project_manager',
    PROJECT_USER: 'project_user',
    // Fleet & Maintenance
    FLEET_MANAGER: 'fleet_manager',
    FLEET_USER: 'fleet_user',
    // Quality
    QUALITY_MANAGER: 'quality_manager',
    QUALITY_USER: 'quality_user',
} as const;

export type RoleKey = typeof ROLES[keyof typeof ROLES];

// ── Permission keys ────────────────────────────────────────────────────────────

export const PERMISSIONS = {
    // Partners
    PARTNERS_READ: 'partners.read',
    PARTNERS_WRITE: 'partners.write',
    PARTNERS_DELETE: 'partners.delete',
    // Sales
    SALES_READ: 'sales.read',
    SALES_WRITE: 'sales.write',
    SALES_DELETE: 'sales.delete',
    SALES_CONFIRM: 'sales.confirm',
    SALES_INVOICE: 'sales.invoice',
    // Accounting
    ACCOUNTING_READ: 'accounting.read',
    ACCOUNTING_WRITE: 'accounting.write',
    ACCOUNTING_POST: 'accounting.post',
    ACCOUNTING_DELETE: 'accounting.delete',
    ACCOUNTING_RECONCILE: 'accounting.reconcile',
    ACCOUNTING_PAY: 'accounting.pay',
    // Purchases
    PURCHASES_READ: 'purchases.read',
    PURCHASES_WRITE: 'purchases.write',
    PURCHASES_DELETE: 'purchases.delete',
    PURCHASES_APPROVE: 'purchases.approve',
    // Products
    PRODUCTS_READ: 'products.read',
    PRODUCTS_WRITE: 'products.write',
    PRODUCTS_DELETE: 'products.delete',
    // Inventory
    INVENTORY_READ: 'inventory.read',
    INVENTORY_WRITE: 'inventory.write',
    INVENTORY_ADJUST: 'inventory.adjust',
    // Manufacturing
    MFG_READ: 'mfg.read',
    MFG_WRITE: 'mfg.write',
    MFG_SCHEDULE: 'mfg.schedule',
    MFG_DELETE: 'mfg.delete',
    // HR (employee data)
    HR_READ: 'hr.read',
    HR_WRITE: 'hr.write',
    HR_DELETE: 'hr.delete',
    HR_PRIVATE: 'hr.private',      // salary, bank details, private notes
    // Payroll
    PAYROLL_READ: 'payroll.read',
    PAYROLL_WRITE: 'payroll.write',
    PAYROLL_CONFIRM: 'payroll.confirm',
    PAYROLL_DELETE: 'payroll.delete',
    // Recruitment
    RECRUITMENT_READ: 'recruitment.read',
    RECRUITMENT_WRITE: 'recruitment.write',
    RECRUITMENT_DELETE: 'recruitment.delete',
    // Helpdesk
    HELPDESK_READ: 'helpdesk.read',
    HELPDESK_WRITE: 'helpdesk.write',
    HELPDESK_DELETE: 'helpdesk.delete',
    HELPDESK_MERGE: 'helpdesk.merge',
    // CRM
    CRM_READ: 'crm.read',
    CRM_WRITE: 'crm.write',
    CRM_DELETE: 'crm.delete',
    // Projects
    PROJECTS_READ: 'projects.read',
    PROJECTS_WRITE: 'projects.write',
    PROJECTS_DELETE: 'projects.delete',
    // Fleet
    FLEET_READ: 'fleet.read',
    FLEET_WRITE: 'fleet.write',
    FLEET_DELETE: 'fleet.delete',
    // Quality
    QUALITY_READ: 'quality.read',
    QUALITY_WRITE: 'quality.write',
    QUALITY_DELETE: 'quality.delete',
    // AI
    AI_RUN: 'ai.run',
    AI_APPROVE: 'ai.approve',
    // Settings
    SETTINGS_READ: 'settings.read',
    SETTINGS_WRITE: 'settings.write',
    // Automation / workflows (engine routes under `/api/automation`)
    AUTOMATION_READ: 'automation.read',
    AUTOMATION_WRITE: 'automation.write',
    // Marketing campaigns (`/api/campaigns`)
    MARKETING_READ: 'marketing.read',
    MARKETING_WRITE: 'marketing.write',
    // GDPR
    GDPR_ERASE: 'gdpr.erase',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ── Default role → permissions mapping (used by seed script) ──────────────────

type AllPerms = PermissionKey[];

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, AllPerms> = {
    admin: Object.values(PERMISSIONS) as AllPerms,
    viewer: [
        PERMISSIONS.PARTNERS_READ,
        PERMISSIONS.SALES_READ,
        PERMISSIONS.ACCOUNTING_READ,
        PERMISSIONS.PURCHASES_READ,
        PERMISSIONS.PRODUCTS_READ,
        PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.HR_READ,
        PERMISSIONS.CRM_READ,
        PERMISSIONS.HELPDESK_READ,
        PERMISSIONS.PROJECTS_READ,
        PERMISSIONS.FLEET_READ,
        PERMISSIONS.QUALITY_READ,
        PERMISSIONS.MARKETING_READ,
    ],

    accounting_manager: [
        PERMISSIONS.ACCOUNTING_READ, PERMISSIONS.ACCOUNTING_WRITE,
        PERMISSIONS.ACCOUNTING_POST, PERMISSIONS.ACCOUNTING_DELETE,
        PERMISSIONS.ACCOUNTING_RECONCILE, PERMISSIONS.ACCOUNTING_PAY,
        PERMISSIONS.PARTNERS_READ, PERMISSIONS.PARTNERS_WRITE,
        PERMISSIONS.SALES_READ, PERMISSIONS.PURCHASES_READ,
        PERMISSIONS.SETTINGS_READ, PERMISSIONS.SETTINGS_WRITE,
    ],
    accounting_user: [
        PERMISSIONS.ACCOUNTING_READ, PERMISSIONS.ACCOUNTING_WRITE,
        PERMISSIONS.PARTNERS_READ, PERMISSIONS.SALES_READ, PERMISSIONS.PURCHASES_READ,
    ],

    sales_manager: [
        PERMISSIONS.SALES_READ, PERMISSIONS.SALES_WRITE,
        PERMISSIONS.SALES_DELETE, PERMISSIONS.SALES_CONFIRM, PERMISSIONS.SALES_INVOICE,
        PERMISSIONS.CRM_READ, PERMISSIONS.CRM_WRITE, PERMISSIONS.CRM_DELETE,
        PERMISSIONS.PARTNERS_READ, PERMISSIONS.PARTNERS_WRITE, PERMISSIONS.PARTNERS_DELETE,
        PERMISSIONS.PRODUCTS_READ, PERMISSIONS.ACCOUNTING_READ,
        PERMISSIONS.AI_RUN,
        PERMISSIONS.AUTOMATION_READ, PERMISSIONS.AUTOMATION_WRITE,
        PERMISSIONS.MARKETING_READ,
        PERMISSIONS.MARKETING_WRITE,
    ],
    sales_user: [
        PERMISSIONS.SALES_READ, PERMISSIONS.SALES_WRITE,
        PERMISSIONS.CRM_READ, PERMISSIONS.CRM_WRITE,
        PERMISSIONS.PARTNERS_READ, PERMISSIONS.PRODUCTS_READ,
        PERMISSIONS.MARKETING_READ,
    ],

    crm_manager: [
        PERMISSIONS.CRM_READ, PERMISSIONS.CRM_WRITE, PERMISSIONS.CRM_DELETE,
        PERMISSIONS.PARTNERS_READ, PERMISSIONS.PARTNERS_WRITE,
        PERMISSIONS.SALES_READ, PERMISSIONS.AI_RUN,
        PERMISSIONS.AUTOMATION_READ, PERMISSIONS.AUTOMATION_WRITE,
        PERMISSIONS.MARKETING_READ,
        PERMISSIONS.MARKETING_WRITE,
    ],
    crm_user: [
        PERMISSIONS.CRM_READ, PERMISSIONS.CRM_WRITE,
        PERMISSIONS.PARTNERS_READ, PERMISSIONS.SALES_READ,
        PERMISSIONS.MARKETING_READ,
    ],

    purchase_manager: [
        PERMISSIONS.PURCHASES_READ, PERMISSIONS.PURCHASES_WRITE,
        PERMISSIONS.PURCHASES_DELETE, PERMISSIONS.PURCHASES_APPROVE,
        PERMISSIONS.PARTNERS_READ, PERMISSIONS.PARTNERS_WRITE,
        PERMISSIONS.PRODUCTS_READ, PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.ACCOUNTING_READ,
    ],
    purchase_user: [
        PERMISSIONS.PURCHASES_READ, PERMISSIONS.PURCHASES_WRITE,
        PERMISSIONS.PARTNERS_READ, PERMISSIONS.PRODUCTS_READ,
    ],

    inventory_manager: [
        PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_WRITE, PERMISSIONS.INVENTORY_ADJUST,
        PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_WRITE,
        PERMISSIONS.MFG_READ,
    ],
    inventory_user: [
        PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_WRITE,
        PERMISSIONS.PRODUCTS_READ,
    ],

    mfg_manager: [
        PERMISSIONS.MFG_READ, PERMISSIONS.MFG_WRITE,
        PERMISSIONS.MFG_SCHEDULE, PERMISSIONS.MFG_DELETE,
        PERMISSIONS.INVENTORY_READ, PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_WRITE,
        PERMISSIONS.AI_RUN,
    ],
    mfg_user: [
        PERMISSIONS.MFG_READ, PERMISSIONS.MFG_WRITE,
        PERMISSIONS.INVENTORY_READ, PERMISSIONS.PRODUCTS_READ,
    ],

    hr_manager: [
        PERMISSIONS.HR_READ, PERMISSIONS.HR_WRITE, PERMISSIONS.HR_DELETE, PERMISSIONS.HR_PRIVATE,
        PERMISSIONS.RECRUITMENT_READ, PERMISSIONS.RECRUITMENT_WRITE,
        PERMISSIONS.PAYROLL_READ,
        PERMISSIONS.AI_RUN,
        PERMISSIONS.AUTOMATION_READ, PERMISSIONS.AUTOMATION_WRITE,
    ],
    hr_user: [
        PERMISSIONS.HR_READ, PERMISSIONS.HR_WRITE,
        PERMISSIONS.RECRUITMENT_READ,
    ],

    payroll_manager: [
        PERMISSIONS.PAYROLL_READ, PERMISSIONS.PAYROLL_WRITE,
        PERMISSIONS.PAYROLL_CONFIRM, PERMISSIONS.PAYROLL_DELETE,
        PERMISSIONS.HR_READ, PERMISSIONS.HR_PRIVATE,
    ],

    recruitment_manager: [
        PERMISSIONS.RECRUITMENT_READ, PERMISSIONS.RECRUITMENT_WRITE, PERMISSIONS.RECRUITMENT_DELETE,
        PERMISSIONS.HR_READ, PERMISSIONS.AI_RUN,
    ],
    recruitment_user: [
        PERMISSIONS.RECRUITMENT_READ, PERMISSIONS.RECRUITMENT_WRITE,
    ],

    helpdesk_manager: [
        PERMISSIONS.HELPDESK_READ, PERMISSIONS.HELPDESK_WRITE,
        PERMISSIONS.HELPDESK_DELETE, PERMISSIONS.HELPDESK_MERGE,
        PERMISSIONS.PARTNERS_READ, PERMISSIONS.AI_RUN,
    ],
    helpdesk_agent: [
        PERMISSIONS.HELPDESK_READ, PERMISSIONS.HELPDESK_WRITE,
        PERMISSIONS.PARTNERS_READ,
    ],

    project_manager: [
        PERMISSIONS.PROJECTS_READ, PERMISSIONS.PROJECTS_WRITE, PERMISSIONS.PROJECTS_DELETE,
        PERMISSIONS.HR_READ, PERMISSIONS.AI_RUN,
    ],
    project_user: [
        PERMISSIONS.PROJECTS_READ, PERMISSIONS.PROJECTS_WRITE,
    ],

    fleet_manager: [
        PERMISSIONS.FLEET_READ, PERMISSIONS.FLEET_WRITE, PERMISSIONS.FLEET_DELETE,
    ],
    fleet_user: [
        PERMISSIONS.FLEET_READ, PERMISSIONS.FLEET_WRITE,
    ],

    quality_manager: [
        PERMISSIONS.QUALITY_READ, PERMISSIONS.QUALITY_WRITE, PERMISSIONS.QUALITY_DELETE,
        PERMISSIONS.INVENTORY_READ, PERMISSIONS.MFG_READ,
    ],
    quality_user: [
        PERMISSIONS.QUALITY_READ, PERMISSIONS.QUALITY_WRITE,
    ],
};
