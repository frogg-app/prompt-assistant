const fs = require("fs/promises");
const path = require("path");
const os = require("os");

const STORAGE_DIR = process.env.PROVIDERS_STORAGE_DIR || path.join(os.homedir(), ".prompt-assistant");
const STORAGE_FILE = path.join(STORAGE_DIR, "providers.json");

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
      env_var: "GH_TOKEN"
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

module.exports = {
  getAllProviders,
  getCustomProviders,
  getProvider,
  addProvider,
  updateProvider,
  deleteProvider,
  getFilteredModels,
  setFilteredModels,
  DEFAULT_PROVIDERS
};
