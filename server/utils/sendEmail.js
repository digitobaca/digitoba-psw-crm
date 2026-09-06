const { google } = require('googleapis');

// Sends through the Gmail API (HTTPS) as digitobaca@gmail.com — not SMTP,
// not a third-party email service. Confirmed live in production that
// Railway blocks all outbound SMTP entirely (ports 587/465/25 all TIMEOUT
// connecting out of the container), so raw SMTP (any provider — Gmail,
// SendGrid's SMTP relay, anything) is a dead end there regardless of
// library. A third-party HTTP API (SendGrid, Resend, etc.) would also
// work, but this keeps everything on the Gmail account already in use and
// needs no new account/signup — just a one-time OAuth authorization
// against the existing Google account (see scripts/gmailAuth.js).
let gmailClient = null;

/** Lazily builds (and caches) an authorized Gmail API client from env vars. */
const getGmailClient = () => {
  if (gmailClient) return gmailClient;

  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    console.warn(
      '[email] Gmail API not configured (GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET/GMAIL_REFRESH_TOKEN missing) — every email will be logged instead of sent. Run `node scripts/gmailAuth.js` once to set these up — see server/.env.example.'
    );
    return null; // email not configured
  }

  const oauth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
  gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });

  console.log(`[email] Gmail API configured — sending as ${process.env.EMAIL_FROM || '(EMAIL_FROM not set)'}`);

  return gmailClient;
};

/** Base64url-encodes a Buffer/string per the Gmail API's `raw` message format (standard base64, but URL-safe and unpadded). */
const base64url = (input) => Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Builds a raw RFC 2822 MIME message. Always multipart/alternative (a
 * plain-text part + an HTML part) so the message renders sensibly however
 * the recipient's client is set up — matches what every caller in this
 * file already provides (both `text` and `html`).
 */
const buildRawMessage = ({ from, to, subject, text, html }) => {
  const boundary = `cd_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject || '').toString('base64')}?=`, // encoded so non-ASCII subjects survive
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    text || '',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html || '',
    '',
    `--${boundary}--`,
  ];
  return lines.join('\r\n');
};

/**
 * Sends an email. If the Gmail API isn't configured (e.g. local dev
 * without OAuth credentials set up yet), it logs the message instead of
 * throwing, so the rest of the app keeps working.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const client = getGmailClient();

  if (!client) {
    console.log(`[email:skipped - Gmail API not configured] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }

  // The Gmail API always sends as the account that authorized the OAuth
  // token (digitobaca@gmail.com) regardless of the From header's address —
  // EMAIL_FROM only controls the display name Gmail shows, not who it's
  // actually sent as.
  const from = process.env.EMAIL_FROM || 'digitobaca@gmail.com';
  const raw = base64url(buildRawMessage({ from, to, subject, text, html }));

  let info;
  try {
    const res = await client.users.messages.send({ userId: 'me', requestBody: { raw } });
    info = res.data;
  } catch (err) {
    // Callers only log err.message (so a slow/misconfigured mailer never
    // blocks the request) — log the fuller picture here so it's actually
    // diagnosable from the host's logs. A 401/invalid_grant here almost
    // always means the refresh token was revoked — re-run
    // scripts/gmailAuth.js to get a fresh one.
    const detail = err.response?.data?.error?.message || err.message;
    console.error(`[email:failed] To: ${to} | Subject: ${subject} | status: ${err.code || err.response?.status || 'n/a'} | ${detail}`);
    throw err;
  }

  return info;
};

/** Auto-reply sent to a student right after they submit any public form. */
const sendLeadAutoReply = (student) => {
  const firstName = student.name?.split(' ')[0] || 'there';

  return sendEmail({
    to: student.email,
    subject: 'Successfully submitted — we are contacting you | CanadaDigitoba',
    text: `Hi ${firstName},\n\nYour request has been successfully submitted. We are contacting you — one of our licensed immigration consultants will reach out within 1-2 business days to discuss your Canadian study options.\n\nIn the meantime, if you have any urgent questions, just reply to this email.\n\nWarm regards,\nThe CanadaDigitoba Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #b91c1c;">Successfully submitted, ${firstName}!</h2>
        <p>We are contacting you — a licensed immigration consultant from <strong>CanadaDigitoba</strong> will reach out within <strong>1-2 business days</strong> to discuss your Canadian study options.</p>
        <p>Here's a quick summary of what you submitted:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:6px 0; color:#6b7280;">Program of interest</td><td style="padding:6px 0;"><strong>${student.intendedProgram || 'General Inquiry'}</strong></td></tr>
          <tr><td style="padding:6px 0; color:#6b7280;">Country</td><td style="padding:6px 0;">${student.country || '-'}</td></tr>
        </table>
        <p>If anything is urgent, just reply directly to this email.</p>
        <p style="margin-top:24px;">Warm regards,<br/>The CanadaDigitoba Team</p>
      </div>
    `,
  });
};

/** Internal notification sent to the team's shared inbox for every new lead. */
const sendTeamNotification = (student) => {
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!notifyEmail) return Promise.resolve({ skipped: true });

  return sendEmail({
    to: notifyEmail,
    subject: `New lead: ${student.name} (${student.intendedProgram || 'General Inquiry'})`,
    text: `New lead received.\n\nName: ${student.name}\nEmail: ${student.email}\nPhone: ${student.phone}\nCountry: ${student.country || '-'}\nStatus: ${student.immigrationStatus || '-'}\nProgram: ${student.intendedProgram || '-'}\nSource: ${student.leadSource}\nMessage: ${student.message || '-'}`,
    html: `<p><strong>New lead received</strong></p>
      <ul>
        <li>Name: ${student.name}</li>
        <li>Email: ${student.email}</li>
        <li>Phone: ${student.phone}</li>
        <li>Country: ${student.country || '-'}</li>
        <li>Status: ${student.immigrationStatus || '-'}</li>
        <li>Program: ${student.intendedProgram || '-'}</li>
        <li>Source: ${student.leadSource}</li>
        <li>Message: ${student.message || '-'}</li>
      </ul>`,
  });
};

/**
 * Individual heads-up to the counsellor a new lead was just auto-assigned
 * to — separate from the shared team inbox above, so it's not easy to miss
 * in a busy shared inbox. Skips quietly if the counsellor has no email
 * (shouldn't happen — User.email is required — but never block onboarding
 * over a notification).
 */
const sendCounsellorNewLeadAlert = (student, counsellor) => {
  if (!counsellor?.email) return Promise.resolve({ skipped: true });

  return sendEmail({
    to: counsellor.email,
    subject: `New lead assigned to you: ${student.name}`,
    text: `Hi ${counsellor.name.split(' ')[0]},\n\nA new lead has been assigned to you.\n\nName: ${student.name}\nEmail: ${student.email}\nPhone: ${student.phone}\nStatus: ${student.immigrationStatus || '-'}\nProgram: ${student.intendedProgram || '-'}\nLead score: ${student.leadScore ?? 0}\n\nA follow-up task has been added to your Students dashboard.`,
    html: `<p>Hi ${counsellor.name.split(' ')[0]},</p>
      <p><strong>A new lead has been assigned to you.</strong></p>
      <ul>
        <li>Name: ${student.name}</li>
        <li>Email: ${student.email}</li>
        <li>Phone: ${student.phone}</li>
        <li>Status: ${student.immigrationStatus || '-'}</li>
        <li>Program: ${student.intendedProgram || '-'}</li>
        <li>Lead score: ${student.leadScore ?? 0}</li>
      </ul>
      <p>A follow-up task has been added to your Students dashboard.</p>`,
  });
};

/** Sent to the team inbox whenever a visitor submits the (showcase) Delete My Info form. */
const sendDeletionRequestNotification = (request) => {
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!notifyEmail) return Promise.resolve({ skipped: true });

  return sendEmail({
    to: notifyEmail,
    subject: `Data deletion request: ${request.name}`,
    text: `A visitor requested their data be deleted.\n\nName: ${request.name}\nEmail: ${request.email}\nPhone: ${request.phone || '-'}\nReason: ${request.reason || '-'}`,
    html: `<p><strong>A visitor requested their data be deleted.</strong></p>
      <ul>
        <li>Name: ${request.name}</li>
        <li>Email: ${request.email}</li>
        <li>Phone: ${request.phone || '-'}</li>
        <li>Reason: ${request.reason || '-'}</li>
      </ul>`,
  });
};

module.exports = {
  sendEmail,
  sendLeadAutoReply,
  sendTeamNotification,
  sendCounsellorNewLeadAlert,
  sendDeletionRequestNotification,
};
