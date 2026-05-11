/**
 * core/email — Transactional email service (ADR-0011)
 *
 * Transport: SMTP via Nodemailer. Configure with env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * In development (NODE_ENV !== 'production'), uses Ethereal preview if no SMTP configured.
 * Failed sends are NOT retried here — the caller should write to OutboxEvent for retry.
 *
 * Usage:
 *   await sendEmail('customer@example.com', 'invoice', { invoiceNum: 'INV0001', amount: '1500.00' });
 *   await sendEmail(to, 'password-reset', { resetUrl }, [{ filename, content }]);
 */

import nodemailer, { Transporter } from 'nodemailer';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface EmailAttachment {
    filename: string;
    content: Buffer | string;
    contentType?: string;
}

export interface SendEmailOptions {
    to: string | string[];
    subject?: string;
    templateKey: string;
    vars?: Record<string, string>;
    attachments?: EmailAttachment[];
    replyTo?: string;
}

// ── Template library ──────────────────────────────────────────────────────────

const TEMPLATES: Record<string, { subject: string; html: string }> = {
    invoice: {
        subject: 'Your invoice {{invoiceNum}} — {{companyName}}',
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#6366f1">Invoice {{invoiceNum}}</h2>
  <p>Dear {{partnerName}},</p>
  <p>Please find your invoice for <strong>€{{amount}}</strong> attached.</p>
  <p>Due date: <strong>{{dueDate}}</strong></p>
  {{#if paymentLink}}<p><a href="{{paymentLink}}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Pay Now</a></p>{{/if}}
  <hr/><p style="color:#888;font-size:12px">{{companyName}} · {{companyAddress}}</p>
</div>`,
    },
    'order-confirm': {
        subject: 'Order confirmation {{orderNum}} — {{companyName}}',
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#10b981">Order Confirmed: {{orderNum}}</h2>
  <p>Dear {{partnerName}},</p>
  <p>Thank you for your order! We have confirmed <strong>{{orderNum}}</strong> for <strong>€{{amount}}</strong>.</p>
  <p>Estimated delivery: <strong>{{deliveryDate}}</strong></p>
  <hr/><p style="color:#888;font-size:12px">{{companyName}}</p>
</div>`,
    },
    'password-reset': {
        subject: 'Reset your password — {{companyName}}',
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2>Reset your password</h2>
  <p>You requested a password reset. Click the button below to set a new password.</p>
  <p><a href="{{resetUrl}}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Reset Password</a></p>
  <p style="color:#888;font-size:12px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
</div>`,
    },
    'payment-reminder': {
        subject: 'Payment reminder — Invoice {{invoiceNum}} is overdue',
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#ef4444">Payment Reminder</h2>
  <p>Dear {{partnerName}},</p>
  <p>Invoice <strong>{{invoiceNum}}</strong> for <strong>€{{amount}}</strong> was due on <strong>{{dueDate}}</strong> and remains unpaid.</p>
  <p>Please arrange payment at your earliest convenience.</p>
  {{#if paymentLink}}<p><a href="{{paymentLink}}" style="background:#ef4444;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Pay Now</a></p>{{/if}}
  <hr/><p style="color:#888;font-size:12px">{{companyName}}</p>
</div>`,
    },
    'user-invite': {
        subject: 'You have been invited to {{companyName}}',
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2>Welcome to {{companyName}}</h2>
  <p>You have been invited to join <strong>{{companyName}}</strong> on FusionAI.</p>
  <p><a href="{{activationUrl}}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Accept Invitation</a></p>
  <p style="color:#888;font-size:12px">This invitation expires in 48 hours.</p>
</div>`,
    },
    'shift-publish': {
        subject: 'Shift Published: {{role}} on {{startDate}}',
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#6366f1">Shift Published</h2>
  <p>Hello {{employeeName}},</p>
  <p>Your shift has been confirmed and published:</p>
  <table style="border-collapse:collapse;width:100%;margin:16px 0">
    <tr><td style="padding:8px;font-weight:bold;color:#888">Role</td><td style="padding:8px">{{role}}</td></tr>
    <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#888">Date</td><td style="padding:8px">{{startDate}} – {{endDate}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#888">Hours</td><td style="padding:8px">{{hours}}h</td></tr>
  </table>
  <hr/><p style="color:#888;font-size:12px">FusionAI Planning</p>
</div>`,
    },
    'recruitment-stage-change': {
        subject: 'Application Update: {{jobName}} — {{stageName}}',
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#6366f1">Your Application Has Been Updated</h2>
  <p>Dear {{applicantName}},</p>
  <p>We wanted to let you know that your application for <strong>{{jobName}}</strong> has moved to a new stage:</p>
  <div style="background:#f0f0ff;border-left:4px solid #6366f1;padding:12px 20px;margin:16px 0;border-radius:4px">
    <strong style="font-size:18px">{{stageName}}</strong>
  </div>
  <p>Our team will be in touch soon. Thank you for your interest!</p>
  <hr/><p style="color:#888;font-size:12px">FusionAI Recruitment</p>
</div>`,
    },
};

// ── Transport factory ─────────────────────────────────────────────────────────

let _transport: Transporter | null = null;

async function getTransport(): Promise<Transporter> {
    if (_transport) return _transport;

    if (process.env.SMTP_HOST) {
        _transport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT ?? '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Dev: use Ethereal (auto-creates test account)
        const testAccount = await nodemailer.createTestAccount();
        _transport = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        console.log('[Email] No SMTP configured — using Ethereal preview. User:', testAccount.user);
    }

    return _transport;
}

// ── Template renderer ─────────────────────────────────────────────────────────

function renderTemplate(templateKey: string, vars: Record<string, string> = {}): { subject: string; html: string } {
    const tpl = TEMPLATES[templateKey];
    if (!tpl) throw new Error(`Email template '${templateKey}' not found`);

    const replace = (s: string) =>
        s
            .replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
            .replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, inner) =>
                vars[key] ? inner.replace(/\{\{(\w+)\}\}/g, (_2: string, k: string) => vars[k] ?? '') : ''
            );

    return { subject: replace(tpl.subject), html: replace(tpl.html) };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendEmail(opts: SendEmailOptions): Promise<{ messageId?: string; previewUrl?: string }> {
    const transport = await getTransport();
    const { subject, html } = renderTemplate(opts.templateKey, opts.vars ?? {});

    const info = await transport.sendMail({
        from: process.env.SMTP_FROM ?? '"FusionAI ERP" <noreply@fusionai.local>',
        to: Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
        replyTo: opts.replyTo,
        subject: opts.subject ?? subject,
        html,
        attachments: (opts.attachments ?? []).map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
        })),
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) console.log('[Email] Preview:', previewUrl);

    return { messageId: info.messageId, previewUrl };
}

export default sendEmail;
