const nodemailer = require('nodemailer');

let transporter = null;

/** Lazily builds (and caches) the Nodemailer transporter from env vars. */
const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null; // email not configured
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Sends an email. If SMTP is not configured (e.g. local dev without
 * credentials), it logs the message instead of throwing, so the rest of
 * the app keeps working.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const t = getTransporter();

  if (!t) {
    console.log(`[email:skipped - SMTP not configured] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }

  const info = await t.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

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
