/**
 * Provider Dispatcher
 * Routes API calls to the appropriate LLM service
 */

import { openaiService } from './openai';
import { geminiService } from './gemini';

/**
 * Map of provider IDs to their services
 */
const PROVIDER_SERVICES = {
  openai: openaiService,
  gemini: geminiService
};

/**
 * Get the service for a provider
 * @param {string} providerId - The provider ID
 * @returns {Object|null} The provider service or null if not found
 */
export function getProviderService(providerId) {
  return PROVIDER_SERVICES[providerId] || null;
}

/**
 * Check if a provider is supported for frontend-only API calls
 * @param {string} providerId - The provider ID
 * @returns {boolean} True if the provider is supported
 */
export function isFrontendProvider(providerId) {
  return providerId in PROVIDER_SERVICES;
}

/**
 * Get list of all frontend-supported providers
 * @returns {Array} List of provider info objects
 */
export function getFrontendProviders() {
  return Object.values(PROVIDER_SERVICES).map(service => ({
    id: service.id,
    name: service.name
  }));
}

/**
 * Call a provider's API for prompt improvement
 * @param {Object} params - The call parameters
 * @returns {Promise<Object>} The response
 */
export async function callProvider({
  providerId,
  apiKey,
  model,
  roughPrompt,
  constraints = [],
  learningMode = false,
  clarifications = null,
  promptTypeSystemPrompt = ''
}) {
  const service = getProviderService(providerId);
  
  if (!service) {
    throw new Error(`Provider "${providerId}" is not supported for frontend API calls. CLI-based providers require backend support.`);
  }

  return service.callAPI({
    apiKey,
    model,
    roughPrompt,
    constraints,
    learningMode,
    clarifications,
    promptTypeSystemPrompt
  });
}

/**
 * Fetch models for a provider
 * @param {string} providerId - The provider ID
 * @param {string} apiKey - The API key
 * @returns {Promise<Array>} List of models
 */
export async function fetchProviderModels(providerId, apiKey) {
  const service = getProviderService(providerId);
  
  if (!service) {
    return [];
  }

  return service.fetchModels(apiKey);
}

/**
 * Test a provider's API key
 * @param {string} providerId - The provider ID
 * @param {string} apiKey - The API key to test
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function testProviderApiKey(providerId, apiKey) {
  const service = getProviderService(providerId);
  
  if (!service) {
    return { valid: false, error: 'Provider not supported' };
  }

  return service.testApiKey(apiKey);
}
