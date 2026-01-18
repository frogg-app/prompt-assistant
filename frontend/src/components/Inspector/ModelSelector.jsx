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

export default function ModelSelector({
  providers = [],
  selectedProvider,
  onProviderChange,
  models = [],
  selectedModel,
  onModelChange,
  isLoading = false,
  disabled = false
}) {
  // Convert providers to select options
  const providerOptions = providers.map(p => ({
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
        <label 
          htmlFor="provider-select" 
          className="model-selector__label"
        >
          Provider
        </label>
        <Select
          id="provider-select"
          value={selectedProvider || ''}
          onChange={(e) => onProviderChange?.(e.target.value)}
          disabled={disabled}
          placeholder="Select a provider..."
          aria-describedby="provider-hint"
        >
          <option value="" disabled>Select a provider...</option>
          {providerOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
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
            aria-describedby="model-hint"
            aria-busy={isLoading}
          >
            <option value="" disabled>
              {isLoading ? 'Loading models...' : 'Select a model...'}
            </option>
            {modelOptions.map(opt => (
              <option 
                key={opt.value} 
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </Select>
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

      {/* Selected Model Summary */}
      {currentProvider && currentModel && (
        <div className="model-selector__summary" aria-live="polite">
          <div className="model-selector__summary-row">
            <span className="model-selector__summary-label">Selected:</span>
            <span className="model-selector__summary-value">
              {currentProvider.name} / {formatModelName(currentModel)}
            </span>
          </div>
          {currentModel.contextWindow && (
            <div className="model-selector__summary-row">
              <span className="model-selector__summary-label">Context:</span>
              <span className="model-selector__summary-value">
                {currentModel.contextWindow.toLocaleString()} tokens
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
