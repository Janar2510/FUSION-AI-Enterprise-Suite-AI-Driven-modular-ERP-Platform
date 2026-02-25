import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding FusionAI database...');

    // ── Partner Tags ──────────────────────────────────────────
    const tagCustomer = await prisma.partnerTag.create({ data: { name: 'Customer', color: 1 } });
    const tagVendor = await prisma.partnerTag.create({ data: { name: 'Vendor', color: 2 } });
    const tagProspect = await prisma.partnerTag.create({ data: { name: 'Prospect', color: 3 } });
    const tagVIP = await prisma.partnerTag.create({ data: { name: 'VIP', color: 4 } });

    // ── Companies ─────────────────────────────────────────────
    const acmeCorp = await prisma.partner.create({
        data: { name: 'Acme Corporation', email: 'info@acme.com', phone: '+1-555-0100', isCompany: true, isCustomer: true, website: 'https://acme.com', street: '123 Business Ave', city: 'San Francisco', state: 'CA', zip: '94102', country: 'US', PartnerToPartnerTag: { create: [{ partner_tags: { connect: { id: tagCustomer.id } } }, { partner_tags: { connect: { id: tagVIP.id } } }] } },
    });
    const globalTech = await prisma.partner.create({
        data: { name: 'Global Tech Solutions', email: 'contact@globaltech.io', phone: '+1-555-0200', isCompany: true, isCustomer: true, isVendor: true, website: 'https://globaltech.io', street: '456 Innovation Blvd', city: 'New York', state: 'NY', zip: '10001', country: 'US', PartnerToPartnerTag: { create: [{ partner_tags: { connect: { id: tagCustomer.id } } }] } },
    });
    const greenSupply = await prisma.partner.create({
        data: { name: 'Green Supply Co', email: 'orders@greensupply.com', phone: '+1-555-0300', isCompany: true, isVendor: true, street: '789 Industrial Park', city: 'Chicago', state: 'IL', zip: '60601', country: 'US', PartnerToPartnerTag: { create: [{ partner_tags: { connect: { id: tagVendor.id } } }] } },
    });
    const euroDesign = await prisma.partner.create({
        data: { name: 'Euro Design Studio', email: 'hello@eurodesign.eu', phone: '+49-30-12345', isCompany: true, isCustomer: true, website: 'https://eurodesign.eu', street: 'Friedrichstraße 42', city: 'Berlin', country: 'DE', PartnerToPartnerTag: { create: [{ partner_tags: { connect: { id: tagCustomer.id } } }] } },
    });
    const techParts = await prisma.partner.create({
        data: { name: 'TechParts International', email: 'sales@techparts.com', phone: '+44-20-55550400', isCompany: true, isVendor: true, country: 'GB', PartnerToPartnerTag: { create: [{ partner_tags: { connect: { id: tagVendor.id } } }] } },
    });

    // ── Individual Contacts ───────────────────────────────────
    const john = await prisma.partner.create({
        data: { name: 'John Smith', email: 'john.smith@acme.com', phone: '+1-555-0101', mobile: '+1-555-0111', jobPosition: 'CEO', title: 'Mr', parentId: acmeCorp.id, isCustomer: true, PartnerToPartnerTag: { create: [{ partner_tags: { connect: { id: tagVIP.id } } }] } },
    });
    const sarah = await prisma.partner.create({
        data: { name: 'Sarah Johnson', email: 'sarah.j@globaltech.io', phone: '+1-555-0201', jobPosition: 'CTO', title: 'Ms', parentId: globalTech.id, isCustomer: true },
    });
    const mike = await prisma.partner.create({
        data: { name: 'Mike Williams', email: 'mike@greensupply.com', phone: '+1-555-0301', jobPosition: 'Sales Manager', parentId: greenSupply.id, isVendor: true },
    });
    const emma = await prisma.partner.create({
        data: { name: 'Emma Davis', email: 'emma@eurodesign.eu', phone: '+49-30-12346', jobPosition: 'Creative Director', parentId: euroDesign.id, isCustomer: true },
    });
    const alex = await prisma.partner.create({
        data: { name: 'Alex Chen', email: 'alex.chen@example.com', phone: '+1-555-0500', jobPosition: 'Freelance Developer', isCustomer: true, PartnerToPartnerTag: { create: [{ partner_tags: { connect: { id: tagProspect.id } } }] } },
    });

    // ── Product Categories ────────────────────────────────────
    const catHardware = await prisma.productCategory.create({ data: { name: 'Hardware' } });
    const catSoftware = await prisma.productCategory.create({ data: { name: 'Software' } });
    const catServices = await prisma.productCategory.create({ data: { name: 'Services' } });
    const catRawMaterials = await prisma.productCategory.create({ data: { name: 'Raw Materials' } });

    // ── Products ──────────────────────────────────────────────
    const laptop = await prisma.product.create({ data: { name: 'Business Laptop Pro 15', internalRef: 'HW-LAP-001', type: 'product', salePrice: 1299.99, costPrice: 850, categoryId: catHardware.id, qtyOnHand: 45, qtyForecasted: 60, description: 'High-performance business laptop with 15" display' } });
    const monitor = await prisma.product.create({ data: { name: '4K Ultra Monitor 27"', internalRef: 'HW-MON-001', type: 'product', salePrice: 549.99, costPrice: 320, categoryId: catHardware.id, qtyOnHand: 120, qtyForecasted: 100, description: '27-inch 4K monitor for professional use' } });
    const keyboard = await prisma.product.create({ data: { name: 'Mechanical Keyboard RGB', internalRef: 'HW-KEY-001', type: 'product', salePrice: 129.99, costPrice: 65, categoryId: catHardware.id, qtyOnHand: 200, qtyForecasted: 180 } });
    const erPLicense = await prisma.product.create({ data: { name: 'FusionAI ERP License (Annual)', internalRef: 'SW-ERP-001', type: 'service', salePrice: 4999.99, costPrice: 0, categoryId: catSoftware.id, description: 'Annual subscription to FusionAI Enterprise Suite' } });
    const consulting = await prisma.product.create({ data: { name: 'Technical Consulting (per hour)', internalRef: 'SRV-CON-001', type: 'service', salePrice: 150, costPrice: 80, categoryId: catServices.id } });
    const steelPlate = await prisma.product.create({ data: { name: 'Steel Plate 1m x 2m', internalRef: 'RM-STL-001', type: 'product', salePrice: 89.99, costPrice: 45, categoryId: catRawMaterials.id, qtyOnHand: 500 } });

    // ── CRM Stages ────────────────────────────────────────────
    const stageNew = await prisma.crmStage.create({ data: { name: 'New', sequence: 1 } });
    const stageQualified = await prisma.crmStage.create({ data: { name: 'Qualified', sequence: 2 } });
    const stageProposal = await prisma.crmStage.create({ data: { name: 'Proposition', sequence: 3 } });
    const stageNegotiation = await prisma.crmStage.create({ data: { name: 'Negotiation', sequence: 4 } });
    const stageWon = await prisma.crmStage.create({ data: { name: 'Won', sequence: 5, foldedKanban: true } });

    // ── CRM Leads ─────────────────────────────────────────────
    await prisma.crmLead.create({ data: { name: 'Acme ERP Implementation', type: 'opportunity', stageId: stageNegotiation.id, partnerId: acmeCorp.id, expectedRevenue: 75000, probability: 70, contactName: 'John Smith', emailFrom: 'john.smith@acme.com', phone: '+1-555-0101', priority: 2 } });
    await prisma.crmLead.create({ data: { name: 'Global Tech License Renewal', type: 'opportunity', stageId: stageProposal.id, partnerId: globalTech.id, expectedRevenue: 25000, probability: 80, contactName: 'Sarah Johnson', emailFrom: 'sarah.j@globaltech.io', priority: 1 } });
    await prisma.crmLead.create({ data: { name: 'Euro Design Consulting Project', type: 'opportunity', stageId: stageQualified.id, partnerId: euroDesign.id, expectedRevenue: 15000, probability: 40, contactName: 'Emma Davis', emailFrom: 'emma@eurodesign.eu' } });
    await prisma.crmLead.create({ data: { name: 'New website inquiry from LinkedIn', type: 'lead', stageId: stageNew.id, expectedRevenue: 5000, probability: 10, contactName: 'David Park', emailFrom: 'david.park@startup.io', city: 'Austin', state: 'TX', country: 'US' } });
    await prisma.crmLead.create({ data: { name: 'Hardware upgrade request', type: 'lead', stageId: stageNew.id, expectedRevenue: 12000, probability: 15, contactName: 'Lisa Wang', emailFrom: 'lisa.wang@enterprise.com' } });
    await prisma.crmLead.create({ data: { name: 'Alex Chen — Freelance project', type: 'opportunity', stageId: stageQualified.id, partnerId: alex.id, expectedRevenue: 8000, probability: 50, contactName: 'Alex Chen', emailFrom: 'alex.chen@example.com' } });

    // ── Sale Orders ───────────────────────────────────────────
    await prisma.saleOrder.create({
        data: {
            name: 'SO00001', state: 'sale', partnerId: acmeCorp.id, amountTotal: 18499.87, amountUntaxed: 18499.87,
            lines: {
                create: [
                    { name: 'Business Laptop Pro 15', productId: laptop.id, productQty: 10, priceUnit: 1299.99, priceSubtotal: 12999.90, priceTotal: 12999.90, sequence: 10 },
                    { name: 'FusionAI ERP License (Annual)', productId: erPLicense.id, productQty: 1, priceUnit: 4999.99, priceSubtotal: 4999.99, priceTotal: 4999.99, sequence: 20 },
                    { name: 'Technical Consulting (5 hours)', productId: consulting.id, productQty: 5, priceUnit: 150, priceSubtotal: 750, priceTotal: 750, sequence: 30, discount: 50 },
                ]
            },
        },
    });
    await prisma.saleOrder.create({
        data: {
            name: 'SO00002', state: 'draft', partnerId: globalTech.id, amountTotal: 3849.93, amountUntaxed: 3849.93,
            lines: {
                create: [
                    { name: '4K Ultra Monitor 27"', productId: monitor.id, productQty: 5, priceUnit: 549.99, priceSubtotal: 2749.95, priceTotal: 2749.95, sequence: 10 },
                    { name: 'Mechanical Keyboard RGB', productId: keyboard.id, productQty: 5, priceUnit: 129.99, priceSubtotal: 649.95, priceTotal: 649.95, sequence: 20 },
                ]
            },
        },
    });

    // ── Purchase Orders ───────────────────────────────────────
    await prisma.purchaseOrder.create({
        data: {
            name: 'PO00001', state: 'purchase', partnerId: greenSupply.id, amountTotal: 22500,
            lines: {
                create: [
                    { name: 'Steel Plate 1m x 2m', productId: steelPlate.id, productQty: 500, priceUnit: 45, priceSubtotal: 22500, priceTotal: 22500 },
                ]
            },
        },
    });

    // ── Chart of Accounts ─────────────────────────────────────
    const accReceivable = await prisma.accountAccount.create({ data: { code: '101200', name: 'Account Receivable', accountType: 'asset_receivable' } });
    const accPayable = await prisma.accountAccount.create({ data: { code: '211000', name: 'Account Payable', accountType: 'liability_payable' } });
    const accIncome = await prisma.accountAccount.create({ data: { code: '400000', name: 'Product Sales', accountType: 'income' } });
    const accExpense = await prisma.accountAccount.create({ data: { code: '600000', name: 'Expenses', accountType: 'expense' } });

    // ── Account Journals ──────────────────────────────────────
    const journalSales = await prisma.accountJournal.create({ data: { name: 'Customer Invoices', code: 'INV', type: 'sale' } });
    const journalPurchase = await prisma.accountJournal.create({ data: { name: 'Vendor Bills', code: 'BILL', type: 'purchase' } });
    await prisma.accountJournal.create({ data: { name: 'Bank', code: 'BANK', type: 'bank' } });
    await prisma.accountJournal.create({ data: { name: 'Cash', code: 'CASH', type: 'cash' } });

    // ── Invoices & Entries ────────────────────────────────────
    await prisma.accountMove.create({
        data: {
            name: 'INV/2025/0001', moveType: 'out_invoice', state: 'posted', partnerId: acmeCorp.id, journalId: journalSales.id,
            amountTotal: 17999.89, amountUntaxed: 17999.89, paymentState: 'paid', amountResidual: 0,
            lines: {
                create: [
                    { name: 'Accounts Receivable', debit: 17999.89, credit: 0, accountId: accReceivable.id },
                    { name: 'Business Laptop Pro 15 x10', quantity: 10, priceUnit: 1299.99, priceSubtotal: 12999.90, priceTotal: 12999.90, debit: 0, credit: 12999.90, accountId: accIncome.id, productId: laptop.id },
                    { name: 'FusionAI ERP License', quantity: 1, priceUnit: 4999.99, priceSubtotal: 4999.99, priceTotal: 4999.99, debit: 0, credit: 4999.99, accountId: accIncome.id, productId: erPLicense.id },
                ]
            },
        },
    });

    await prisma.accountMove.create({
        data: {
            name: 'BILL/2026/0001', moveType: 'in_invoice', state: 'posted', partnerId: greenSupply.id, journalId: journalPurchase.id,
            amountTotal: 22500, amountUntaxed: 22500, paymentState: 'not_paid', amountResidual: 22500,
            lines: {
                create: [
                    { name: 'Accounts Payable', credit: 22500, debit: 0, accountId: accPayable.id },
                    { name: 'Steel Plate 1m x 2m', quantity: 500, priceUnit: 45, priceSubtotal: 22500, priceTotal: 22500, debit: 22500, credit: 0, accountId: accExpense.id, productId: steelPlate.id },
                ]
            }
        }
    });

    await prisma.accountMove.create({
        data: {
            name: 'MISC/2026/0001', moveType: 'entry', state: 'posted', journalId: journalSales.id,
            lines: {
                create: [
                    { name: 'Opening Balance Checking', debit: 50000, credit: 0, accountId: accReceivable.id },
                    { name: 'Opening Balance Equity', debit: 0, credit: 50000, accountId: accIncome.id },
                ]
            }
        }
    });

    // ── Stock Warehouse, Locations, Picking Types ─────────────
    const wh = await prisma.stockWarehouse.create({ data: { name: 'Main Warehouse', code: 'WH' } });

    const locView = await prisma.stockLocation.create({ data: { name: 'WH', completeName: 'WH', usage: 'view', warehouseId: wh.id } });
    const locStock = await prisma.stockLocation.create({ data: { name: 'Stock', completeName: 'WH/Stock', usage: 'internal', locationId: locView.id, warehouseId: wh.id } });
    const locSuppliers = await prisma.stockLocation.create({ data: { name: 'Vendors', completeName: 'Partner Locations/Vendors', usage: 'supplier' } });
    const locCustomers = await prisma.stockLocation.create({ data: { name: 'Customers', completeName: 'Partner Locations/Customers', usage: 'customer' } });

    const ptReceipts = await prisma.stockPickingType.create({ data: { name: 'Receipts', code: 'incoming', sequenceCode: 'IN', warehouseId: wh.id, defaultLocationSrcId: locSuppliers.id, defaultLocationDestId: locStock.id } });
    const ptDeliveries = await prisma.stockPickingType.create({ data: { name: 'Delivery Orders', code: 'outgoing', sequenceCode: 'OUT', warehouseId: wh.id, defaultLocationSrcId: locStock.id, defaultLocationDestId: locCustomers.id } });
    const ptInternal = await prisma.stockPickingType.create({ data: { name: 'Internal Transfers', code: 'internal', sequenceCode: 'INT', warehouseId: wh.id, defaultLocationSrcId: locStock.id, defaultLocationDestId: locStock.id } });

    // ── Pre-seed Initial Quants (Stock On Hand) ───────────────
    await prisma.stockQuant.create({ data: { productId: laptop.id, locationId: locStock.id, quantity: 45 } });
    await prisma.stockQuant.create({ data: { productId: monitor.id, locationId: locStock.id, quantity: 120 } });
    await prisma.stockQuant.create({ data: { productId: keyboard.id, locationId: locStock.id, quantity: 200 } });
    await prisma.stockQuant.create({ data: { productId: steelPlate.id, locationId: locStock.id, quantity: 500 } });

    // ── HR Departments ────────────────────────────────────────
    const deptMgmt = await prisma.hrDepartment.create({ data: { name: 'Management' } });
    const deptEng = await prisma.hrDepartment.create({ data: { name: 'Engineering' } });
    const deptSales = await prisma.hrDepartment.create({ data: { name: 'Sales' } });
    const deptHR = await prisma.hrDepartment.create({ data: { name: 'Human Resources' } });
    const deptOps = await prisma.hrDepartment.create({ data: { name: 'Operations' } });

    // ── HR Jobs ───────────────────────────────────────────────
    const jobCEO = await prisma.hrJob.create({ data: { name: 'Chief Executive Officer', state: 'open' } });
    const jobDev = await prisma.hrJob.create({ data: { name: 'Software Engineer', expectedEmployees: 10 } });
    const jobSalesMgr = await prisma.hrJob.create({ data: { name: 'Sales Manager', expectedEmployees: 3 } });
    const jobHRMgr = await prisma.hrJob.create({ data: { name: 'HR Manager' } });
    const jobDesigner = await prisma.hrJob.create({ data: { name: 'UX Designer', expectedEmployees: 2 } });

    // ── HR Employees ──────────────────────────────────────────
    await prisma.hrEmployee.create({ data: { name: 'Alice Martin', workEmail: 'alice@fusionai.com', employeeNumber: 'EMP001', departmentId: deptMgmt.id, jobId: jobCEO.id, gender: 'female' } });
    await prisma.hrEmployee.create({ data: { name: 'Bob Taylor', workEmail: 'bob@fusionai.com', employeeNumber: 'EMP002', departmentId: deptEng.id, jobId: jobDev.id, gender: 'male' } });
    await prisma.hrEmployee.create({ data: { name: 'Carol White', workEmail: 'carol@fusionai.com', employeeNumber: 'EMP003', departmentId: deptSales.id, jobId: jobSalesMgr.id, gender: 'female' } });
    await prisma.hrEmployee.create({ data: { name: 'Daniel Brown', workEmail: 'daniel@fusionai.com', employeeNumber: 'EMP004', departmentId: deptEng.id, jobId: jobDev.id, gender: 'male' } });
    await prisma.hrEmployee.create({ data: { name: 'Eva Fischer', workEmail: 'eva@fusionai.com', employeeNumber: 'EMP005', departmentId: deptHR.id, jobId: jobHRMgr.id, gender: 'female' } });

    // ── Project Stages ────────────────────────────────────────
    const pStageNew = await prisma.projectStage.create({ data: { name: 'New', sequence: 1 } });
    const pStageProgress = await prisma.projectStage.create({ data: { name: 'In Progress', sequence: 2 } });
    const pStageDone = await prisma.projectStage.create({ data: { name: 'Done', sequence: 3, foldedKanban: true } });
    const pStageCancelled = await prisma.projectStage.create({ data: { name: 'Cancelled', sequence: 4, foldedKanban: true } });

    // ── Projects & Tasks ──────────────────────────────────────
    const projERP = await prisma.projectProject.create({ data: { name: 'FusionAI v2.0 Release', description: 'Next major release of the ERP platform', taskCount: 5 } });
    await prisma.projectTask.create({ data: { name: 'Implement Unified Contact System', projectId: projERP.id, stageId: pStageProgress.id, priority: 2 } });
    await prisma.projectTask.create({ data: { name: 'Build Purchase Module Dashboard', projectId: projERP.id, stageId: pStageNew.id, priority: 1 } });
    await prisma.projectTask.create({ data: { name: 'Prisma Backend Migration', projectId: projERP.id, stageId: pStageDone.id } });
    await prisma.projectTask.create({ data: { name: 'POS Terminal UI', projectId: projERP.id, stageId: pStageNew.id } });
    await prisma.projectTask.create({ data: { name: 'Calendar Module Integration', projectId: projERP.id, stageId: pStageNew.id } });

    const projWebsite = await prisma.projectProject.create({ data: { name: 'Company Website Redesign', description: 'Modernize the corporate website', taskCount: 3 } });
    await prisma.projectTask.create({ data: { name: 'Design homepage wireframes', projectId: projWebsite.id, stageId: pStageDone.id } });
    await prisma.projectTask.create({ data: { name: 'Implement responsive layout', projectId: projWebsite.id, stageId: pStageProgress.id } });
    await prisma.projectTask.create({ data: { name: 'SEO optimization', projectId: projWebsite.id, stageId: pStageNew.id } });

    // ── Helpdesk Stages ───────────────────────────────────────
    const hdNew = await prisma.helpdeskStage.create({ data: { name: 'New', sequence: 1 } });
    const hdProgress = await prisma.helpdeskStage.create({ data: { name: 'In Progress', sequence: 2 } });
    const hdSolved = await prisma.helpdeskStage.create({ data: { name: 'Solved', sequence: 3, foldedKanban: true } });

    await prisma.helpdeskTicket.create({ data: { name: 'Cannot login to dashboard', stageId: hdProgress.id, partnerId: john.id, priority: 2, description: 'User reports being unable to access the main dashboard after password reset.' } });
    await prisma.helpdeskTicket.create({ data: { name: 'Invoice PDF not generating', stageId: hdNew.id, partnerId: sarah.id, priority: 1, description: 'PDF generation fails for invoices created after Jan 2025.' } });
    await prisma.helpdeskTicket.create({ data: { name: 'Feature request: Dark mode', stageId: hdNew.id, partnerId: alex.id, priority: 0 } });

    // ── Calendar Events ───────────────────────────────────────
    const now = new Date();
    await prisma.calendarEvent.create({ data: { name: 'Team Standup', start: new Date(now.getTime() + 86400000), stop: new Date(now.getTime() + 86400000 + 1800000), recurrency: true, location: 'Virtual - Google Meet' } });
    await prisma.calendarEvent.create({ data: { name: 'Client Demo — Acme Corp', start: new Date(now.getTime() + 172800000), stop: new Date(now.getTime() + 172800000 + 3600000), location: 'Conference Room A' } });
    await prisma.calendarEvent.create({ data: { name: 'Sprint Planning', start: new Date(now.getTime() + 432000000), stop: new Date(now.getTime() + 432000000 + 7200000), location: 'Office' } });

    // ── POS Config ────────────────────────────────────────────
    await prisma.posConfig.create({ data: { name: 'Main POS Terminal' } });
    await prisma.posConfig.create({ data: { name: 'Bar' } });

    // ── Messaging Channels ────────────────────────────────────
    await prisma.mailChannel.create({ data: { name: 'General', channelType: 'channel', description: 'General discussion for the whole team' } });
    await prisma.mailChannel.create({ data: { name: 'Engineering', channelType: 'channel', description: 'Tech discussions and updates' } });
    await prisma.mailChannel.create({ data: { name: 'Sales Team', channelType: 'channel', description: 'Sales pipeline updates and wins' } });

    // ── Notes ─────────────────────────────────────────────────
    await prisma.note.create({ data: { name: 'Release checklist for v2.0', body: '- [ ] All tests passing\n- [ ] Documentation updated\n- [ ] Changelog written\n- [ ] Performance tested', stage: 'in_progress', color: 1 } });
    await prisma.note.create({ data: { name: 'Meeting notes — Product roadmap', body: 'Discussed Q2 priorities: focus on manufacturing module and POS improvements.', stage: 'done', color: 3 } });

    // ── Manufacturing ─────────────────────────────────────────
    const bom = await prisma.mrpBom.create({ data: { name: 'Business Laptop Assembly', productQty: 1, type: 'normal' } });
    await prisma.mrpProduction.create({ data: { name: 'MO/2026/001', state: 'progress', productQty: 10, bomId: bom.id } });
    await prisma.mrpProduction.create({ data: { name: 'MO/2026/002', state: 'draft', productQty: 25 } });

    // ── Fleet ─────────────────────────────────────────────────
    await prisma.fleetVehicle.create({ data: { name: 'Toyota Camry 2024', licensePlate: 'ABC-1234', model: 'Camry', brand: 'Toyota', fuelType: 'hybrid', state: 'active', odometer: 12500 } });
    await prisma.fleetVehicle.create({ data: { name: 'Ford Transit Van', licensePlate: 'XYZ-5678', model: 'Transit', brand: 'Ford', fuelType: 'diesel', state: 'active', odometer: 45200 } });
    await prisma.fleetVehicle.create({ data: { name: 'Tesla Model 3', licensePlate: 'EV-9900', model: 'Model 3', brand: 'Tesla', fuelType: 'electric', state: 'active', odometer: 8300 } });

    // ── Maintenance ───────────────────────────────────────────
    await prisma.maintenanceRequest.create({ data: { name: 'HVAC filter replacement', requestDate: new Date(), priority: 1, stage: 'in_progress', maintenanceType: 'preventive' } });
    await prisma.maintenanceRequest.create({ data: { name: 'Server room UPS battery check', requestDate: new Date(now.getTime() + 604800000), priority: 2, stage: 'new', maintenanceType: 'corrective' } });

    // ── Surveys ───────────────────────────────────────────────
    await prisma.survey.create({ data: { title: 'Employee Satisfaction Q1 2026', state: 'open', description: 'Quarterly employee satisfaction and engagement survey.' } });
    await prisma.survey.create({ data: { title: 'Customer NPS Survey', state: 'open', description: 'Net Promoter Score survey for active customers.' } });

    // ── Knowledge ─────────────────────────────────────────────
    await prisma.knowledgeArticle.create({ data: { title: 'Employee Onboarding Guide', body: '# Welcome to FusionAI\n\nThis guide covers everything you need to get started...\n\n## Day 1\n- Set up your accounts\n- Meet your team\n- Review company handbook', isPublished: true, category: 'hr' } });
    await prisma.knowledgeArticle.create({ data: { title: 'API Documentation', body: '# FusionAI API Reference\n\n## Authentication\nAll API requests require a Bearer token.\n\n## Endpoints\n- `GET /api/partners` — List all contacts\n- `POST /api/crm/leads` — Create a lead', isPublished: true, category: 'engineering' } });

    // ── Leaves (Time Off) ─────────────────────────────────────
    await prisma.hrLeave.create({ data: { name: 'Summer Vacation', state: 'validate', leaveType: 'legal', dateFrom: new Date('2026-07-01'), dateTo: new Date('2026-07-14'), numberOfDays: 10, employeeId: 2 } });
    await prisma.hrLeave.create({ data: { name: 'Sick Leave', state: 'confirm', leaveType: 'sick', dateFrom: new Date('2026-03-10'), dateTo: new Date('2026-03-12'), numberOfDays: 2, employeeId: 4 } });
    await prisma.hrLeave.create({ data: { name: 'Family Event', state: 'draft', leaveType: 'compensatory', dateFrom: new Date('2026-04-20'), dateTo: new Date('2026-04-21'), numberOfDays: 1, employeeId: 3 } });

    // ── Expenses ──────────────────────────────────────────────
    await prisma.hrExpense.create({ data: { name: 'Client Dinner — Acme Corp', state: 'approved', date: new Date('2026-02-15'), totalAmount: 245.50, quantity: 1, unitAmount: 245.50, paymentMode: 'own_account', employeeId: 3 } });
    await prisma.hrExpense.create({ data: { name: 'Conference Registration — React Summit', state: 'draft', date: new Date('2026-03-01'), totalAmount: 599, quantity: 1, unitAmount: 599, paymentMode: 'company_account', employeeId: 2 } });
    await prisma.hrExpense.create({ data: { name: 'Office Supplies', state: 'reported', date: new Date('2026-02-20'), totalAmount: 127.80, quantity: 1, unitAmount: 127.80, paymentMode: 'own_account', employeeId: 5 } });

    // ── Recruitment ───────────────────────────────────────────
    await prisma.hrApplicant.create({ data: { name: 'Senior React Developer', partnerName: 'James Wilson', email: 'james.w@email.com', phone: '+1-555-7001', stage: 'interview', salary: 120000, source: 'linkedin', jobId: jobDev.id, departmentId: deptEng.id } });
    await prisma.hrApplicant.create({ data: { name: 'UX Designer — Portfolio Review', partnerName: 'María García', email: 'maria.g@design.io', phone: '+34-600-123456', stage: 'qualified', salary: 85000, source: 'website', jobId: jobDesigner.id, departmentId: deptEng.id } });
    await prisma.hrApplicant.create({ data: { name: 'Sales Account Executive', partnerName: 'David Kim', email: 'david.kim@gmail.com', stage: 'new', salary: 75000, source: 'referral', jobId: jobSalesMgr.id, departmentId: deptSales.id } });

    // ── Attendances ───────────────────────────────────────────
    await prisma.hrAttendance.create({ data: { checkIn: new Date('2026-02-23T08:00:00'), checkOut: new Date('2026-02-23T17:30:00'), workedHours: 9.5, employeeId: 1 } });
    await prisma.hrAttendance.create({ data: { checkIn: new Date('2026-02-23T08:15:00'), checkOut: new Date('2026-02-23T18:00:00'), workedHours: 9.75, employeeId: 2 } });
    await prisma.hrAttendance.create({ data: { checkIn: new Date('2026-02-23T09:00:00'), checkOut: new Date('2026-02-23T17:00:00'), workedHours: 8, employeeId: 3 } });
    await prisma.hrAttendance.create({ data: { checkIn: new Date('2026-02-23T08:30:00'), workedHours: 0, employeeId: 4 } }); // still checked in

    // ── Payroll ───────────────────────────────────────────────
    await prisma.hrPayslip.create({ data: { name: 'SLIP/2026/001', state: 'done', dateFrom: new Date('2026-01-01'), dateTo: new Date('2026-01-31'), basicWage: 8500, grossSalary: 8500, deductions: 2125, netSalary: 6375, employeeId: 1 } });
    await prisma.hrPayslip.create({ data: { name: 'SLIP/2026/002', state: 'done', dateFrom: new Date('2026-01-01'), dateTo: new Date('2026-01-31'), basicWage: 7200, grossSalary: 7200, deductions: 1800, netSalary: 5400, employeeId: 2 } });
    await prisma.hrPayslip.create({ data: { name: 'SLIP/2026/003', state: 'draft', dateFrom: new Date('2026-02-01'), dateTo: new Date('2026-02-28'), basicWage: 8500, grossSalary: 8500, deductions: 2125, netSalary: 6375, employeeId: 1 } });

    // ── Appraisals ────────────────────────────────────────────
    await prisma.hrAppraisal.create({ data: { state: 'done', overallRating: 5, managerFeedback: 'Exceptional leadership. Drove company to 30% revenue growth.', employeeFeedback: 'Great year, looking forward to scaling the team.', deadline: new Date('2026-01-15'), employeeId: 1 } });
    await prisma.hrAppraisal.create({ data: { state: 'done', overallRating: 4, managerFeedback: 'Strong technical skills, excellent code quality. Room for growth in mentoring.', employeeFeedback: 'Enjoyed working on the ERP migration project.', deadline: new Date('2026-01-15'), employeeId: 2 } });
    await prisma.hrAppraisal.create({ data: { state: 'pending', overallRating: 0, deadline: new Date('2026-03-01'), employeeId: 4 } });

    // ── Quality ───────────────────────────────────────────────
    const qpIncoming = await prisma.qualityPoint.create({ data: { name: 'Incoming Goods Inspection', testType: 'passfail', notes: 'Check packaging integrity and product count.' } });
    const qpDimension = await prisma.qualityPoint.create({ data: { name: 'Dimensional Check', testType: 'measure', notes: 'Measure critical dimensions against spec sheet.' } });
    await prisma.qualityCheck.create({ data: { name: 'Laptop shipment #LAP-2026-001', state: 'pass', testType: 'passfail', pointId: qpIncoming.id, notes: 'All 50 units received in good condition.' } });
    await prisma.qualityCheck.create({ data: { name: 'Steel plate batch #STL-2026-012', state: 'fail', testType: 'measure', measureValue: 1.03, pointId: qpDimension.id, notes: 'Thickness 1.03m exceeds tolerance (max 1.01m).' } });
    await prisma.qualityCheck.create({ data: { name: 'Monitor QC — Batch #MON-B5', state: 'none', testType: 'passfail', pointId: qpIncoming.id } });

    // ── PLM (Engineering Changes) ─────────────────────────────
    await prisma.mrpEco.create({ data: { name: 'ECO-001: Laptop hinge redesign', stage: 'progress', type: 'product', description: 'Redesign hinge mechanism for improved durability. Current design fails after ~500 open/close cycles.', approvalState: 'approved' } });
    await prisma.mrpEco.create({ data: { name: 'ECO-002: Updated BOM for Monitor v2', stage: 'confirmed', type: 'bom', description: 'Replace panel supplier. New Samsung panel improves color accuracy.', approvalState: 'none' } });
    await prisma.mrpEco.create({ data: { name: 'ECO-003: Keyboard switch upgrade', stage: 'new', type: 'product', description: 'Switch from Cherry MX Red to Cherry MX Brown for better tactile feedback.' } });

    // ── Subscriptions ─────────────────────────────────────────
    await prisma.subscription.create({ data: { name: 'SUB-001', state: 'in_progress', plan: 'enterprise', mrr: 2400, startDate: new Date('2024-01-15'), nextBilling: new Date('2026-03-01'), recurringRule: 'monthly', partnerId: acmeCorp.id } });
    await prisma.subscription.create({ data: { name: 'SUB-002', state: 'in_progress', plan: 'pro', mrr: 1200, startDate: new Date('2024-03-20'), nextBilling: new Date('2026-03-05'), recurringRule: 'monthly', partnerId: globalTech.id } });
    await prisma.subscription.create({ data: { name: 'SUB-003', state: 'in_progress', plan: 'starter', mrr: 49, startDate: new Date('2024-09-01'), nextBilling: new Date('2026-03-10'), recurringRule: 'monthly', partnerId: euroDesign.id } });
    await prisma.subscription.create({ data: { name: 'SUB-004', state: 'in_progress', plan: 'enterprise', mrr: 3600, startDate: new Date('2023-06-12'), nextBilling: new Date('2026-03-01'), recurringRule: 'yearly', partnerId: techParts.id } });
    await prisma.subscription.create({ data: { name: 'SUB-005', state: 'churned', plan: 'pro', mrr: 0, startDate: new Date('2024-02-01'), endDate: new Date('2025-12-31'), recurringRule: 'monthly', partnerId: greenSupply.id } });

    // ── Planning Slots ────────────────────────────────────────
    const nextWeek = new Date(now.getTime() + 86400000);
    const nextWeekEnd = new Date(now.getTime() + 5 * 86400000);
    await prisma.planningSlot.create({ data: { role: 'Developer', hours: 32, startDate: nextWeek, endDate: nextWeekEnd, state: 'published', employeeId: 2, projectId: projERP.id } });
    await prisma.planningSlot.create({ data: { role: 'Designer', hours: 24, startDate: nextWeek, endDate: nextWeekEnd, state: 'published', employeeId: 4, projectId: projWebsite.id } });
    await prisma.planningSlot.create({ data: { role: 'QA Engineer', hours: 40, startDate: nextWeek, endDate: nextWeekEnd, state: 'draft', employeeId: 5, projectId: projERP.id } });
    await prisma.planningSlot.create({ data: { role: 'Project Manager', hours: 16, startDate: nextWeek, endDate: nextWeekEnd, state: 'published', employeeId: 1, projectId: projWebsite.id } });
    await prisma.planningSlot.create({ data: { role: 'Developer', hours: 28, startDate: nextWeek, endDate: nextWeekEnd, state: 'draft', employeeId: 3, projectId: projERP.id } });

    // ── Marketing Campaigns ───────────────────────────────────
    await prisma.marketingCampaign.create({ data: { name: 'Spring Product Launch', type: 'multi_channel', state: 'active', budget: 5000, spent: 3200, leads: 245, conversions: 34, startDate: new Date('2026-02-15'), description: 'Major launch campaign for new ERP features.' } });
    await prisma.marketingCampaign.create({ data: { name: 'Webinar Series Q1', type: 'content', state: 'active', budget: 2000, spent: 1800, leads: 180, conversions: 28, startDate: new Date('2026-01-20') } });
    await prisma.marketingCampaign.create({ data: { name: 'Social Media Blast', type: 'social', state: 'completed', budget: 3000, spent: 3000, leads: 520, conversions: 67, startDate: new Date('2026-01-10'), endDate: new Date('2026-02-10') } });
    await prisma.marketingCampaign.create({ data: { name: 'Trade Show Follow-up', type: 'email', state: 'draft', budget: 1500, spent: 0, leads: 0, conversions: 0, description: 'Email drip sequence for trade show booth contacts.' } });

    console.log('✅ Seed complete! Database populated with comprehensive demo data.');
}

main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
