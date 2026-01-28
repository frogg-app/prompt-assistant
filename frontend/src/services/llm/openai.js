/**
 * OpenAI Service
 * Direct API calls to OpenAI from the frontend
 */

import { getFullSystemPrompt, buildUserContent, safeJsonParse, formatConstraints } from './common';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

/**
 * Fallback model list when API fails
 */
const FALLBACK_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { id: 'gpt-4', label: 'GPT-4' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { id: 'o1', label: 'O1' },
  { id: 'o1-mini', label: 'O1 Mini' },
  { id: 'o1-preview', label: 'O1 Preview' }
];

/**
 * Fetch available models from OpenAI
 * @param {string} apiKey - The OpenAI API key
 * @returns {Promise<Array>} List of available models
 */
async function fetchModels(apiKey) {
  if (!apiKey) {
    return FALLBACK_MODELS;
  }

  try {
    const response = await fetch(`${OPENAI_API_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAI models request failed: ${response.status}`);
    }

    const data = await response.json();
    const models = Array.isArray(data.data) ? data.data : [];
    
    const filtered = models
      .map(model => model.id)
      .filter(id => typeof id === 'string' && /^(gpt|o1)/.test(id))
      .sort((a, b) => a.localeCompare(b))
      .map(id => ({ id, label: id }));

    return filtered.length ? filtered : FALLBACK_MODELS;
  } catch (error) {
    console.warn('Failed to fetch OpenAI models:', error);
    return FALLBACK_MODELS;
  }
}

/**
 * Call OpenAI API for prompt improvement
 * @param {Object} params - The call parameters
 * @returns {Promise<Object>} The parsed response
 */
async function callAPI({
  apiKey,
  model,
  roughPrompt,
  constraints = [],
  learningMode = false,
  clarifications = null,
  promptTypeSystemPrompt = ''
}) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const systemPrompt = getFullSystemPrompt(promptTypeSystemPrompt);
  const constraintsString = formatConstraints(constraints);
  const userContent = buildUserContent({
    roughPrompt,
    constraints: constraintsString,
    learningMode,
    clarifications
  });

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const trimmed = content.trim();

  const parsed = safeJsonParse(trimmed);
  if (!parsed.ok) {
    console.error('OpenAI returned invalid JSON:', trimmed.substring(0, 500));
    throw new Error('OpenAI returned invalid JSON response');
  }

  return parsed.value;
}

/**
 * Test if an API key is valid
 * @param {string} apiKey - The API key to test
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function testApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  try {
    const response = await fetch(`${OPENAI_API_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }

    return { valid: false, error: `API returned status ${response.status}` };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * OpenAI service object
 */
export const openaiService = {
  id: 'openai',
  name: 'OpenAI',
  fetchModels,
  callAPI,
  testApiKey,
  fallbackModels: FALLBACK_MODELS
};
