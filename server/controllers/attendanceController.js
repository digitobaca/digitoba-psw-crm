const asyncHandler = require('express-async-handler');
const ExcelJS = require('exceljs');
const Attendance = require('../models/Attendance');

/** Shared by the list and export endpoints: role scoping + user/status/date-range filters. */
const buildAttendanceFilter = (req) => {
  const filter = {};
  if (req.user.role === 'counsellor') {
    filter.user = req.user._id;
  } else if (req.query.user) {
    filter.user = req.query.user;
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.dateFrom || req.query.dateTo) {
    filter.shiftStart = {};
    if (req.query.dateFrom) filter.shiftStart.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) {
      // Treat dateTo as inclusive of the whole day.
      const end = new Date(req.query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.shiftStart.$lte = end;
    }
  }
  return filter;
};

/**
 * @desc    List shift records — admins see everyone (optionally filtered to
 *          one user and/or a date range), counsellors only ever see their
 *          own. Defaults to a high limit so the admin accordion view can
 *          group a full team's history client-side.
 * @route   GET /api/attendance?user=&status=&dateFrom=&dateTo=&page=&limit=
 * @access  Private
 */
const getAttendance = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 1000;
  const filter = buildAttendanceFilter(req);

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate('user', 'name email role')
      .sort({ shiftStart: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Attendance.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: records,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

/**
 * @desc    Export attendance as an .xlsx workbook — one row per shift,
 *          respecting the same user/status/date-range filters as the list
 *          view. Admin-only (a counsellor exporting is just their own list,
 *          which they can already read on-screen — the useful export is the
 *          whole-team report).
 * @route   GET /api/attendance/export?user=&status=&dateFrom=&dateTo=
 * @access  Private (admin)
 */
const exportAttendance = asyncHandler(async (req, res) => {
  const filter = buildAttendanceFilter(req);
  const records = await Attendance.find(filter).populate('user', 'name email role').sort([['user', 1], ['shiftStart', -1]]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CanadaDigitoba CRM';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Attendance');

  sheet.columns = [
    { header: 'Staff Name', key: 'name', width: 24 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Role', key: 'role', width: 12 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Shift Start', key: 'start', width: 12 },
    { header: 'Shift End', key: 'end', width: 12 },
    { header: 'Duration (hrs)', key: 'duration', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'What They Got Done', key: 'summary', width: 50 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const r of records) {
    sheet.addRow({
      name: r.user?.name || 'Unknown',
      email: r.user?.email || '',
      role: r.user?.role || '',
      date: r.shiftStart.toISOString().slice(0, 10),
      start: r.shiftStart.toTimeString().slice(0, 5),
      end: r.shiftEnd ? r.shiftEnd.toTimeString().slice(0, 5) : '',
      duration: r.durationMinutes != null ? (r.durationMinutes / 60).toFixed(2) : '',
      status: r.status,
      summary: r.summary || '',
    });
  }

  const filename = `attendance-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = { getAttendance, exportAttendance };
