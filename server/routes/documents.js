const express = require('express');
const { getDocuments, uploadDocument, updateDocument, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { idParamRule, validate } = require('../middleware/validators');

const router = express.Router();

router.use(protect);

router.get('/', getDocuments);
router.post('/', upload.single('file'), uploadDocument);
router.put('/:id', idParamRule, validate, updateDocument);
router.delete('/:id', idParamRule, validate, deleteDocument);

module.exports = router;
