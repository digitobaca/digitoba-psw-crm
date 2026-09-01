const express = require('express');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { taskCreateRules, idParamRule, validate } = require('../middleware/validators');

const router = express.Router();

router.use(protect);

router.get('/', getTasks);
router.post('/', taskCreateRules, validate, createTask);
router.put('/:id', idParamRule, validate, updateTask);
router.delete('/:id', idParamRule, validate, deleteTask);

module.exports = router;
