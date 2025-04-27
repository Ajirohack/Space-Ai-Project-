import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faFile, faImage, faPaperPlane, faStop, faTimes } from '@fortawesome/react-fontawesome';

const AccessScreen = () => {
  const [apiKey, setApiKey] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const handleClick = () => {
    if (!showInput) {
      setShowInput(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate API key
    if (apiKey === '1234567890') {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Invalid API key. Please try again.');
    }
  };

  const NexusApp = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([{
      text: "Hello, I am Nexus. I'm here to assist and interact with you. How can I help you today?",
      timestamp: "10:30 AM", 
      sender: 'nexus'
    }]);

    const handleSendMessage = (e) => {
      e.preventDefault();
      if (input.trim() === '') return;
      
      // Add user message
      setMessages(prev => [...prev, {
        text: input,
        timestamp: "10:32 AM",
        sender: 'user'
      }]);
      
      setInput('');
      
      // Simulate Nexus response after a short delay
      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: "I'm just a demo of the Nexus interface. In the actual application, I'd provide a helpful response based on your input.",
          timestamp: "10:32 AM",
          sender: 'nexus'
        }]);
      }, 1000);
    };

    return (
      <div className="flex flex-col h-screen bg-black text-white">
        {/* Header with logo */}
        <header className="flex justify-center items-center py-5 border-b border-gray-800">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="w-8 h-8 bg-cyan-400 opacity-75 rounded-full absolute animate-pulse"></div>
            </div>
          </div>
        </header>
        
        {/* Chat container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'nexus' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-2">
                  <div className="w-6 h-6 bg-black rounded-full"></div>
                </div>
              )}
              
              <div className={`max-w-xs p-3 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-gray-800 rounded-tr-none' 
                  : 'bg-gray-900 rounded-tl-none border border-gray-800'
              }`}>
                <p>{message.text}</p>
                <p className="text-xs text-gray-500 text-right mt-1">{message.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Input area */}
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
            <div className="relative w-full">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Nexus..."
                className="w-full py-3 px-4 pr-12 bg-gray-900 border border-gray-800 rounded-full text-white"
              />
              <button 
                type="submit" 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white disabled:text-gray-600"
                disabled={input.trim() === ''}
              >
                <span>→</span>
              </button>
            </div>
            
            <div className="flex justify-center gap-4">
              <button type="button" className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                <span>📄</span>
              </button>
              <button type="button" className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                <span>🖼️</span>
              </button>
              <button type="button" className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                <span>🎤</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (authenticated) {
    return <NexusApp />;
  }

  return (
    <div 
      className="flex items-center justify-center h-screen bg-black text-white cursor-pointer" 
      onClick={handleClick}
    >
      <div className={`flex flex-col items-center transition-all duration-500 ${showInput ? 'opacity-60 blur-sm scale-95' : ''}`}>
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mb-4">
          <div className="w-18 h-18 bg-black rounded-full flex items-center justify-center relative overflow-hidden">
            <div className="w-10 h-10 bg-cyan-400 opacity-75 rounded-full absolute animate-pulse"></div>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-wider">NEXUS</h1>
      </div>
      
      {showInput && (
        <div 
          className="absolute bg-gray-900 bg-opacity-90 p-6 rounded-lg shadow-lg max-w-md w-full animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl text-center mb-4 text-blue-400">Enter API Key</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full p-3 bg-black bg-opacity-50 border border-gray-700 rounded-full text-white"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-center mb-4 text-sm">{error}</p>}
            <button 
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold rounded-full hover:shadow-lg transition transform hover:-translate-y-1"
            >
              Access Nexus
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AccessScreen;
