// mail-templates.ts
export function passwordResetTemplate({
  resetLink,
  name = 'User',
  expiryMinutes = 60,
  supportEmail = 'eburon.support@gmail.com',
}: {
  resetLink: string;
  name?: string;
  expiryMinutes?: number;
  supportEmail?: string;
}) {
  const preheader =
    'Reset your password — click the button below to set a new password.';
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Password reset</title>
    <style>
      /* General resets */
      body { margin:0; padding:0; background-color:#f4f6f8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
      table { border-collapse: collapse; }
      img { border:0; line-height:100%; outline:none; text-decoration:none; display:block; }
      a { color: #1a82e2; text-decoration: none; }
      /* Container */
      .email-wrapper { width:100%; background-color:#f4f6f8; padding: 20px 0; }
      .email-content { width:100%; max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow: 0 4px 10px rgba(12,20,32,0.06); }
      .header { padding:24px; text-align:left; background: linear-gradient(90deg,#0ea5e9,#6366f1); color:#fff; }
      .brand { font-size:20px; font-weight:700; letter-spacing: -0.2px; }
      .body { padding:28px; color:#0f172a; font-size:16px; line-height:1.45; }
      .greeting { margin:0 0 12px 0; font-weight:600; }
      .lead { margin:0 0 18px 0; color:#334155; }
      .button-wrap { text-align:center; margin:22px 0; }
      .btn {
        display:inline-block;
        padding:12px 22px;
        border-radius:8px;
        background-color:#111827;
        color:#ffffff !important;
        font-weight:600;
        text-decoration:none;
      }
      .muted { color:#64748b; font-size:13px; }
      .footer { padding:18px 28px; font-size:13px; color:#94a3b8; background:#fbfdff; }
      .small { font-size:13px; color:#94a3b8; }
      .fallback { word-break: break-all; }
      /* Mobile */
      @media (max-width: 420px) {
        .email-content { margin: 0 12px; }
        .header, .body, .footer { padding-left:16px; padding-right:16px; }
        .btn { width:100%; display:inline-block; box-sizing:border-box; text-align:center; }
      }
    </style>
  </head>
  <body>
    <!-- Preheader : hidden but displayed in preview panes -->
    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
      ${preheader}
    </div>

    <table role="presentation" class="email-wrapper" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" class="email-content" width="600">
            <!-- Header -->
            <tr>
              <td class="header" align="left">
                <div class="brand">Match-It</div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="body">
                <p class="greeting">Hi ${escapeHtml(name)},</p>
                <p class="lead">
                  We received a request to reset the password for your account. Click the button below to choose a new password.
                </p>

                <div class="button-wrap">
                  <a href="${escapeAttr(resetLink)}" class="btn" target="_blank" rel="noopener">Reset password</a>
                </div>

                <p class="muted">
                  This link will expire in ${expiryMinutes} minutes. If you didn't request a password reset, you can safely ignore this email — your password won't change.
                </p>

                <hr style="border:none; border-top:1px solid #eef2f7; margin:18px 0;" />

                <p class="small">
                  If the button doesn't work, copy and paste the following link into your browser:
                </p>
                <p class="small fallback">
                  <a href="${escapeAttr(resetLink)}" target="_blank" rel="noopener">${escapeHtml(resetLink)}</a>
                </p>

                <p class="small" style="margin-top:16px;">
                  Need help? Contact our support at <a href="mailto:${escapeAttr(supportEmail)}">${escapeHtml(supportEmail)}</a>.
                </p>

                <p class="small" style="margin-top:22px;">
                  — The Match-It team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="footer">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="small">
                      You are receiving this email because a password reset was requested for your account.
                    </td>
                    <td align="right" class="small">
                      Match-It · Boterstrat 36 · Ieper
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

/* Helper escaping functions for safety (server-side) */
function escapeHtml(str: string) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function escapeAttr(str: string) {
  return escapeHtml(str).replace(/\n/g, '');
}
