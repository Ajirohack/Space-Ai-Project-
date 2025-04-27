const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Import controllers
const chatController = require('./controllers/chatController');
const uploadController = require('./controllers/uploadController');

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Setup logging
const logger = require('./utils/logger');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Set up file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage: storage });

// Initialize memory system
const MemorySystem = require('./memory/memorySystem');
const memorySystem = new MemorySystem();

(async function initializeMemory() {
  try {
    await memorySystem.initialize();
    logger.info('Memory system initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize memory system:', error);
  }
})();

// Routes
app.post('/api/chat', chatController.processMessage);
app.post('/api/upload', upload.single('file'), uploadController.handleFileUpload);
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '0.1.0',
    message: 'Nexus is ready for interaction'
  });
});

// Root endpoint for development
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    version: '0.1.0',
    message: 'Welcome to Nexus backend'
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  logger.info(`Nexus backend server running on port ${PORT}`);
  console.log(`Nexus backend server running on port ${PORT}`);
});

module.exports = app; // For testing
