const express = require('express');
const { getPayments, createPayment, updatePayment, deletePayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { paymentCreateRules, idParamRule, validate } = require('../middleware/validators');

const router = express.Router();

router.use(protect);

router.get('/', getPayments);
router.post('/', paymentCreateRules, validate, createPayment);
router.put('/:id', idParamRule, validate, updatePayment);
router.delete('/:id', authorize('admin'), idParamRule, validate, deletePayment);

module.exports = router;
