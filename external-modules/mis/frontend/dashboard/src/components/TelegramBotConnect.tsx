import React, { useState } from 'react';

interface TelegramBotConnectProps {
  onConnect?: (success: boolean) => void;
}

const TelegramBotConnect: React.FC<TelegramBotConnectProps> = ({ onConnect }) => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!botToken.trim() || !chatId.trim()) {
      setError('Both Bot Token and Chat ID are required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/telegram/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ botToken, chatId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to connect Telegram bot');
      }
      
      setSuccess(true);
      if (onConnect) {
        onConnect(true);
      }
    } catch (error) {
      console.error('Telegram bot connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect Telegram bot');
      if (onConnect) {
        onConnect(false);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/10">
      <h2 className="text-xl font-semibold text-white mb-4">Connect Telegram Bot</h2>
      
      {success ? (
        <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg text-center">
          <p className="text-green-200 font-medium">Telegram bot connected successfully!</p>
          <button 
            onClick={() => setSuccess(false)} 
            className="mt-3 text-sm underline text-green-300 hover:text-green-100"
          >
            Connect another bot
          </button>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label htmlFor="botToken" className="block text-sm font-medium text-gray-300 mb-1">
              Bot Token
            </label>
            <input
              id="botToken"
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ"
              autoComplete="off"
            />
          </div>
          
          <div>
            <label htmlFor="chatId" className="block text-sm font-medium text-gray-300 mb-1">
              Chat ID
            </label>
            <input
              id="chatId"
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. -123456789"
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
          
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white rounded-lg font-medium transition-colors duration-200"
            >
              {isLoading ? 'Connecting...' : 'Connect Bot'}
            </button>
          </div>
          
          <div className="text-xs text-gray-400 mt-3">
            <p>How to get your Bot Token:</p>
            <ol className="list-decimal pl-4 space-y-1 mt-1">
              <li>Talk to @BotFather on Telegram</li>
              <li>Create a new bot with /newbot command</li>
              <li>Copy the HTTP API token provided</li>
            </ol>
            
            <p className="mt-2">How to get your Chat ID:</p>
            <ol className="list-decimal pl-4 space-y-1 mt-1">
              <li>Add @RawDataBot to your group</li>
              <li>Find "chat": {"id": -XXXXXXXXX} in the response</li>
              <li>Use this number as your Chat ID</li>
            </ol>
          </div>
        </form>
      )}
    </div>
  );
};

export default TelegramBotConnect;