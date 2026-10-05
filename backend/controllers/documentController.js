const Document = require('../models/Document');
const Client = require('../models/Client');
const jwt = require('jsonwebtoken');
const { PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib');
const {
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
  getObjectFromS3
} = require('../middleware/s3Upload');

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    const { clientId, year, documentType, paymentStatus } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify client belongs to this CA
    const client = await Client.findOne({
      _id: clientId,
      createdBy: req.userId
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const resolvedPaymentStatus = paymentStatus || client.paymentStatus || 'UNPAID';
    if (!['UNPAID', 'PAID'].includes(resolvedPaymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    // Upload to AWS S3
    const uploadResult = await uploadToS3(
      req.file,
      clientId,
      documentType.toUpperCase(),
      year
    );

    // Generate presigned URL (valid for 7 days)
    const presignedUrl = await getPresignedUrl(uploadResult.s3Key, 7 * 24 * 60 * 60);

    const document = new Document({
      clientId,
      year,
      documentType: documentType.toUpperCase(),
      paymentStatus: resolvedPaymentStatus,
      fileUrl: presignedUrl, // Store presigned URL
      fileName: uploadResult.fileName,
      s3Key: uploadResult.s3Key,
      bucket: uploadResult.bucket,
      storageType: 's3',
      uploadedBy: req.userId
    });

    await document.save();

    res.status(201).json({
      message: 'Document uploaded successfully to AWS S3',
      document
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all documents for a client
exports.getClientDocuments = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Verify client belongs to this CA
    const client = await Client.findOne({
      _id: clientId,
      createdBy: req.userId
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const documents = await Document.find({ clientId })
      .sort({ uploadDate: -1 });

    // Refresh presigned URLs for S3 documents
    const documentsWithFreshUrls = await Promise.all(
      documents.map(async (doc) => {
        if (doc.storageType === 's3' && doc.s3Key) {
          try {
            const freshUrl = await getPresignedUrl(doc.s3Key, 7 * 24 * 60 * 60);
            return { ...doc.toObject(), fileUrl: freshUrl };
          } catch (error) {
            console.error('Error generating presigned URL:', error);
            return doc.toObject();
          }
        }
        return doc.toObject();
      })
    );

    res.json({ documents: documentsWithFreshUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all documents for logged-in CA
exports.getAllDocuments = async (req, res) => {
  try {
    // Get all clients of this CA
    const clients = await Client.find({ createdBy: req.userId });
    const clientIds = clients.map(c => c._id);

    const documents = await Document.find({ clientId: { $in: clientIds } })
      .populate('clientId', 'name whatsappNumber')
      .sort({ uploadDate: -1 });

    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Serve a WhatsApp document link, watermarking unpaid clients' PDFs.
exports.shareDocument = async (req, res) => {
  try {
    const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    if (decoded.documentId !== req.params.id) {
      return res.status(401).json({ error: 'Invalid document link' });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const client = await Client.findById(document.clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.set('Cache-Control', 'private, no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');

    const paymentStatus = document.paymentStatus || client.paymentStatus || 'UNPAID';
    if (paymentStatus === 'PAID') {
      const fileUrl = document.storageType === 's3' && document.s3Key
        ? await getPresignedUrl(document.s3Key, 7 * 24 * 60 * 60)
        : document.fileUrl;
      return res.redirect(fileUrl);
    }

    if (document.storageType !== 's3' || !document.s3Key) {
      return res.status(422).json({
        error: 'Cannot watermark this document because its stored PDF is unavailable'
      });
    }

    const sourcePdf = await getObjectFromS3(
      document.s3Key,
      document.bucket || process.env.AWS_S3_BUCKET_NAME
    );
    const pdf = await PDFDocument.load(sourcePdf);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const watermark = 'PAYMENT PENDING';

    pdf.getPages().forEach(page => {
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) / 14;
      const textWidth = font.widthOfTextAtSize(watermark, fontSize);
      const angle = 35 * (Math.PI / 180);

      page.drawText(watermark, {
        x: (width - textWidth * Math.cos(angle) - fontSize * Math.sin(angle)) / 2,
        y: (height - textWidth * Math.sin(angle) - fontSize * Math.cos(angle)) / 2,
        size: fontSize,
        font,
        color: rgb(0.8, 0.08, 0.08),
        opacity: 0.3,
        rotate: degrees(35)
      });
    });

    const watermarkedPdf = await pdf.save();
    return res
      .type('application/pdf')
      .set('Content-Disposition', `inline; filename="${document.fileName}"`)
      .send(Buffer.from(watermarkedPdf));
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired document link' });
    }
    console.error('Error serving shared document:', error);
    return res.status(500).json({ error: 'Unable to prepare shared document' });
  }
};

// Update payment status for a single document.
exports.updateDocumentPaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!['UNPAID', 'PAID'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const client = await Client.findOne({
      _id: document.clientId,
      createdBy: req.userId
    });
    if (!client) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    document.paymentStatus = paymentStatus;
    await document.save();
    res.json({ message: 'Document payment status updated', document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify document belongs to this CA's client
    const client = await Client.findOne({
      _id: document.clientId,
      createdBy: req.userId
    });

    if (!client) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete from S3 if it's an S3 document
    if (document.storageType === 's3' && document.s3Key) {
      try {
        await deleteFromS3(document.s3Key);
      } catch (error) {
        console.error('Error deleting from S3:', error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    await document.deleteOne();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};