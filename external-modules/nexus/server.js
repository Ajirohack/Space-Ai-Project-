const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const port = 3000;

// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename to avoid overwrites
  }
});

const upload = multer({ storage: storage });

// Initialize Nexus
app.post('/initialize', (req, res) => {
  res.json({ message: 'Nexus initialized' });
});

// Upload attachment
app.post('/upload-attachment', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    id: req.file.filename,
    url: `http://localhost:3000/uploads/${req.file.filename}`,
    name: req.file.originalname
  });
});

// Send message
app.post('/send-message', (req, res) => {
  const { text, attachments } = req.body;
  console.log('Received message:', text);
  console.log('Attachments:', attachments);

  // Here you would process the message and attachments
  // For now, we'll just echo the message back
  res.json({ text: `You sent: ${text}` });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
