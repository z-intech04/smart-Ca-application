const jwt = require('jsonwebtoken');

const createDocumentShareUrl = (document) => {
  const token = jwt.sign(
    { documentId: String(document._id) },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  const baseUrl = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`)
    .replace(/\/+$/, '');

  return `${baseUrl}/api/documents/share/${document._id}?token=${encodeURIComponent(token)}`;
};

module.exports = { createDocumentShareUrl };
