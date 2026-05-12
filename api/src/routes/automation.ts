import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/utils';
import { requireAuth, requirePermission } from '../core/auth';
import { requestWorkflowCronSync } from '../jobs/workflowCronBootstrap';

export const automationRoutes = Router();
automationRoutes.use(requireAuth);

/** Re-read CRON workflows from DB and reschedule `node-cron` tasks (same serialization as the refresh timer). */
automationRoutes.post('/cron/sync', requirePermission('automation.write'), asyncHandler(async (_req, res) => {
    await requestWorkflowCronSync();
    res.json({ ok: true });
}));

// Get all workflows
automationRoutes.get('/workflows', requirePermission('automation.read'), asyncHandler(async (req, res) => {
    const workflows = await prisma.workflow.findMany({
        orderBy: { updatedAt: 'desc' }
    });
    res.json({ data: workflows });
}));

// Create workflow
automationRoutes.post('/workflows', requirePermission('automation.write'), asyncHandler(async (req, res) => {
    const { name, description, model, trigger, condition, action, active } = req.body;
    const workflow = await prisma.workflow.create({
        data: {
            name,
            description,
            model,
            trigger,
            condition,
            action: typeof action === 'string' ? action : JSON.stringify(action),
            active: active ?? true
        }
    });
    res.json({ data: workflow });
}));

// Update workflow
automationRoutes.put('/workflows/:id', requirePermission('automation.write'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, model, trigger, condition, action, active } = req.body;

    const workflow = await prisma.workflow.update({
        where: { id: parseInt(id) },
        data: {
            name,
            description,
            model,
            trigger,
            condition,
            action: typeof action === 'string' ? action : JSON.stringify(action),
            active
        }
    });
    res.json({ data: workflow });
}));

// Delete workflow
automationRoutes.delete('/workflows/:id', requirePermission('automation.write'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.workflow.delete({
        where: { id: parseInt(id) }
    });
    res.json({ message: 'Workflow deleted' });
}));

// Toggle workflow active state
automationRoutes.patch('/workflows/:id/toggle', requirePermission('automation.write'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;
    const workflow = await prisma.workflow.update({
        where: { id: parseInt(id) },
        data: { active }
    });
    res.json({ data: workflow });
}));
