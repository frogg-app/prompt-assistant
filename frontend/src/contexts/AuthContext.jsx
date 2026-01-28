/**
 * AuthContext - Authentication state management
 * Provides user authentication state and methods across the app
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

// Mock user storage (will be replaced with real backend)
const STORAGE_KEY = 'prompt-assistant-auth';

/**
 * AuthProvider component
 * Wraps the app and provides authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to storage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  /**
   * Sign in with email and password
   */
  const signInWithEmail = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with real backend call
      // For now, simulate a successful login
      const mockUser = {
        id: `user_${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        photoURL: null,
        provider: 'email',
        createdAt: new Date().toISOString()
      };
      
      setUser(mockUser);
      return { success: true, user: mockUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign up with email and password
   */
  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with real backend call
      const mockUser = {
        id: `user_${Date.now()}`,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: null,
        provider: 'email',
        createdAt: new Date().toISOString()
      };
      
      setUser(mockUser);
      return { success: true, user: mockUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign in with GitHub OAuth
   */
  const signInWithGitHub = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with real OAuth flow
      const mockUser = {
        id: `github_${Date.now()}`,
        email: 'github-user@example.com',
        displayName: 'GitHub User',
        photoURL: 'https://github.com/ghost.png',
        provider: 'github',
        createdAt: new Date().toISOString()
      };
      
      setUser(mockUser);
      return { success: true, user: mockUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with real OAuth flow
      const mockUser = {
        id: `google_${Date.now()}`,
        email: 'google-user@gmail.com',
        displayName: 'Google User',
        photoURL: null,
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      
      setUser(mockUser);
      return { success: true, user: mockUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    setUser(null);
    setError(null);
    return { success: true };
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };
    
    setUser(prev => ({ ...prev, ...updates }));
    return { success: true };
  }, [user]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGitHub,
    signInWithGoogle,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook
 * Access authentication state and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
