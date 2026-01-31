/**
 * Email Service
 * Handles email delivery using SendGrid
 *
 * Sprint 4 Implementation:
 * - Send PDF reports via email
 * - Weekly digest emails
 * - Notification email fallback
 * - Transactional emails (welcome, password reset)
 */

import sgMail from '@sendgrid/mail';
import { config } from '../config';
import { query } from '../config/database';

// =============================================================================
// INITIALIZATION
// =============================================================================

// Initialize SendGrid with API key if available
if (config.email?.sendgridApiKey) {
  sgMail.setApiKey(config.email.sendgridApiKey);
}

// =============================================================================
// TYPES
// =============================================================================

export interface EmailAttachment {
  content: string; // Base64 encoded
  filename: string;
  type: string; // MIME type
  disposition?: 'attachment' | 'inline';
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export interface ReportEmailData {
  user_name: string;
  tax_year: number;
  quarter?: number;
  period_start: Date;
  period_end: Date;
  gross_income: number;
  total_deductions: number;
  net_profit: number;
  estimated_tax: number;
}

export interface DigestEmailData {
  user_name: string;
  period_start: Date;
  period_end: Date;
  new_income: number;
  new_expenses: number;
  transactions_needing_review: number;
  next_deadline?: {
    quarter: number;
    due_date: Date;
    days_until: number;
    estimated_payment: number;
  };
}

// =============================================================================
// EMAIL SERVICE CLASS
// =============================================================================

export class EmailService {
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isConfigured: boolean;

  constructor() {
    this.fromEmail = config.email?.fromEmail || 'noreply@sidehustletax.app';
    this.fromName = 'Side Hustle Tax Tracker';
    this.isConfigured = !!config.email?.sendgridApiKey;
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('[EMAIL] SendGrid not configured. Would send email:', {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    try {
      const msg: sgMail.MailDataRequired = {
        to: options.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
        text: options.text || '',
        html: options.html || options.text || '',
      };

      if (options.replyTo) {
        msg.replyTo = options.replyTo;
      }

      if (options.attachments && options.attachments.length > 0) {
        msg.attachments = options.attachments.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type,
          disposition: att.disposition || 'attachment',
        }));
      }

      console.log(`[EMAIL] Attempting to send to ${options.to}: ${options.subject}`);
      console.log(`[EMAIL] From: ${this.fromEmail}`);

      await sgMail.send(msg);
      console.log(`[EMAIL] Successfully sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error: unknown) {
      console.error('[EMAIL] Failed to send email');

      // Extract detailed error info from SendGrid response
      if (error && typeof error === 'object' && 'response' in error) {
        const sgError = error as { response?: { body?: { errors?: Array<{ message: string }> } } };
        if (sgError.response?.body?.errors) {
          console.error('[EMAIL] SendGrid errors:', JSON.stringify(sgError.response.body.errors, null, 2));
        }
      } else if (error instanceof Error) {
        console.error('[EMAIL] Error message:', error.message);
      }

      return false;
    }
  }

  /**
   * Send PDF tax report via email
   */
  async sendReportEmail(
    toEmail: string,
    pdfBuffer: Buffer,
    data: ReportEmailData
  ): Promise<boolean> {
    const periodLabel = data.quarter
      ? `Q${data.quarter} ${data.tax_year}`
      : `${data.tax_year}`;

    const filename = data.quarter
      ? `tax-report-${data.tax_year}-Q${data.quarter}.pdf`
      : `tax-report-${data.tax_year}.pdf`;

    const formatCurrency = (amount: number) =>
      amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    const formatDate = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const subject = `Your ${periodLabel} Tax Report - Side Hustle Tax Tracker`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a5f2a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
    .summary-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .summary-row:last-child { border-bottom: none; }
    .label { color: #666; }
    .value { font-weight: 600; }
    .highlight { color: #1a5f2a; font-size: 1.2em; }
    .footer { padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #1a5f2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Your Tax Report is Ready</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${periodLabel} Report</p>
    </div>

    <div class="content">
      <p>Hi ${data.user_name},</p>

      <p>Your ${periodLabel} tax report is attached to this email. Here's a quick summary:</p>

      <div class="summary-box">
        <div class="summary-row">
          <span class="label">Report Period</span>
          <span class="value">${formatDate(data.period_start)} - ${formatDate(data.period_end)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Gross Income</span>
          <span class="value">${formatCurrency(data.gross_income)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Total Deductions</span>
          <span class="value">${formatCurrency(data.total_deductions)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Net Profit</span>
          <span class="value highlight">${formatCurrency(data.net_profit)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Estimated Tax</span>
          <span class="value highlight">${formatCurrency(data.estimated_tax)}</span>
        </div>
      </div>

      <p>Open the attached PDF for your complete tax report, including:</p>
      <ul>
        <li>Income breakdown by platform</li>
        <li>Expenses by IRS category</li>
        <li>Self-employment tax calculation</li>
        <li>Quarterly payment recommendations</li>
      </ul>

      <p style="margin-top: 20px;">
        <a href="https://app.sidehustletax.app/tax" class="button">View in App</a>
      </p>
    </div>

    <div class="footer">
      <p><strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute tax advice. Consult a qualified tax professional for advice specific to your situation.</p>
      <p>Side Hustle Tax Tracker | <a href="https://sidehustletax.app">sidehustletax.app</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Your ${periodLabel} Tax Report - Side Hustle Tax Tracker

Hi ${data.user_name},

Your ${periodLabel} tax report is attached to this email.

Summary:
- Report Period: ${formatDate(data.period_start)} - ${formatDate(data.period_end)}
- Gross Income: ${formatCurrency(data.gross_income)}
- Total Deductions: ${formatCurrency(data.total_deductions)}
- Net Profit: ${formatCurrency(data.net_profit)}
- Estimated Tax: ${formatCurrency(data.estimated_tax)}

Open the attached PDF for your complete tax report.

---
Disclaimer: This report is for informational purposes only and does not constitute tax advice.
Side Hustle Tax Tracker | https://sidehustletax.app
    `;

    return this.sendEmail({
      to: toEmail,
      subject,
      html,
      text,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    });
  }

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigest(toEmail: string, data: DigestEmailData): Promise<boolean> {
    const formatCurrency = (amount: number) =>
      amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    const formatDate = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const subject = `Weekly Summary: ${formatDate(data.period_start)} - ${formatDate(data.period_end)}`;

    let deadlineSection = '';
    if (data.next_deadline) {
      deadlineSection = `
        <div class="alert-box">
          <h3>Upcoming Deadline</h3>
          <p>Q${data.next_deadline.quarter} estimated tax payment of <strong>${formatCurrency(data.next_deadline.estimated_payment)}</strong>
          is due in <strong>${data.next_deadline.days_until} days</strong>.</p>
        </div>
      `;
    }

    let reviewSection = '';
    if (data.transactions_needing_review > 0) {
      reviewSection = `
        <p>You have <strong>${data.transactions_needing_review}</strong> transaction(s) that need to be categorized.</p>
      `;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a5f2a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
    .stat-box { background: white; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1a5f2a; }
    .stat-label { color: #666; font-size: 14px; }
    .alert-box { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107; }
    .footer { padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #1a5f2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Weekly Summary</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${formatDate(data.period_start)} - ${formatDate(data.period_end)}</p>
    </div>

    <div class="content">
      <p>Hi ${data.user_name},</p>

      <p>Here's your activity summary for the past week:</p>

      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-value">${formatCurrency(data.new_income)}</div>
          <div class="stat-label">New Income</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${formatCurrency(data.new_expenses)}</div>
          <div class="stat-label">New Expenses</div>
        </div>
      </div>

      ${reviewSection}
      ${deadlineSection}

      <p style="margin-top: 20px;">
        <a href="https://app.sidehustletax.app/dashboard" class="button">View Dashboard</a>
      </p>
    </div>

    <div class="footer">
      <p>You're receiving this because you enabled weekly digest emails.
      <a href="https://app.sidehustletax.app/settings/notifications">Manage preferences</a></p>
      <p>Side Hustle Tax Tracker | <a href="https://sidehustletax.app">sidehustletax.app</a></p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: toEmail,
      subject,
      html,
    });
  }

  /**
   * Send welcome email after signup
   */
  async sendWelcomeEmail(toEmail: string, userName: string): Promise<boolean> {
    const subject = 'Welcome to Side Hustle Tax Tracker!';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a5f2a; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
    .step { display: flex; align-items: flex-start; margin: 15px 0; }
    .step-number { background: #1a5f2a; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0; }
    .footer { padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #1a5f2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Welcome to Side Hustle Tax Tracker!</h1>
    </div>

    <div class="content">
      <p>Hi ${userName},</p>

      <p>You're all set to take control of your side hustle taxes. Here's how to get started:</p>

      <div class="step">
        <div class="step-number">1</div>
        <div>
          <strong>Connect your accounts</strong><br>
          Link your bank accounts and payment platforms to automatically import income.
        </div>
      </div>

      <div class="step">
        <div class="step-number">2</div>
        <div>
          <strong>Add your expenses</strong><br>
          Snap photos of receipts or enter expenses manually to track your deductions.
        </div>
      </div>

      <div class="step">
        <div class="step-number">3</div>
        <div>
          <strong>Review your tax estimate</strong><br>
          See exactly what you owe and when your quarterly payments are due.
        </div>
      </div>

      <p style="margin-top: 20px; text-align: center;">
        <a href="https://app.sidehustletax.app/onboarding" class="button">Get Started</a>
      </p>
    </div>

    <div class="footer">
      <p>Questions? Reply to this email and we'll help you out.</p>
      <p>Side Hustle Tax Tracker | <a href="https://sidehustletax.app">sidehustletax.app</a></p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: toEmail,
      subject,
      html,
    });
  }

  /**
   * Send notification as email (fallback when push is disabled)
   */
  async sendNotificationEmail(
    toEmail: string,
    userName: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<boolean> {
    const subject = title;

    let buttonHtml = '';
    if (actionUrl) {
      const fullUrl = actionUrl.startsWith('http')
        ? actionUrl
        : `https://app.sidehustletax.app${actionUrl}`;
      buttonHtml = `<p style="margin-top: 20px;"><a href="${fullUrl}" class="button">View Details</a></p>`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a5f2a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
    .footer { padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #1a5f2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">${title}</h2>
    </div>

    <div class="content">
      <p>Hi ${userName},</p>
      <p>${message}</p>
      ${buttonHtml}
    </div>

    <div class="footer">
      <p>You're receiving this because you enabled email notifications.
      <a href="https://app.sidehustletax.app/settings/notifications">Manage preferences</a></p>
      <p>Side Hustle Tax Tracker | <a href="https://sidehustletax.app">sidehustletax.app</a></p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: toEmail,
      subject,
      html,
    });
  }

  /**
   * Log email to database for tracking
   */
  async logEmailSent(
    userId: string,
    emailType: string,
    recipient: string,
    subject: string,
    success: boolean
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO email_logs (user_id, email_type, recipient, subject, sent_at, success)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [userId, emailType, recipient, subject, success]
      );
    } catch {
      // Email logging is non-critical, just log the error
      console.error('[EMAIL] Failed to log email send');
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
