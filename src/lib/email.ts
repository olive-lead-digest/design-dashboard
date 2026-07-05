import type { EmailPreview } from '@/types';
import { IS_TESTER_MODE, MOCK_EMAIL_SEND, TESTER_RECEIVER, TESTER_SENDER } from './constants';

/**
 * 🔴 SINGLE SOURCE OF TRUTH for email routing.
 * TESTER MODE: from/to are ALWAYS the hardcoded test addresses.
 * The intended production recipient is accepted only for the audit trail —
 * it is NEVER used as an actual recipient while testing.
 */
export function resolveEmailRouting(productionRecipient?: string): { from: string; to: string } {
  if (IS_TESTER_MODE || MOCK_EMAIL_SEND) {
    return { from: TESTER_SENDER, to: TESTER_RECEIVER };
  }
  // Production (later phase): real sender + owner email
  return {
    from: process.env.PRODUCTION_SENDER_EMAIL || TESTER_SENDER,
    to: productionRecipient || TESTER_RECEIVER,
  };
}

/** Branded Olive Living HTML email template. */
export function buildEmailHtml(opts: {
  ownerName?: string;
  projectName: string;
  location?: string;
  updateType: string;
  summary: string;
  dashboardPath?: string;
}): string {
  const { ownerName = 'Property Owner', projectName, location, updateType, summary, dashboardPath = '/' } = opts;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F9FAFB;font-family:Inter,Arial,sans-serif;color:#1F2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.08);">
  <tr><td style="background:#0F172A;padding:28px 32px;">
    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:.5px;">OLIVE <span style="color:#14B8A6;">LIVING</span></span>
    <div style="color:#94A3B8;font-size:12px;margin-top:4px;">Design &amp; Project Management</div>
  </td></tr>
  <tr><td style="padding:32px;">
    <h1 style="margin:0 0 8px;font-size:20px;color:#0F172A;">Your ${projectName} — ${updateType} Ready</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4B5563;">Dear ${ownerName},</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4B5563;">
      We're excited to share that the <strong>${updateType}</strong> for your project
      <strong>${projectName}</strong>${location ? ` in ${location}` : ''} is now ready.
    </p>
    <div style="background:#F0FDFA;border-left:4px solid #14B8A6;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:14px;line-height:1.7;color:#134E4A;">${summary}</p>
    </div>
    <a href="${dashboardPath}" style="display:inline-block;background:#14B8A6;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">View Full Details</a>
    <p style="margin:24px 0 0;font-size:13px;color:#6B7280;">Questions? Reply to this email or contact our team.</p>
  </td></tr>
  <tr><td style="background:#F9FAFB;padding:20px 32px;border-top:1px solid #E5E7EB;">
    <p style="margin:0;font-size:12px;color:#9CA3AF;">Best regards,<br/><strong style="color:#4B5563;">Olive Living Design &amp; Project Management Team</strong></p>
  </td></tr>
</table>
${IS_TESTER_MODE ? `<p style="font-size:11px;color:#9CA3AF;margin-top:16px;">🧪 TESTER MODE — routed ${TESTER_SENDER} → ${TESTER_RECEIVER}. No production email was sent.</p>` : ''}
</td></tr></table></body></html>`;
}

/**
 * Build the full preview object shown in the Email Preview modal.
 * In tester mode nothing is ever actually dispatched — preview only.
 */
export function buildEmailPreview(opts: {
  subject: string;
  projectName: string;
  location?: string;
  updateType: string;
  summary: string;
  productionRecipient?: string;
}): EmailPreview {
  const { from, to } = resolveEmailRouting(opts.productionRecipient);
  return {
    from,
    to,
    subject: opts.subject,
    html: buildEmailHtml(opts),
    testerMode: IS_TESTER_MODE || MOCK_EMAIL_SEND,
  };
}
