/**
 * AI Council routes for managing AI agents and orchestration
 */
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const AIAgentCouncil = require('../services/AIAgentCouncil');

const council = new AIAgentCouncil();

// Validate request for AI processing
const validateProcessRequest = [
  body('input').trim().notEmpty().withMessage('Input is required'),
  body('context').optional().isObject(),
  body('tools').optional().isArray(),
  body('modelPreferences').optional().isObject(),
];

// Process input through AI Council
router.post('/process', validateProcessRequest, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { input, context, tools, modelPreferences } = req.body;
    const result = await council.processRequest({
      input,
      context,
      tools,
      modelPreferences,
    });

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// Get available AI models and capabilities
router.get('/models', async (req, res, next) => {
  try {
    const models = await council.getAvailableModels();
    res.json({ success: true, models });
  } catch (error) {
    next(error);
  }
});

// Register a new AI model
router.post(
  '/models/register',
  [
    body('name').trim().notEmpty(),
    body('type').trim().notEmpty(),
    body('capabilities').isArray(),
    body('config').isObject(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, capabilities, config } = req.body;
      await council.registerModel({ name, type, capabilities, config });
      res.json({ success: true, message: 'Model registered successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Get AI Council status and metrics
router.get('/status', async (req, res, next) => {
  try {
    const status = await council.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
