/**
 * core/pdf — PDF generation service (ADR-0010)
 *
 * Uses pdfkit (pure Node.js, no browser/Chromium) to generate branded PDFs.
 * Returns a Buffer that callers can save as an Attachment or stream to the client.
 *
 * Usage:
 *   const buf = await generateInvoicePdf(moveId);
 *   res.setHeader('Content-Type', 'application/pdf');
 *   res.setHeader('Content-Disposition', `attachment; filename="INV0001.pdf"`);
 *   res.end(buf);
 */

import PDFDocument from 'pdfkit';
import prisma from '../../lib/prisma';
import { AppError } from '../errors';

// ── Branding constants ────────────────────────────────────────────────────────

const BRAND_COLOR = '#6366f1'; // indigo-500
const FONT_REGULAR = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'EUR'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function bufferFromDoc(doc: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
}

// ── Invoice / Vendor Bill PDF ─────────────────────────────────────────────────

export async function generateInvoicePdf(moveId: number): Promise<{ buffer: Buffer; filename: string }> {
    const move = await (prisma as any).accountMove?.findFirst?.({
        where: { id: moveId },
        include: {
            partner: true,
            lines: { include: { product: true } },
            journal: true,
        },
    });
    if (!move) throw AppError.notFound('Invoice');

    const isVendorBill = move.moveType === 'in_invoice';
    const docTitle = isVendorBill ? 'VENDOR BILL' : 'INVOICE';
    const filename = `${move.name?.replace(/\//g, '-') ?? 'document'}.pdf`;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const pdfDone = bufferFromDoc(doc);

    // ── Header ────────────────────────────────────────────────────────────────
    doc.font(FONT_BOLD).fontSize(24).fillColor(BRAND_COLOR).text('FusionAI ERP', 50, 50);
    doc.font(FONT_BOLD).fontSize(18).fillColor('#111').text(docTitle, 400, 50, { align: 'right' });
    doc.font(FONT_REGULAR).fontSize(10).fillColor('#555');
    doc.text(`Reference: ${move.name ?? '-'}`, 400, 75, { align: 'right' });
    doc.text(`Date: ${formatDate(move.postedAt ?? move.createdAt)}`, 400, 88, { align: 'right' });
    doc.text(`Status: ${move.state?.toUpperCase() ?? 'DRAFT'}`, 400, 101, { align: 'right' });

    // ── Divider ───────────────────────────────────────────────────────────────
    doc.moveTo(50, 125).lineTo(545, 125).strokeColor(BRAND_COLOR).lineWidth(1).stroke();
    doc.moveDown(0.5);

    // ── Partner block ─────────────────────────────────────────────────────────
    doc.font(FONT_BOLD).fontSize(10).fillColor('#111').text('Bill To:', 50, 140);
    doc.font(FONT_REGULAR).fillColor('#333');
    const partner = move.partner;
    if (partner) {
        doc.text(partner.name ?? '-', 50, 155);
        if (partner.email) doc.text(partner.email);
        if (partner.phone) doc.text(partner.phone);
        if (partner.vatId) doc.text(`VAT: ${partner.vatId}`);
    }

    // ── Line items table ──────────────────────────────────────────────────────
    const tableTop = 240;
    const colX = { desc: 50, qty: 310, price: 375, tax: 440, subtotal: 490 };

    doc.font(FONT_BOLD).fontSize(9).fillColor('#fff');
    doc.rect(50, tableTop - 5, 495, 18).fill(BRAND_COLOR);
    doc.text('Description', colX.desc, tableTop);
    doc.text('Qty', colX.qty, tableTop);
    doc.text('Unit Price', colX.price, tableTop);
    doc.text('Tax', colX.tax, tableTop);
    doc.text('Subtotal', colX.subtotal, tableTop, { align: 'right' });

    let y = tableTop + 20;
    doc.font(FONT_REGULAR).fontSize(9).fillColor('#333');

    const lines: any[] = move.lines ?? [];
    for (const line of lines) {
        if (y > 720) { doc.addPage(); y = 50; }
        doc.text(line.name ?? line.product?.name ?? '-', colX.desc, y, { width: 250, ellipsis: true });
        doc.text(String(line.quantity ?? 0), colX.qty, y);
        doc.text(formatCurrency(line.priceUnit ?? 0), colX.price, y);
        doc.text(`${line.taxAmount != null ? formatCurrency(line.taxAmount) : '-'}`, colX.tax, y);
        doc.text(formatCurrency(line.priceSubtotal ?? 0), colX.subtotal, y, { align: 'right' });
        y += 18;
        doc.moveTo(50, y - 2).lineTo(545, y - 2).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    }

    // ── Totals block ──────────────────────────────────────────────────────────
    y += 10;
    const totalsX = 390;
    doc.font(FONT_REGULAR).fontSize(10).fillColor('#333');
    doc.text('Subtotal:', totalsX, y); doc.text(formatCurrency(move.amountUntaxed ?? 0), 490, y, { align: 'right' }); y += 18;
    doc.text('Tax:', totalsX, y);      doc.text(formatCurrency(move.amountTax ?? 0), 490, y, { align: 'right' });      y += 18;
    doc.moveTo(totalsX, y).lineTo(545, y).strokeColor(BRAND_COLOR).lineWidth(1).stroke(); y += 6;
    doc.font(FONT_BOLD).fontSize(12).fillColor('#111');
    doc.text('Total:', totalsX, y);    doc.text(formatCurrency(move.amountTotal ?? 0), 490, y, { align: 'right' }); y += 20;

    if (move.amountResidual != null && move.amountResidual > 0) {
        doc.font(FONT_BOLD).fontSize(11).fillColor('#ef4444');
        doc.text('Amount Due:', totalsX, y + 5); doc.text(formatCurrency(move.amountResidual), 490, y + 5, { align: 'right' });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.font(FONT_REGULAR).fontSize(8).fillColor('#aaa');
    doc.text('Generated by FusionAI Enterprise Suite', 50, 790, { align: 'center' });

    doc.end();
    const buffer = await pdfDone;
    return { buffer, filename };
}

// ── Sales Order / Quotation PDF ───────────────────────────────────────────────

export async function generateOrderPdf(orderId: number): Promise<{ buffer: Buffer; filename: string }> {
    const order = await (prisma as any).saleOrder?.findFirst?.({
        where: { id: orderId },
        include: { partner: true, lines: { include: { product: true } } },
    });
    if (!order) throw AppError.notFound('Sale Order');

    const filename = `${order.name?.replace(/\//g, '-') ?? 'quotation'}.pdf`;
    const isQuote = ['draft', 'sent'].includes(order.state);
    const docTitle = isQuote ? 'QUOTATION' : 'ORDER CONFIRMATION';

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const pdfDone = bufferFromDoc(doc);

    doc.font(FONT_BOLD).fontSize(24).fillColor(BRAND_COLOR).text('FusionAI ERP', 50, 50);
    doc.font(FONT_BOLD).fontSize(18).fillColor('#111').text(docTitle, 400, 50, { align: 'right' });
    doc.font(FONT_REGULAR).fontSize(10).fillColor('#555');
    doc.text(`Ref: ${order.name}`, 400, 75, { align: 'right' });
    doc.text(`Date: ${formatDate(order.dateOrder)}`, 400, 88, { align: 'right' });

    doc.moveTo(50, 115).lineTo(545, 115).strokeColor(BRAND_COLOR).lineWidth(1).stroke();

    const partner = order.partner;
    doc.font(FONT_BOLD).fontSize(10).fillColor('#111').text('Customer:', 50, 130);
    doc.font(FONT_REGULAR).fillColor('#333');
    if (partner) {
        doc.text(partner.name ?? '-', 50, 145);
        if (partner.email) doc.text(partner.email);
    }

    const tableTop = 220;
    doc.font(FONT_BOLD).fontSize(9).fillColor('#fff');
    doc.rect(50, tableTop - 5, 495, 18).fill(BRAND_COLOR);
    doc.text('Product', 50, tableTop);
    doc.text('Qty', 310, tableTop);
    doc.text('Unit Price', 375, tableTop);
    doc.text('Subtotal', 490, tableTop, { align: 'right' });

    let y = tableTop + 20;
    doc.font(FONT_REGULAR).fontSize(9).fillColor('#333');
    for (const line of (order.lines ?? [])) {
        doc.text(line.name ?? line.product?.name ?? '-', 50, y, { width: 250 });
        doc.text(String(line.productQty ?? 0), 310, y);
        doc.text(formatCurrency(line.priceUnit ?? 0), 375, y);
        doc.text(formatCurrency(line.priceSubtotal ?? 0), 490, y, { align: 'right' });
        y += 18;
        doc.moveTo(50, y - 2).lineTo(545, y - 2).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    }

    y += 10;
    doc.font(FONT_BOLD).fontSize(12).fillColor('#111');
    doc.text('Total:', 390, y); doc.text(formatCurrency(order.amountTotal ?? 0), 490, y, { align: 'right' });

    doc.font(FONT_REGULAR).fontSize(8).fillColor('#aaa');
    doc.text('Generated by FusionAI Enterprise Suite', 50, 790, { align: 'center' });

    doc.end();
    const buffer = await pdfDone;
    return { buffer, filename };
}
