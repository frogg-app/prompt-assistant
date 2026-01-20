/**
 * App.jsx - Main Application Component
 * 
 * Modern AI chat interface for prompt refinement with:
 * - Chat window for conversation history
 * - Composer for prompt input
 * - Inspector panel for options (model, prompt type, constraints)
 * - Responsive and accessible design
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import ChatWindow from './components/ChatWindow/ChatWindow';
import Composer from './components/Composer/Composer';
import { InspectorPanel } from './components/Inspector';
import { ProviderManager } from './components/ProviderManager';
import { useChat } from './hooks/useChat';
import { useProviders } from './hooks/useProviders';
import { useLocalStorage } from './hooks/useLocalStorage';
import { buildPromptPayload, validatePayload } from './utils/schema';
import { STORAGE_KEYS, API_BASE } from './utils/constants';
import './styles/globals.css';

/**
 * Main App component
 */
export default function App() {
  // Theme state
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, 'system');
  
  // Inspector panel visibility
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  
  // Provider manager visibility
  const [isProviderManagerOpen, setIsProviderManagerOpen] = useState(false);
  
  // Prompt input
  const [promptText, setPromptText] = useState('');
  
  // Prompt type selection (default: none)
  const [promptType, setPromptType] = useLocalStorage(
    STORAGE_KEYS.PROMPT_TYPE || 'prompt-type',
    'none'
  );
  
  // Constraints list
  const [constraints, setConstraints] = useLocalStorage(
    STORAGE_KEYS.CONSTRAINTS || 'constraints',
    []
  );
  
  // Provider and model state
  const {
    providers,
    models,
    selectedProvider,
    selectedModel,
    currentProvider,
    currentModel,
    isLoadingProviders,
    isLoadingModels,
    isRescanning,
    providersReady,
    providerError,
    setSelectedProvider,
    setSelectedModel,
    refreshProviders,
    rescanProviders
  } = useProviders();
  
  // Chat state
  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    sendPrompt,
    submitClarifications,
    clearChat
  } = useChat();

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Handle theme toggle
  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme);
  }, [setTheme]);

  // Toggle inspector panel
  const handleToggleInspector = useCallback(() => {
    setIsInspectorOpen(prev => !prev);
  }, []);

  // Build current payload for export
  const currentPayload = useMemo(() => {
    return buildPromptPayload({
      roughPrompt: promptText,
      promptType,
      constraints,
      model: {
        provider: selectedProvider,
        name: currentModel?.name || selectedModel,
        version: currentModel?.version || null
      },
      uiState: {
        inspectorOpen: isInspectorOpen,
        theme
      }
    });
  }, [
    promptText,
    promptType,
    constraints,
    selectedProvider,
    selectedModel,
    currentModel,
    isInspectorOpen,
    theme
  ]);

  // Export payload as JSON
  const handleExportJSON = useCallback(() => {
    const payload = currentPayload;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-payload-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentPayload]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!promptText.trim()) return;
    if (!providersReady) return;

    const payload = buildPromptPayload({
      roughPrompt: promptText.trim(),
      promptType,
      constraints,
      model: {
        provider: selectedProvider,
        name: currentModel?.name || selectedModel,
        version: currentModel?.version || null
      }
    });

    // Validate payload
    const validation = validatePayload(payload);
    if (!validation.valid) {
      console.error('Payload validation errors:', validation.errors);
      return;
    }

    // Send to chat
    sendPrompt(payload);
    
    // Clear input
    setPromptText('');
  }, [
    promptText,
    promptType,
    constraints,
    selectedProvider,
    selectedModel,
    currentModel,
    providersReady,
    sendPrompt
  ]);

  // Handle clarification submission
  const handleClarificationSubmit = useCallback((answers) => {
    submitClarifications(answers);
  }, [submitClarifications]);

  // Provider management handlers
  const handleProviderAdded = useCallback(async (providerData) => {
    const response = await fetch(`${API_BASE}/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(providerData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add provider');
    }
    
    await refreshProviders();
  }, [refreshProviders]);

  const handleProviderUpdated = useCallback(async (providerId, updates) => {
    const response = await fetch(`${API_BASE}/providers/${providerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update provider');
    }
    
    await refreshProviders();
  }, [refreshProviders]);

  const handleProviderDeleted = useCallback(async (providerId) => {
    const response = await fetch(`${API_BASE}/providers/${providerId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete provider');
    }
    
    await refreshProviders();
  }, [refreshProviders]);

  // Determine if submit is disabled
  const isSubmitDisabled = useMemo(() => {
    return (
      isChatLoading ||
      isLoadingProviders ||
      !providersReady ||
      !promptText.trim()
    );
  }, [isChatLoading, isLoadingProviders, providersReady, promptText]);

  return (
    <div className="app">
      {/* Header */}
      <Header
        theme={theme}
        onThemeChange={handleThemeChange}
        onExportJSON={handleExportJSON}
        onToggleInspector={handleToggleInspector}
        inspectorVisible={isInspectorOpen}
      />
      
      {/* Main layout */}
      <div className="app__layout">
        {/* Chat area */}
        <main className="app__main">
          {/* Provider error notice */}
          {providerError && (
            <div className="app__notice app__notice--error" role="alert">
              <p>{providerError}</p>
            </div>
          )}
          
          {/* Chat error notice */}
          {chatError && (
            <div className="app__notice app__notice--error" role="alert">
              <p>{chatError}</p>
            </div>
          )}
          
          {/* Chat window */}
          <ChatWindow
            messages={messages}
            isLoading={isChatLoading}
            onClarificationSubmit={handleClarificationSubmit}
          />
          
          {/* Composer */}
          <Composer
            value={promptText}
            onChange={setPromptText}
            onSubmit={handleSubmit}
            disabled={isSubmitDisabled}
            placeholder={
              !providersReady
                ? 'Configure a provider to start...'
                : 'Enter your rough prompt here...'
            }
          />
        </main>
        
        {/* Inspector Panel */}
        <InspectorPanel
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          // Model selection
          providers={providers}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          isLoadingModels={isLoadingModels}
          // Prompt type
          promptType={promptType}
          onPromptTypeChange={setPromptType}
          // Constraints
          constraints={constraints}
          onConstraintsChange={setConstraints}
          // Disabled state
          disabled={isChatLoading}
          onManageProviders={() => setIsProviderManagerOpen(true)}
        />
      </div>
      
      {/* Provider Manager Modal */}
      <ProviderManager
        isOpen={isProviderManagerOpen}
        onClose={() => setIsProviderManagerOpen(false)}
        providers={providers}
        onProviderAdded={handleProviderAdded}
        onProviderUpdated={handleProviderUpdated}
        onProviderDeleted={handleProviderDeleted}
        onRescan={rescanProviders}
        isRescanning={isRescanning}
      />
      
      {/* Mobile inspector toggle button */}
      <button
        className="app__mobile-toggle"
        onClick={handleToggleInspector}
        aria-label={isInspectorOpen ? 'Close options panel' : 'Open options panel'}
        aria-expanded={isInspectorOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>
  );
}
