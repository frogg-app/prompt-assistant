/**
 * useLocalStorage Hook Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  const TEST_KEY = 'test-storage-key';

  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should return stored value from localStorage', () => {
    window.localStorage.setItem(TEST_KEY, JSON.stringify('stored-value'));
    
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'initial'));
    
    act(() => {
      result.current[1]('updated');
    });
    
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(window.localStorage.getItem(TEST_KEY))).toBe('updated');
  });

  it('should handle object values', () => {
    const initialValue = { name: 'test', count: 0 };
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, initialValue));
    
    expect(result.current[0]).toEqual(initialValue);
    
    act(() => {
      result.current[1]({ name: 'updated', count: 1 });
    });
    
    expect(result.current[0]).toEqual({ name: 'updated', count: 1 });
  });

  it('should handle array values', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, []));
    
    act(() => {
      result.current[1](['item1', 'item2']);
    });
    
    expect(result.current[0]).toEqual(['item1', 'item2']);
  });

  it('should handle boolean values', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, false));
    
    act(() => {
      result.current[1](true);
    });
    
    expect(result.current[0]).toBe(true);
  });

  it('should use initial value if localStorage contains invalid JSON', () => {
    window.localStorage.setItem(TEST_KEY, 'not-valid-json');
    
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should update value with functional setter', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 5));
    
    act(() => {
      result.current[1](prev => prev + 1);
    });
    
    expect(result.current[0]).toBe(6);
  });

  it('should maintain separate values for different keys', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
    const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));
    
    expect(result1.current[0]).toBe('value1');
    expect(result2.current[0]).toBe('value2');
  });
});
