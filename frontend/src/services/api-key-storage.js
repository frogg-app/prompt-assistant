/**
 * API Key Storage Service
 * Manages API keys in localStorage for frontend-only API calls
 * 
 * Security considerations:
 * - Keys are stored in localStorage which is accessible to JavaScript
 * - This is suitable for personal/self-hosted use where users manage their own keys
 * - For production multi-user apps, keys should be stored server-side with encryption
 * - Keys are stored with a simple obfuscation (not encryption) to prevent casual viewing
 */

const STORAGE_KEY_PREFIX = 'prompt-assistant-api-key-';

/**
 * Simple obfuscation for localStorage storage
 * This is NOT encryption - just basic obfuscation to prevent casual viewing
 * For sensitive production use, consider proper encryption or server-side storage
 */
function obfuscate(value) {
  if (!value) return '';
  // Base64 encode with a simple transform
  const encoded = btoa(value);
  return encoded.split('').reverse().join('');
}

function deobfuscate(value) {
  if (!value) return '';
  try {
    // Reverse the transform and decode
    const reversed = value.split('').reverse().join('');
    return atob(reversed);
  } catch {
    // If decode fails, return empty (corrupted data)
    return '';
  }
}

/**
 * Get the storage key for a provider
 * @param {string} providerId - The provider ID
 * @returns {string} The storage key
 */
function getStorageKey(providerId) {
  return `${STORAGE_KEY_PREFIX}${providerId}`;
}

/**
 * Save an API key for a provider
 * @param {string} providerId - The provider ID
 * @param {string} apiKey - The API key
 */
export function saveApiKey(providerId, apiKey) {
  if (!providerId) return;
  
  const key = getStorageKey(providerId);
  
  if (!apiKey) {
    localStorage.removeItem(key);
    return;
  }
  
  const obfuscated = obfuscate(apiKey);
  localStorage.setItem(key, obfuscated);
}

/**
 * Get an API key for a provider
 * @param {string} providerId - The provider ID
 * @returns {string} The API key or empty string if not found
 */
export function getApiKey(providerId) {
  if (!providerId) return '';
  
  const key = getStorageKey(providerId);
  const stored = localStorage.getItem(key);
  
  if (!stored) return '';
  
  return deobfuscate(stored);
}

/**
 * Check if an API key exists for a provider
 * @param {string} providerId - The provider ID
 * @returns {boolean} True if a key exists
 */
export function hasApiKey(providerId) {
  return Boolean(getApiKey(providerId));
}

/**
 * Remove an API key for a provider
 * @param {string} providerId - The provider ID
 */
export function removeApiKey(providerId) {
  if (!providerId) return;
  
  const key = getStorageKey(providerId);
  localStorage.removeItem(key);
}

/**
 * Get all stored provider IDs that have API keys
 * @returns {Array<string>} List of provider IDs with stored keys
 */
export function getStoredProviderIds() {
  const providers = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      const providerId = key.replace(STORAGE_KEY_PREFIX, '');
      if (providerId) {
        providers.push(providerId);
      }
    }
  }
  
  return providers;
}

/**
 * Clear all stored API keys
 */
export function clearAllApiKeys() {
  const keys = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  
  keys.forEach(key => localStorage.removeItem(key));
}

/**
 * API Key Storage service object
 */
export const apiKeyStorage = {
  save: saveApiKey,
  get: getApiKey,
  has: hasApiKey,
  remove: removeApiKey,
  getStoredProviderIds,
  clearAll: clearAllApiKeys
};
