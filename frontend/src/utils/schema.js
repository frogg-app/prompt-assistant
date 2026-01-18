/**
 * Schema Utilities
 * Functions for building and exporting the prompt payload
 */

import { MODEL_DISPLAY_NAMES } from './constants';

/**
 * Generate a unique ID
 * @returns {string} A unique identifier
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the display name and version for a model
 * @param {string} modelId - The model ID
 * @param {string} modelLabel - The model label from API
 * @returns {{name: string, version: string, displayName: string}}
 */
export function getModelDisplayInfo(modelId, modelLabel = '') {
  const mapping = MODEL_DISPLAY_NAMES[modelId];
  
  if (mapping) {
    const displayName = mapping.version 
      ? `${mapping.name} ${mapping.version}` 
      : mapping.name;
    return {
      name: mapping.name,
      version: mapping.version,
      displayName
    };
  }
  
  // Fallback: use the label or ID
  const fallbackName = modelLabel || modelId;
  return {
    name: fallbackName,
    version: '',
    displayName: fallbackName
  };
}

/**
 * Build a complete prompt payload
 * @param {Object} params - The payload parameters
 * @returns {Object} The complete payload
 */
export function buildPayload({
  roughPrompt,
  promptType = 'none',
  constraints = [],
  model,
  options = {},
  uiState = {},
  clarifications = null
}) {
  const modelInfo = getModelDisplayInfo(model?.name, model?.label);
  
  const payload = {
    roughPrompt: roughPrompt?.trim() || '',
    promptType,
    constraints: constraints.map(c => ({
      id: c.id || generateId(),
      type: c.type,
      description: c.description
    })),
    model: {
      provider: model?.provider || '',
      name: model?.name || '',
      version: modelInfo.version,
      displayName: modelInfo.displayName
    },
    options: {
      learningMode: Boolean(options.learningMode),
      autoCopy: Boolean(options.autoCopy)
    },
    uiState: {
      inspectorCollapsed: Boolean(uiState.inspectorCollapsed),
      theme: uiState.theme || 'system',
      lastUpdated: new Date().toISOString()
    }
  };
  
  if (clarifications) {
    payload.clarifications = clarifications;
  }
  
  return payload;
}

/**
 * Validate a payload against the schema
 * @param {Object} payload - The payload to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validatePayload(payload) {
  const errors = [];
  
  // Required: roughPrompt
  if (!payload.roughPrompt || typeof payload.roughPrompt !== 'string') {
    errors.push('roughPrompt is required and must be a string');
  } else if (payload.roughPrompt.trim().length === 0) {
    errors.push('roughPrompt cannot be empty');
  }
  
  // Required: model
  if (!payload.model) {
    errors.push('model is required');
  } else {
    if (!payload.model.provider) {
      errors.push('model.provider is required');
    }
    if (!payload.model.name) {
      errors.push('model.name is required');
    }
  }
  
  // Optional: promptType validation
  const validPromptTypes = [
    'none', 'plan-architect', 'research', 'full-app-build',
    'update-refactor', 'bug-investigation-fix', 'code-review'
  ];
  if (payload.promptType && !validPromptTypes.includes(payload.promptType)) {
    errors.push(`promptType must be one of: ${validPromptTypes.join(', ')}`);
  }
  
  // Optional: constraints validation
  const validConstraintTypes = [
    'tone', 'length', 'output-format', 'language', 'architecture',
    'testing-requirements', 'error-handling', 'security-privacy',
    'performance', 'documentation', 'dependencies', 'accessibility',
    'compatibility', 'custom'
  ];
  if (payload.constraints && Array.isArray(payload.constraints)) {
    payload.constraints.forEach((c, i) => {
      if (!c.type) {
        errors.push(`constraints[${i}].type is required`);
      } else if (!validConstraintTypes.includes(c.type)) {
        errors.push(`constraints[${i}].type must be one of: ${validConstraintTypes.join(', ')}`);
      }
      if (!c.description || typeof c.description !== 'string') {
        errors.push(`constraints[${i}].description is required`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Export payload as a JSON file download
 * @param {Object} payload - The payload to export
 * @param {string} filename - Optional filename
 */
export function exportPayloadAsJSON(payload, filename = 'prompt-payload.json') {
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy payload JSON to clipboard
 * @param {Object} payload - The payload to copy
 * @returns {Promise<boolean>} Whether the copy succeeded
 */
export async function copyPayloadToClipboard(payload) {
  try {
    const jsonString = JSON.stringify(payload, null, 2);
    await navigator.clipboard.writeText(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse a JSON payload from string
 * @param {string} jsonString - The JSON string to parse
 * @returns {{payload: Object|null, error: string|null}}
 */
export function parsePayload(jsonString) {
  try {
    const payload = JSON.parse(jsonString);
    const validation = validatePayload(payload);
    
    if (!validation.valid) {
      return { payload: null, error: validation.errors.join('; ') };
    }
    
    return { payload, error: null };
  } catch (e) {
    return { payload: null, error: 'Invalid JSON format' };
  }
}

/**
 * Alias for buildPayload for backward compatibility
 */
export const buildPromptPayload = buildPayload;
