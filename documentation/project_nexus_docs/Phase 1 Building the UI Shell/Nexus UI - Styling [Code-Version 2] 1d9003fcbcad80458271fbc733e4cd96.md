# Nexus UI - Styling [Code-Version 2]

---

```css
/* File: src/App.css */
:root {
  --primary-color: #2a6dd2;
  --secondary-color: #1a4a98;
  --background-color: #f5f7fa;
  --message-bg-user: #e9edf4;
  --message-bg-nexus: #eaf5ff;
  --nexus-pulse: rgba(42, 109, 210, 0.75);
  --text-color: #333;
  --light-text: #666;
  --very-light-text: #999;
  --border-color: #ddd;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
}

.app {
  max-width: 900px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 16px 20px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.app-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--secondary-color);
}

.status-indicator {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: var(--light-text);
}

.status-light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-light.active {
  background-color: #4caf50;
}

.status-light.processing {
  background-color: #ffc107;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  max-width: 80%;
}

.user-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-content {
  background-color: var(--message-bg-user);
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.nexus-message .message-content {
  background-color: var(--message-bg-nexus);
  margin-left: 12px;
}

.user-message .message-content {
  background-color: var(--primary-color);
  color: white;
  margin-right: 12px;
}

.message-text {
  line-height: 1.5;
}

.message-time {
  font-size: 0.7rem;
  color: var(--very-light-text);
  margin-top: 6px;
  text-align: right;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.nexus-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nexus-avatar-inner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.nexus-avatar-pulse {
  position: absolute;
  width: 16px;
  height: 16px;
  background-color: var(--nexus-pulse);
  border-radius: 50%;
  animation: nexus-pulse 2s infinite;
}

@keyframes nexus-pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
}

.input-area {
  display: flex;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  align-items: center;
}

.input-area input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 24px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-area input:focus {
  border-color: var(--primary-color);
}

.attachment-buttons {
  display: flex;
  margin-left: 8px;
}

.attachment-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0f2f5;
  border: none;
  margin: 0 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--light-text);
  transition: background-color 0.2s, color 0.2s;
}

.attachment-button:hover {
  background-color: #e4e6eb;
  color: var(--primary-color);
}

.attachment-button.recording {
  background-color: #ff4a4a;
  color: white;
  animation: pulse 1.5s infinite;
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover {
  background-color: var(--secondary-color);
}

.send-button:disabled {
  background-color: var(--very-light-text);
  cursor: not-allowed;
}

.status-light.recording {
  background-color: #ff4a4a;
  animation: pulse 1.5s infinite;
}

/* Attachment styles */
.pending-attachments {
  display: flex;
  flex-wrap: wrap;
  padding: 8px 16px;
  border-top: 1px solid var(--border-color);
  background-color: #f8f9fa;
}

.pending-attachment {
  position: relative;
  margin: 4px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background-color: white;
}

.attachment-preview {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 4px;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.document-preview {
  font-size: 1.5rem;
  color: var(--light-text);
}

.document-preview span {
  font-size: 0.7rem;
  margin-top: 4px;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-preview audio {
  width: 70px;
  height: 30px;
}

.remove-attachment {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
}

/* Message attachment styles */
.attachment {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background-color: rgba(255, 255, 255, 0.5);
}

.image-attachment img {
  max-width: 100%;
  max-height: 200px;
  display: block;
}

.document-attachment {
  padding: 8px;
  display: flex;
}

.document-attachment a {
  display: flex;
  align-items: center;
  color: var(--text-color);
  text-decoration: none;
}

.document-icon {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  color: var(--primary-color);
}

.audio-attachment {
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.audio-attachment audio {
  width: 100%;
  margin-bottom: 4px;
}

.audio-attachment span {
  font-size: 0.7rem;
  color: var(--light-text);
}
```