const asyncHandler = require('express-async-handler');
const { sendDeletionRequestNotification } = require('../utils/sendEmail');

/**
 * Public "Delete My Info" page (showcase/compliance page, modeled on the
 * data-deletion-request forms consultancies commonly publish) — deliberately
 * lightweight: it does not touch any CRM record automatically (a name/email
 * alone isn't enough to safely auto-delete the right one), it just notifies
 * the team so a human follows up and handles the actual deletion themselves.
 * @route POST /api/deletion-requests
 * @access Public
 */
const createDeletionRequest = asyncHandler(async (req, res) => {
  const { name, email, phone, reason } = req.body;

  await sendDeletionRequestNotification({ name, email, phone, reason }).catch((err) =>
    console.error('Deletion request notification failed:', err.message)
  );

  res.status(201).json({
    success: true,
    message: "Your request has been received. Our team will process it and follow up if we need anything else.",
  });
});

module.exports = { createDeletionRequest };
