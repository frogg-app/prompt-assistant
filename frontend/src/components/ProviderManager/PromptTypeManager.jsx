/**
 * PromptTypeManager Component
 * Modal for managing custom prompt types (add, edit, delete, reset)
 */

import { useState, useEffect } from 'react';
import { Button, Input } from '../ui';
import './PromptTypeManager.css';

export default function PromptTypeManager({ 
  isOpen, 
  onClose, 
  promptTypes = [],
  onRefresh
}) {
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [selectedType, setSelectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    icon: '📝',
    systemPrompt: ''
  });

  useEffect(() => {
    if (view === 'edit' && selectedType) {
      setFormData({
        id: selectedType.id,
        name: selectedType.name,
        description: selectedType.description || '',
        icon: selectedType.icon || '📝',
        systemPrompt: selectedType.systemPrompt || ''
      });
    } else if (view === 'add') {
      setFormData({
        id: '',
        name: '',
        description: '',
        icon: '📝',
        systemPrompt: ''
      });
    }
  }, [view, selectedType]);

  if (!isOpen) return null;

  const handleAddType = () => {
    setSelectedType(null);
    setError(null);
    setView('add');
  };

  const handleEditType = (type) => {
    setSelectedType(type);
    setError(null);
    setView('edit');
  };

  const handleDeleteType = async (type) => {
    if (type.builtin) {
      alert('Cannot delete built-in prompt types');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${type.name}"?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/prompt-types/${type.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete prompt type');
      }

      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetType = async (type) => {
    if (!type.builtin) {
      alert('Can only reset built-in prompt types');
      return;
    }

    if (!window.confirm(`Reset "${type.name}" to default system prompt?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/prompt-types/${type.id}/reset`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset prompt type');
      }

      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (view === 'add') {
        const response = await fetch('/prompt-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add prompt type');
        }
      } else if (view === 'edit') {
        const { id, ...updates } = formData;
        const response = await fetch(`/prompt-types/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update prompt type');
        }
      }

      await onRefresh();
      setView('list');
      setSelectedType(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setView('list');
    setSelectedType(null);
    setError(null);
  };

  const customTypes = promptTypes.filter(t => !t.builtin);

  return (
    <div className="prompt-type-manager__overlay" onClick={onClose}>
      <div 
        className="prompt-type-manager__modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="prompt-type-manager-title"
      >
        <div className="prompt-type-manager__header">
          <h2 id="prompt-type-manager-title">
            {view === 'list' && 'Manage Prompt Types'}
            {view === 'add' && 'Add Custom Prompt Type'}
            {view === 'edit' && `Edit ${selectedType?.builtin ? 'System Prompt' : 'Prompt Type'}`}
          </h2>
          <button
            className="prompt-type-manager__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="prompt-type-manager__content">
          {error && (
            <div className="prompt-type-manager__error" role="alert">
              {error}
            </div>
          )}

          {view === 'list' && (
            <>
              <div className="prompt-type-manager__actions">
                <button 
                  className="prompt-type-manager__add-btn"
                  onClick={handleAddType}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Custom Type
                </button>
              </div>

              <div className="prompt-type-manager__section">
                <h3>Built-in Prompt Types</h3>
                <div className="prompt-type-manager__list">
                  {promptTypes.filter(t => t.builtin).map(type => (
                    <div key={type.id} className="prompt-type-item">
                      <div className="prompt-type-item__header">
                        <span className="prompt-type-item__icon">{type.icon}</span>
                        <div className="prompt-type-item__info">
                          <h4>{type.name}</h4>
                          <p>{type.description}</p>
                        </div>
                      </div>
                      <div className="prompt-type-item__actions">
                        <button
                          onClick={() => handleEditType(type)}
                          className="prompt-type-item__edit"
                          title="Edit system prompt"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {type.systemPrompt && (
                          <button
                            onClick={() => handleResetType(type)}
                            className="prompt-type-item__reset"
                            title="Reset to default"
                            disabled={isLoading}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {customTypes.length > 0 && (
                <div className="prompt-type-manager__section">
                  <h3>Custom Prompt Types</h3>
                  <div className="prompt-type-manager__list">
                    {customTypes.map(type => (
                      <div key={type.id} className="prompt-type-item">
                        <div className="prompt-type-item__header">
                          <span className="prompt-type-item__icon">{type.icon}</span>
                          <div className="prompt-type-item__info">
                            <h4>{type.name}</h4>
                            <p>{type.description}</p>
                          </div>
                        </div>
                        <div className="prompt-type-item__actions">
                          <button
                            onClick={() => handleEditType(type)}
                            className="prompt-type-item__edit"
                            title="Edit"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteType(type)}
                            className="prompt-type-item__delete"
                            title="Delete"
                            disabled={isLoading}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {(view === 'add' || view === 'edit') && (
            <form onSubmit={handleSubmit} className="prompt-type-form">
              {view === 'add' && (
                <>
                  <div className="prompt-type-form__field">
                    <label htmlFor="type-id">ID *</label>
                    <Input
                      id="type-id"
                      value={formData.id}
                      onChange={(e) => setFormData({...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                      placeholder="e.g., my-custom-type"
                      required
                      disabled={isLoading}
                    />
                    <small>Lowercase, alphanumeric with dashes only</small>
                  </div>

                  <div className="prompt-type-form__field">
                    <label htmlFor="type-name">Name *</label>
                    <Input
                      id="type-name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., My Custom Type"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="prompt-type-form__field">
                    <label htmlFor="type-icon">Icon</label>
                    <Input
                      id="type-icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      placeholder="📝"
                      maxLength={2}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="prompt-type-form__field">
                    <label htmlFor="type-description">Description</label>
                    <Input
                      id="type-description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Brief description of this prompt type"
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              <div className="prompt-type-form__field">
                <label htmlFor="type-system-prompt">
                  System Prompt {view === 'edit' && selectedType?.builtin && '(Override)'}
                </label>
                <textarea
                  id="type-system-prompt"
                  className="prompt-type-form__textarea"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({...formData, systemPrompt: e.target.value})}
                  placeholder="Instructions for refining this type of prompt..."
                  rows={12}
                  disabled={isLoading}
                />
                <small>
                  This guidance is added to the main system prompt when this type is selected.
                  {view === 'edit' && selectedType?.builtin && ' Leave empty to use default.'}
                </small>
              </div>

              <div className="prompt-type-form__actions">
                <Button type="button" variant="ghost" onClick={handleCancel} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : view === 'add' ? 'Add' : 'Save'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
