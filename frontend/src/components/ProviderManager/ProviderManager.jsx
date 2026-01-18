/**
 * ProviderManager Component
 * Modal for managing custom providers (add, edit, delete)
 */

import { useState } from 'react';
import ProviderForm from './ProviderForm';
import ModelFilter from './ModelFilter';
import './ProviderManager.css';

export default function ProviderManager({ 
  isOpen, 
  onClose, 
  providers = [],
  onProviderAdded,
  onProviderUpdated,
  onProviderDeleted
}) {
  const [view, setView] = useState('list'); // 'list', 'add', 'edit', 'filter'
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleAddProvider = () => {
    setSelectedProvider(null);
    setView('add');
  };

  const handleEditProvider = (provider) => {
    setSelectedProvider(provider);
    setView('edit');
  };

  const handleFilterModels = (provider) => {
    setSelectedProvider(provider);
    setView('filter');
  };

  const handleDeleteProvider = async (providerId) => {
    // TODO: Replace with proper confirmation modal for better accessibility
    if (!window.confirm('Are you sure you want to delete this provider?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onProviderDeleted(providerId);
      setView('list');
    } catch (error) {
      // TODO: Replace alert with toast notification or inline error display
      window.alert(`Failed to delete provider: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (providerData) => {
    try {
      if (view === 'add') {
        await onProviderAdded(providerData);
      } else if (view === 'edit') {
        await onProviderUpdated(selectedProvider.id, providerData);
      }
      setView('list');
      setSelectedProvider(null);
    } catch (error) {
      throw error;
    }
  };

  const handleFormCancel = () => {
    setView('list');
    setSelectedProvider(null);
  };

  const handleFilterSubmit = async (filteredModels) => {
    setView('list');
    setSelectedProvider(null);
  };

  const customProviders = providers.filter(p => !p.builtin);

  return (
    <div className="provider-manager__overlay" onClick={onClose}>
      <div 
        className="provider-manager__modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="provider-manager-title"
      >
        <div className="provider-manager__header">
          <h2 id="provider-manager-title">
            {view === 'list' && 'Manage Providers'}
            {view === 'add' && 'Add New Provider'}
            {view === 'edit' && 'Edit Provider'}
            {view === 'filter' && 'Filter Models'}
          </h2>
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
          {view === 'list' && (
            <>
              <div className="provider-manager__actions">
                <button 
                  className="provider-manager__add-btn"
                  onClick={handleAddProvider}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Custom Provider
                </button>
              </div>

              {customProviders.length === 0 ? (
                <div className="provider-manager__empty">
                  <p>No custom providers configured.</p>
                  <p className="provider-manager__hint">
                    Click "Add Custom Provider" to add OpenAI-compatible APIs or other custom LLM providers.
                  </p>
                </div>
              ) : (
                <div className="provider-manager__list">
                  {customProviders.map(provider => (
                    <div key={provider.id} className="provider-manager__item">
                      <div className="provider-manager__item-info">
                        <h3>{provider.name}</h3>
                        <p className="provider-manager__item-id">ID: {provider.id}</p>
                        <p className="provider-manager__item-type">
                          Type: {provider.config?.type || 'custom'}
                        </p>
                      </div>
                      <div className="provider-manager__item-actions">
                        <button
                          onClick={() => handleFilterModels(provider)}
                          className="provider-manager__item-btn"
                          title="Filter models"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                          </svg>
                          Filter Models
                        </button>
                        <button
                          onClick={() => handleEditProvider(provider)}
                          className="provider-manager__item-btn"
                          title="Edit provider"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="provider-manager__item-btn provider-manager__item-btn--danger"
                          disabled={isDeleting}
                          title="Delete provider"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="provider-manager__builtin-section">
                <h3>Built-in Providers</h3>
                <p className="provider-manager__hint">
                  Built-in providers (OpenAI, Gemini, Copilot CLI, Claude Code) cannot be modified.
                  Configure them using environment variables or CLI authentication.
                </p>
                <div className="provider-manager__builtin-list">
                  {providers.filter(p => p.builtin).map(provider => (
                    <div key={provider.id} className="provider-manager__builtin-item">
                      <span className="provider-manager__builtin-name">{provider.name}</span>
                      <span className={`provider-manager__builtin-status ${provider.available ? 'available' : 'unavailable'}`}>
                        {provider.available ? '✓ Available' : '✗ Not configured'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {(view === 'add' || view === 'edit') && (
            <ProviderForm
              provider={selectedProvider}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isEdit={view === 'edit'}
            />
          )}

          {view === 'filter' && selectedProvider && (
            <ModelFilter
              provider={selectedProvider}
              onSubmit={handleFilterSubmit}
              onCancel={handleFormCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
