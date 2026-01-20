/**
 * usePromptTypes Hook
 * Manages prompt types state and operations
 */

import { useState, useEffect, useCallback } from 'react';

export function usePromptTypes() {
  const [promptTypes, setPromptTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPromptTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/prompt-types');
      
      if (!response.ok) {
        throw new Error('Failed to fetch prompt types');
      }

      const data = await response.json();
      setPromptTypes(data.promptTypes || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch prompt types:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromptTypes();
  }, [fetchPromptTypes]);

  return {
    promptTypes,
    isLoading,
    error,
    refreshPromptTypes: fetchPromptTypes
  };
}
