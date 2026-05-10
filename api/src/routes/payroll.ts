import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requirePermission } from '../core/auth';
import { PERMISSIONS } from '../core/auth/roles';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const payrollRoutes = Router();
payrollRoutes.use(requireAuth);

payrollRoutes.get('/', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
        prisma.hrPayslip.findMany({ where, skip, take: limit, orderBy: { dateFrom: 'desc' }, include: { employee: true } }),
        prisma.hrPayslip.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

payrollRoutes.get('/:id', asyncHandler(async (req, res) => {
    const p = await prisma.hrPayslip.findUnique({ where: { id: parseInt(req.params.id) }, include: { employee: true } });
    if (!p) { res.status(404).json({ error: 'Payslip not found' }); return; }
    res.json(p);
}));

payrollRoutes.post('/', requirePermission(PERMISSIONS.PAYROLL_WRITE), asyncHandler(async (req, res) => {
    const body = req.body;

    // Auto-populate wage fields from the employee's active contract
    if (body.employeeId && !body.basicWage) {
        const contract = await prisma.hrContract.findFirst({
            where: { employeeId: body.employeeId, state: 'open' },
            orderBy: { dateStart: 'desc' },
        });
        if (contract) {
            body.basicWage = contract.wage;
            body.grossSalary = contract.wage;
            body.netSalary = contract.wage - (body.deductions ?? 0);
        }
    }

    const p = await prisma.hrPayslip.create({ data: body, include: { employee: true } });
    res.status(201).json(p);
}));

payrollRoutes.put('/:id', asyncHandler(async (req, res) => {
    const p = await prisma.hrPayslip.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(p);
}));

payrollRoutes.patch('/:id/confirm', asyncHandler(async (req, res) => {
    const p = await prisma.hrPayslip.update({ where: { id: parseInt(req.params.id) }, data: { state: 'done' } });
    res.json(p);
}));

payrollRoutes.delete('/:id', requirePermission(PERMISSIONS.PAYROLL_DELETE), asyncHandler(async (req, res) => {
    await prisma.hrPayslip.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// Analytics — monthly payroll summary
payrollRoutes.get('/analytics/summary', asyncHandler(async (_req, res) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [monthly, total, byState] = await Promise.all([
        prisma.hrPayslip.aggregate({
            where: { dateFrom: { gte: monthStart }, dateTo: { lte: monthEnd } },
            _sum: { netSalary: true, grossSalary: true, deductions: true },
            _count: true,
        }),
        prisma.hrPayslip.aggregate({ _sum: { netSalary: true }, _count: true }),
        prisma.hrPayslip.groupBy({ by: ['state'], _count: true }),
    ]);

    res.json({
        thisMonth: {
            count: monthly._count,
            netSalary: monthly._sum.netSalary ?? 0,
            grossSalary: monthly._sum.grossSalary ?? 0,
            deductions: monthly._sum.deductions ?? 0,
        },
        allTime: { count: total._count, netSalary: total._sum.netSalary ?? 0 },
        byState,
    });
}));
