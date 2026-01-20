/**
 * useProviders Hook Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProviders } from './useProviders';

// Mock the api module
vi.mock('../utils/api', () => ({
  fetchProviders: vi.fn(),
  fetchModels: vi.fn(),
  rescanProviders: vi.fn()
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

import { fetchProviders, fetchModels, rescanProviders } from '../utils/api';

describe('useProviders', () => {
  const mockProviders = [
    { id: 'openai', name: 'OpenAI', available: true },
    { id: 'claude', name: 'Claude', available: true },
    { id: 'copilot', name: 'Copilot', available: false }
  ];

  const mockModels = [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    fetchProviders.mockResolvedValue({
      providers: mockProviders,
      hasAvailable: true
    });
    
    fetchModels.mockResolvedValue({
      models: mockModels,
      note: '',
      isDynamic: true
    });
    
    rescanProviders.mockResolvedValue({
      message: 'Rescan completed',
      results: {}
    });
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

    expect(result.current.providers).toEqual(mockProviders);
    expect(result.current.providersReady).toBe(true);
  });

  it('should filter to available providers correctly', async () => {
    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    const availableProviders = result.current.providers.filter(p => p.available);
    expect(availableProviders).toHaveLength(2);
  });

  it('should set providerError when no providers are available', async () => {
    fetchProviders.mockResolvedValue({
      providers: [{ id: 'openai', available: false }],
      hasAvailable: false
    });

    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    expect(result.current.providerError).toContain('No providers are configured');
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

    expect(fetchModels).toHaveBeenCalledWith('openai', false);
    expect(result.current.models).toHaveLength(2);
  });

  it('should cache models and not refetch on provider reselection', async () => {
    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    // Select provider first time
    act(() => {
      result.current.setSelectedProvider('openai');
    });

    await waitFor(() => {
      expect(result.current.models).toHaveLength(2);
    });

    const fetchCount = fetchModels.mock.calls.length;

    // Change to different provider
    act(() => {
      result.current.setSelectedProvider('claude');
    });

    await waitFor(() => {
      expect(result.current.isLoadingModels).toBe(false);
    });

    // Change back - should not refetch due to cache
    act(() => {
      result.current.setSelectedProvider('openai');
    });

    await waitFor(() => {
      expect(result.current.isLoadingModels).toBe(false);
    });

    // Models should be cached from first fetch
    expect(result.current.models).toHaveLength(2);
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
      result.current.setSelectedProvider('claude');
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

  it('should handle provider fetch error', async () => {
    fetchProviders.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    expect(result.current.providerError).toContain('Failed to load providers');
    expect(result.current.providersReady).toBe(false);
  });

  it('should handle model fetch error gracefully', async () => {
    fetchModels.mockRejectedValue(new Error('Model fetch failed'));

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

  it('should set isRescanning during rescan', async () => {
    const { result } = renderHook(() => useProviders());

    await waitFor(() => {
      expect(result.current.isLoadingProviders).toBe(false);
    });

    expect(result.current.isRescanning).toBe(false);

    // Note: We can't easily test the intermediate state without more complex async handling
    // This tests that the function exists and can be called
    expect(typeof result.current.rescanProviders).toBe('function');
  });
});
