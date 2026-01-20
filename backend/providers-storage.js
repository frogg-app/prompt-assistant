const fs = require("fs/promises");
const path = require("path");
const os = require("os");

const STORAGE_DIR = process.env.PROVIDERS_STORAGE_DIR || path.join(os.homedir(), ".prompt-assistant");
const STORAGE_FILE = path.join(STORAGE_DIR, "providers.json");
const MODEL_CACHE_FILE = path.join(STORAGE_DIR, "model-cache.json");

// In-memory model cache (providerId -> { models: [], fetchedAt: timestamp })
const modelCache = new Map();

// Default built-in providers
const DEFAULT_PROVIDERS = [
  { 
    id: "openai", 
    name: "OpenAI", 
    supports_dynamic_models: true,
    builtin: true,
    config: {
      type: "api_key",
      env_var: "OPENAI_API_KEY"
    }
  },
  { 
    id: "gemini", 
    name: "Google Gemini", 
    supports_dynamic_models: true,
    builtin: true,
    config: {
      type: "api_key",
      env_var: "GEMINI_API_KEY"
    }
  },
  { 
    id: "copilot", 
    name: "Copilot CLI", 
    supports_dynamic_models: false,
    builtin: true,
    config: {
      type: "cli",
    }
  },
  { 
    id: "claude", 
    name: "Claude Code", 
    supports_dynamic_models: false,
    builtin: true,
    config: {
      type: "cli"
    }
  }
];

/**
 * Ensure storage directory and file exist
 */
async function ensureStorage() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    
    try {
      await fs.access(STORAGE_FILE);
    } catch {
      // File doesn't exist, create with default structure
      const initialData = {
        providers: [],
        filtered_models: {}
      };
      await fs.writeFile(STORAGE_FILE, JSON.stringify(initialData, null, 2));
    }
  } catch (error) {
    console.error("Failed to ensure storage:", error);
  }
}

/**
 * Read storage file
 */
async function readStorage() {
  try {
    await ensureStorage();
    const data = await fs.readFile(STORAGE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read storage:", error);
    return { providers: [], filtered_models: {} };
  }
}

/**
 * Write storage file
 */
async function writeStorage(data) {
  try {
    await ensureStorage();
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to write storage:", error);
    throw error;
  }
}

/**
 * Get all providers (built-in + custom)
 */
async function getAllProviders() {
  const storage = await readStorage();
  return [...DEFAULT_PROVIDERS, ...storage.providers];
}

/**
 * Get custom providers only
 */
async function getCustomProviders() {
  const storage = await readStorage();
  return storage.providers;
}

/**
 * Get a provider by ID
 */
async function getProvider(id) {
  const providers = await getAllProviders();
  return providers.find(p => p.id === id);
}

/**
 * Add a new custom provider
 */
async function addProvider(provider) {
  const storage = await readStorage();
  
  // Check if provider ID already exists
  const allProviders = await getAllProviders();
  if (allProviders.some(p => p.id === provider.id)) {
    throw new Error("Provider ID already exists");
  }
  
  // Add builtin flag as false for custom providers
  const newProvider = {
    ...provider,
    builtin: false,
    created_at: new Date().toISOString()
  };
  
  storage.providers.push(newProvider);
  await writeStorage(storage);
  
  return newProvider;
}

/**
 * Update a custom provider
 */
async function updateProvider(id, updates) {
  const storage = await readStorage();
  
  const index = storage.providers.findIndex(p => p.id === id);
  if (index === -1) {
    throw new Error("Provider not found or is built-in");
  }
  
  // Prevent changing ID and builtin status
  const { id: newId, builtin, created_at, ...allowedUpdates } = updates;
  
  storage.providers[index] = {
    ...storage.providers[index],
    ...allowedUpdates,
    updated_at: new Date().toISOString()
  };
  
  await writeStorage(storage);
  
  return storage.providers[index];
}

/**
 * Delete a custom provider
 */
async function deleteProvider(id) {
  const storage = await readStorage();
  
  const index = storage.providers.findIndex(p => p.id === id);
  if (index === -1) {
    throw new Error("Provider not found or is built-in");
  }
  
  storage.providers.splice(index, 1);
  
  // Also remove filtered models for this provider
  if (storage.filtered_models[id]) {
    delete storage.filtered_models[id];
  }
  
  await writeStorage(storage);
}

/**
 * Get filtered models for a provider
 */
async function getFilteredModels(providerId) {
  const storage = await readStorage();
  return storage.filtered_models[providerId] || null;
}

/**
 * Set filtered models for a provider
 */
async function setFilteredModels(providerId, modelIds) {
  const storage = await readStorage();
  
  if (!modelIds || modelIds.length === 0) {
    // Remove filter if empty
    delete storage.filtered_models[providerId];
  } else {
    storage.filtered_models[providerId] = modelIds;
  }
  
  await writeStorage(storage);
}

/**
 * Read model cache from disk
 */
async function readModelCache() {
  try {
    await ensureStorage();
    const data = await fs.readFile(MODEL_CACHE_FILE, "utf-8");
    const cache = JSON.parse(data);
    // Load into memory
    for (const [providerId, cacheData] of Object.entries(cache)) {
      modelCache.set(providerId, cacheData);
    }
    return cache;
  } catch (error) {
    return {};
  }
}

/**
 * Write model cache to disk
 */
async function writeModelCache() {
  try {
    await ensureStorage();
    const cacheObj = Object.fromEntries(modelCache);
    await fs.writeFile(MODEL_CACHE_FILE, JSON.stringify(cacheObj, null, 2));
  } catch (error) {
    console.error("Failed to write model cache:", error);
  }
}

/**
 * Get cached models for a provider
 * @param {string} providerId 
 * @returns {{ models: Array, fetchedAt: number } | null}
 */
function getCachedModels(providerId) {
  return modelCache.get(providerId) || null;
}

/**
 * Set cached models for a provider
 * @param {string} providerId 
 * @param {Array} models 
 */
async function setCachedModels(providerId, models) {
  modelCache.set(providerId, {
    models,
    fetchedAt: Date.now()
  });
  await writeModelCache();
}

/**
 * Clear cached models for a provider or all providers
 * @param {string} [providerId] - If not provided, clears all caches
 */
async function clearModelCache(providerId) {
  if (providerId) {
    modelCache.delete(providerId);
  } else {
    modelCache.clear();
  }
  await writeModelCache();
}

/**
 * Check if cache is stale (older than 24 hours by default)
 * @param {string} providerId 
 * @param {number} maxAgeMs - Max age in milliseconds (default: 24 hours)
 * @returns {boolean}
 */
function isCacheStale(providerId, maxAgeMs = 24 * 60 * 60 * 1000) {
  const cached = modelCache.get(providerId);
  if (!cached) return true;
  return Date.now() - cached.fetchedAt > maxAgeMs;
}

// Initialize cache from disk on module load
readModelCache().catch(err => console.error("Failed to initialize model cache:", err));

module.exports = {
  getAllProviders,
  getCustomProviders,
  getProvider,
  addProvider,
  updateProvider,
  deleteProvider,
  getFilteredModels,
  setFilteredModels,
  getCachedModels,
  setCachedModels,
  clearModelCache,
  isCacheStale,
  DEFAULT_PROVIDERS
};
