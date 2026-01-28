/**
 * useProviders Hook Tests
 * Updated for frontend-only API key management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProviders } from './useProviders';

// Mock the LLM services
vi.mock('../services/llm', () => ({
  isFrontendProvider: vi.fn((id) => id === 'openai' || id === 'gemini'),
  fetchProviderModels: vi.fn(() => Promise.resolve([
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' }
  ]))
}));

// Mock the API key storage
vi.mock('../services/api-key-storage', () => ({
  apiKeyStorage: {
    has: vi.fn((id) => id === 'openai'), // Only openai has a key by default
    get: vi.fn((id) => id === 'openai' ? 'sk-test-key' : ''),
    save: vi.fn(),
    remove: vi.fn()
  }
}));

// Mock the schema module
vi.mock('../utils/schema', () => ({
  getModelDisplayInfo: vi.fn((id, label) => ({ displayName: label || id }))
}));

// Mock useLocalStorage
vi.mock('./useLocalStorage', () => ({
  useLocalStorage: vi.fn((key, defaultValue) => {
    const [value, setValue] = vi.importActual('react').useState(defaultValue);
    return [value, setValue];
  })
}));

import { fetchProviderModels } from '../services/llm';
import { apiKeyStorage } from '../services/api-key-storage';

describe('useProviders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load providers on mount', async () => {
    const { result } = renderHook(() => useProviders());

    expect(result.current.isLoadingProviders).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    // Should have 2 providers (openai and gemini)
    expect(result.current.providers).toHaveLength(2);
    expect(result.current.providers[0].id).toBe('openai');
    expect(result.current.providers[1].id).toBe('gemini');
  });

  it('should mark providers as available based on API key storage', async () => {
    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    // OpenAI has a key, Gemini doesn't
    const openai = result.current.providers.find(p => p.id === 'openai');
    const gemini = result.current.providers.find(p => p.id === 'gemini');
    
    expect(openai.available).toBe(true);
    expect(gemini.available).toBe(false);
  });

  it('should set providerError when no providers have API keys', async () => {
    // Mock no API keys configured
    apiKeyStorage.has.mockReturnValue(false);

    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    expect(result.current.providerError).toContain('No API keys configured');
    expect(result.current.providersReady).toBe(false);
  });

  it('should load models when provider is selected', async () => {
    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    // Select a provider
    act(() => {
      result.current.setSelectedProvider('openai');
    });

    await waitFor(() => {
      expect(result.current.isLoadingModels).toBe(false);
    });

    expect(fetchProviderModels).toHaveBeenCalledWith('openai', 'sk-test-key');
    expect(result.current.models).toHaveLength(2);
  });

  it('should not load models for provider without API key', async () => {
    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    // Select gemini which has no API key
    act(() => {
      result.current.setSelectedProvider('gemini');
    });

    await waitFor(() => {
      expect(result.current.isLoadingModels).toBe(false);
    });

    expect(result.current.modelHint).toContain('API key not configured');
    expect(result.current.models).toEqual([]);
  });

  it('should expose rescanProviders function', async () => {
    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    expect(typeof result.current.rescanProviders).toBe('function');
  });

  it('should clear model when provider changes', async () => {
    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    act(() => {
      result.current.setSelectedProvider('openai');
    });

    await waitFor(() => {
      expect(result.current.models).toHaveLength(2);
    });

    act(() => {
      result.current.setSelectedModel('gpt-4o');
    });

    expect(result.current.selectedModel).toBe('gpt-4o');

    // Change provider
    act(() => {
      result.current.setSelectedProvider('gemini');
    });

    // Model should be cleared
    expect(result.current.selectedModel).toBe('');
  });

  it('should set first model as selected when models load', async () => {
    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    act(() => {
      result.current.setSelectedProvider('openai');
    });

    await waitFor(() => {
      expect(result.current.models).toHaveLength(2);
    });

    expect(result.current.selectedModel).toBe('gpt-4o');
  });

  it('should handle model fetch error gracefully', async () => {
    fetchProviderModels.mockRejectedValue(new Error('Model fetch failed'));

    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    act(() => {
      result.current.setSelectedProvider('openai');
    });

    await waitFor(() => {
      expect(result.current.isLoadingModels).toBe(false);
    });

    expect(result.current.modelHint).toContain('Failed to load models');
    expect(result.current.models).toEqual([]);
  });

  it('should return currentProvider and currentModel', async () => {
    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    act(() => {
      result.current.setSelectedProvider('openai');
    });

    await waitFor(() => {
      expect(result.current.models).toHaveLength(2);
    });

    expect(result.current.currentProvider).toBeTruthy();
    expect(result.current.currentProvider.id).toBe('openai');
    expect(result.current.currentModel).toBeTruthy();
    expect(result.current.currentModel.id).toBe('gpt-4o');
  });
});
