/**
 * useChatSessions Hook
 * Manages multiple chat sessions with persistence
 */

import { useState, useCallback, useEffect } from 'react';
import { generateId } from '../utils/schema';

const STORAGE_KEY = 'prompt-assistant-sessions';
const MAX_SESSIONS = 50;

/**
 * Generate a title from the first user message
 */
function generateSessionTitle(messages) {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage?.content) return 'New Chat';
  
  const content = firstUserMessage.content;
  if (content.length <= 40) return content;
  return content.substring(0, 37) + '...';
}

/**
 * useChatSessions hook
 * Provides session management for multiple chat conversations
 */
export function useChatSessions(userId = null) {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Storage key includes userId if authenticated
  const storageKey = userId ? `${STORAGE_KEY}-${userId}` : STORAGE_KEY;

  // Load sessions from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by updatedAt descending
        parsed.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setSessions(parsed);
        
        // Set current session to the most recent one if exists and no session selected
        if (parsed.length > 0) {
          setCurrentSessionId(prev => prev || parsed[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load chat sessions:', e);
    }
    setIsLoading(false);
  }, [storageKey]); // Removed currentSessionId to prevent infinite loop

  // Save sessions to storage when they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(sessions));
      } catch (e) {
        console.error('Failed to save chat sessions:', e);
      }
    }
  }, [sessions, storageKey, isLoading]);

  /**
   * Get the current session
   */
  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  /**
   * Create a new chat session
   */
  const createSession = useCallback((options = {}) => {
    const newSession = {
      id: generateId(),
      title: options.title || 'New Chat',
      messages: [],
      settings: {
        provider: options.provider || null,
        model: options.model || null,
        promptType: options.promptType || 'none',
        learningMode: options.learningMode || false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSessions(prev => {
      // Limit total sessions
      const updated = [newSession, ...prev].slice(0, MAX_SESSIONS);
      return updated;
    });

    setCurrentSessionId(newSession.id);
    return newSession;
  }, []);

  /**
   * Update a session
   */
  const updateSession = useCallback((sessionId, updates) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return session;
    }));
  }, []);

  /**
   * Update session messages
   */
  const updateSessionMessages = useCallback((sessionId, messages) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        // Generate title from first message if not set
        const title = session.title === 'New Chat' && messages.length > 0
          ? generateSessionTitle(messages)
          : session.title;
        
        return {
          ...session,
          title,
          messages,
          updatedAt: new Date().toISOString()
        };
      }
      return session;
    }));
  }, []);

  /**
   * Delete a session
   */
  const deleteSession = useCallback((sessionId) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== sessionId);
      
      // If deleting current session, switch to most recent or null
      if (sessionId === currentSessionId) {
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id);
        } else {
          setCurrentSessionId(null);
        }
      }
      
      return remaining;
    });
  }, [currentSessionId]);

  /**
   * Select a session
   */
  const selectSession = useCallback((sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
    }
  }, [sessions]);

  /**
   * Clear all sessions
   */
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setCurrentSessionId(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    sessions,
    currentSession,
    currentSessionId,
    isLoading,
    createSession,
    updateSession,
    updateSessionMessages,
    deleteSession,
    selectSession,
    clearAllSessions
  };
}

export default useChatSessions;
