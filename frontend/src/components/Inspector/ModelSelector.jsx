/**
 * ModelSelector Component
 * Provider and model selection with dynamic model loading
 */

import { Select } from '../ui';
import './ModelSelector.css';

// Loading spinner
const Spinner = ({ size = 16 }) => (
  <svg 
    className="model-selector__spinner" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
  >
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round"
      strokeDasharray="31.4 31.4"
    />
  </svg>
);

// Format model display name with version
function formatModelName(model) {
  if (!model) return '';
  
  const { name, version, displayName } = model;
  
  if (displayName) {
    return displayName;
  }
  
  if (version) {
    return `${name} ${version}`;
  }
  
  return name;
}

// Settings gear icon
const SettingsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function ModelSelector({
  providers = [],
  selectedProvider,
  onProviderChange,
  models = [],
  selectedModel,
  onModelChange,
  isLoading = false,
  disabled = false,
  onManageProviders
}) {
  // Filter to only show available providers
  const availableProviders = providers.filter(p => p.available);
  
  // Convert providers to select options
  const providerOptions = availableProviders.map(p => ({
    value: p.id,
    label: p.name,
    icon: p.icon
  }));

  // Convert models to select options with formatted names
  const modelOptions = models.map(m => ({
    value: m.id,
    label: formatModelName(m),
    description: m.description,
    disabled: m.disabled
  }));

  // Find current selections
  const currentProvider = providers.find(p => p.id === selectedProvider);
  const currentModel = models.find(m => m.id === selectedModel);

  return (
    <div className="model-selector">
      {/* Provider Selection */}
      <div className="model-selector__field">
        <div className="model-selector__label-row">
          <label 
            htmlFor="provider-select" 
            className="model-selector__label"
          >
            Provider
          </label>
          {onManageProviders && (
            <button
              className="model-selector__settings-btn"
              onClick={onManageProviders}
              disabled={disabled}
              aria-label="Manage providers"
              title="Manage providers"
            >
              <SettingsIcon size={14} />
            </button>
          )}
        </div>
        <Select
          id="provider-select"
          value={selectedProvider || ''}
          onChange={(e) => onProviderChange?.(e.target.value)}
          disabled={disabled}
          placeholder="Select a provider..."
          options={providerOptions}
          aria-describedby="provider-hint"
        />
        <p id="provider-hint" className="model-selector__hint">
          Choose your AI provider
        </p>
      </div>

      {/* Model Selection */}
      <div className="model-selector__field">
        <label 
          htmlFor="model-select" 
          className="model-selector__label"
        >
          Model
        </label>
        <div className="model-selector__input-wrapper">
          <Select
            id="model-select"
            value={selectedModel || ''}
            onChange={(e) => onModelChange?.(e.target.value)}
            disabled={disabled || !selectedProvider || isLoading}
            placeholder={isLoading ? 'Loading models...' : 'Select a model...'}
            options={modelOptions}
            loading={isLoading}
            aria-describedby="model-hint"
            aria-busy={isLoading}
          />
          {isLoading && (
            <div className="model-selector__loading" aria-hidden="true">
              <Spinner />
            </div>
          )}
        </div>
        <p id="model-hint" className="model-selector__hint">
          {currentModel?.description || 'Select a provider first to see available models'}
        </p>
      </div>

      {/* Model Context Info */}
      {currentProvider && currentModel && currentModel.contextWindow && (
        <div className="model-selector__info" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="model-selector__info-icon">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span className="model-selector__info-text">
            Context: {currentModel.contextWindow.toLocaleString()} tokens
          </span>
        </div>
      )}
    </div>
  );
}
