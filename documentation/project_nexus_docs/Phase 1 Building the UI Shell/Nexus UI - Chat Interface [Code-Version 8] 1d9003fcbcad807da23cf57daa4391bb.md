# Nexus UI - Chat Interface [Code-Version 8]

---

```jsx
// File: src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faFile, faImage, faPaperPlane, faStop } from '@fortawesome/free-solid-svg-icons';

// Simple avatar component for Nexus
const NexusAvatar = () => (
  <div className="nexus-avatar">
    <div className="nexus-avatar-inner">
      <div className="nexus-avatar-pulse"></div>
    </div>
  </div>
);

// Message component to display chat messages with media support
const Message = ({ message, isNexus }) => (
  <div className={`message ${isNexus ? 'nexus-message' : 'user-message'}`}>
    {isNexus && <NexusAvatar />}
    <div className="message-content">
      <div className="message-text">{message.text}</div>
      
      {/* Render attachments if present */}
      {message.attachments && message.attachments.map((attachment, index) => (
        <div className="attachment" key={index}>
          {attachment.type === 'image' && (
            <div className="image-attachment">
              <img src={attachment.url} alt="User uploaded" />
            </div>
          )}
          {attachment.type === 'document' && (
            <div className="document-attachment">
              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                <div className="document-icon">
                  <FontAwesomeIcon icon={faFile} />
                </div>
                <span>{attachment.name}</span>
              </a>
            </div>
          )}
          {attachment.type === 'audio' && (
            <div className="audio-attachment">
              <audio controls src={attachment.url}></audio>
              <span>{attachment.duration ? `${Math.round(attachment.duration)}s` : ''}</span>
            </div>
          )}
        </div>
      ))}
      
      <div className="message-time">{message.timestamp}</div>
    </div>
  </div>
);

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Format current time for message timestamps
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Nexus with a greeting when the app loads
  useEffect(() => {
    if (!isInitialized) {
      setTimeout(() => {
        const initialMessage = {
          text: "Hello, I am Nexus. I'm here to assist and interact with you. How can I help you today?",
          timestamp: getCurrentTime(),
        };
        setMessages([{ ...initialMessage, sender: 'nexus' }]);
        setIsInitialized(true);
      }, 1000);
    }
  }, [isInitialized]);

  // Import the Nexus API service at the top of your file
import nexusApi from './services/nexusApi';

// Function to send message to backend LLM API
  const sendMessageToNexus = async (messageText, attachments = []) => {
    try {
      setIsProcessing(true);
      
      // Process attachments if present
      let processedAttachments = [];
      if (attachments.length > 0) {
        processedAttachments = await Promise.all(attachments.map(async (attachment) => {
          // For a real implementation, you would upload the files to a server
          // and return URLs or IDs. For now, we'll just pass the local URLs.
          
          // In a production system, we'd do something like:
          // const uploadResult = await nexusApi.uploadAttachment(attachment.file);
          // return { id: uploadResult.id, type: attachment.type, url: uploadResult.url };
          
          return {
            type: attachment.type,
            url: attachment.url,
            name: attachment.name
          };
        }));
      }
      
      // Use the API service to send the message with attachments
      const responseText = await nexusApi.sendMessage(messageText, processedAttachments);
      
      const response = {
        text: responseText,
        timestamp: getCurrentTime(),
      };
      
      setMessages((prevMessages) => [
        ...prevMessages, 
        { ...response, sender: 'nexus' }
      ]);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error communicating with Nexus:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "I apologize, but I'm having trouble processing your request. Please try again.",
          timestamp: getCurrentTime(),
          sender: 'nexus',
        },
      ]);
      setIsProcessing(false);
    }
  };

  // Handle file uploads
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Create a URL for the file
    const fileUrl = URL.createObjectURL(file);
    
    // Add to attachments
    setAttachments(prev => [...prev, {
      type: 'document',
      name: file.name,
      url: fileUrl,
      file: file
    }]);
  };
  
  // Handle image uploads
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Only accept images
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    
    // Create a URL for the image
    const imageUrl = URL.createObjectURL(file);
    
    // Add to attachments
    setAttachments(prev => [...prev, {
      type: 'image',
      name: file.name,
      url: imageUrl,
      file: file
    }]);
  };
  
  // Handle voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Add to attachments
        setAttachments(prev => [...prev, {
          type: 'audio',
          name: 'Voice message',
          url: audioUrl,
          file: audioBlob,
          duration: mediaRecorderRef.current.duration || null
        }]);
        
        setIsRecording(false);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
      alert('Failed to access microphone. Please check your permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stream cleanup
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  // Handle sending a message with possible attachments
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (input.trim() === '' && attachments.length === 0) return;
    
    const userMessage = {
      text: input,
      timestamp: getCurrentTime(),
      sender: 'user',
      attachments: attachments.length > 0 ? [...attachments] : null
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setAttachments([]);
    
    // Send to Nexus backend
    sendMessageToNexus(input, attachments);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Nexus Interface</h1>
        <div className="status-indicator">
          <div className={`status-light ${isProcessing ? 'processing' : isRecording ? 'recording' : 'active'}`}></div>
          <span>
            {isProcessing ? 'Processing...' : isRecording ? 'Recording...' : 'Online'}
          </span>
        </div>
      </header>
      
      <main className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <Message 
              key={index} 
              message={message} 
              isNexus={message.sender === 'nexus'} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Display pending attachments */}
        {attachments.length > 0 && (
          <div className="pending-attachments">
            {attachments.map((attachment, index) => (
              <div className="pending-attachment" key={index}>
                {attachment.type === 'image' && (
                  <div className="attachment-preview image-preview">
                    <img src={attachment.url} alt="Preview" />
                  </div>
                )}
                {attachment.type === 'document' && (
                  <div className="attachment-preview document-preview">
                    <FontAwesomeIcon icon={faFile} />
                    <span>{attachment.name}</span>
                  </div>
                )}
                {attachment.type === 'audio' && (
                  <div className="attachment-preview audio-preview">
                    <audio src={attachment.url} controls></audio>
                  </div>
                )}
                <button 
                  className="remove-attachment" 
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
        
        <form className="input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Nexus..."
            disabled={isProcessing || isRecording}
          />
          
          {/* Hidden file inputs */}
          <input 
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
          />
          
          <input 
            type="file"
            ref={imageInputRef}
            style={{ display: 'none' }}
            onChange={handleImageUpload}
            accept="image/*"
          />
          
          {/* Attachment buttons */}
          <div className="attachment-buttons">
            <button 
              type="button" 
              className="attachment-button"
              onClick={() => fileInputRef.current.click()}
              disabled={isProcessing || isRecording}
            >
              <FontAwesomeIcon icon={faFile} />
            </button>
            
            <button 
              type="button" 
              className="attachment-button"
              onClick={() => imageInputRef.current.click()}
              disabled={isProcessing || isRecording}
            >
              <FontAwesomeIcon icon={faImage} />
            </button>
            
            {!isRecording ? (
              <button 
                type="button" 
                className="attachment-button"
                onClick={startRecording}
                disabled={isProcessing}
              >
                <FontAwesomeIcon icon={faMicrophone} />
              </button>
            ) : (
              <button 
                type="button" 
                className="attachment-button recording"
                onClick={stopRecording}
              >
                <FontAwesomeIcon icon={faStop} />
              </button>
            )}
          </div>
          
          <button 
            type="submit" 
            className="send-button"
            disabled={isProcessing || (input.trim() === '' && attachments.length === 0) || isRecording}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
```