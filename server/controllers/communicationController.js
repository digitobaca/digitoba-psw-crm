const asyncHandler = require('express-async-handler');
const CommunicationLog = require('../models/CommunicationLog');
const { sendWhatsApp, sendSMS } = require('../utils/messaging');
const Student = require('../models/Student');

/**
 * @desc    Get a student's communication timeline. `?type=chat` returns just
 *          the back-and-forth chat thread (channel 'Note', no contactStatus);
 *          `?type=log` returns just the counsellor's outcome-of-contact
 *          entries (contactStatus set); omitted returns everything.
 *          Counsellors may only reach students assigned to them.
 * @route   GET /api/communications?student=:id&type=chat|log
 * @access  Private
 */
const getCommunications = asyncHandler(async (req, res) => {
  if (!req.query.student) {
    res.status(400);
    throw new Error('student query param is required');
  }

  if (req.user.role === 'counsellor') {
    const owned = await Student.exists({ _id: req.query.student, assignedCounsellor: req.user._id });
    if (!owned) {
      res.status(403);
      throw new Error('Not authorized to view this student');
    }
  }

  const filter = { student: req.query.student };
  if (req.query.type === 'chat') {
    filter.channel = 'Note';
    filter.contactStatus = null;
  } else if (req.query.type === 'log') {
    filter.contactStatus = { $ne: null };
  }

  // Opening a chat thread marks the student's unread messages as read —
  // shared across whoever on staff looks at it (see readAt comment on the model).
  if (req.query.type === 'chat') {
    await CommunicationLog.updateMany(
      { student: req.query.student, channel: 'Note', contactStatus: null, direction: 'Inbound', readAt: null },
      { $set: { readAt: new Date() } }
    );
  }

  const logs = await CommunicationLog.find(filter)
    .populate('counsellor', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: logs });
});

/**
 * @desc    One row per student with a chat message — last message preview,
 *          when, and how many unread inbound messages — for the counsellor/
 *          admin Messages inbox. Counsellors see only their own students;
 *          admins see everyone's, for monitoring.
 * @route   GET /api/communications/inbox
 * @access  Private
 */
const getInbox = asyncHandler(async (req, res) => {
  const studentFilter = {};
  if (req.user.role === 'counsellor') {
    studentFilter.assignedCounsellor = req.user._id;
  }

  const students = await Student.find(studentFilter).select('name email assignedCounsellor').populate('assignedCounsellor', 'name');
  if (!students.length) {
    return res.json({ success: true, data: [] });
  }
  const studentIds = students.map((s) => s._id);

  const conversations = await CommunicationLog.aggregate([
    { $match: { student: { $in: studentIds }, channel: 'Note', contactStatus: null } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$student',
        lastMessage: { $first: '$message' },
        lastDirection: { $first: '$direction' },
        lastAt: { $first: '$createdAt' },
        unreadCount: {
          $sum: { $cond: [{ $and: [{ $eq: ['$direction', 'Inbound'] }, { $eq: ['$readAt', null] }] }, 1, 0] },
        },
      },
    },
    { $sort: { lastAt: -1 } },
  ]);

  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));
  const data = conversations
    .filter((c) => studentMap.has(c._id.toString()))
    .map((c) => ({
      student: studentMap.get(c._id.toString()),
      lastMessage: c.lastMessage,
      lastDirection: c.lastDirection,
      lastAt: c.lastAt,
      unreadCount: c.unreadCount,
    }));

  res.json({ success: true, data });
});

/**
 * @desc    Total unread inbound chat messages, for the Messages nav badge.
 *          Scoped the same way as the inbox.
 * @route   GET /api/communications/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const filter = { channel: 'Note', contactStatus: null, direction: 'Inbound', readAt: null };
  if (req.user.role === 'counsellor') {
    const myIds = await Student.find({ assignedCounsellor: req.user._id }).distinct('_id');
    filter.student = { $in: myIds };
  }
  const count = await CommunicationLog.countDocuments(filter);
  res.json({ success: true, count });
});

/**
 * @desc    Log a touchpoint with a student. If channel is WhatsApp/SMS this
 *          also attempts to send it (via the stub until a provider is
 *          configured) rather than just recording a manual note. When
 *          `contactStatus` is set (Contacted / Not Contacted / No Response —
 *          the counsellor quick-log flow on a student's record), the
 *          student's `lastContactStatus`/`lastContactAt` are updated too, so
 *          the admin students table can show it without an extra query.
 * @route   POST /api/communications
 * @access  Private
 */
const createCommunication = asyncHandler(async (req, res) => {
  const { student: studentId, channel, message, outcome, nextFollowUpDate, direction, contactStatus } = req.body;

  if (req.user.role === 'counsellor') {
    const owned = await Student.exists({ _id: studentId, assignedCounsellor: req.user._id });
    if (!owned) {
      res.status(403);
      throw new Error('Not authorized to contact this student');
    }
  }

  // Admins can see every conversation for monitoring, but only the assigned
  // counsellor is a participant in the actual chat — admins can't join in.
  // (Doesn't apply to contact-status logging, which is a separate, internal
  // record admins are allowed to keep too.)
  const isChatMessage = channel === 'Note' && !contactStatus;
  if (req.user.role === 'admin' && isChatMessage) {
    res.status(403);
    throw new Error('Admins can view student conversations but not send messages in them');
  }

  let log;

  if (channel === 'WhatsApp' || channel === 'SMS') {
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }
    const send = channel === 'WhatsApp' ? sendWhatsApp : sendSMS;
    log = await send({ student, message, counsellor: req.user._id, direction: direction || 'Outbound' });
    if (outcome || nextFollowUpDate || contactStatus) {
      log.outcome = outcome || '';
      if (nextFollowUpDate) log.nextFollowUpDate = nextFollowUpDate;
      if (contactStatus) log.contactStatus = contactStatus;
      await log.save();
    }
  } else {
    log = await CommunicationLog.create({
      student: studentId,
      counsellor: req.user._id,
      channel,
      direction: direction || 'Outbound',
      message,
      outcome,
      nextFollowUpDate,
      contactStatus: contactStatus || null,
      deliveryStatus: 'logged',
    });
  }

  if (contactStatus) {
    await Student.findByIdAndUpdate(studentId, { lastContactStatus: contactStatus, lastContactAt: new Date() });
  }

  res.status(201).json({ success: true, data: log });
});

module.exports = { getCommunications, createCommunication, getInbox, getUnreadCount };
