import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  
  const [membershipKey, setMembershipKey] = useState('');
  const [tools, setTools] = useState({
    educator: false,
    planner: false,
    rag: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleToolToggle = (tool: keyof typeof tools) => {
    setTools(prev => ({
      ...prev,
      [tool]: !prev[tool]
    }));
  };
  
  const handleNextStep = () => {
    if (step === 1) {
      if (!membershipKey.trim()) {
        setError('Please enter your membership key');
        return;
      }
      setError('');
      setStep(2);
    } else {
      handleSubmit();
    }
  };
  
  const handleBack = () => {
    setStep(1);
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // API call to save setup preferences
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          membershipKey,
          tools
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Setup failed');
      }
      
      // Setup successful - redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Setup error:', error);
      setError(error instanceof Error ? error.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-radial from-gray-900 to-gray-950 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">One-Time Setup</h1>
          <p className="text-gray-300 mt-2">
            {step === 1 ? 'Enter your membership key' : 'Customize your experience'}
          </p>
        </div>
        
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="membershipKey" className="block text-sm font-medium text-gray-300 mb-1">
                Your Membership Key
              </label>
              <input
                id="membershipKey"
                type="text"
                value={membershipKey}
                onChange={(e) => setMembershipKey(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. A1B2-C3D4"
              />
              {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
            </div>
            
            <div className="pt-4">
              <button
                onClick={handleNextStep}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-300">Enable Tools</p>
              
              {/* Educator Tool Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-white">Educator</h3>
                  <p className="text-sm text-gray-400">Learn topics through guided tutorials</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={tools.educator}
                    onChange={() => handleToolToggle('educator')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {/* Planner Tool Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-white">Planner</h3>
                  <p className="text-sm text-gray-400">Create and track personal goals</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={tools.planner}
                    onChange={() => handleToolToggle('planner')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {/* RAG Tool Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-white">RAG</h3>
                  <p className="text-sm text-gray-400">Access knowledge base Q&A with citations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={tools.rag}
                    onChange={() => handleToolToggle('rag')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}
            
            <div className="pt-4 flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 px-4 bg-transparent hover:bg-white/10 border border-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white rounded-lg font-medium transition-colors duration-200"
              >
                {isLoading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupPage;