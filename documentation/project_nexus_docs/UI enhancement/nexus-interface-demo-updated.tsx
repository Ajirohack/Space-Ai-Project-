import React, { useState } from 'react';

const AccessScreen = () => {
  const [apiKey, setApiKey] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('classic'); // 'classic', 'hex', 'diamond', 'square', 'circuit', 'neural'

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

  const NexusLogo = ({ type, small = false }) => {
    if (type === 'hex') {
      return (
        <div className={`w-28 h-28 ${small ? 'scale-75' : ''} relative bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-5`} 
             style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
          <div className="w-20 h-20 bg-black flex items-center justify-center relative overflow-hidden"
               style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
            <div className="w-12 h-12 rounded-full bg-cyan-400 opacity-75 absolute animate-pulse"></div>
          </div>
        </div>
      );
    } else if (type === 'diamond') {
      return (
        <div className={`w-24 h-24 ${small ? 'scale-75' : ''} relative bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-5 rotate-45`}>
          <div className="w-20 h-20 bg-black flex items-center justify-center relative overflow-hidden">
            <div className="w-10 h-10 bg-cyan-400 opacity-75 absolute -rotate-45 animate-pulse"></div>
          </div>
        </div>
      );
    } else if (type === 'square') {