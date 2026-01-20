/**
 * Schema Utilities Tests
 * Tests for building, validating, and exporting prompt payloads
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  getModelDisplayInfo,
  buildPayload,
  buildPromptPayload,
  validatePayload,
  parsePayload,
  copyPayloadToClipboard
} from '../utils/schema';

describe('generateId', () => {
  it('should generate a unique string ID', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(10);
  });

  it('should generate different IDs on subsequent calls', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should contain a timestamp component', () => {
    const beforeTime = Date.now();
    const id = generateId();
    const afterTime = Date.now();
    
    // ID format is timestamp-randomstring
    const timestampPart = parseInt(id.split('-')[0], 10);
    expect(timestampPart).toBeGreaterThanOrEqual(beforeTime);
    expect(timestampPart).toBeLessThanOrEqual(afterTime);
  });
});

describe('getModelDisplayInfo', () => {
  it('should return mapped display info for known model IDs', () => {
    const info = getModelDisplayInfo('sonnet');
    expect(info.name).toBe('Sonnet');
    expect(info.version).toBe('4');
    expect(info.displayName).toBe('Sonnet 4');
  });

  it('should return mapped display info for OpenAI models', () => {
    const info = getModelDisplayInfo('gpt-4o');
    expect(info.name).toBe('GPT-4o');
    expect(info.version).toBe('');
    expect(info.displayName).toBe('GPT-4o');
  });

  it('should fallback to label for unknown model IDs', () => {
    const info = getModelDisplayInfo('unknown-model', 'Custom Model Label');
    expect(info.name).toBe('Custom Model Label');
    expect(info.version).toBe('');
    expect(info.displayName).toBe('Custom Model Label');
  });

  it('should fallback to ID when no label provided', () => {
    const info = getModelDisplayInfo('my-custom-model');
    expect(info.name).toBe('my-custom-model');
    expect(info.displayName).toBe('my-custom-model');
  });

  it('should handle empty modelId', () => {
    const info = getModelDisplayInfo('', 'Fallback Label');
    expect(info.displayName).toBe('Fallback Label');
  });
});

describe('buildPayload', () => {
  it('should build a complete payload with all fields', () => {
    const payload = buildPayload({
      roughPrompt: 'Create a React component',
      promptType: 'full-app-build',
      constraints: [
        { type: 'language', description: 'TypeScript' }
      ],
      model: {
        provider: 'claude',
        name: 'sonnet'
      },
      options: {
        learningMode: true,
        autoCopy: false
      },
      uiState: {
        inspectorCollapsed: false,
        theme: 'dark'
      }
    });

    expect(payload.roughPrompt).toBe('Create a React component');
    expect(payload.promptType).toBe('full-app-build');
    expect(payload.constraints).toHaveLength(1);
    expect(payload.constraints[0].type).toBe('language');
    expect(payload.constraints[0].description).toBe('TypeScript');
    expect(payload.constraints[0].id).toBeDefined();
    expect(payload.model.provider).toBe('claude');
    expect(payload.model.name).toBe('sonnet');
    expect(payload.model.displayName).toBe('Sonnet 4');
    expect(payload.options.learningMode).toBe(true);
    expect(payload.options.autoCopy).toBe(false);
    expect(payload.uiState.theme).toBe('dark');
    expect(payload.uiState.lastUpdated).toBeDefined();
  });

  it('should use default values for optional fields', () => {
    const payload = buildPayload({
      roughPrompt: 'Test prompt',
      model: { provider: 'openai', name: 'gpt-4o' }
    });

    expect(payload.promptType).toBe('none');
    expect(payload.constraints).toEqual([]);
    expect(payload.options.learningMode).toBe(false);
    expect(payload.options.autoCopy).toBe(false);
    expect(payload.uiState.theme).toBe('system');
  });

  it('should trim whitespace from roughPrompt', () => {
    const payload = buildPayload({
      roughPrompt: '  Hello world  ',
      model: { provider: 'test', name: 'test-model' }
    });

    expect(payload.roughPrompt).toBe('Hello world');
  });

  it('should handle empty roughPrompt', () => {
    const payload = buildPayload({
      roughPrompt: '',
      model: { provider: 'test', name: 'test' }
    });

    expect(payload.roughPrompt).toBe('');
  });

  it('should preserve existing constraint IDs', () => {
    const existingId = 'existing-constraint-123';
    const payload = buildPayload({
      roughPrompt: 'Test',
      model: { provider: 'test', name: 'test' },
      constraints: [
        { id: existingId, type: 'tone', description: 'Professional' }
      ]
    });

    expect(payload.constraints[0].id).toBe(existingId);
  });

  it('should include clarifications when provided', () => {
    const clarifications = {
      target_audience: 'developers'
    };
    const payload = buildPayload({
      roughPrompt: 'Test',
      model: { provider: 'test', name: 'test' },
      clarifications
    });

    expect(payload.clarifications).toBe(clarifications);
  });
});

describe('buildPromptPayload', () => {
  it('should be an alias for buildPayload', () => {
    expect(buildPromptPayload).toBe(buildPayload);
  });
});

describe('validatePayload', () => {
  const validPayload = {
    roughPrompt: 'Create a web app',
    model: { provider: 'claude', name: 'sonnet' },
    promptType: 'none',
    constraints: []
  };

  it('should validate a correct payload', () => {
    const result = validatePayload(validPayload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject payload without roughPrompt', () => {
    const result = validatePayload({ ...validPayload, roughPrompt: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('roughPrompt is required and must be a string');
  });

  it('should reject empty roughPrompt', () => {
    const result = validatePayload({ ...validPayload, roughPrompt: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('roughPrompt cannot be empty');
  });

  it('should reject payload without model', () => {
    const { model, ...payloadWithoutModel } = validPayload;
    const result = validatePayload(payloadWithoutModel);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('model is required');
  });

  it('should reject model without provider', () => {
    const result = validatePayload({
      ...validPayload,
      model: { name: 'sonnet' }
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('model.provider is required');
  });

  it('should reject model without name', () => {
    const result = validatePayload({
      ...validPayload,
      model: { provider: 'claude' }
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('model.name is required');
  });

  it('should accept any promptType string (custom types allowed)', () => {
    const result = validatePayload({
      ...validPayload,
      promptType: 'my-custom-type'
    });
    expect(result.valid).toBe(true);
  });

  it('should accept all built-in prompt types', () => {
    const builtInTypes = [
      'none', 'plan-architect', 'research', 'full-app-build',
      'update-refactor', 'bug-investigation-fix', 'code-review'
    ];

    builtInTypes.forEach(type => {
      const result = validatePayload({ ...validPayload, promptType: type });
      expect(result.valid).toBe(true);
    });
  });

  it('should reject constraint without type', () => {
    const result = validatePayload({
      ...validPayload,
      constraints: [{ description: 'Test' }]
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('constraints[0].type is required');
  });

  it('should reject constraint with invalid type', () => {
    const result = validatePayload({
      ...validPayload,
      constraints: [{ type: 'invalid-constraint', description: 'Test' }]
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('constraints[0].type must be one of');
  });

  it('should reject constraint without description', () => {
    const result = validatePayload({
      ...validPayload,
      constraints: [{ type: 'tone' }]
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('constraints[0].description is required');
  });

  it('should validate all valid constraint types', () => {
    const validTypes = [
      'tone', 'length', 'output-format', 'language', 'architecture',
      'testing-requirements', 'error-handling', 'security-privacy',
      'performance', 'documentation', 'dependencies', 'accessibility',
      'compatibility', 'custom'
    ];

    validTypes.forEach(type => {
      const result = validatePayload({
        ...validPayload,
        constraints: [{ type, description: 'Test constraint' }]
      });
      expect(result.valid).toBe(true);
    });
  });
});

describe('parsePayload', () => {
  it('should parse valid JSON', () => {
    const json = JSON.stringify({
      roughPrompt: 'Test',
      model: { provider: 'test', name: 'test' }
    });

    const result = parsePayload(json);
    expect(result.payload).not.toBeNull();
    expect(result.error).toBeNull();
  });

  it('should reject invalid JSON', () => {
    const result = parsePayload('{ invalid json }');
    expect(result.payload).toBeNull();
    expect(result.error).toBe('Invalid JSON format');
  });

  it('should reject valid JSON with invalid payload', () => {
    const json = JSON.stringify({ roughPrompt: 'Test' });
    const result = parsePayload(json);
    expect(result.payload).toBeNull();
    expect(result.error).toContain('model is required');
  });
});

describe('copyPayloadToClipboard', () => {
  const mockClipboard = {
    writeText: vi.fn()
  };

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: mockClipboard
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should copy payload JSON to clipboard', async () => {
    mockClipboard.writeText.mockResolvedValueOnce();
    
    const payload = { test: 'data' };
    const result = await copyPayloadToClipboard(payload);
    
    expect(result).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(payload, null, 2)
    );
  });

  it('should return false on clipboard error', async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));
    
    const result = await copyPayloadToClipboard({ test: 'data' });
    expect(result).toBe(false);
  });
});
