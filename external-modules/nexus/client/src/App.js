import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faFile, faImage, faPaperPlane, faStop, faBars } from '@fortawesome/free-solid-svg-icons';
import Message from './components/Message';
import AttachmentPreview from './components/AttachmentPreview';
import NexusLogo from './components/NexusLogo';
import nexusApi from './services/nexusApi';
import './App.css';

function App({ apiKey }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea as content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    setAttachments(prev => [...prev, {
      type: 'document',
      name: file.name,
      url: fileUrl,
      file: file
    }]);
    event.target.value = null;
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setAttachments(prev => [...prev, {
      type: 'image',
      name: file.name,
      url: imageUrl,
      file: file
    }]);
    event.target.value = null;
  };

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
        setAttachments(prev => [...prev, {
          type: 'audio',
          name: 'Voice message',
          url: audioUrl,
          file: audioBlob
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
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const removeAttachment = (attachmentToRemove) => {
    setAttachments(prev => prev.filter(attachment => attachment !== attachmentToRemove));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' && attachments.length === 0) return;

    const newMessage = {
      text: input,
      attachments: attachments.length > 0 ? [...attachments] : null,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, { ...newMessage, isUser: true }]);
    setInput('');
    setAttachments([]);
    setIsProcessing(true);

    try {
      const response = await nexusApi.sendMessage(input, attachments, apiKey);
      setMessages(prev => [...prev, {
        text: response,
        timestamp: new Date().toLocaleTimeString(),
        isUser: false
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        text: "I apologize, but I'm having trouble processing your request. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        isUser: false
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <NexusLogo size={40} />
          <h2>Nexus</h2>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3>Recent Conversations</h3>
            <ul className="conversation-list">
              <li className="active">Current Session</li>
              <li>Yesterday's Chat</li>
              <li>Research Project</li>
            </ul>
          </div>
          <div className="sidebar-section">
            <h3>Settings</h3>
            <ul className="settings-list">
              <li>Theme</li>
              <li>Notifications</li>
              <li>Privacy</li>
              <li>Help</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="app-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div className="logo-container">
              <NexusLogo size={40} />
            </div>
          </div>
          <div className="status-indicator">
            <div className={`status-light ${isProcessing ? 'processing' : isRecording ? 'recording' : 'active'}`}></div>
            <span>{isProcessing ? 'Processing...' : isRecording ? 'Recording...' : 'Online'}</span>
          </div>
        </header>

        <main className="chat-container">
          <div className="messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <NexusLogo size={80} />
                <h2>Welcome to Nexus</h2>
                <p>Your intelligent assistant is ready to help. Ask anything!</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <Message key={index} message={msg} isNexus={!msg.isUser} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {attachments.length > 0 && (
            <div className="pending-attachments">
              {attachments.map((attachment, index) => (
                <AttachmentPreview
                  key={index}
                  attachment={attachment}
                  onRemove={removeAttachment}
                />
              ))}
            </div>
          )}

          <div className="typing-container">
            <div className="typing-content">
              <div className="typing-textarea">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message Nexus..."
                  rows="1"
                  disabled={isProcessing || isRecording}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={isProcessing || (input.trim() === '' && attachments.length === 0)}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>

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

              <div className="typing-controls">
                <button
                  className="control-button"
                  onClick={() => fileInputRef.current.click()}
                  disabled={isProcessing || isRecording}
                  title="Upload document"
                >
                  <FontAwesomeIcon icon={faFile} />
                </button>

                <button
                  className="control-button"
                  onClick={() => imageInputRef.current.click()}
                  disabled={isProcessing || isRecording}
                  title="Upload image"
                >
                  <FontAwesomeIcon icon={faImage} />
                </button>

                {!isRecording ? (
                  <button
                    className="control-button"
                    onClick={startRecording}
                    disabled={isProcessing}
                    title="Record voice message"
                  >
                    <FontAwesomeIcon icon={faMicrophone} />
                  </button>
                ) : (
                  <button
                    className="control-button recording"
                    onClick={stopRecording}
                    title="Stop recording"
                  >
                    <FontAwesomeIcon icon={faStop} />
                  </button>
                )}
              </div> {/* Closing typing-controls */}
            </div> {/* Closing typing-content */}
          </div> {/* Closing typing-container */}
        </main> {/* Closing chat-container */}
      </div> {/* Closing main-content */}
    </div> /* Closing app */
  );
}

export default App;
