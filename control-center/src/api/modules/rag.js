const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { authMiddleware, requirePermission } = require('../../middleware');

const ragSystem = require('../../modules/rag-system');

/**
 * @route   GET /api/modules/rag-system/stats
 * @desc    Get RAG system statistics
 * @access  Private/Admin
 */
router.get('/stats', authMiddleware, requirePermission('admin'), async (req, res) => {
  try {
    const stats = await ragSystem.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/modules/rag-system/documents
 * @desc    Upload document to knowledge base
 * @access  Private/Admin
 */
router.post(
  '/documents',
  authMiddleware,
  requirePermission('admin'),
  upload.single('document'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No document provided' });
      }

      const document = {
        id: `doc-${Date.now()}`,
        text: req.file.buffer.toString('utf-8'),
        metadata: {
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          uploadedBy: req.user.id,
          uploadedAt: new Date(),
        },
      };

      await ragSystem.addDocument(document);
      res.json({ success: true, documentId: document.id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   POST /api/modules/rag-system/query
 * @desc    Query the knowledge base
 * @access  Private/Admin
 */
router.post('/query', authMiddleware, requirePermission('admin'), async (req, res) => {
  try {
    if (!req.body.query) {
      return res.status(400).json({ error: 'No query provided' });
    }

    const results = await ragSystem.query(req.body.query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
