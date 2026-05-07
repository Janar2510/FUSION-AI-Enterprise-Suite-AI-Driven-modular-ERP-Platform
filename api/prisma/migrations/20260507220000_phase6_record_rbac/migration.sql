-- Add userId (salesperson/agent) to CrmLead, SaleOrder, HelpdeskTicket
-- Required for record-level RBAC (ADR-0013)

ALTER TABLE "crm_leads" ADD COLUMN "userId" TEXT;
CREATE INDEX "crm_leads_userId_idx" ON "crm_leads"("userId");

ALTER TABLE "sale_orders" ADD COLUMN "userId" TEXT;

ALTER TABLE "helpdesk_tickets" ADD COLUMN "userId" TEXT;
CREATE INDEX "helpdesk_tickets_userId_idx" ON "helpdesk_tickets"("userId");
