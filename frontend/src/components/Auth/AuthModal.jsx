/**
 * AuthModal Component
 * Sign in / Sign up modal with multiple auth providers
 */

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui';
import './AuthModal.css';

// SVG Icons
const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export default function AuthModal({ isOpen, onClose, requireAuth = false }) {
  const { signInWithEmail, signUpWithEmail, signInWithGitHub, signInWithGoogle, isLoading, error, user } = useAuth();
  
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'email-signin' | 'email-signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState(null);

  if (!isOpen) return null;

  // Prevent closing if auth is required and user is not authenticated
  const handleClose = () => {
    if (requireAuth && !user) {
      return; // Don't allow closing
    }
    onClose();
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!email.trim() || !password) {
      setLocalError('Please enter email and password');
      return;
    }
    
    const result = await signInWithEmail(email, password);
    if (result.success) {
      handleClose();
    } else {
      setLocalError(result.error);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!email.trim() || !password) {
      setLocalError('Please enter email and password');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    
    const result = await signUpWithEmail(email, password, displayName);
    if (result.success) {
      handleClose();
    } else {
      setLocalError(result.error);
    }
  };

  const handleGitHubSignIn = async () => {
    setLocalError(null);
    const result = await signInWithGitHub();
    if (result.success) {
      handleClose();
    } else {
      setLocalError(result.error);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    const result = await signInWithGoogle();
    if (result.success) {
      handleClose();
    } else {
      setLocalError(result.error);
    }
  };

  const displayError = localError || error;

  // Email sign in form
  if (mode === 'email-signin') {
    return (
      <div className="auth-modal__overlay" onClick={handleClose}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          {!requireAuth && (
            <button className="auth-modal__close" onClick={handleClose} aria-label="Close">×</button>
          )}
          
          <div className="auth-modal__header">
            <h2>Sign in with Email</h2>
            <p>Enter your email and password to continue</p>
          </div>

          {displayError && (
            <div className="auth-modal__error">{displayError}</div>
          )}

          <form onSubmit={handleEmailSignIn} className="auth-modal__form">
            <div className="auth-modal__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            
            <div className="auth-modal__field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="auth-modal__submit"
              disabled={isLoading}
              loading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="auth-modal__footer">
            <button 
              className="auth-modal__link" 
              onClick={() => setMode('signin')}
            >
              ← Back to sign in options
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Email sign up form
  if (mode === 'email-signup') {
    return (
      <div className="auth-modal__overlay" onClick={handleClose}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          {!requireAuth && (
            <button className="auth-modal__close" onClick={handleClose} aria-label="Close">×</button>
          )}
          
          <div className="auth-modal__header">
            <h2>Create Account</h2>
            <p>Sign up with your email to get started</p>
          </div>

          {displayError && (
            <div className="auth-modal__error">{displayError}</div>
          )}

          <form onSubmit={handleEmailSignUp} className="auth-modal__form">
            <div className="auth-modal__field">
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            
            <div className="auth-modal__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            
            <div className="auth-modal__field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
              />
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="auth-modal__submit"
              disabled={isLoading}
              loading={isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="auth-modal__footer">
            <button 
              className="auth-modal__link" 
              onClick={() => setMode('signup')}
            >
              ← Back to sign up options
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main sign in / sign up screen
  return (
    <div className="auth-modal__overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        {!requireAuth && (
          <button className="auth-modal__close" onClick={handleClose} aria-label="Close">×</button>
        )}
        
        <div className="auth-modal__header">
          <h2>{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>
            {mode === 'signin' 
              ? 'Sign in to access your saved chats and settings'
              : 'Sign up to save your chats and sync across devices'
            }
          </p>
        </div>

        {displayError && (
          <div className="auth-modal__error">{displayError}</div>
        )}

        <div className="auth-modal__providers">
          <button 
            className="auth-modal__provider auth-modal__provider--github"
            onClick={handleGitHubSignIn}
            disabled={isLoading}
          >
            <GitHubIcon />
            <span>Continue with GitHub</span>
          </button>
          
          <button 
            className="auth-modal__provider auth-modal__provider--google"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
          
          <button 
            className="auth-modal__provider auth-modal__provider--email"
            onClick={() => setMode(mode === 'signin' ? 'email-signin' : 'email-signup')}
            disabled={isLoading}
          >
            <EmailIcon />
            <span>Continue with Email</span>
          </button>
        </div>

        <div className="auth-modal__divider">
          <span>or</span>
        </div>

        <div className="auth-modal__footer">
          {mode === 'signin' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button className="auth-modal__link" onClick={() => setMode('signup')}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button className="auth-modal__link" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
