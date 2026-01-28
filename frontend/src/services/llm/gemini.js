/**
 * Gemini Service
 * Direct API calls to Google's Gemini from the frontend
 */

import { getFullSystemPrompt, buildUserContent, safeJsonParse, formatConstraints } from './common';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Fallback model list when API fails
 */
const FALLBACK_MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' }
];

/**
 * Fetch available models from Gemini
 * @param {string} apiKey - The Gemini API key
 * @returns {Promise<Array>} List of available models
 */
async function fetchModels(apiKey) {
  if (!apiKey) {
    return FALLBACK_MODELS;
  }

  try {
    const response = await fetch(`${GEMINI_API_BASE}/models?key=${apiKey}`);

    if (!response.ok) {
      throw new Error(`Gemini models request failed: ${response.status}`);
    }

    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models : [];
    
    const filtered = models
      .filter(model =>
        (model.supportedGenerationMethods || []).includes('generateContent')
      )
      .map(model => {
        const name = model.name || '';
        const id = name.includes('/') ? name.split('/').pop() : name;
        if (!id || !id.includes('gemini')) {
          return null;
        }
        const label = model.displayName ? `${model.displayName} (${id})` : id;
        return { id, label };
      })
      .filter(Boolean);

    return filtered.length ? filtered : FALLBACK_MODELS;
  } catch (error) {
    console.warn('Failed to fetch Gemini models:', error);
    return FALLBACK_MODELS;
  }
}

/**
 * Call Gemini API for prompt improvement
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
    throw new Error('Gemini API key is required');
  }

  const systemPrompt = getFullSystemPrompt(promptTypeSystemPrompt);
  const constraintsString = formatConstraints(constraints);
  const userContent = buildUserContent({
    roughPrompt,
    constraints: constraintsString,
    learningMode,
    clarifications
  });

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userContent }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const content =
    data.candidates?.[0]?.content?.parts?.map(part => part.text).join('') || '';
  const trimmed = content.trim();

  const parsed = safeJsonParse(trimmed);
  if (!parsed.ok) {
    console.error('Gemini returned invalid JSON:', trimmed.substring(0, 500));
    throw new Error('Gemini returned invalid JSON response');
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
    const response = await fetch(`${GEMINI_API_BASE}/models?key=${apiKey}`);

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 400 || response.status === 403) {
      return { valid: false, error: 'Invalid API key' };
    }

    return { valid: false, error: `API returned status ${response.status}` };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Gemini service object
 */
export const geminiService = {
  id: 'gemini',
  name: 'Google Gemini',
  fetchModels,
  callAPI,
  testApiKey,
  fallbackModels: FALLBACK_MODELS
};
