/**
 * ModelFilter Component
 * UI for filtering which models are visible for a provider
 */

import { useState, useEffect } from 'react';
import { API_BASE } from '../../utils/constants';

export default function ModelFilter({ provider, onSubmit, onCancel }) {
  const [availableModels, setAvailableModels] = useState([]);
  const [filteredModelIds, setFilteredModelIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadModels();
  }, [provider]);

  const loadModels = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Encode provider ID to prevent path traversal
      const encodedProviderId = encodeURIComponent(provider.id);
      
      // Fetch all available models for the provider
      const availableResponse = await fetch(
        `${API_BASE}/providers/${encodedProviderId}/available-models`
      );
      
      if (!availableResponse.ok) {
        throw new Error('Failed to fetch available models');
      }
      
      const availableData = await availableResponse.json();
      setAvailableModels(availableData.models || []);

      // Fetch currently filtered models
      const filteredResponse = await fetch(
        `${API_BASE}/providers/${encodedProviderId}/filtered-models`
      );
      
      if (filteredResponse.ok) {
        const filteredData = await filteredResponse.json();
        setFilteredModelIds(filteredData.filtered_models || []);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleModel = (modelId) => {
    setFilteredModelIds(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredList = filterModels(availableModels);
    setFilteredModelIds(filteredList.map(m => m.id));
  };

  const handleDeselectAll = () => {
    setFilteredModelIds([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const encodedProviderId = encodeURIComponent(provider.id);
      const response = await fetch(
        `${API_BASE}/providers/${encodedProviderId}/filtered-models`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model_ids: filteredModelIds })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save filtered models');
      }

      onSubmit(filteredModelIds);
    } catch (error) {
      setError(error.message);
      setIsSaving(false);
    }
  };

  const filterModels = (models) => {
    if (!searchQuery.trim()) return models;
    
    const query = searchQuery.toLowerCase();
    return models.filter(m => 
      m.id.toLowerCase().includes(query) || 
      (m.label && m.label.toLowerCase().includes(query))
    );
  };

  const filteredModels = filterModels(availableModels);
  const selectedCount = filteredModelIds.length;
  const totalCount = availableModels.length;

  return (
    <div className="model-filter">
      {/* Back button */}
      <button
        type="button"
        onClick={onCancel}
        className="model-filter__back-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Providers
      </button>

      {error && (
        <div className="model-filter__error" role="alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="model-filter__loading">
          <p>Loading available models...</p>
        </div>
      ) : (
        <>
          <div className="model-filter__header">
            <p className="model-filter__description">
              Select which models from <strong>{provider.name}</strong> should be visible in the model selector.
              Leave all unchecked to show all models.
            </p>
            <div className="model-filter__stats">
              {selectedCount === 0 ? (
                <span>All {totalCount} models will be shown</span>
              ) : (
                <span>{selectedCount} of {totalCount} models selected</span>
              )}
            </div>
          </div>

          <div className="model-filter__search">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="model-filter__search-input"
            />
          </div>

          <div className="model-filter__bulk-actions">
            <button
              type="button"
              onClick={handleSelectAll}
              className="model-filter__bulk-btn"
            >
              Select All {searchQuery && `(${filteredModels.length})`}
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="model-filter__bulk-btn"
            >
              Deselect All
            </button>
          </div>

          {filteredModels.length === 0 ? (
            <div className="model-filter__empty">
              <p>No models found{searchQuery ? ' matching your search' : ''}.</p>
            </div>
          ) : (
            <div className="model-filter__list">
              {filteredModels.map(model => (
                <label key={model.id} className="model-filter__item">
                  <input
                    type="checkbox"
                    checked={filteredModelIds.includes(model.id)}
                    onChange={() => handleToggleModel(model.id)}
                    className="model-filter__checkbox"
                  />
                  <div className="model-filter__item-info">
                    <span className="model-filter__item-label">
                      {model.label || model.id}
                    </span>
                    {model.id !== model.label && (
                      <span className="model-filter__item-id">{model.id}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="model-filter__actions">
            <button
              type="button"
              onClick={onCancel}
              className="model-filter__cancel-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="model-filter__save-btn"
            >
              {isSaving ? 'Saving...' : 'Save Filter'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
