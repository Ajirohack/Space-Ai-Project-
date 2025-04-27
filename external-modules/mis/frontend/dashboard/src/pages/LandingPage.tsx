import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-radial from-gray-900 to-gray-950">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to MIS</h1>
          <p className="text-gray-300 mb-8">Membership Initiation System</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg"
          >
            Coming In?
          </button>
          
          <button 
            onClick={() => navigate('/invitation')}
            className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors duration-200 shadow backdrop-blur-sm"
          >
            Were You Invited?
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
          <p>Secure access for authorized members only</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;