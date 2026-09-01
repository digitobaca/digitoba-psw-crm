const CommunicationLog = require('../models/CommunicationLog');

/**
 * Single interface for outbound WhatsApp/SMS. No provider is configured yet
 * (decided during setup) — every call still writes a CommunicationLog entry
 * so the pipeline/automation logic and UI work identically today, and
 * "sending" becomes real the moment WHATSAPP_PROVIDER is set, with no
 * changes needed anywhere else in the codebase.
 *
 * To wire a real provider later:
 *   - Meta Cloud API: POST to graph.facebook.com/v.../messages with
 *     WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN.
 *   - Twilio: use the Twilio SDK with TWILIO_ACCOUNT_SID/AUTH_TOKEN and a
 *     WhatsApp-enabled sender number.
 * Either way, set deliveryStatus to 'sent' on success or 'failed' on error
 * instead of the stub's 'logged'.
 */
const sendWhatsApp = async ({ student, message, counsellor = null, direction = 'Outbound' }) => {
  const provider = process.env.WHATSAPP_PROVIDER; // unset in Phase 1

  let deliveryStatus = 'logged';

  if (provider) {
    // Placeholder for a real integration — intentionally not implemented
    // until a provider is chosen and credentials are available.
    console.warn(`[whatsapp] WHATSAPP_PROVIDER="${provider}" is set but not yet wired up. Logging instead of sending.`);
  } else {
    console.log(`[whatsapp:stub] To: ${student.phone} | ${message}`);
  }

  return CommunicationLog.create({
    student: student._id,
    counsellor,
    channel: 'WhatsApp',
    direction,
    message,
    deliveryStatus,
  });
};

/** Same stub pattern for SMS (spec: "SMS if required"). */
const sendSMS = async ({ student, message, counsellor = null }) => {
  const provider = process.env.SMS_PROVIDER;

  if (!provider) {
    console.log(`[sms:stub] To: ${student.phone} | ${message}`);
  }

  return CommunicationLog.create({
    student: student._id,
    counsellor,
    channel: 'SMS',
    direction: 'Outbound',
    message,
    deliveryStatus: 'logged',
  });
};

module.exports = { sendWhatsApp, sendSMS };
