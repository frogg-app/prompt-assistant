/**
 * Constants Tests
 */

import { describe, it, expect } from 'vitest';
import {
  PROMPT_TYPES,
  CONSTRAINT_TYPES,
  MODEL_DISPLAY_NAMES,
  THEMES,
  STORAGE_KEYS,
  MESSAGE_TYPES,
  ANIMATION
} from './constants';

describe('PROMPT_TYPES', () => {
  it('should be an array of prompt type objects', () => {
    expect(Array.isArray(PROMPT_TYPES)).toBe(true);
    expect(PROMPT_TYPES.length).toBeGreaterThan(0);
  });

  it('should have required properties for each prompt type', () => {
    PROMPT_TYPES.forEach(type => {
      expect(type).toHaveProperty('id');
      expect(type).toHaveProperty('label');
      expect(type).toHaveProperty('description');
      expect(typeof type.id).toBe('string');
      expect(typeof type.label).toBe('string');
    });
  });

  it('should include the "none" type', () => {
    const noneType = PROMPT_TYPES.find(t => t.id === 'none');
    expect(noneType).toBeDefined();
    expect(noneType.label).toBe('None');
  });

  it('should have unique IDs', () => {
    const ids = PROMPT_TYPES.map(t => t.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });
});

describe('CONSTRAINT_TYPES', () => {
  it('should be an array of constraint type objects', () => {
    expect(Array.isArray(CONSTRAINT_TYPES)).toBe(true);
    expect(CONSTRAINT_TYPES.length).toBeGreaterThan(0);
  });

  it('should have required properties for each constraint type', () => {
    CONSTRAINT_TYPES.forEach(type => {
      expect(type).toHaveProperty('id');
      expect(type).toHaveProperty('label');
      expect(type).toHaveProperty('description');
      expect(type).toHaveProperty('placeholder');
    });
  });

  it('should include common constraint types', () => {
    const ids = CONSTRAINT_TYPES.map(t => t.id);
    expect(ids).toContain('tone');
    expect(ids).toContain('length');
    expect(ids).toContain('output-format');
  });
});

describe('MODEL_DISPLAY_NAMES', () => {
  it('should be an object mapping model IDs to display info', () => {
    expect(typeof MODEL_DISPLAY_NAMES).toBe('object');
    expect(Object.keys(MODEL_DISPLAY_NAMES).length).toBeGreaterThan(0);
  });

  it('should have name property for each model', () => {
    Object.entries(MODEL_DISPLAY_NAMES).forEach(([id, info]) => {
      expect(info).toHaveProperty('name');
      expect(typeof info.name).toBe('string');
    });
  });

  it('should include Claude models', () => {
    expect(MODEL_DISPLAY_NAMES).toHaveProperty('sonnet');
    expect(MODEL_DISPLAY_NAMES).toHaveProperty('opus');
  });

  it('should include OpenAI models', () => {
    expect(MODEL_DISPLAY_NAMES).toHaveProperty('gpt-4o');
    expect(MODEL_DISPLAY_NAMES).toHaveProperty('gpt-4o-mini');
  });
});

describe('THEMES', () => {
  it('should include light, dark, and system themes', () => {
    const ids = THEMES.map(t => t.id);
    expect(ids).toContain('light');
    expect(ids).toContain('dark');
    expect(ids).toContain('system');
  });

  it('should have labels for all themes', () => {
    THEMES.forEach(theme => {
      expect(theme).toHaveProperty('label');
      expect(typeof theme.label).toBe('string');
    });
  });
});

describe('STORAGE_KEYS', () => {
  it('should have all required storage keys', () => {
    expect(STORAGE_KEYS).toHaveProperty('THEME');
    expect(STORAGE_KEYS).toHaveProperty('CONSTRAINTS');
    expect(STORAGE_KEYS).toHaveProperty('PROMPT_TYPE');
  });

  it('should have unique values', () => {
    const values = Object.values(STORAGE_KEYS);
    const uniqueValues = [...new Set(values)];
    expect(values.length).toBe(uniqueValues.length);
  });
});

describe('MESSAGE_TYPES', () => {
  it('should include user and assistant types', () => {
    expect(MESSAGE_TYPES.USER).toBe('user');
    expect(MESSAGE_TYPES.ASSISTANT).toBe('assistant');
  });

  it('should include clarification type', () => {
    expect(MESSAGE_TYPES.CLARIFICATION).toBe('clarification');
  });
});

describe('ANIMATION', () => {
  it('should have numeric duration values', () => {
    expect(typeof ANIMATION.FAST).toBe('number');
    expect(typeof ANIMATION.NORMAL).toBe('number');
    expect(typeof ANIMATION.SLOW).toBe('number');
  });

  it('should have FAST < NORMAL < SLOW', () => {
    expect(ANIMATION.FAST).toBeLessThan(ANIMATION.NORMAL);
    expect(ANIMATION.NORMAL).toBeLessThan(ANIMATION.SLOW);
  });
});
