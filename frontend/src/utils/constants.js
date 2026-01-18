/**
 * Application Constants
 * Central location for all constant values used throughout the application
 */

// API Configuration
export const API_BASE = import.meta.env.VITE_API_BASE || '';

// Prompt Types with metadata
export const PROMPT_TYPES = [
  {
    id: 'none',
    label: 'None',
    description: 'No specific prompt type (default)',
    icon: 'Circle'
  },
  {
    id: 'plan-architect',
    label: 'Plan / Architect',
    description: 'High-level system design, architecture decisions, technical planning',
    icon: 'Compass'
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Information gathering, exploration, learning about topics',
    icon: 'Search'
  },
  {
    id: 'full-app-build',
    label: 'Full App Build',
    description: 'Complete application development from scratch',
    icon: 'Rocket'
  },
  {
    id: 'update-refactor',
    label: 'Update / Refactor',
    description: 'Modifying existing code, improving structure, upgrading dependencies',
    icon: 'RefreshCw'
  },
  {
    id: 'bug-investigation-fix',
    label: 'Bug Investigation & Fix',
    description: 'Debugging, root cause analysis, implementing fixes',
    icon: 'Bug'
  },
  {
    id: 'code-review',
    label: 'Code Review',
    description: 'Reviewing code for quality, security, best practices',
    icon: 'CheckSquare'
  }
];

// Constraint Types with metadata
export const CONSTRAINT_TYPES = [
  {
    id: 'tone',
    label: 'Tone',
    description: 'Voice and style of output',
    icon: 'MessageCircle',
    placeholder: 'e.g., Professional and concise, Friendly and casual',
    examples: ['Professional and formal', 'Casual and friendly', 'Technical and precise']
  },
  {
    id: 'length',
    label: 'Length',
    description: 'Output length requirements',
    icon: 'Ruler',
    placeholder: 'e.g., Maximum 500 words, Brief summary',
    examples: ['Under 200 words', 'Comprehensive (1000+ words)', '3-5 bullet points']
  },
  {
    id: 'output-format',
    label: 'Output Format',
    description: 'Structure and format of response',
    icon: 'FileText',
    placeholder: 'e.g., Markdown with code blocks, JSON response',
    examples: ['Markdown with headers', 'JSON schema', 'Numbered list', 'Table format']
  },
  {
    id: 'resource-time-limits',
    label: 'Resource / Time Limits',
    description: 'Computational or time constraints',
    icon: 'Clock',
    placeholder: 'e.g., Must complete in <2 seconds, Minimal dependencies',
    examples: ['Low memory usage', 'No external API calls', 'Single file solution']
  },
  {
    id: 'security-privacy',
    label: 'Security / Privacy',
    description: 'Data handling and security requirements',
    icon: 'Shield',
    placeholder: 'e.g., No PII logging, OWASP compliant',
    examples: ['No external data transmission', 'Encrypt sensitive data', 'GDPR compliant']
  },
  {
    id: 'language',
    label: 'Language',
    description: 'Programming or natural language preferences',
    icon: 'Code',
    placeholder: 'e.g., TypeScript, British English',
    examples: ['TypeScript with strict mode', 'Python 3.11+', 'American English']
  },
  {
    id: 'testing-requirements',
    label: 'Testing Requirements',
    description: 'Test coverage and methodology expectations',
    icon: 'TestTube',
    placeholder: 'e.g., Include unit tests with Jest, 80% coverage',
    examples: ['Unit tests with Jest', 'Integration tests included', 'TDD approach']
  }
];

// Model display name mappings for version formatting
export const MODEL_DISPLAY_NAMES = {
  // Claude models
  'sonnet': { name: 'Sonnet', version: '4' },
  'claude-3-5-sonnet': { name: 'Sonnet', version: '3.5' },
  'claude-sonnet-4': { name: 'Sonnet', version: '4' },
  'opus': { name: 'Opus', version: '4' },
  'claude-opus-4': { name: 'Opus', version: '4' },
  'haiku': { name: 'Haiku', version: '3.5' },
  
  // OpenAI models
  'gpt-4o': { name: 'GPT-4o', version: '' },
  'gpt-4o-mini': { name: 'GPT-4o Mini', version: '' },
  'gpt-4.1': { name: 'GPT-4.1', version: '' },
  'gpt-4.1-mini': { name: 'GPT-4.1 Mini', version: '' },
  'o1': { name: 'o1', version: '' },
  'o1-mini': { name: 'o1 Mini', version: '' },
  'o3': { name: 'o3', version: '' },
  'o3-mini': { name: 'o3 Mini', version: '' },
  
  // Gemini models
  'gemini-1.5-pro': { name: 'Gemini 1.5 Pro', version: '' },
  'gemini-1.5-flash': { name: 'Gemini 1.5 Flash', version: '' },
  'gemini-2.0-flash-exp': { name: 'Gemini 2.0 Flash', version: 'exp' },
  'gemini-2.5-pro': { name: 'Gemini 2.5 Pro', version: '' },
  
  // Copilot
  'copilot-default': { name: 'Copilot CLI', version: 'default' }
};

// Theme options
export const THEMES = [
  { id: 'light', label: 'Light', icon: 'Sun' },
  { id: 'dark', label: 'Dark', icon: 'Moon' },
  { id: 'system', label: 'System', icon: 'Monitor' }
];

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'prompt-assistant-theme',
  UI_STATE: 'prompt-assistant-ui-state',
  LAST_PROVIDER: 'prompt-assistant-last-provider',
  LAST_MODEL: 'prompt-assistant-last-model',
  CONSTRAINTS: 'prompt-assistant-constraints',
  PROMPT_TYPE: 'prompt-assistant-prompt-type',
  LEARNING_MODE: 'prompt-assistant-learning-mode'
};

// Keyboard shortcuts
export const SHORTCUTS = {
  SEND: { key: 'Enter', modifier: 'metaKey', description: 'Send prompt' },
  TOGGLE_INSPECTOR: { key: 'i', modifier: 'metaKey', description: 'Toggle inspector' },
  EXPORT_JSON: { key: 'e', modifier: 'metaKey', description: 'Export JSON' },
  NEW_CHAT: { key: 'n', modifier: 'metaKey', description: 'New chat' }
};

// Message types
export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  CLARIFICATION: 'clarification',
  IMPROVED_PROMPT: 'improved-prompt',
  LEARNING_REPORT: 'learning-report',
  ERROR: 'error'
};

// Animation durations (in ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350
};
