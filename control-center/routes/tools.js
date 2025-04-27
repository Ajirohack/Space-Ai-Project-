/**
 * Tools API Router
 * Handles discovery and interaction with the tools system
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { logger } = require('../src/services/loggingService');
const config = require('../src/config');

// Base URL for the tools package service
const TOOLS_API_BASE_URL = config.services.toolsPackages.url || 'http://tools-packages:4000';

/**
 * @route   GET /api/tools
 * @desc    Get a list of all available tools
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { page, pageSize, query, tag, capability } = req.query;

    // Forward the request to the tools discovery API
    const response = await axios.get(`${TOOLS_API_BASE_URL}/api/tools/discovery`, {
      params: { page, pageSize, query, tag, capability },
    });

    res.json(response.data);
  } catch (error) {
    logger.error('Failed to fetch tools list', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tools list',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/tools/:id
 * @desc    Get details about a specific tool
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Forward the request to the tools discovery API
    const response = await axios.get(`${TOOLS_API_BASE_URL}/api/tools/discovery/${id}`);

    res.json(response.data);
  } catch (error) {
    logger.error(`Failed to fetch tool details for ID: ${req.params.id}`, { error: error.message });
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch tool details',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/tools/search
 * @desc    Search for tools based on criteria
 * @access  Private
 */
router.get('/search', async (req, res) => {
  try {
    const { query, tags, author, capabilities } = req.query;

    // Forward the request to the tools discovery API
    const response = await axios.get(`${TOOLS_API_BASE_URL}/api/tools/discovery/search`, {
      params: { query, tags, author, capabilities },
    });

    res.json(response.data);
  } catch (error) {
    logger.error('Failed to search tools', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to search tools',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/tools/recommendations/:id
 * @desc    Get tool recommendations based on a tool ID
 * @access  Private
 */
router.get('/recommendations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    // Forward the request to the tools discovery API
    const response = await axios.get(
      `${TOOLS_API_BASE_URL}/api/tools/discovery/recommendations/${id}`,
      { params: { limit } }
    );

    res.json(response.data);
  } catch (error) {
    logger.error(`Failed to fetch tool recommendations for ID: ${req.params.id}`, {
      error: error.message,
    });
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch tool recommendations',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/tools/capabilities/:capability
 * @desc    Check if any tools support a specific capability
 * @access  Private
 */
router.get('/capabilities/:capability', async (req, res) => {
  try {
    const { capability } = req.params;

    // Forward the request to the tools discovery API
    const response = await axios.get(
      `${TOOLS_API_BASE_URL}/api/tools/discovery/capabilities/${capability}`
    );

    res.json(response.data);
  } catch (error) {
    logger.error(`Failed to check capability: ${req.params.capability}`, { error: error.message });
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to check capability',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/tools/metadata/tags
 * @desc    Get all available tags from tools
 * @access  Private
 */
router.get('/metadata/tags', async (req, res) => {
  try {
    // Forward the request to the tools discovery API
    const response = await axios.get(`${TOOLS_API_BASE_URL}/api/tools/discovery/metadata/tags`);

    res.json(response.data);
  } catch (error) {
    logger.error('Failed to fetch tool tags', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tool tags',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/tools/metadata/capabilities
 * @desc    Get all available capabilities from tools
 * @access  Private
 */
router.get('/metadata/capabilities', async (req, res) => {
  try {
    // Forward the request to the tools discovery API
    const response = await axios.get(
      `${TOOLS_API_BASE_URL}/api/tools/discovery/metadata/capabilities`
    );

    res.json(response.data);
  } catch (error) {
    logger.error('Failed to fetch tool capabilities', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tool capabilities',
      message: error.message,
    });
  }
});

module.exports = router;
