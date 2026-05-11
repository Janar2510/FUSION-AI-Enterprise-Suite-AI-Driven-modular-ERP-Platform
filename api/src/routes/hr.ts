import { Router, Request } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requirePermission } from '../core/auth';
import { asyncHandler, getPagination, paginatedResponse } from '../lib/utils';

export const hrRoutes = Router();
hrRoutes.use(requireAuth);

// Departments
hrRoutes.get('/departments', asyncHandler(async (_req, res) => {
    const depts = await prisma.hrDepartment.findMany({ where: { active: true }, include: { manager: true, _count: { select: { employees: true } } } });
    res.json(depts);
}));

hrRoutes.post('/departments', asyncHandler(async (req, res) => {
    const dept = await prisma.hrDepartment.create({ data: req.body });
    res.status(201).json(dept);
}));

hrRoutes.put('/departments/:id', asyncHandler(async (req, res) => {
    const dept = await prisma.hrDepartment.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(dept);
}));

hrRoutes.delete('/departments/:id', asyncHandler(async (req, res) => {
    await prisma.hrDepartment.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.status(204).send();
}));

// Jobs
hrRoutes.get('/jobs', asyncHandler(async (_req, res) => {
    const jobs = await prisma.hrJob.findMany({ include: { _count: { select: { employees: true } } } });
    res.json(jobs);
}));

// Employees
hrRoutes.get('/employees', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const deptId = req.query.department_id ? parseInt(req.query.department_id as string) : undefined;
    const where: any = { active: true };
    if (deptId) where.departmentId = deptId;

    const [data, total] = await Promise.all([
        prisma.hrEmployee.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, include: { department: true, job: true } }),
        prisma.hrEmployee.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

hrRoutes.get('/employees/:id', asyncHandler(async (req, res) => {
    const emp = await prisma.hrEmployee.findUnique({ where: { id: parseInt(req.params.id) }, include: { department: true, job: true, manager: true, subordinates: true, timesheets: { take: 10 }, leaveRequests: { take: 5 } } });
    if (!emp) { res.status(404).json({ error: 'Employee not found' }); return; }
    res.json(emp);
}));

hrRoutes.post('/employees', asyncHandler(async (req, res) => {
    const emp = await prisma.hrEmployee.create({ data: req.body, include: { department: true, job: true } });
    res.status(201).json(emp);
}));

hrRoutes.put('/employees/:id', asyncHandler(async (req, res) => {
    const emp = await prisma.hrEmployee.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(emp);
}));

hrRoutes.patch('/employees/:id/archive', asyncHandler(async (req, res) => {
    const emp = await prisma.hrEmployee.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json(emp);
}));

hrRoutes.patch('/employees/:id/unarchive', asyncHandler(async (req, res) => {
    const emp = await prisma.hrEmployee.update({ where: { id: parseInt(req.params.id) }, data: { active: true } });
    res.json(emp);
}));

// Employee private info tab — returns sensitive fields; requires hr.read permission
hrRoutes.get('/employees/:id/private', requirePermission('hr.read'), asyncHandler(async (req: Request, res) => {
    const emp = await prisma.hrEmployee.findUnique({
        where: { id: parseInt(req.params.id) },
        select: {
            id: true,
            gender: true,
            birthday: true,
            maritalStatus: true,
            emergencyContact: true,
            emergencyPhone: true,
            workEmail: true,
            workPhone: true,
            mobilePhone: true,
        },
    });
    if (!emp) { res.status(404).json({ error: 'Employee not found' }); return; }
    res.json(emp);
}));

hrRoutes.put('/employees/:id/private', requirePermission('hr.read'), asyncHandler(async (req: Request, res) => {
    const { gender, birthday, maritalStatus, emergencyContact, emergencyPhone } = req.body;
    const emp = await prisma.hrEmployee.update({
        where: { id: parseInt(req.params.id) },
        data: { gender, birthday: birthday ? new Date(birthday) : undefined, maritalStatus, emergencyContact, emergencyPhone },
    });
    res.json({ id: emp.id, gender: emp.gender, maritalStatus: emp.maritalStatus });
}));

// Leaves
hrRoutes.get('/leaves', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.hrLeave.findMany({ skip, take: limit, orderBy: { dateFrom: 'desc' }, include: { employee: true } }),
        prisma.hrLeave.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

hrRoutes.post('/leaves', asyncHandler(async (req, res) => {
    const leave = await prisma.hrLeave.create({ data: req.body });
    res.status(201).json(leave);
}));

hrRoutes.patch('/leaves/:id/approve', asyncHandler(async (req, res) => {
    const leave = await prisma.hrLeave.update({ where: { id: parseInt(req.params.id) }, data: { state: 'validate' } });
    res.json(leave);
}));

hrRoutes.patch('/leaves/:id/refuse', asyncHandler(async (req, res) => {
    const leave = await prisma.hrLeave.update({ where: { id: parseInt(req.params.id) }, data: { state: 'refuse' } });
    res.json(leave);
}));

hrRoutes.put('/leaves/:id', asyncHandler(async (req, res) => {
    const leave = await prisma.hrLeave.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(leave);
}));

hrRoutes.delete('/leaves/:id', asyncHandler(async (req, res) => {
    await prisma.hrLeave.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// Leave Types
hrRoutes.get('/leave-types', asyncHandler(async (_req, res) => {
    const types = await prisma.hrLeaveType.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    res.json(types);
}));

hrRoutes.post('/leave-types', asyncHandler(async (req, res) => {
    const t = await prisma.hrLeaveType.create({ data: req.body });
    res.status(201).json(t);
}));

hrRoutes.put('/leave-types/:id', asyncHandler(async (req, res) => {
    const t = await prisma.hrLeaveType.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(t);
}));

hrRoutes.delete('/leave-types/:id', asyncHandler(async (req, res) => {
    await prisma.hrLeaveType.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
}));

// Leave Allocations
hrRoutes.get('/leave-allocations', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
        prisma.hrLeaveAllocation.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { employee: true, leaveType: true } }),
        prisma.hrLeaveAllocation.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

hrRoutes.post('/leave-allocations', asyncHandler(async (req, res) => {
    const alloc = await prisma.hrLeaveAllocation.create({ data: req.body, include: { employee: true, leaveType: true } });
    res.status(201).json(alloc);
}));

hrRoutes.patch('/leave-allocations/:id/approve', asyncHandler(async (req, res) => {
    const alloc = await prisma.hrLeaveAllocation.update({ where: { id: parseInt(req.params.id) }, data: { state: 'validate' } });
    res.json(alloc);
}));

hrRoutes.patch('/leave-allocations/:id/refuse', asyncHandler(async (req, res) => {
    const alloc = await prisma.hrLeaveAllocation.update({ where: { id: parseInt(req.params.id) }, data: { state: 'refuse' } });
    res.json(alloc);
}));

hrRoutes.put('/leave-allocations/:id', asyncHandler(async (req, res) => {
    const alloc = await prisma.hrLeaveAllocation.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(alloc);
}));

hrRoutes.delete('/leave-allocations/:id', asyncHandler(async (req, res) => {
    await prisma.hrLeaveAllocation.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// Leave Balance — days allocated minus days taken for an employee per leave type
hrRoutes.get('/leave-balance/:employeeId', asyncHandler(async (req, res) => {
    const employeeId = parseInt(req.params.employeeId);
    const types = await prisma.hrLeaveType.findMany({ where: { active: true } });

    const balances = await Promise.all(types.map(async (lt) => {
        const [allocated, taken] = await Promise.all([
            prisma.hrLeaveAllocation.aggregate({
                where: { employeeId, leaveTypeId: lt.id, state: 'validate' },
                _sum: { numberOfDays: true },
            }),
            prisma.hrLeave.aggregate({
                where: { employeeId, leaveTypeId: lt.id, state: 'validate' },
                _sum: { numberOfDays: true },
            }),
        ]);
        const totalAllocated = allocated._sum.numberOfDays ?? 0;
        const totalTaken = taken._sum.numberOfDays ?? 0;
        return {
            leaveTypeId: lt.id,
            leaveTypeName: lt.name,
            color: lt.color,
            allocated: totalAllocated,
            taken: totalTaken,
            remaining: totalAllocated - totalTaken,
        };
    }));

    res.json(balances);
}));

/**
 * Team Calendar — returns all validated leaves for a given month as calendar events.
 * GET /api/hr/leaves/calendar?month=YYYY-MM
 */
hrRoutes.get('/leaves/calendar', asyncHandler(async (req, res) => {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const [year, mon] = month.split('-').map(Number);
    const dateFrom = new Date(year, mon - 1, 1);
    const dateTo = new Date(year, mon, 0, 23, 59, 59); // last day of month

    const leaves = await prisma.hrLeave.findMany({
        where: {
            state: 'validate',
            OR: [
                { dateFrom: { lte: dateTo }, dateTo: { gte: dateFrom } },
            ],
        },
        include: {
            employee: { select: { id: true, name: true } },
            hrLeaveType: { select: { id: true, name: true, color: true } },
        },
        orderBy: { dateFrom: 'asc' },
    });

    res.json(leaves.map(l => ({
        id: l.id,
        title: `${l.employee.name} — ${l.hrLeaveType?.name ?? l.leaveType}`,
        start: l.dateFrom,
        end: l.dateTo,
        employeeId: l.employeeId,
        employeeName: l.employee.name,
        leaveTypeName: l.hrLeaveType?.name ?? l.leaveType,
        leaveTypeColor: l.hrLeaveType?.color ?? 'blue',
        numberOfDays: l.numberOfDays,
    })));
}));

// Contracts
hrRoutes.get('/contracts', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
        prisma.hrContract.findMany({ where, skip, take: limit, orderBy: { dateStart: 'desc' }, include: { employee: true } }),
        prisma.hrContract.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

hrRoutes.get('/contracts/:id', asyncHandler(async (req, res) => {
    const contract = await prisma.hrContract.findUnique({ where: { id: parseInt(req.params.id) }, include: { employee: true } });
    if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }
    res.json(contract);
}));

hrRoutes.post('/contracts', asyncHandler(async (req, res) => {
    const contract = await prisma.hrContract.create({ data: req.body, include: { employee: true } });
    res.status(201).json(contract);
}));

hrRoutes.put('/contracts/:id', asyncHandler(async (req, res) => {
    const contract = await prisma.hrContract.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(contract);
}));

hrRoutes.patch('/contracts/:id/open', asyncHandler(async (req, res) => {
    const contract = await prisma.hrContract.update({ where: { id: parseInt(req.params.id) }, data: { state: 'open' } });
    res.json(contract);
}));

hrRoutes.patch('/contracts/:id/close', asyncHandler(async (req, res) => {
    const contract = await prisma.hrContract.update({ where: { id: parseInt(req.params.id) }, data: { state: 'close' } });
    res.json(contract);
}));

hrRoutes.delete('/contracts/:id', asyncHandler(async (req, res) => {
    await prisma.hrContract.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// Expenses
hrRoutes.get('/expenses', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.hrExpense.findMany({ skip, take: limit, orderBy: { date: 'desc' }, include: { employee: true } }),
        prisma.hrExpense.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

hrRoutes.post('/expenses', asyncHandler(async (req, res) => {
    const expense = await prisma.hrExpense.create({ data: req.body });
    res.status(201).json(expense);
}));

hrRoutes.put('/expenses/:id', asyncHandler(async (req, res) => {
    const expense = await prisma.hrExpense.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(expense);
}));

hrRoutes.delete('/expenses/:id', asyncHandler(async (req, res) => {
    await prisma.hrExpense.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

hrRoutes.patch('/expenses/:id/approve', asyncHandler(async (req, res) => {
    const expense = await prisma.hrExpense.update({ where: { id: parseInt(req.params.id) }, data: { state: 'approved' } });
    res.json(expense);
}));

hrRoutes.patch('/expenses/:id/refuse', asyncHandler(async (req, res) => {
    const expense = await prisma.hrExpense.update({ where: { id: parseInt(req.params.id) }, data: { state: 'refused' } });
    res.json(expense);
}));

// Expense Sheets (Expense Reports)
hrRoutes.get('/expense-sheets', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
        prisma.hrExpenseSheet.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { employee: true, expenses: true } }),
        prisma.hrExpenseSheet.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

hrRoutes.get('/expense-sheets/:id', asyncHandler(async (req, res) => {
    const sheet = await prisma.hrExpenseSheet.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { employee: true, expenses: true },
    });
    if (!sheet) { res.status(404).json({ error: 'Expense sheet not found' }); return; }
    res.json(sheet);
}));

hrRoutes.post('/expense-sheets', asyncHandler(async (req, res) => {
    const { expenseIds, ...rest } = req.body;
    const sheet = await prisma.hrExpenseSheet.create({
        data: { ...rest },
        include: { employee: true },
    });
    // Link existing expenses to this sheet
    if (expenseIds?.length) {
        await prisma.hrExpense.updateMany({ where: { id: { in: expenseIds } }, data: { sheetId: sheet.id } });
    }
    // Recompute totalAmount
    const agg = await prisma.hrExpense.aggregate({ where: { sheetId: sheet.id }, _sum: { totalAmount: true } });
    const updated = await prisma.hrExpenseSheet.update({
        where: { id: sheet.id },
        data: { totalAmount: agg._sum.totalAmount ?? 0 },
        include: { employee: true, expenses: true },
    });
    res.status(201).json(updated);
}));

hrRoutes.put('/expense-sheets/:id', asyncHandler(async (req, res) => {
    const { expenseIds, expenses, employee, ...rest } = req.body;
    const sheet = await prisma.hrExpenseSheet.update({ where: { id: parseInt(req.params.id) }, data: rest });
    res.json(sheet);
}));

hrRoutes.patch('/expense-sheets/:id/submit', asyncHandler(async (req, res) => {
    const sheet = await prisma.hrExpenseSheet.update({ where: { id: parseInt(req.params.id) }, data: { state: 'submitted' } });
    res.json(sheet);
}));

hrRoutes.patch('/expense-sheets/:id/approve', asyncHandler(async (req, res) => {
    const sheetId = parseInt(req.params.id);
    // Update state to approved
    const sheet = await prisma.hrExpenseSheet.update({
        where: { id: sheetId },
        data: { state: 'approved' },
        include: { employee: true, expenses: true },
    });

    // Auto-post GL entry on approval
    try {
        let expenseAccount = await prisma.accountAccount.findFirst({ where: { accountType: 'expense' } });
        if (!expenseAccount) {
            expenseAccount = await prisma.accountAccount.create({
                data: { code: '612000', name: 'Employee Expenses', accountType: 'expense', active: true },
            });
        }
        let expenseJournal = await prisma.accountJournal.findFirst({ where: { type: 'purchase' } });
        if (!expenseJournal) {
            expenseJournal = await prisma.accountJournal.create({
                data: { name: 'Expense Journal', code: 'EXP', type: 'purchase', active: true },
            });
        }
        await prisma.accountMove.create({
            data: {
                name: `EXP/${new Date().getFullYear()}/${String(sheetId).padStart(4, '0')}`,
                moveType: 'in_invoice',
                state: 'posted',
                date: new Date(),
                ref: sheet.name,
                amountTotal: sheet.totalAmount,
                amountResidual: sheet.totalAmount,
                journalId: expenseJournal.id,
                lines: {
                    create: sheet.expenses.map(exp => ({
                        name: exp.name,
                        accountId: expenseAccount!.id,
                        debit: exp.totalAmount,
                        credit: 0,
                        amount: exp.totalAmount,
                    })),
                },
            },
        });
        await prisma.hrExpenseSheet.update({ where: { id: sheetId }, data: { state: 'posted' } });
        res.json({ ...sheet, state: 'posted' });
    } catch (_err) {
        // GL posting failed non-fatally — sheet is still approved
        res.json(sheet);
    }
}));

hrRoutes.patch('/expense-sheets/:id/refuse', asyncHandler(async (req, res) => {
    const sheet = await prisma.hrExpenseSheet.update({ where: { id: parseInt(req.params.id) }, data: { state: 'refused' } });
    res.json(sheet);
}));

// Post expense sheet to accounting — creates an AccountMove (vendor bill) for reimbursement
hrRoutes.patch('/expense-sheets/:id/post', asyncHandler(async (req, res) => {
    const sheetId = parseInt(req.params.id);
    const sheet = await prisma.hrExpenseSheet.findUnique({ where: { id: sheetId }, include: { employee: true, expenses: true } });
    if (!sheet) { res.status(404).json({ error: 'Sheet not found' }); return; }
    if (sheet.state !== 'approved') { res.status(400).json({ error: 'Sheet must be approved before posting' }); return; }

    // Find or create an expense account and journal
    let expenseAccount = await prisma.accountAccount.findFirst({ where: { accountType: 'expense' } });
    if (!expenseAccount) {
        expenseAccount = await prisma.accountAccount.create({
            data: { code: '612000', name: 'Employee Expenses', accountType: 'expense', active: true },
        });
    }
    let expenseJournal = await prisma.accountJournal.findFirst({ where: { type: 'purchase' } });
    if (!expenseJournal) {
        expenseJournal = await prisma.accountJournal.create({
            data: { name: 'Expense Journal', code: 'EXP', type: 'purchase', active: true },
        });
    }

    const move = await prisma.accountMove.create({
        data: {
            name: `EXP/${new Date().getFullYear()}/${String(sheetId).padStart(4, '0')}`,
            moveType: 'in_invoice',
            state: 'posted',
            date: new Date(),
            ref: sheet.name,
            amountTotal: sheet.totalAmount,
            amountResidual: sheet.totalAmount,
            journalId: expenseJournal.id,
            lines: {
                create: sheet.expenses.map(exp => ({
                    name: exp.name,
                    accountId: expenseAccount!.id,
                    debit: exp.totalAmount,
                    credit: 0,
                    balance: exp.totalAmount,
                })),
            },
        },
    });

    const updated = await prisma.hrExpenseSheet.update({
        where: { id: sheetId },
        data: { state: 'posted', accountMoveId: move.id },
    });
    res.json({ sheet: updated, move });
}));

hrRoutes.delete('/expense-sheets/:id', asyncHandler(async (req, res) => {
    await prisma.hrExpenseSheet.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

hrRoutes.get('/timesheets', asyncHandler(async (req: Request, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
    const projectId = req.query.project_id ? parseInt(req.query.project_id as string) : undefined;
    const where: any = {};

    if (employeeId) {
        where.employeeId = employeeId;
    } else {
        // Privacy guard: must have hr.read to list all timesheets without employee_id filter
        const permissions: string[] = (req.user as any)?.permissions ?? [];
        if (!permissions.includes('hr.read')) {
            res.status(403).json({ error: 'Provide employee_id or request hr.read permission' });
            return;
        }
    }

    if (projectId) where.projectId = projectId;
    const [data, total] = await Promise.all([
        prisma.hrTimesheet.findMany({ where, skip, take: limit, orderBy: { date: 'desc' }, include: { employee: true, project: true, task: true } }),
        prisma.hrTimesheet.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

hrRoutes.post('/timesheets', asyncHandler(async (req, res) => {
    const ts = await prisma.hrTimesheet.create({ data: req.body });
    res.status(201).json(ts);
}));

hrRoutes.put('/timesheets/:id', asyncHandler(async (req, res) => {
    const ts = await prisma.hrTimesheet.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
    });
    res.json(ts);
}));

hrRoutes.delete('/timesheets/:id', asyncHandler(async (req, res) => {
    await prisma.hrTimesheet.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
}));

// Weekly grid: returns timesheet hours grouped by employee × day for a given ISO week
// Query: ?weekStart=2026-05-04 (Monday of the desired week)
hrRoutes.get('/timesheets/weekly', asyncHandler(async (req: Request, res) => {
    const weekStartStr = req.query.weekStart as string | undefined;
    const weekStart = weekStartStr ? new Date(weekStartStr) : (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
        return d;
    })();
    const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);

    const rows = await prisma.hrTimesheet.findMany({
        where: { date: { gte: weekStart, lt: weekEnd } },
        include: { employee: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
    });

    // Group by employee → day
    const grid: Record<number, { employee: { id: number; name: string }; days: Record<string, number> }> = {};
    for (const r of rows) {
        const dayKey = r.date.toISOString().split('T')[0];
        if (!grid[r.employeeId]) {
            grid[r.employeeId] = { employee: r.employee, days: {} };
        }
        grid[r.employeeId].days[dayKey] = (grid[r.employeeId].days[dayKey] ?? 0) + r.unitAmount;
    }

    res.json({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        rows: Object.values(grid),
    });
}));

// Attendance
hrRoutes.get('/attendance', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
        prisma.hrAttendance.findMany({ where, skip, take: limit, orderBy: { checkIn: 'desc' }, include: { employee: true } }),
        prisma.hrAttendance.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

hrRoutes.post('/attendance', asyncHandler(async (req, res) => {
    const attendance = await prisma.hrAttendance.create({ data: req.body, include: { employee: true } });
    res.status(201).json(attendance);
}));

hrRoutes.put('/attendance/:id', asyncHandler(async (req, res) => {
    const attendance = await prisma.hrAttendance.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(attendance);
}));

hrRoutes.delete('/attendance/:id', asyncHandler(async (req, res) => {
    await prisma.hrAttendance.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// Recruitment / Applicants
hrRoutes.get('/applicants', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const jobId = req.query.job_id ? parseInt(req.query.job_id as string) : undefined;
    const where: any = { active: true };
    if (jobId) where.jobId = jobId;

    const [data, total] = await Promise.all([
        prisma.hrApplicant.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { job: true, department: true } }),
        prisma.hrApplicant.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

hrRoutes.get('/applicants/:id', asyncHandler(async (req, res) => {
    const applicant = await prisma.hrApplicant.findUnique({ where: { id: parseInt(req.params.id) }, include: { job: true, department: true } });
    if (!applicant) { res.status(404).json({ error: 'Applicant not found' }); return; }
    res.json(applicant);
}));

hrRoutes.post('/applicants', asyncHandler(async (req, res) => {
    const applicant = await prisma.hrApplicant.create({ data: req.body, include: { job: true, department: true } });
    res.status(201).json(applicant);
}));

hrRoutes.put('/applicants/:id', asyncHandler(async (req, res) => {
    const applicant = await prisma.hrApplicant.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(applicant);
}));

hrRoutes.delete('/applicants/:id', asyncHandler(async (req, res) => {
    await prisma.hrApplicant.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

// ── Chatter ─────────────────────────────────────────────────────────────────
import { createChatterRouter } from '../core/chatter';
hrRoutes.use('/', createChatterRouter('hr.applicant'));

// ── Payslips ─────────────────────────────────────────────────────────────────

hrRoutes.get('/payslips', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
        prisma.hrPayslip.findMany({ where, skip, take: limit, orderBy: { dateFrom: 'desc' }, include: { employee: { select: { id: true, name: true } } } }),
        prisma.hrPayslip.count({ where }),
    ]);
    res.json({ data, total, page, pages: Math.ceil(total / limit) });
}));

hrRoutes.get('/payslips/:id', asyncHandler(async (req, res) => {
    const payslip = await prisma.hrPayslip.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { employee: true },
    });
    if (!payslip) { res.status(404).json({ error: 'Payslip not found' }); return; }
    res.json(payslip);
}));

hrRoutes.post('/payslips', asyncHandler(async (req, res) => {
    const payslip = await prisma.hrPayslip.create({
        data: { ...req.body, state: 'draft' },
        include: { employee: true },
    });
    res.status(201).json(payslip);
}));

hrRoutes.put('/payslips/:id', asyncHandler(async (req, res) => {
    const { employee, ...data } = req.body;
    const payslip = await prisma.hrPayslip.update({
        where: { id: parseInt(req.params.id) },
        data,
        include: { employee: true },
    });
    res.json(payslip);
}));

/** Confirm payslip: draft → confirmed */
hrRoutes.patch('/payslips/:id/confirm', asyncHandler(async (req, res) => {
    const payslip = await prisma.hrPayslip.update({
        where: { id: parseInt(req.params.id) },
        data: { state: 'done' },
        include: { employee: true },
    });
    res.json(payslip);
}));

/** Mark as paid: confirmed → paid */
hrRoutes.patch('/payslips/:id/pay', asyncHandler(async (req, res) => {
    const payslip = await prisma.hrPayslip.update({
        where: { id: parseInt(req.params.id) },
        data: { state: 'paid' },
        include: { employee: true },
    });
    res.json(payslip);
}));

/** Reset to draft */
hrRoutes.patch('/payslips/:id/reset', asyncHandler(async (req, res) => {
    const payslip = await prisma.hrPayslip.update({
        where: { id: parseInt(req.params.id) },
        data: { state: 'draft' },
        include: { employee: true },
    });
    res.json(payslip);
}));

hrRoutes.delete('/payslips/:id', asyncHandler(async (req, res) => {
    await prisma.hrPayslip.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
}));

