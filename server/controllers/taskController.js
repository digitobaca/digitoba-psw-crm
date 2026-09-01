const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');

/**
 * @desc List tasks — counsellors see their own; admins can filter by any counsellor.
 *       ?today=true narrows to tasks due today or overdue, for the dashboard widget.
 * @route GET /api/tasks
 * @access Private
 */
const getTasks = asyncHandler(async (req, res) => {
  const filter = {};
  const assignedTo = req.query.assignedTo || (req.user.role === 'counsellor' ? req.user._id : undefined);
  if (assignedTo) filter.assignedTo = assignedTo;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.student) filter.student = req.query.student;

  if (req.query.today === 'true') {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    filter.dueDate = { $lte: endOfToday };
    filter.status = 'Pending';
  }

  const tasks = await Task.find(filter)
    .populate('student', 'name email phone')
    .populate('assignedTo', 'name')
    .sort({ dueDate: 1 });

  res.json({ success: true, data: tasks });
});

/** @desc Create a task. @route POST /api/tasks @access Private */
const createTask = asyncHandler(async (req, res) => {
  const { student, assignedTo, type, description, dueDate } = req.body;
  const task = await Task.create({ student, assignedTo, type, description, dueDate });
  res.status(201).json({ success: true, data: task });
});

/** @desc Update a task (e.g. mark Done). @route PUT /api/tasks/:id @access Private */
const updateTask = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.status === 'Done' && !updates.completedAt) updates.completedAt = new Date();

  const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ success: true, data: task });
});

/** @desc Delete a task. @route DELETE /api/tasks/:id @access Private */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ success: true, message: 'Task deleted' });
});

module.exports = { getTasks, createTask, updateTask, deleteTask };
