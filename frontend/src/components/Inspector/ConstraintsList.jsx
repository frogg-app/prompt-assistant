/**
 * ConstraintsList Component
 * UI for adding and managing prompt constraints
 */

import { useState, useCallback } from 'react';
import { Button, Input } from '../ui';
import './ConstraintsList.css';

// Comprehensive constraint type definitions with premade examples
const CONSTRAINT_TYPES = [
  {
    id: 'tone',
    name: 'Tone & Style',
    placeholder: 'e.g., Professional, casual, technical, friendly',
    description: 'The style and voice of the output',
    presets: [
      'Professional and formal',
      'Casual and conversational',
      'Technical and precise',
      'Friendly and approachable',
      'Concise and direct'
    ]
  },
  {
    id: 'length',
    name: 'Length',
    placeholder: 'e.g., 500 words max, 3 paragraphs, concise',
    description: 'Output length restrictions',
    presets: [
      'Keep it brief (under 200 words)',
      'Detailed explanation (500+ words)',
      'One-liner summary',
      'Bullet points only',
      'No more than 3 paragraphs'
    ]
  },
  {
    id: 'output-format',
    name: 'Output Format',
    placeholder: 'e.g., JSON, Markdown, bullet points, code only',
    description: 'Desired format of the response',
    presets: [
      'Markdown with headers',
      'JSON format',
      'Code only, no explanations',
      'Step-by-step numbered list',
      'Table format',
      'Mermaid diagram'
    ]
  },
  {
    id: 'language',
    name: 'Language & Framework',
    placeholder: 'e.g., TypeScript, Python 3.11+, React',
    description: 'Programming language or framework preferences',
    presets: [
      'TypeScript with strict mode',
      'Python 3.11+',
      'React with hooks',
      'Node.js with ES modules',
      'Vanilla JavaScript (no frameworks)',
      'Go with standard library only'
    ]
  },
  {
    id: 'architecture',
    name: 'Architecture & Patterns',
    placeholder: 'e.g., MVC, microservices, functional',
    description: 'Design patterns and architecture preferences',
    presets: [
      'Follow SOLID principles',
      'Functional programming style',
      'Clean Architecture',
      'Keep it simple (KISS)',
      'Prefer composition over inheritance',
      'Use dependency injection'
    ]
  },
  {
    id: 'testing-requirements',
    name: 'Testing',
    placeholder: 'e.g., Include unit tests, 80% coverage, use Jest',
    description: 'Testing and quality requirements',
    presets: [
      'Include unit tests',
      'Add integration tests',
      'Use Jest/Vitest',
      'Include test fixtures/mocks',
      'TDD approach',
      '80%+ code coverage'
    ]
  },
  {
    id: 'error-handling',
    name: 'Error Handling',
    placeholder: 'e.g., Comprehensive try/catch, graceful degradation',
    description: 'How errors should be handled',
    presets: [
      'Comprehensive error handling',
      'Fail fast with clear messages',
      'Graceful degradation',
      'Return error objects, don\'t throw',
      'Log all errors with context'
    ]
  },
  {
    id: 'security-privacy',
    name: 'Security & Privacy',
    placeholder: 'e.g., No external APIs, GDPR compliant',
    description: 'Security and privacy requirements',
    presets: [
      'Sanitize all user inputs',
      'No hardcoded secrets',
      'OWASP security best practices',
      'GDPR compliant',
      'No external API calls',
      'Encrypt sensitive data'
    ]
  },
  {
    id: 'performance',
    name: 'Performance',
    placeholder: 'e.g., Optimize for speed, low memory usage',
    description: 'Performance and optimization requirements',
    presets: [
      'Optimize for speed',
      'Minimize memory usage',
      'Use lazy loading',
      'Cache expensive operations',
      'Avoid N+1 queries',
      'Use pagination for large datasets'
    ]
  },
  {
    id: 'documentation',
    name: 'Documentation',
    placeholder: 'e.g., JSDoc comments, inline explanations',
    description: 'Documentation and comment requirements',
    presets: [
      'Add JSDoc/docstring comments',
      'Include inline comments for complex logic',
      'Add README with usage examples',
      'Document all public APIs',
      'No comments needed'
    ]
  },
  {
    id: 'dependencies',
    name: 'Dependencies',
    placeholder: 'e.g., Minimal deps, use standard library',
    description: 'Third-party dependency preferences',
    presets: [
      'Minimal dependencies',
      'Use standard library when possible',
      'No external dependencies',
      'Prefer well-maintained packages',
      'Use only free/open-source tools'
    ]
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    placeholder: 'e.g., WCAG 2.1 AA, screen reader support',
    description: 'Accessibility requirements',
    presets: [
      'WCAG 2.1 AA compliant',
      'Include ARIA labels',
      'Keyboard navigation support',
      'Screen reader friendly',
      'Color contrast requirements'
    ]
  },
  {
    id: 'compatibility',
    name: 'Compatibility',
    placeholder: 'e.g., IE11 support, Node 18+',
    description: 'Browser or runtime compatibility',
    presets: [
      'Modern browsers only',
      'Node.js 18+ LTS',
      'Cross-platform (Windows/Mac/Linux)',
      'Mobile responsive',
      'Progressive enhancement'
    ]
  },
  {
    id: 'custom',
    name: 'Custom',
    placeholder: 'Enter your own constraint...',
    description: 'Any other specific requirement',
    presets: []
  }
];

// Generate unique ID
function generateId() {
  return `constraint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Icons
const PlusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

// Single constraint item
function ConstraintItem({ constraint, onUpdate, onRemove, disabled }) {
  const typeInfo = CONSTRAINT_TYPES.find(t => t.id === constraint.type);
  
  return (
    <div className="constraint-item" aria-label={`${typeInfo?.name || constraint.type} constraint`}>
      <div className="constraint-item__header">
        <span className="constraint-item__type">
          {typeInfo?.name || constraint.type}
        </span>
        <button
          className="constraint-item__remove"
          onClick={() => onRemove(constraint.id)}
          disabled={disabled}
          aria-label={`Remove ${typeInfo?.name || constraint.type} constraint`}
        >
          <TrashIcon size={14} />
        </button>
      </div>
      <Input
        value={constraint.description}
        onChange={(e) => onUpdate(constraint.id, { description: e.target.value })}
        placeholder={typeInfo?.placeholder || 'Enter constraint description...'}
        disabled={disabled}
        aria-label={`${typeInfo?.name || constraint.type} description`}
      />
    </div>
  );
}

// Add constraint form
function AddConstraintForm({ onAdd, disabled }) {
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedTypeInfo = CONSTRAINT_TYPES.find(t => t.id === selectedType);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!selectedType || !description.trim()) return;
    
    onAdd({
      id: generateId(),
      type: selectedType,
      description: description.trim()
    });
    
    setSelectedType('');
    setDescription('');
    setIsExpanded(false);
  }, [selectedType, description, onAdd]);

  const handlePresetClick = (preset) => {
    setDescription(preset);
  };

  const handleQuickAdd = (typeId, preset) => {
    onAdd({
      id: generateId(),
      type: typeId,
      description: preset
    });
  };

  const handleCancel = () => {
    setSelectedType('');
    setDescription('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div className="constraint-add-section">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
          className="constraint-add-button"
        >
          <PlusIcon size={14} />
          <span>Add Constraint</span>
        </Button>
        
        {/* Quick add common constraints */}
        <div className="constraint-quick-add">
          <span className="constraint-quick-add__label">Quick add:</span>
          <div className="constraint-quick-add__chips">
            <button
              type="button"
              className="constraint-chip"
              onClick={() => handleQuickAdd('tone', 'Professional and concise')}
              disabled={disabled}
            >
              Professional tone
            </button>
            <button
              type="button"
              className="constraint-chip"
              onClick={() => handleQuickAdd('output-format', 'Markdown with code blocks')}
              disabled={disabled}
            >
              Markdown output
            </button>
            <button
              type="button"
              className="constraint-chip"
              onClick={() => handleQuickAdd('testing-requirements', 'Include unit tests')}
              disabled={disabled}
            >
              Include tests
            </button>
            <button
              type="button"
              className="constraint-chip"
              onClick={() => handleQuickAdd('documentation', 'Add inline comments for complex logic')}
              disabled={disabled}
            >
              Add comments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="constraint-add-form" onSubmit={handleSubmit}>
      <div className="constraint-add-form__field">
        <label htmlFor="constraint-type" className="constraint-add-form__label">
          Constraint Type
        </label>
        <select
          id="constraint-type"
          className="constraint-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select type...</option>
          {CONSTRAINT_TYPES.map(type => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        {selectedTypeInfo && (
          <p className="constraint-add-form__hint">
            {selectedTypeInfo.description}
          </p>
        )}
      </div>

      {selectedTypeInfo && selectedTypeInfo.presets.length > 0 && (
        <div className="constraint-add-form__presets">
          <span className="constraint-add-form__presets-label">Suggestions:</span>
          <div className="constraint-presets">
            {selectedTypeInfo.presets.map((preset, i) => (
              <button
                key={i}
                type="button"
                className={`constraint-preset ${description === preset ? 'constraint-preset--selected' : ''}`}
                onClick={() => handlePresetClick(preset)}
                disabled={disabled}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="constraint-add-form__field">
        <label htmlFor="constraint-description" className="constraint-add-form__label">
          Description
        </label>
        <Input
          id="constraint-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={selectedTypeInfo?.placeholder || 'Describe your constraint...'}
          disabled={disabled || !selectedType}
        />
      </div>

      <div className="constraint-add-form__actions">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={disabled}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={disabled || !selectedType || !description.trim()}
        >
          Add
        </Button>
      </div>
    </form>
  );
}

export default function ConstraintsList({
  constraints = [],
  onAdd,
  onUpdate,
  onRemove,
  disabled = false
}) {
  return (
    <div className="constraints-list">
      {constraints.length > 0 && (
        <div className="constraints-list__items">
          {constraints.map(constraint => (
            <ConstraintItem
              key={constraint.id}
              constraint={constraint}
              onUpdate={onUpdate}
              onRemove={onRemove}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <AddConstraintForm
        onAdd={onAdd}
        disabled={disabled}
      />
    </div>
  );
}

// Export for use elsewhere
export { CONSTRAINT_TYPES };
