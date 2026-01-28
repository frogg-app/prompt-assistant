import { useState, useCallback } from 'react';
import { generateId } from '../utils/schema';
import { callProvider, isFrontendProvider } from '../services/llm';
import { apiKeyStorage } from '../services/api-key-storage';

/**
 * Transform LLM response to the frontend format
 * @param {Object} response - Raw LLM response
 * @returns {Object} Transformed response
 */
function transformResponse(response) {
  return {
    needsClarification: Boolean(response.needs_clarification),
    clarifications: response.clarifications || [],
    improvedPrompt: response.improved_prompt || '',
    isAlreadyExcellent: Boolean(response.is_already_excellent),
    excellenceReason: response.excellence_reason || null,
    assumptions: response.assumptions || [],
    learningReport: response.learning_report || null
  };
}

/**
 * Hook for managing chat state and messages
 * Now calls LLM APIs directly from the frontend
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
   * Call the LLM provider directly from the frontend
   */
  const callLLM = useCallback(async (payload, clarifications = null) => {
    const providerId = payload.model?.provider;
    
    if (!providerId) {
      throw new Error('No provider selected');
    }
    
    if (!isFrontendProvider(providerId)) {
      throw new Error(`Provider "${providerId}" requires backend support (CLI-based)`);
    }
    
    const apiKey = apiKeyStorage.get(providerId);
    if (!apiKey) {
      throw new Error(`API key not configured for ${providerId}. Please add your API key in settings.`);
    }
    
    // Get prompt type system prompt if available
    // TODO: In the future, we could load this from a local store or backend
    const promptTypeSystemPrompt = '';
    
    const result = await callProvider({
      providerId,
      apiKey,
      model: payload.model?.name,
      roughPrompt: payload.roughPrompt,
      constraints: payload.constraints || [],
      learningMode: payload.options?.learningMode || false,
      clarifications,
      promptTypeSystemPrompt
    });
    
    return result;
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
      const result = await callLLM(payload);
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
  }, [addMessage, callLLM]);

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
      const result = await callLLM(lastPayload, answers);
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
  }, [lastPayload, addMessage, callLLM]);

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
