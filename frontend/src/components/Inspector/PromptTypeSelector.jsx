/**
 * PromptTypeSelector Component
 * Selection of prompt categories with descriptions
 */

import './PromptTypeSelector.css';

// Prompt type definitions with descriptions
const DEFAULT_PROMPT_TYPES = [
  {
    id: 'none',
    name: 'Generic',
    description: 'General-purpose prompt refinement with sensible defaults',
    icon: '✨'
  },
  {
    id: 'plan-architect',
    name: 'Plan / Architect',
    description: 'High-level system design, architecture decisions, and project planning',
    icon: '📐'
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Information gathering, technology comparison, and learning exploration',
    icon: '🔍'
  },
  {
    id: 'full-app-build',
    name: 'Full App Build',
    description: 'Complete application development from scratch with all components',
    icon: '🏗️'
  },
  {
    id: 'update-refactor',
    name: 'Update / Refactor',
    description: 'Modifying existing code, improving structure, or adding features',
    icon: '🔄'
  },
  {
    id: 'bug-investigation-fix',
    name: 'Bug Investigation & Fix',
    description: 'Debugging, error analysis, and implementing fixes',
    icon: '🐛'
  },
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Reviewing code quality, suggesting improvements, and best practices',
    icon: '👀'
  }
];

export default function PromptTypeSelector({
  value = 'none',
  onChange,
  disabled = false,
  promptTypes = DEFAULT_PROMPT_TYPES
}) {
  const handleSelect = (typeId) => {
    if (!disabled) {
      onChange?.(typeId);
    }
  };

  const handleKeyDown = (e, typeId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(typeId);
    }
  };

  return (
    <div 
      className="prompt-type-selector"
      role="radiogroup"
      aria-label="Prompt type selection"
    >
      {promptTypes.map((type) => {
        const isSelected = value === type.id;
        
        return (
          <div
            key={type.id}
            className={`prompt-type-option ${isSelected ? 'prompt-type-option--selected' : ''} ${disabled ? 'prompt-type-option--disabled' : ''}`}
            role="radio"
            aria-checked={isSelected}
            tabIndex={disabled ? -1 : 0}
            onClick={() => handleSelect(type.id)}
            onKeyDown={(e) => handleKeyDown(e, type.id)}
          >
            <div className="prompt-type-option__radio">
              <div className="prompt-type-option__radio-dot" />
            </div>
            <div className="prompt-type-option__content">
              <div className="prompt-type-option__header">
                <span className="prompt-type-option__icon" aria-hidden="true">
                  {type.icon}
                </span>
                <span className="prompt-type-option__name">{type.name}</span>
              </div>
              <p className="prompt-type-option__description">
                {type.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Export defaults for use elsewhere
export { DEFAULT_PROMPT_TYPES };
