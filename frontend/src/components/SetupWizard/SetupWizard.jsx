/**
 * SetupWizard Component
 * Quick setup wizard for new chats - select model, prompt type, and options
 */

import { useState, useEffect } from 'react';
import { Button } from '../ui';
import './SetupWizard.css';

// Icons
const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function SetupWizard({
  isOpen,
  onClose,
  onComplete,
  // Provider/Model
  providers = [],
  models = [],
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  // Prompt types
  promptTypes = [],
  selectedPromptType,
  onPromptTypeChange,
  // Learning mode
  learningMode,
  onLearningModeChange,
  // Constraints callback
  onAddConstraints,
  // Defaults
  hasDefaults = false
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleContinue = () => {
    onComplete();
    onClose();
  };

  const handleAddConstraints = () => {
    onAddConstraints?.();
    onClose();
  };

  const isReady = selectedProvider && selectedModel;

  return (
    <div className="setup-wizard__overlay" onClick={onClose}>
      <div className="setup-wizard" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="setup-wizard__header">
          <div className="setup-wizard__icon">
            <SparklesIcon />
          </div>
          <h2>New Chat Setup</h2>
          <p>Configure your chat settings to get started</p>
        </div>

        {/* Main content */}
        <div className="setup-wizard__content">
          {/* Model Selection */}
          <div className="setup-wizard__section">
            <label className="setup-wizard__label">
              <span className="setup-wizard__label-text">AI Provider</span>
              {hasDefaults && <span className="setup-wizard__default-badge">Default available</span>}
            </label>
            <select
              value={selectedProvider || ''}
              onChange={(e) => onProviderChange(e.target.value)}
              className="setup-wizard__select"
            >
              <option value="" disabled>Select a provider...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name || provider.id}
                </option>
              ))}
            </select>
          </div>

          <div className="setup-wizard__section">
            <label className="setup-wizard__label">
              <span className="setup-wizard__label-text">Model</span>
            </label>
            <select
              value={selectedModel || ''}
              onChange={(e) => onModelChange(e.target.value)}
              className="setup-wizard__select"
              disabled={!selectedProvider || models.length === 0}
            >
              <option value="" disabled>
                {!selectedProvider 
                  ? 'Select a provider first...' 
                  : models.length === 0 
                    ? 'No models available' 
                    : 'Select a model...'}
              </option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name || model.id}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt Type Selection */}
          <div className="setup-wizard__section">
            <label className="setup-wizard__label">
              <span className="setup-wizard__label-text">Prompt Type</span>
              <span className="setup-wizard__optional">(optional)</span>
            </label>
            <select
              value={selectedPromptType || 'none'}
              onChange={(e) => onPromptTypeChange(e.target.value)}
              className="setup-wizard__select"
            >
              <option value="none">General (no specific type)</option>
              {promptTypes.filter(pt => pt.id !== 'none').map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name || type.id}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced options toggle */}
          <button 
            className="setup-wizard__advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
            type="button"
          >
            <span>Advanced Options</span>
            <ChevronDownIcon />
          </button>

          {/* Advanced options */}
          {showAdvanced && (
            <div className="setup-wizard__advanced">
              {/* Learning Mode */}
              <label className="setup-wizard__checkbox">
                <input
                  type="checkbox"
                  checked={learningMode}
                  onChange={(e) => onLearningModeChange(e.target.checked)}
                />
                <span className="setup-wizard__checkbox-label">
                  <strong>Learning Mode</strong>
                  <small>Get detailed feedback and scores for your prompts</small>
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="setup-wizard__actions">
          <Button variant="ghost" onClick={onClose}>
            Skip
          </Button>
          
          <div className="setup-wizard__actions-right">
            <Button 
              variant="secondary" 
              onClick={handleAddConstraints}
              disabled={!isReady}
            >
              Add Constraints
            </Button>
            
            <Button 
              variant="primary" 
              onClick={handleContinue}
              disabled={!isReady}
            >
              <CheckIcon />
              Start Chat
            </Button>
          </div>
        </div>

        {/* Quick tip */}
        <div className="setup-wizard__tip">
          <strong>Tip:</strong> Set default provider and model in Settings to skip this step
        </div>
      </div>
    </div>
  );
}
