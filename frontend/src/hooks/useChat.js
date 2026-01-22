import { useState, useCallback } from 'react';
import { improvePrompt, transformResponse } from '../utils/api';
import { generateId } from '../utils/schema';

/**
 * Hook for managing chat state and messages
 * @returns {Object} Chat state and handlers
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingClarifications, setPendingClarifications] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);

  /**
   * Add a message to the chat
   */
  const addMessage = useCallback((message) => {
    const newMessage = {
      id: generateId(),
      timestamp: new Date(),
      ...message
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  /**
   * Send a new prompt for improvement
   */
  const sendPrompt = useCallback(async (payload) => {
    setError(null);
    setLastPayload(payload);
    
    // Add user message
    addMessage({
      role: 'user',
      type: 'message',
      content: payload.roughPrompt
    });
    
    setIsLoading(true);
    
    try {
      const result = await improvePrompt(payload);
      const transformed = transformResponse(result);
      
      if (transformed.needsClarification) {
        // Add clarification request message
        addMessage({
          role: 'assistant',
          type: 'clarification',
          content: 'I need a few clarifications to refine your prompt better:',
          metadata: {
            clarifications: transformed.clarifications
          }
        });
        setPendingClarifications(transformed.clarifications);
      } else if (transformed.isAlreadyExcellent) {
        // Prompt is already excellent - celebrate it!
        addMessage({
          role: 'assistant',
          type: 'excellent-prompt',
          content: transformed.improvedPrompt,
          metadata: {
            excellenceReason: transformed.excellenceReason,
            learningReport: transformed.learningReport
          }
        });
        setPendingClarifications(null);
      } else {
        // Add improved prompt message
        addMessage({
          role: 'assistant',
          type: 'improved-prompt',
          content: transformed.improvedPrompt,
          metadata: {
            assumptions: transformed.assumptions,
            learningReport: transformed.learningReport
          }
        });
        setPendingClarifications(null);
      }
      return { success: true };
    } catch (err) {
      setError(err.message);
      
      // Build a detailed error message
      let errorContent = `Error: ${err.message}`;
      if (err.status) {
        errorContent = `Error (${err.status}): ${err.message}`;
      }
      if (err.raw) {
        errorContent += `\n\nServer response:\n${err.raw}`;
      }
      
      addMessage({
        role: 'system',
        type: 'error',
        content: errorContent
      });
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  /**
   * Submit clarification answers and continue
   */
  const submitClarifications = useCallback(async (answers) => {
    if (!lastPayload) return;
    
    setError(null);
    
    // Format answer summary with human-readable labels
    const formatKey = (key) => {
      // Convert snake_case to Title Case
      return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    };
    
    const answerSummary = Object.entries(answers)
      .map(([key, value]) => {
        const label = formatKey(key);
        if (Array.isArray(value)) {
          return `**${label}:** ${value.join(', ')}`;
        }
        return `**${label}:** ${value}`;
      })
      .join('\n');
    
    addMessage({
      role: 'user',
      type: 'message',
      content: answerSummary
    });
    
    setIsLoading(true);
    
    try {
      const payloadWithClarifications = {
        ...lastPayload,
        clarifications: answers
      };
      
      const result = await improvePrompt(payloadWithClarifications);
      const transformed = transformResponse(result);
      
      if (transformed.needsClarification) {
        // More clarifications needed
        addMessage({
          role: 'assistant',
          type: 'clarification',
          content: 'I need a few more details:',
          metadata: {
            clarifications: transformed.clarifications
          }
        });
        setPendingClarifications(transformed.clarifications);
      } else if (transformed.isAlreadyExcellent) {
        // Prompt is already excellent
        addMessage({
          role: 'assistant',
          type: 'excellent-prompt',
          content: transformed.improvedPrompt,
          metadata: {
            excellenceReason: transformed.excellenceReason,
            learningReport: transformed.learningReport
          }
        });
        setPendingClarifications(null);
      } else {
        // Add improved prompt message
        addMessage({
          role: 'assistant',
          type: 'improved-prompt',
          content: transformed.improvedPrompt,
          metadata: {
            assumptions: transformed.assumptions,
            learningReport: transformed.learningReport
          }
        });
        setPendingClarifications(null);
      }
    } catch (err) {
      setError(err.message);
      addMessage({
        role: 'system',
        type: 'error',
        content: `Error: ${err.message}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [lastPayload, addMessage]);

  /**
   * Clear all messages and start fresh
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setPendingClarifications(null);
    setLastPayload(null);
  }, []);

  /**
   * Remove a specific message
   */
  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  return {
    messages,
    isLoading,
    error,
    pendingClarifications,
    sendPrompt,
    submitClarifications,
    clearChat,
    addMessage,
    removeMessage
  };
}
