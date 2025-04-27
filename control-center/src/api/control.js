const express = require('express');
const router = express.Router();

// Ping endpoint for connectivity checks
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

module.exports = router;
