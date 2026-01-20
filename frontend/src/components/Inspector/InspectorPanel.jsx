/**
 * InspectorPanel Component
 * Side panel for prompt options, model selection, constraints, and settings
 */

import { useState, useCallback } from 'react';
import ModelSelector from './ModelSelector';
import PromptTypeSelector from './PromptTypeSelector';
import ConstraintsList from './ConstraintsList';
import './InspectorPanel.css';

// Icons
const ChevronIcon = ({ direction = 'down', size = 16 }) => {
  const rotation = {
    up: 180,
    down: 0,
    left: 90,
    right: -90
  };
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotation[direction]}deg)`, transition: 'transform 0.2s' }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
};

const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const SettingsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Collapsible section component
function Section({ title, icon, children, defaultOpen = true, headerAction }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionId = title.toLowerCase().replace(/\s+/g, '-');
  
  // Handle click on header, but not when clicking the action button
  const handleHeaderClick = (e) => {
    // Don't toggle if clicking on the action button
    if (e.target.closest('.inspector-section__action')) {
      return;
    }
    setIsOpen(!isOpen);
  };
  
  return (
    <div className={`inspector-section ${isOpen ? 'inspector-section--open' : ''}`}>
      <div 
        className="inspector-section__header"
        onClick={handleHeaderClick}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={`section-${sectionId}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        {icon && <span className="inspector-section__icon">{icon}</span>}
        <span className="inspector-section__title">{title}</span>
        {headerAction && (
          <div className="inspector-section__action">
            {headerAction}
          </div>
        )}
        <ChevronIcon direction={isOpen ? 'up' : 'down'} size={16} />
      </div>
      <div 
        id={`section-${sectionId}`}
        className="inspector-section__content"
        hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
}

export default function InspectorPanel({
  isOpen,
  onClose,
  // Model selection
  providers = [],
  selectedProvider,
  onProviderChange,
  models = [],
  selectedModel,
  onModelChange,
  isLoadingModels = false,
  // Prompt type
  promptType = 'none',
  onPromptTypeChange,
  promptTypes = [],
  // Constraints
  constraints = [],
  onConstraintsChange,
  // Grading mode
  gradingMode = false,
  onGradingModeChange,
  // Disabled state
  disabled = false,
  // Provider management
  onManageProviders,
  // Prompt Type management
  onManagePromptTypes
}) {
  // Handle constraint operations
  const handleAddConstraint = useCallback((constraint) => {
    onConstraintsChange?.([...constraints, constraint]);
  }, [constraints, onConstraintsChange]);

  const handleUpdateConstraint = useCallback((id, updates) => {
    onConstraintsChange?.(
      constraints.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }, [constraints, onConstraintsChange]);

  const handleRemoveConstraint = useCallback((id) => {
    onConstraintsChange?.(constraints.filter(c => c.id !== id));
  }, [constraints, onConstraintsChange]);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="inspector-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={`inspector-panel ${isOpen ? 'inspector-panel--open' : ''}`}
        role="complementary"
        aria-label="Prompt options panel"
      >
        <div className="inspector-panel__header">
          <div className="inspector-panel__title">
            <SettingsIcon size={18} />
            <h2>Options</h2>
          </div>
          <button
            className="inspector-panel__close"
            onClick={onClose}
            aria-label="Close options panel"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        
        <div className="inspector-panel__body">
          {/* Model Selection Section */}
          <Section 
            title="Model" 
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2" />
                <path d="M20 14h2" />
                <path d="M15 13v2" />
                <path d="M9 13v2" />
              </svg>
            }
            headerAction={
              <button
                className="inspector-section__settings-btn"
                onClick={onManageProviders}
                title="Manage providers"
                aria-label="Manage providers"
              >
                <SettingsIcon size={16} />
              </button>
            }
          >
            <ModelSelector
              providers={providers}
              selectedProvider={selectedProvider}
              onProviderChange={onProviderChange}
              models={models}
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              isLoading={isLoadingModels}
              disabled={disabled}
            />
          </Section>

          {/* Prompt Type Section */}
          <Section 
            title="Prompt Type" 
            defaultOpen={false}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
            }
            headerAction={
              <button
                className="inspector-section__settings-btn"
                onClick={onManagePromptTypes}
                title="Manage prompt types"
                aria-label="Manage prompt types"
              >
                <SettingsIcon size={16} />
              </button>
            }
          >
            <PromptTypeSelector
              value={promptType}
              onChange={onPromptTypeChange}
              disabled={disabled}
              promptTypes={promptTypes}
            />
          </Section>

          {/* Constraints Section */}
          <Section 
            title="Constraints" 
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="9" y2="9" />
                <line x1="4" x2="20" y1="15" y2="15" />
                <line x1="10" x2="8" y1="3" y2="21" />
                <line x1="16" x2="14" y1="3" y2="21" />
              </svg>
            }
            defaultOpen={false}
          >
            <ConstraintsList
              constraints={constraints}
              onAdd={handleAddConstraint}
              onUpdate={handleUpdateConstraint}
              onRemove={handleRemoveConstraint}
              disabled={disabled}
            />
          </Section>

          {/* Grading Mode Section */}
          <Section 
            title="Grading Mode" 
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            }
            defaultOpen={false}
          >
            <div className="grading-section">
              <label className="grading-section__toggle">
                <input
                  type="checkbox"
                  checked={gradingMode}
                  onChange={(e) => onGradingModeChange?.(e.target.checked)}
                  disabled={disabled}
                />
                <span className="grading-section__toggle-label">Enable prompt grading</span>
              </label>
              <p className="grading-section__description">
                When enabled, your prompt will be graded on clarity, context, constraints, and more. 
                Excellent prompts (Grade A) will be confirmed rather than modified.
              </p>
              {gradingMode && (
                <div className="grading-section__criteria">
                  <p className="grading-section__criteria-title">Grading criteria:</p>
                  <ul>
                    <li>Clarity & Specificity</li>
                    <li>Context Completeness</li>
                    <li>Constraints & Success</li>
                    <li>Input/Output Definition</li>
                    <li>Ambiguity & Assumptions</li>
                    <li>Testability</li>
                  </ul>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Export JSON button */}
        <div className="inspector-panel__footer">
          <p className="inspector-panel__hint">
            Configure options to customize prompt refinement
          </p>
        </div>
      </aside>
    </>
  );
}
