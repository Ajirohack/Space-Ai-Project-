import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

// Define the auth user type
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

// Define the auth context type
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  logout: () => {},
});

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // Check local storage for token
        const token = localStorage.getItem('auth_token');

        if (token) {
          // In a real app, validate the token with your API
          // For now, let's mock a user
          const userData: AuthUser = {
            id: '1',
            name: 'Admin User',
            email: 'admin@nexus.com',
            role: 'admin',
            token,
          };
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to restore auth state:', err);
        setError('Failed to restore authentication state');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, make an API request to authenticate
      // For now, let's just simulate an API call
      if (email === 'admin@nexus.com' && password === 'admin') {
        // Mock successful login
        const token = 'mock_jwt_token';
        localStorage.setItem('auth_token', token);

        const userData: AuthUser = {
          id: '1',
          name: 'Admin User',
          email,
          role: 'admin',
          token,
        };

        setUser(userData);
        router.push('/dashboard');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
