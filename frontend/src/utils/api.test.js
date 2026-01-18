/**
 * API Utilities Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchProviders, fetchModels, improvePrompt } from './api';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('fetchProviders', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch and return providers list', async () => {
    const mockProviders = {
      providers: [
        { id: 'openai', name: 'OpenAI', available: true },
        { id: 'claude', name: 'Claude', available: false }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProviders
    });

    const result = await fetchProviders();
    
    expect(mockFetch).toHaveBeenCalledWith('/providers');
    expect(result.providers).toHaveLength(2);
    expect(result.hasAvailable).toBe(true);
  });

  it('should return hasAvailable false when no providers are available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        providers: [
          { id: 'openai', name: 'OpenAI', available: false }
        ]
      })
    });

    const result = await fetchProviders();
    expect(result.hasAvailable).toBe(false);
  });

  it('should throw error on failed request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    await expect(fetchProviders()).rejects.toThrow('Failed to fetch providers');
  });

  it('should handle empty providers array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ providers: [] })
    });

    const result = await fetchProviders();
    expect(result.providers).toEqual([]);
    expect(result.hasAvailable).toBe(false);
  });
});

describe('fetchModels', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch models for a provider', async () => {
    const mockModels = {
      models: [
        { id: 'gpt-4o', label: 'GPT-4o' },
        { id: 'gpt-4o-mini', label: 'GPT-4o Mini' }
      ],
      note: 'Dynamic models',
      is_dynamic: true
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockModels
    });

    const result = await fetchModels('openai');
    
    expect(mockFetch).toHaveBeenCalledWith('/models?provider=openai');
    expect(result.models).toHaveLength(2);
    expect(result.isDynamic).toBe(true);
  });

  it('should return empty result for empty providerId', async () => {
    const result = await fetchModels('');
    
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.models).toEqual([]);
    expect(result.isDynamic).toBe(false);
  });

  it('should return empty result for null providerId', async () => {
    const result = await fetchModels(null);
    
    expect(result.models).toEqual([]);
  });

  it('should throw error on failed request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    await expect(fetchModels('unknown')).rejects.toThrow('Failed to fetch models');
  });
});

describe('improvePrompt', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should send improvement request and return result', async () => {
    const mockResponse = {
      needs_clarification: false,
      improved_prompt: 'Improved version of the prompt',
      assumptions: ['Assumption 1']
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const payload = {
      roughPrompt: 'Test prompt',
      model: { provider: 'claude', name: 'sonnet' }
    };

    const result = await improvePrompt(payload);
    
    expect(mockFetch).toHaveBeenCalledWith('/improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String)
    });
    expect(result.improved_prompt).toBe('Improved version of the prompt');
  });

  it('should throw error with message from response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid request format' })
    });

    await expect(improvePrompt({})).rejects.toThrow('Invalid request format');
  });

  it('should throw generic error when no error message in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    await expect(improvePrompt({})).rejects.toThrow('Request failed');
  });

  it('should handle JSON parse error in error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => { throw new Error('Parse error'); }
    });

    await expect(improvePrompt({})).rejects.toThrow('Request failed');
  });
});
