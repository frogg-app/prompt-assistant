/**
 * ProviderForm Component
 * Form for adding/editing custom providers
 */

import { useState, useEffect } from 'react';
import { API_BASE } from '../../utils/constants';

export default function ProviderForm({ provider, onSubmit, onCancel, isEdit = false }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    config_type: 'openai_compatible',
    base_url: '',
    api_key: '',
    env_var: '',
    supports_dynamic_models: true,
    models: []
  });
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (provider) {
      setFormData({
        id: provider.id || '',
        name: provider.name || '',
        config_type: provider.config?.type || 'openai_compatible',
        base_url: provider.config?.base_url || '',
        api_key: provider.config?.api_key || '',
        env_var: provider.config?.env_var || '',
        supports_dynamic_models: provider.supports_dynamic_models !== false,
        models: provider.models || []
      });
    }
  }, [provider]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setError('');

    try {
      // For new providers, we need to validate without saving
      const testPayload = {
        id: formData.id || 'test',
        name: formData.name || 'Test Provider',
        config: {
          type: formData.config_type,
          base_url: formData.base_url,
          api_key: formData.api_key,
          env_var: formData.env_var
        }
      };

      // Test by attempting to fetch models
      if (formData.config_type === 'openai_compatible' && formData.base_url && formData.api_key) {
        const response = await fetch(`${formData.base_url}/models`, {
          headers: { 
            'Authorization': `Bearer ${formData.api_key}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const models = Array.isArray(data.data) 
            ? data.data.map(m => ({ id: m.id, label: m.id }))
            : [];
          
          setTestResult({
            success: true,
            message: `Connection successful! Found ${models.length} model(s).`,
            models
          });
        } else {
          setTestResult({
            success: false,
            message: `Connection failed: ${response.status} ${response.statusText}`
          });
        }
      } else {
        setTestResult({
          success: false,
          message: 'Please fill in all required fields to test connection.'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection error: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.id || !formData.name) {
        throw new Error('ID and name are required');
      }

      if (formData.config_type === 'openai_compatible' && !formData.base_url) {
        throw new Error('Base URL is required for OpenAI-compatible providers');
      }

      const providerData = {
        id: formData.id,
        name: formData.name,
        supports_dynamic_models: formData.supports_dynamic_models,
        config: {
          type: formData.config_type,
          base_url: formData.base_url || undefined,
          api_key: formData.api_key || undefined,
          env_var: formData.env_var || undefined
        },
        models: testResult?.models || formData.models || []
      };

      await onSubmit(providerData);
    } catch (error) {
      setError(error.message || 'Failed to save provider');
      setIsSubmitting(false);
    }
  };

  return (
    <form className="provider-form" onSubmit={handleSubmit}>
      {error && (
        <div className="provider-form__error" role="alert">
          {error}
        </div>
      )}

      <div className="provider-form__field">
        <label htmlFor="provider-id" className="provider-form__label">
          Provider ID *
        </label>
        <input
          id="provider-id"
          type="text"
          name="id"
          value={formData.id}
          onChange={handleChange}
          disabled={isEdit}
          placeholder="e.g., ollama, lmstudio"
          pattern="[a-z0-9-]+"
          title="Only lowercase letters, numbers, and dashes"
          required
          className="provider-form__input"
        />
        <p className="provider-form__hint">
          Unique identifier (lowercase letters, numbers, and dashes only)
        </p>
      </div>

      <div className="provider-form__field">
        <label htmlFor="provider-name" className="provider-form__label">
          Provider Name *
        </label>
        <input
          id="provider-name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Ollama, LM Studio"
          required
          className="provider-form__input"
        />
      </div>

      <div className="provider-form__field">
        <label htmlFor="config-type" className="provider-form__label">
          Provider Type *
        </label>
        <select
          id="config-type"
          name="config_type"
          value={formData.config_type}
          onChange={handleChange}
          className="provider-form__select"
        >
          <option value="openai_compatible">OpenAI-Compatible API</option>
          <option value="api_key">Custom API (API Key)</option>
        </select>
      </div>

      {formData.config_type === 'openai_compatible' && (
        <div className="provider-form__field">
          <label htmlFor="base-url" className="provider-form__label">
            Base URL *
          </label>
          <input
            id="base-url"
            type="url"
            name="base_url"
            value={formData.base_url}
            onChange={handleChange}
            placeholder="e.g., http://localhost:11434/v1"
            required
            className="provider-form__input"
          />
          <p className="provider-form__hint">
            API endpoint URL (should end with /v1 for OpenAI-compatible)
          </p>
        </div>
      )}

      <div className="provider-form__field">
        <label htmlFor="api-key" className="provider-form__label">
          API Key
        </label>
        <input
          id="api-key"
          type="password"
          name="api_key"
          value={formData.api_key}
          onChange={handleChange}
          placeholder="Leave empty to use environment variable"
          className="provider-form__input"
        />
      </div>

      <div className="provider-form__field">
        <label htmlFor="env-var" className="provider-form__label">
          Environment Variable Name
        </label>
        <input
          id="env-var"
          type="text"
          name="env_var"
          value={formData.env_var}
          onChange={handleChange}
          placeholder="e.g., OLLAMA_API_KEY"
          className="provider-form__input"
        />
        <p className="provider-form__hint">
          Alternative: Use an environment variable instead of storing the API key
        </p>
      </div>

      <div className="provider-form__field provider-form__field--checkbox">
        <label className="provider-form__checkbox-label">
          <input
            type="checkbox"
            name="supports_dynamic_models"
            checked={formData.supports_dynamic_models}
            onChange={handleChange}
            className="provider-form__checkbox"
          />
          <span>Support dynamic model discovery</span>
        </label>
        <p className="provider-form__hint">
          Enable if the provider API supports listing available models
        </p>
      </div>

      {testResult && (
        <div className={`provider-form__test-result ${testResult.success ? 'success' : 'error'}`} role="status">
          <p>{testResult.message}</p>
          {testResult.models && testResult.models.length > 0 && (
            <details className="provider-form__models-details">
              <summary>Show detected models ({testResult.models.length})</summary>
              <ul className="provider-form__models-list">
                {testResult.models.slice(0, 10).map(m => (
                  <li key={m.id}>{m.label || m.id}</li>
                ))}
                {testResult.models.length > 10 && (
                  <li>... and {testResult.models.length - 10} more</li>
                )}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="provider-form__actions">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={isTesting || !formData.base_url || !formData.api_key}
          className="provider-form__test-btn"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="provider-form__cancel-btn"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="provider-form__submit-btn"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Provider' : 'Add Provider'}
        </button>
      </div>
    </form>
  );
}
