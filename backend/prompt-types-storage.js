/**
 * Prompt Types Storage Module
 * Manages custom prompt types with their system prompts
 */

const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const STORAGE_DIR = path.join(os.homedir(), '.prompt-assistant');
const PROMPT_TYPES_FILE = path.join(STORAGE_DIR, 'prompt-types.json');

// Default prompt types with their system prompts
const DEFAULT_PROMPT_TYPES = [
  {
    id: 'none',
    name: 'Generic',
    description: 'General-purpose prompt refinement with sensible defaults',
    icon: '✨',
    systemPrompt: '',
    builtin: true
  },
  {
    id: 'plan-architect',
    name: 'Plan / Architect',
    description: 'High-level system design, architecture decisions, and project planning',
    icon: '📐',
    systemPrompt: `Focus on architectural decisions and system design. When refining this prompt:
- Clarify the system scope and boundaries
- Identify key components and their responsibilities
- Consider scalability, maintainability, and performance
- Suggest relevant design patterns or architectural styles
- Include technology stack considerations if relevant`,
    builtin: true
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Information gathering, technology comparison, and learning exploration',
    icon: '🔍',
    systemPrompt: `Focus on research and information gathering. When refining this prompt:
- Clarify what information or comparisons are needed
- Identify criteria for evaluation if comparing options
- Structure the prompt to guide comprehensive research
- Include desired depth of analysis
- Suggest reliable sources or methodology if relevant`,
    builtin: true
  },
  {
    id: 'full-app-build',
    name: 'Full App Build',
    description: 'Complete application development from scratch with all components',
    icon: '🏗️',
    systemPrompt: `Focus on complete application development. When refining this prompt:
- Break down the application into clear components
- Specify technology stack and framework preferences
- Include architecture and file structure guidance
- Consider authentication, data storage, and API needs
- Clarify deployment and environment requirements`,
    builtin: true
  },
  {
    id: 'update-refactor',
    name: 'Update / Refactor',
    description: 'Modifying existing code, improving structure, or adding features',
    icon: '🔄',
    systemPrompt: `Focus on code modifications and refactoring. When refining this prompt:
- Identify what specific code or feature needs updating
- Clarify the goals (performance, maintainability, new feature, etc.)
- Preserve existing functionality and behavior
- Consider backward compatibility if relevant
- Include testing requirements for changes`,
    builtin: true
  },
  {
    id: 'bug-investigation-fix',
    name: 'Bug Investigation & Fix',
    description: 'Debugging, error analysis, and implementing fixes',
    icon: '🐛',
    systemPrompt: `Focus on bug identification and resolution. When refining this prompt:
- Clarify the specific symptoms and error messages
- Include reproduction steps if available
- Identify affected components or files
- Consider root cause analysis approach
- Include verification steps after the fix`,
    builtin: true
  },
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Reviewing code quality, suggesting improvements, and best practices',
    icon: '👀',
    systemPrompt: `Focus on code review and quality assessment. When refining this prompt:
- Specify what aspects to review (security, performance, style, etc.)
- Include relevant coding standards or style guides
- Clarify if looking for specific issues or general feedback
- Consider maintainability and readability
- Suggest actionable improvements`,
    builtin: true
  }
];

/**
 * Ensure storage directory exists
 */
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create storage directory:', error);
  }
}

/**
 * Load prompt types from disk
 * @returns {Promise<Array>} Array of prompt types
 */
async function loadPromptTypes() {
  try {
    await ensureStorageDir();
    const data = await fs.readFile(PROMPT_TYPES_FILE, 'utf8');
    const customTypes = JSON.parse(data);
    
    // Merge with defaults, keeping custom types
    const allTypes = [...DEFAULT_PROMPT_TYPES];
    customTypes.forEach(customType => {
      const existingIndex = allTypes.findIndex(t => t.id === customType.id);
      if (existingIndex >= 0) {
        // Update existing (allows overriding defaults)
        allTypes[existingIndex] = { ...allTypes[existingIndex], ...customType };
      } else {
        // Add new custom type
        allTypes.push({ ...customType, builtin: false });
      }
    });
    
    return allTypes;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return defaults
      return DEFAULT_PROMPT_TYPES;
    }
    console.error('Failed to load prompt types:', error);
    return DEFAULT_PROMPT_TYPES;
  }
}

/**
 * Save custom prompt types to disk
 * @param {Array} customTypes - Array of custom prompt types only
 */
async function saveCustomTypes(customTypes) {
  try {
    await ensureStorageDir();
    await fs.writeFile(
      PROMPT_TYPES_FILE,
      JSON.stringify(customTypes, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('Failed to save prompt types:', error);
    throw error;
  }
}

/**
 * Get all prompt types (built-in + custom)
 * @returns {Promise<Array>} All prompt types
 */
async function getAllPromptTypes() {
  return await loadPromptTypes();
}

/**
 * Get a single prompt type by ID
 * @param {string} id - Prompt type ID
 * @returns {Promise<Object|null>} Prompt type or null if not found
 */
async function getPromptType(id) {
  const types = await loadPromptTypes();
  return types.find(t => t.id === id) || null;
}

/**
 * Add a new custom prompt type
 * @param {Object} promptType - Prompt type data
 * @returns {Promise<Object>} Added prompt type
 */
async function addPromptType(promptType) {
  const types = await loadPromptTypes();
  
  // Check for duplicate ID
  if (types.some(t => t.id === promptType.id)) {
    throw new Error(`Prompt type with ID "${promptType.id}" already exists`);
  }
  
  const newType = {
    ...promptType,
    builtin: false
  };
  
  // Load custom types and add new one
  const customTypes = types.filter(t => !t.builtin);
  customTypes.push(newType);
  await saveCustomTypes(customTypes);
  
  return newType;
}

/**
 * Update an existing custom prompt type
 * @param {string} id - Prompt type ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated prompt type
 */
async function updatePromptType(id, updates) {
  const types = await loadPromptTypes();
  const type = types.find(t => t.id === id);
  
  if (!type) {
    throw new Error(`Prompt type "${id}" not found`);
  }
  
  if (type.builtin && updates.systemPrompt === undefined) {
    throw new Error('Cannot update built-in prompt type (except systemPrompt)');
  }
  
  // Update the type
  const updatedType = { ...type, ...updates, id: type.id, builtin: type.builtin };
  
  // Save custom types
  const customTypes = types
    .filter(t => !t.builtin || t.id === id)
    .map(t => t.id === id ? updatedType : t);
  
  await saveCustomTypes(customTypes);
  
  return updatedType;
}

/**
 * Delete a custom prompt type
 * @param {string} id - Prompt type ID to delete
 */
async function deletePromptType(id) {
  const types = await loadPromptTypes();
  const type = types.find(t => t.id === id);
  
  if (!type) {
    throw new Error(`Prompt type "${id}" not found`);
  }
  
  if (type.builtin) {
    throw new Error('Cannot delete built-in prompt types');
  }
  
  const customTypes = types.filter(t => !t.builtin && t.id !== id);
  await saveCustomTypes(customTypes);
}

/**
 * Reset a built-in prompt type to its default system prompt
 * @param {string} id - Prompt type ID
 * @returns {Promise<Object>} Reset prompt type
 */
async function resetPromptType(id) {
  const defaultType = DEFAULT_PROMPT_TYPES.find(t => t.id === id);
  
  if (!defaultType) {
    throw new Error(`Cannot reset: "${id}" is not a built-in prompt type`);
  }
  
  // Remove from custom types (restores default)
  const types = await loadPromptTypes();
  const customTypes = types.filter(t => !t.builtin && t.id !== id);
  await saveCustomTypes(customTypes);
  
  return defaultType;
}

module.exports = {
  getAllPromptTypes,
  getPromptType,
  addPromptType,
  updatePromptType,
  deletePromptType,
  resetPromptType,
  DEFAULT_PROMPT_TYPES
};
