import { useState, useEffect } from 'react';

/**
 * Hook for persisting state to localStorage
 * @param {string} key - The localStorage key
 * @param {any} initialValue - The initial value
 * @returns {[any, Function]} State value and setter
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Update localStorage when value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Ignore localStorage errors
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
