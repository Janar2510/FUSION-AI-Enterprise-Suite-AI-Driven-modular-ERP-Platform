import { Router, Request } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../core/auth';
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
hrRoutes.get('/timesheets', asyncHandler(async (req, res) => {
    const { skip, page, limit } = getPagination(req.query);
    const [data, total] = await Promise.all([
        prisma.hrTimesheet.findMany({ skip, take: limit, orderBy: { date: 'desc' }, include: { employee: true, project: true, task: true } }),
        prisma.hrTimesheet.count(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
}));

hrRoutes.post('/timesheets', asyncHandler(async (req, res) => {
    const ts = await prisma.hrTimesheet.create({ data: req.body });
    res.status(201).json(ts);
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
