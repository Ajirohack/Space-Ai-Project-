# Nexus UI - Chat Interface [CODE]

---

```html
// File: src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Simple avatar component for Nexus
const NexusAvatar = () => (
  <div className="nexus-avatar">
    <div className="nexus-avatar-inner">
      <div className="nexus-avatar-pulse"></div>
    </div>
  </div>
);

// Message component to display chat messages
const Message = ({ message, isNexus }) => (
  <div className={`message ${isNexus ? 'nexus-message' : 'user-message'}`}>
    {isNexus && <NexusAvatar />}
    <div className="message-content">
      <div className="message-text">{message.text}</div>
      <div className="message-time">{message.timestamp}</div>
    </div>
  </div>
);

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef(null);

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

  // Function to send message to backend LLM API
  const sendMessageToNexus = async (messageText) => {
    try {
      // This would be replaced with actual API call to your LLM backend
      setIsProcessing(true);
      
      // Simulate API call with timeout
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          // This is where you'd integrate with your chosen LLM API
          resolve({
            text: "I'm processing your request. In a full implementation, this would be a response from the LLM backend that powers Nexus.",
            timestamp: getCurrentTime(),
          });
        }, 1500);
      });
      
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

  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (input.trim() === '') return;
    
    const userMessage = {
      text: input,
      timestamp: getCurrentTime(),
      sender: 'user',
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    
    // Send to Nexus backend
    sendMessageToNexus(input);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Nexus Interface</h1>
        <div className="status-indicator">
          <div className={`status-light ${isProcessing ? 'processing' : 'active'}`}></div>
          <span>{isProcessing ? 'Processing...' : 'Online'}</span>
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
        
        <form className="input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Nexus..."
            disabled={isProcessing}
          />
          <button 
            type="submit" 
            disabled={isProcessing || input.trim() === ''}
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
```