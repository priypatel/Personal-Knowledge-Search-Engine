import { Resend } from 'resend';
import { RESEND_API_KEY, FROM_EMAIL } from '../config/env.js';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(to, displayName, resetLink) {
  if (!resend) {
    // Dev fallback — log the link so testing works without Resend configured
    console.log(`\n[DEV] Password reset link for ${to}:\n${resetLink}\n`);
    return;
  }

  await resend.emails.send({
    from: `Recall <${FROM_EMAIL}>`,
    to,
    subject: 'Reset your Recall password',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#2563eb;padding:28px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:8px;text-align:center;vertical-align:middle;font-size:16px;">⚡</td>
                <td style="padding-left:10px;color:#fff;font-size:17px;font-weight:600;letter-spacing:-0.3px;">Recall</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a1a;">Reset your password</h2>
            <p style="margin:0 0 6px;font-size:14px;color:#6b6b6b;line-height:1.6;">
              Hi <strong>${displayName}</strong>, we received a request to reset your Recall password.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;line-height:1.6;">
              Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${resetLink}"
                    style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 20px;font-size:12px;color:#9b9b9b;line-height:1.6;">
              If you didn't request this, you can safely ignore this email. Your password won't change.
            </p>

            <hr style="border:none;border-top:1px solid #ededed;margin:0 0 16px;">

            <p style="margin:0;font-size:11px;color:#9b9b9b;word-break:break-all;">
              Or copy this link: <a href="${resetLink}" style="color:#2563eb;">${resetLink}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f7f7f5;border-top:1px solid #ededed;">
            <p style="margin:0;font-size:11px;color:#9b9b9b;text-align:center;">
              © ${new Date().getFullYear()} Recall · Personal knowledge search engine
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
