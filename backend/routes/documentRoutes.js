const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const { upload } = require('../middleware/s3Upload'); // Changed from supabaseUpload to s3Upload

router.get('/share/:id', documentController.shareDocument);
router.post('/', auth, upload.single('document'), documentController.uploadDocument);
router.get('/', auth, documentController.getAllDocuments);
router.get('/client/:clientId', auth, documentController.getClientDocuments);
router.patch('/:id/payment-status', auth, documentController.updateDocumentPaymentStatus);
router.delete('/:id', auth, documentController.deleteDocument);

module.exports = router;
