export function WithdrawalRequestEmail({
  interviewerName,
  interviewerEmail,
  credits,
  platformFee,
  netAmount,
  paymentMethod,
  paymentDetail,
  reviewUrl,
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Withdrawal Request</title>
      </head>
      <body style="font-family: Georgia, serif; padding: 32px 16px; margin: 0; background-color: #ffffff;">
        <div style="max-width: 480px; margin: 0 auto;">
          <p style="font-size: 22px; color: #111827; margin: 0 0 4px; font-weight: bold;">
           InterviewPrep
          </p>
          <p style="font-size: 11px; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 32px;">
            Withdrawal Request
          </p>

          <p style="font-size: 14px; color: #374151; margin: 0 0 4px; line-height: 1.5;">
            <strong>${interviewerName}</strong> (${interviewerEmail}) has requested a withdrawal.
          </p>

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">
            Credits: <span style="color: #111827; font-weight: 400;">${credits}</span>
          </p>
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">
            Platform fee (20%): <span style="color: #111827; font-weight: 400;">− $${platformFee.toFixed(2)}</span>
          </p>
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">
            Net payout: <span style="color: #d97706; font-weight: 700;">$${netAmount.toFixed(2)}</span>
          </p>
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">
            Method: <span style="color: #111827; font-weight: 400;">${paymentMethod}</span>
          </p>
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">
            Send to: <span style="color: #111827; font-weight: 400;">${paymentDetail}</span>
          </p>

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

          <a href="${reviewUrl}" style="background-color: #f59e0b; color: #ffffff; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block;">
            Review &amp; Approve →
          </a>
        </div>
      </body>
    </html>
  `;
}
