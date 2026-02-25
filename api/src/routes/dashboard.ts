import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/utils';

export const dashboardRoutes = Router();

// Get dashboard KPIs across all modules
dashboardRoutes.get('/', asyncHandler(async (_req, res) => {
    const [
        partnerCount, leadCount, opportunityCount, saleOrderCount,
        purchaseOrderCount, invoiceCount, employeeCount, projectCount,
        taskCount, ticketCount, productCount,
        revenueData, topLeads,
    ] = await Promise.all([
        prisma.partner.count({ where: { active: true } }),
        prisma.crmLead.count({ where: { active: true, type: 'lead' } }),
        prisma.crmLead.count({ where: { active: true, type: 'opportunity' } }),
        prisma.saleOrder.count(),
        prisma.purchaseOrder.count(),
        prisma.accountMove.count(),
        prisma.hrEmployee.count({ where: { active: true } }),
        prisma.projectProject.count({ where: { active: true } }),
        prisma.projectTask.count({ where: { active: true } }),
        prisma.helpdeskTicket.count({ where: { active: true } }),
        prisma.product.count({ where: { active: true } }),
        // Total revenue from confirmed sales
        prisma.saleOrder.aggregate({ where: { state: 'sale' }, _sum: { amountTotal: true } }),
        // Top 5 opportunities by expected revenue
        prisma.crmLead.findMany({ where: { active: true, type: 'opportunity' }, orderBy: { expectedRevenue: 'desc' }, take: 5, include: { partner: true, stage: true } }),
    ]);

    res.json({
        kpis: {
            contacts: partnerCount,
            leads: leadCount,
            opportunities: opportunityCount,
            saleOrders: saleOrderCount,
            purchaseOrders: purchaseOrderCount,
            invoices: invoiceCount,
            employees: employeeCount,
            projects: projectCount,
            tasks: taskCount,
            tickets: ticketCount,
            products: productCount,
            totalRevenue: revenueData._sum.amountTotal || 0,
        },
        topOpportunities: topLeads,
    });
}));
