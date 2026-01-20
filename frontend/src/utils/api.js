/**
 * API Utilities
 * Functions for communicating with the backend API
 */

import { API_BASE } from './constants';

/**
 * Fetch available providers from the API
 * @returns {Promise<{providers: Array, hasAvailable: boolean}>}
 */
export async function fetchProviders() {
  const response = await fetch(`${API_BASE}/providers`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch providers');
  }
  
  const data = await response.json();
  const providers = data.providers || [];
  const hasAvailable = providers.some(p => p.available);
  
  return { providers, hasAvailable };
}

/**
 * Fetch available models for a specific provider
 * @param {string} providerId - The provider ID
 * @param {boolean} forceRefresh - Whether to bypass cache
 * @returns {Promise<{models: Array, note: string, isDynamic: boolean}>}
 */
export async function fetchModels(providerId, forceRefresh = false) {
  if (!providerId) {
    return { models: [], note: '', isDynamic: false };
  }
  
  const params = new URLSearchParams({ provider: providerId });
  if (forceRefresh) {
    params.set('refresh', 'true');
  }
  
  const response = await fetch(`${API_BASE}/models?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  
  const data = await response.json();
  
  return {
    models: data.models || [],
    note: data.note || '',
    isDynamic: data.is_dynamic !== false
  };
}

/**
 * Rescan all providers to refresh model lists
 * @returns {Promise<Object>} Rescan results
 */
export async function rescanProviders() {
  const response = await fetch(`${API_BASE}/providers/rescan`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error('Failed to rescan providers');
  }
  
  return response.json();
}

/**
 * Send a prompt improvement request
 * @param {Object} payload - The request payload
 * @returns {Promise<Object>} The improvement result
 */
export async function improvePrompt(payload) {
  // Transform the new payload format to the legacy backend format
  const backendPayload = transformPayloadForBackend(payload);
  
  const response = await fetch(`${API_BASE}/improve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backendPayload)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

/**
 * Transform the new payload format to the legacy backend format
 * @param {Object} payload - The new format payload
 * @returns {Object} The legacy format payload
 */
function transformPayloadForBackend(payload) {
  const {
    roughPrompt,
    promptType,
    constraints = [],
    model,
    options = {},
    clarifications
  } = payload;
  
  // Convert structured constraints to a string format for the backend
  const constraintsString = constraints.length > 0
    ? constraints.map(c => {
        const typeLabel = c.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `${typeLabel}: ${c.description}`;
      }).join('; ')
    : '';
  
  // Build the legacy format payload
  const backendPayload = {
    provider: model?.provider,
    model: model?.name,
    rough_prompt: roughPrompt,
    constraints: constraintsString,
    learning_mode: options.learningMode ?? false,
    prompt_type: promptType || 'none'
  };
  
  // Add clarifications if provided
  if (clarifications) {
    backendPayload.clarifications = clarifications;
  }
  
  return backendPayload;
}

/**
 * Transform backend response to the new format
 * @param {Object} response - Backend response
 * @returns {Object} Transformed response
 */
export function transformResponse(response) {
  return {
    needsClarification: Boolean(response.needs_clarification),
    clarifications: response.clarifications || [],
    improvedPrompt: response.improved_prompt || '',
    isAlreadyExcellent: Boolean(response.is_already_excellent),
    excellenceReason: response.excellence_reason || null,
    assumptions: response.assumptions || [],
    learningReport: response.learning_report || null
  };
}
