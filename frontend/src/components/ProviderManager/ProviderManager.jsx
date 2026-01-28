/**
 * ProviderManager Component
 * Modal for managing API keys and custom providers
 * Now focuses on frontend-only API key management for OpenAI and Gemini
 */

import { useState, useEffect } from 'react';
import { apiKeyStorage } from '../../services/api-key-storage';
import { testProviderApiKey } from '../../services/llm';
import './ProviderManager.css';

export default function ProviderManager({ 
  isOpen, 
  onClose, 
  providers = [],
  onProviderAdded,
  onProviderUpdated,
  onProviderDeleted,
  onRescan,
  isRescanning = false,
  onModelsFiltered
}) {
  const [apiKeys, setApiKeys] = useState({});
  const [editingProvider, setEditingProvider] = useState(null);
  const [keyInput, setKeyInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load current API keys on mount
  useEffect(() => {
    if (isOpen) {
      const keys = {};
      providers.forEach(p => {
        keys[p.id] = apiKeyStorage.has(p.id);
      });
      setApiKeys(keys);
      setEditingProvider(null);
      setKeyInput('');
      setTestResult(null);
    }
  }, [isOpen, providers]);

  if (!isOpen) return null;

  const handleEditKey = (providerId) => {
    setEditingProvider(providerId);
    // Don't pre-fill the input with existing key for security
    setKeyInput('');
    setTestResult(null);
  };

  const handleCancelEdit = () => {
    setEditingProvider(null);
    setKeyInput('');
    setTestResult(null);
  };

  const handleTestKey = async () => {
    if (!keyInput.trim() || !editingProvider) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await testProviderApiKey(editingProvider, keyInput.trim());
      setTestResult(result);
    } catch (error) {
      setTestResult({ valid: false, error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveKey = async () => {
    if (!keyInput.trim() || !editingProvider) return;
    
    setIsSaving(true);
    
    try {
      apiKeyStorage.save(editingProvider, keyInput.trim());
      setApiKeys(prev => ({ ...prev, [editingProvider]: true }));
      setEditingProvider(null);
      setKeyInput('');
      setTestResult(null);
      
      // Refresh providers to update availability
      if (onRescan) {
        await onRescan();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKey = async (providerId) => {
    if (!window.confirm(`Remove API key for ${providerId}? You will need to re-enter it to use this provider.`)) {
      return;
    }
    
    apiKeyStorage.remove(providerId);
    setApiKeys(prev => ({ ...prev, [providerId]: false }));
    
    // Refresh providers to update availability
    if (onRescan) {
      await onRescan();
    }
  };

  // Filter to only show frontend providers (OpenAI, Gemini)
  const frontendProviders = providers.filter(p => 
    p.id === 'openai' || p.id === 'gemini'
  );

  return (
    <div className="provider-manager__overlay" onClick={onClose}>
      <div 
        className="provider-manager__modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="provider-manager-title"
      >
        <div className="provider-manager__header">
          <h2 id="provider-manager-title">API Key Settings</h2>
          <button
            className="provider-manager__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="provider-manager__content">
          <div className="provider-manager__info-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <p><strong>Your API keys are stored locally in your browser.</strong></p>
              <p>Keys are never sent to any server. All API calls are made directly from your browser to the provider.</p>
            </div>
          </div>

          <div className="provider-manager__providers-list">
            {frontendProviders.map(provider => (
              <div key={provider.id} className="provider-manager__provider-card">
                <div className="provider-manager__provider-header">
                  <div className="provider-manager__provider-info">
                    <h3>{provider.name}</h3>
                    <span className={`provider-manager__status ${apiKeys[provider.id] ? 'configured' : 'not-configured'}`}>
                      {apiKeys[provider.id] ? '✓ API Key Configured' : '○ Not Configured'}
                    </span>
                  </div>
                  
                  {editingProvider !== provider.id && (
                    <div className="provider-manager__provider-actions">
                      <button
                        className="provider-manager__btn provider-manager__btn--primary"
                        onClick={() => handleEditKey(provider.id)}
                      >
                        {apiKeys[provider.id] ? 'Change Key' : 'Add Key'}
                      </button>
                      {apiKeys[provider.id] && (
                        <button
                          className="provider-manager__btn provider-manager__btn--danger"
                          onClick={() => handleRemoveKey(provider.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Setup instructions */}
                {!apiKeys[provider.id] && editingProvider !== provider.id && provider.setup && (
                  <div className="provider-manager__setup-hint">
                    <p>
                      <a href={provider.setup.docs} target="_blank" rel="noopener noreferrer">
                        Get your API key →
                      </a>
                    </p>
                  </div>
                )}

                {/* Key editing form */}
                {editingProvider === provider.id && (
                  <div className="provider-manager__key-form">
                    <div className="provider-manager__key-input-group">
                      <label htmlFor={`api-key-${provider.id}`}>
                        API Key
                      </label>
                      <input
                        id={`api-key-${provider.id}`}
                        type="password"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder={`Enter your ${provider.name} API key`}
                        autoComplete="off"
                        className="provider-manager__key-input"
                      />
                    </div>

                    {testResult && (
                      <div className={`provider-manager__test-result ${testResult.valid ? 'success' : 'error'}`}>
                        {testResult.valid ? '✓ API key is valid' : `✗ ${testResult.error || 'Invalid API key'}`}
                      </div>
                    )}

                    <div className="provider-manager__key-actions">
                      <button
                        className="provider-manager__btn"
                        onClick={handleCancelEdit}
                        disabled={isTesting || isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        className="provider-manager__btn"
                        onClick={handleTestKey}
                        disabled={!keyInput.trim() || isTesting || isSaving}
                      >
                        {isTesting ? 'Testing...' : 'Test Key'}
                      </button>
                      <button
                        className="provider-manager__btn provider-manager__btn--primary"
                        onClick={handleSaveKey}
                        disabled={!keyInput.trim() || isTesting || isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save Key'}
                      </button>
                    </div>

                    {provider.setup && (
                      <div className="provider-manager__setup-steps">
                        <p><strong>How to get your API key:</strong></p>
                        <ol>
                          {provider.setup.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                        <p>
                          <a href={provider.setup.docs} target="_blank" rel="noopener noreferrer">
                            Open {provider.name} API Keys page →
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="provider-manager__footer-note">
            <h4>About CLI-based providers</h4>
            <p>
              Copilot CLI and Claude Code require local CLI authentication and are not supported 
              in this frontend-only version. These tools need to run on a backend server with 
              CLI access. See the CLI Tooling Plan in the documentation for future support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
