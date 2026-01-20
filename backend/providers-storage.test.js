/**
 * Providers Storage Tests
 */

const { describe, it, expect, beforeEach, afterEach, vi } = require('vitest');

// Mock fs/promises before importing the module
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined)
}));

const fs = require('fs/promises');

describe('providers-storage', () => {
  let providersStorage;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset module cache to get fresh instance
    vi.resetModules();
    
    // Default mock for storage file
    fs.readFile.mockResolvedValue(JSON.stringify({
      providers: [],
      filtered_models: {}
    }));
    
    // Import fresh module
    providersStorage = await import('./providers-storage');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllProviders', () => {
    it('should return default providers when storage is empty', async () => {
      const providers = await providersStorage.getAllProviders();
      
      expect(providers).toContainEqual(expect.objectContaining({ id: 'openai' }));
      expect(providers).toContainEqual(expect.objectContaining({ id: 'gemini' }));
      expect(providers).toContainEqual(expect.objectContaining({ id: 'copilot' }));
      expect(providers).toContainEqual(expect.objectContaining({ id: 'claude' }));
    });

    it('should include custom providers from storage', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify({
        providers: [
          { id: 'custom-1', name: 'Custom Provider', builtin: false }
        ],
        filtered_models: {}
      }));

      const providers = await providersStorage.getAllProviders();
      
      expect(providers).toContainEqual(expect.objectContaining({ id: 'custom-1' }));
    });
  });

  describe('getProvider', () => {
    it('should return built-in provider by id', async () => {
      const provider = await providersStorage.getProvider('openai');
      
      expect(provider).toBeDefined();
      expect(provider.id).toBe('openai');
      expect(provider.builtin).toBe(true);
    });

    it('should return custom provider by id', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify({
        providers: [
          { id: 'my-custom', name: 'My Custom', builtin: false }
        ],
        filtered_models: {}
      }));

      const provider = await providersStorage.getProvider('my-custom');
      
      expect(provider).toBeDefined();
      expect(provider.id).toBe('my-custom');
    });

    it('should return undefined for unknown provider', async () => {
      const provider = await providersStorage.getProvider('unknown');
      
      expect(provider).toBeUndefined();
    });
  });

  describe('addProvider', () => {
    it('should add a new custom provider', async () => {
      const newProvider = {
        id: 'new-provider',
        name: 'New Provider',
        config: { type: 'api_key' }
      };

      const result = await providersStorage.addProvider(newProvider);
      
      expect(result.id).toBe('new-provider');
      expect(result.builtin).toBe(false);
      expect(result.created_at).toBeDefined();
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw error if provider ID already exists', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify({
        providers: [
          { id: 'existing', name: 'Existing', builtin: false }
        ],
        filtered_models: {}
      }));

      await expect(providersStorage.addProvider({ id: 'existing', name: 'Duplicate' }))
        .rejects.toThrow('Provider ID already exists');
    });

    it('should throw error for built-in provider ID', async () => {
      await expect(providersStorage.addProvider({ id: 'openai', name: 'Fake OpenAI' }))
        .rejects.toThrow('Provider ID already exists');
    });
  });

  describe('deleteProvider', () => {
    it('should delete a custom provider', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify({
        providers: [
          { id: 'to-delete', name: 'To Delete', builtin: false }
        ],
        filtered_models: { 'to-delete': ['model1', 'model2'] }
      }));

      await providersStorage.deleteProvider('to-delete');
      
      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = fs.writeFile.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1]);
      
      expect(writtenData.providers).not.toContainEqual(
        expect.objectContaining({ id: 'to-delete' })
      );
      expect(writtenData.filtered_models['to-delete']).toBeUndefined();
    });

    it('should throw error for non-existent provider', async () => {
      await expect(providersStorage.deleteProvider('unknown'))
        .rejects.toThrow('Provider not found or is built-in');
    });
  });

  describe('getFilteredModels', () => {
    it('should return filtered models for provider', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify({
        providers: [],
        filtered_models: {
          openai: ['gpt-4o', 'gpt-4o-mini']
        }
      }));

      const filtered = await providersStorage.getFilteredModels('openai');
      
      expect(filtered).toEqual(['gpt-4o', 'gpt-4o-mini']);
    });

    it('should return null when no filter is set', async () => {
      const filtered = await providersStorage.getFilteredModels('openai');
      
      expect(filtered).toBeNull();
    });
  });

  describe('setFilteredModels', () => {
    it('should save filtered models for provider', async () => {
      await providersStorage.setFilteredModels('openai', ['gpt-4o']);
      
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should remove filter when empty array is provided', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify({
        providers: [],
        filtered_models: {
          openai: ['gpt-4o']
        }
      }));

      await providersStorage.setFilteredModels('openai', []);
      
      const writeCall = fs.writeFile.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1]);
      
      expect(writtenData.filtered_models.openai).toBeUndefined();
    });
  });

  describe('Model Cache', () => {
    it('should return null for uncached provider', () => {
      const cached = providersStorage.getCachedModels('uncached');
      expect(cached).toBeNull();
    });

    it('should cache and retrieve models', async () => {
      const models = [{ id: 'model1', label: 'Model 1' }];
      
      await providersStorage.setCachedModels('test-provider', models);
      
      const cached = providersStorage.getCachedModels('test-provider');
      
      expect(cached).toBeDefined();
      expect(cached.models).toEqual(models);
      expect(cached.fetchedAt).toBeDefined();
    });

    it('should report cache as stale after max age', async () => {
      const models = [{ id: 'model1' }];
      await providersStorage.setCachedModels('stale-test', models);
      
      // Cache should not be stale immediately
      expect(providersStorage.isCacheStale('stale-test')).toBe(false);
      
      // With 0ms max age, cache should be stale
      expect(providersStorage.isCacheStale('stale-test', 0)).toBe(true);
    });

    it('should report uncached provider as stale', () => {
      expect(providersStorage.isCacheStale('never-cached')).toBe(true);
    });

    it('should clear specific provider cache', async () => {
      await providersStorage.setCachedModels('provider1', [{ id: 'm1' }]);
      await providersStorage.setCachedModels('provider2', [{ id: 'm2' }]);
      
      await providersStorage.clearModelCache('provider1');
      
      expect(providersStorage.getCachedModels('provider1')).toBeNull();
      expect(providersStorage.getCachedModels('provider2')).not.toBeNull();
    });

    it('should clear all caches when no provider specified', async () => {
      await providersStorage.setCachedModels('provider1', [{ id: 'm1' }]);
      await providersStorage.setCachedModels('provider2', [{ id: 'm2' }]);
      
      await providersStorage.clearModelCache();
      
      expect(providersStorage.getCachedModels('provider1')).toBeNull();
      expect(providersStorage.getCachedModels('provider2')).toBeNull();
    });
  });
});
