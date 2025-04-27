import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  const [membershipKey, setMembershipKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { auth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!membershipKey.trim()) {
      setError('Membership key is required');
      if (onError) onError('Membership key is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await auth.login(membershipKey.trim());
      if (onSuccess) onSuccess();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid membership key';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="membershipKey" className="block text-sm font-medium text-gray-300 mb-1">
          Membership Key
        </label>
        <input
          id="membershipKey"
          type="text"
          value={membershipKey}
          onChange={(e) => setMembershipKey(e.target.value)}
          className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g. A1B2-C3D4"
          disabled={isLoading}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white rounded-lg font-medium transition-colors duration-200"
        >
          {isLoading ? 'Logging in...' : 'Enter'}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;