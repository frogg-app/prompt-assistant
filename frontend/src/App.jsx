/**
 * App.jsx - Main Application Component
 * 
 * Modern AI chat interface for prompt refinement with:
 * - Left sidebar for chat history and navigation
 * - Chat window for conversation history
 * - Composer for prompt input
 * - Inspector panel for options (model, prompt type, constraints)
 * - Setup wizard for new chats
 * - User authentication support
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import ChatWindow from './components/ChatWindow/ChatWindow';
import Composer from './components/Composer/Composer';
import { InspectorPanel } from './components/Inspector';
import { ProviderManager } from './components/ProviderManager';
import PromptTypeManager from './components/ProviderManager/PromptTypeManager';
import { SetupWizard } from './components/SetupWizard';
import { AuthModal } from './components/Auth';
import { useChat } from './hooks/useChat';
import { useProviders } from './hooks/useProviders';
import { usePromptTypes } from './hooks/usePromptTypes';
import { useChatSessions } from './hooks/useChatSessions';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './contexts/AuthContext';
import { buildPromptPayload, validatePayload } from './utils/schema';
import { STORAGE_KEYS } from './utils/constants';
import './styles/globals.css';

/**
 * Main App component
 */
export default function App() {
  // Auth state
  const { user, signOut } = useAuth();
  
  // Theme state
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, 'system');
  
  // Inspector panel visibility - closed by default on mobile
  const [isInspectorOpen, setIsInspectorOpen] = useState(() => {
    // Default to closed on mobile screens
    return typeof window !== 'undefined' && window.innerWidth >= 1200;
  });
  
  // Keep inspector visibility in sync with viewport size
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const shouldBeOpen = window.innerWidth >= 1200;
      setIsInspectorOpen(shouldBeOpen);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Sidebar visibility (mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Provider manager visibility
  const [isProviderManagerOpen, setIsProviderManagerOpen] = useState(false);
  
  // Prompt type manager visibility
  const [isPromptTypeManagerOpen, setIsPromptTypeManagerOpen] = useState(false);
  
  // Auth modal visibility - open by default if not authenticated
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Show auth modal if user is not logged in
  useEffect(() => {
    if (!user) {
      setIsAuthModalOpen(true);
    }
  }, [user]);
  
  // Setup wizard visibility
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  
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
  
  // Learning mode (opt-in) - provides detailed feedback and scores
  const [learningMode, setLearningMode] = useState(false);
  
  // Chat sessions management
  const {
    sessions,
    currentSession,
    currentSessionId,
    createSession,
    updateSessionMessages,
    deleteSession,
    selectSession
  } = useChatSessions(user?.id);
  
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
    rescanProviders,
    refreshModelsForProvider
  } = useProviders();
  
  // Prompt types state
  const {
    promptTypes,
    refreshPromptTypes
  } = usePromptTypes();
  
  // Chat state
  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    sendPrompt,
    submitClarifications,
    skipClarifications,
    cancelClarification,
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

  // Toggle sidebar (mobile)
  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Build current payload for export
  const currentPayload = useMemo(() => {
    return buildPromptPayload({
      roughPrompt: promptText,
      promptType,
      constraints,
      model: {
        provider: selectedProvider,
        name: currentModel?.id || selectedModel,
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

  // Toast state for temporary notifications
  const [toast, setToast] = useState(null);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!promptText.trim()) return;
    if (!providersReady) return;

    const payload = buildPromptPayload({
      roughPrompt: promptText.trim(),
      promptType,
      constraints,
      model: {
        provider: selectedProvider,
        name: currentModel?.id || selectedModel,
        version: currentModel?.version || null
      },
      options: {
        learningMode: learningMode
      }
    });

    // Validate payload
    const validation = validatePayload(payload);
    if (!validation.valid) {
      console.error('Payload validation errors:', validation.errors);
      return;
    }

    // Send to chat and check result
    const result = await sendPrompt(payload);
    
    // Only clear input on success
    if (result?.success) {
      setPromptText('');
    } else {
      // Show toast on failure
      setToast({ type: 'error', message: 'Request failed' });
      setTimeout(() => setToast(null), 4000);
    }
  }, [
    promptText,
    promptType,
    constraints,
    learningMode,
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

  // Handle clarification skip (with optional freeform text)
  const handleClarificationSkip = useCallback((freeformText) => {
    skipClarifications(freeformText);
  }, [skipClarifications]);

  // Handle clarification cancel
  const handleClarificationCancel = useCallback(() => {
    cancelClarification();
  }, [cancelClarification]);

  // Handle new chat - show setup wizard if no defaults
  const handleNewChat = useCallback(() => {
    // Create a new session
    createSession({
      provider: selectedProvider,
      model: selectedModel,
      promptType,
      learningMode
    });
    
    // Clear current chat
    clearChat();
    
    // Show setup wizard if provider not configured
    if (!providersReady) {
      setIsSetupWizardOpen(true);
    }
  }, [createSession, clearChat, providersReady, selectedProvider, selectedModel, promptType, learningMode]);

  // Handle session selection
  const handleSelectSession = useCallback((sessionId) => {
    selectSession(sessionId);
  }, [selectSession]);

  // Handle session deletion
  const handleDeleteSession = useCallback((sessionId) => {
    deleteSession(sessionId);
  }, [deleteSession]);

  // Handle setup wizard complete
  const handleSetupComplete = useCallback(() => {
    // Setup is complete, wizard will close
  }, []);

  // Handle add constraints from wizard
  const handleAddConstraintsFromWizard = useCallback(() => {
    setIsInspectorOpen(true);
  }, []);

  // Determine if input is disabled (prevents typing)
  const isInputDisabled = useMemo(() => {
    return (
      isChatLoading ||
      isLoadingProviders ||
      !providersReady
    );
  }, [isChatLoading, isLoadingProviders, providersReady]);

  // Determine if submit is disabled (prevents sending)
  const isSubmitDisabled = useMemo(() => {
    return (
      isInputDisabled ||
      !promptText.trim()
    );
  }, [isInputDisabled, promptText]);

  return (
    <div className="app">
      {/* Header */}
      <Header
        theme={theme}
        onThemeChange={handleThemeChange}
        onNewChat={handleNewChat}
        hasMessages={messages.length > 0}
        onMenuClick={handleToggleSidebar}
      />
      
      {/* Main layout */}
      <div className="app__layout">
        {/* Left Sidebar */}
        <Sidebar
          chatSessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          user={user}
          onSignIn={() => setIsAuthModalOpen(true)}
          onSignOut={signOut}
          onOpenSettings={() => setIsProviderManagerOpen(true)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        {/* Chat area */}
        <main className="app__main">
          {/* Provider error notice */}
          {providerError && (
            <div className="app__notice app__notice--error" role="alert">
              <p>{providerError}</p>
            </div>
          )}
          
          {/* Chat window */}
          <ChatWindow
            messages={messages}
            isLoading={isChatLoading}
            onClarificationSubmit={handleClarificationSubmit}
            onClarificationCancel={handleClarificationCancel}
            onClarificationSkip={handleClarificationSkip}
          />
          
          {/* Composer */}
          <Composer
            value={promptText}
            onChange={setPromptText}
            onSubmit={handleSubmit}
            disabled={isInputDisabled}
            submitDisabled={isSubmitDisabled}
            isLoading={isChatLoading}
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
          promptTypes={promptTypes}
          // Constraints
          constraints={constraints}
          onConstraintsChange={setConstraints}
          // Learning mode
          learningMode={learningMode}
          onLearningModeChange={setLearningMode}
          // Disabled state
          disabled={isChatLoading}
          onManageProviders={() => setIsProviderManagerOpen(true)}
          onManagePromptTypes={() => setIsPromptTypeManagerOpen(true)}
        />
      </div>
      
      {/* Provider Manager Modal */}
      <ProviderManager
        isOpen={isProviderManagerOpen}
        onClose={() => setIsProviderManagerOpen(false)}
        providers={providers}
        onRescan={rescanProviders}
        isRescanning={isRescanning}
      />
      
      {/* Prompt Type Manager Modal */}
      <PromptTypeManager
        isOpen={isPromptTypeManagerOpen}
        onClose={() => setIsPromptTypeManagerOpen(false)}
        promptTypes={promptTypes}
        onRefresh={refreshPromptTypes}
      />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        requireAuth={!user}
      />
      
      {/* Setup Wizard */}
      <SetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        onComplete={handleSetupComplete}
        providers={providers}
        models={models}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onProviderChange={setSelectedProvider}
        onModelChange={setSelectedModel}
        promptTypes={promptTypes}
        selectedPromptType={promptType}
        onPromptTypeChange={setPromptType}
        learningMode={learningMode}
        onLearningModeChange={setLearningMode}
        onAddConstraints={handleAddConstraintsFromWizard}
        hasDefaults={!!selectedProvider && !!selectedModel}
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
      
      {/* Toast notification */}
      {toast && (
        <div className={`app__toast app__toast--${toast.type}`} role="alert">
          <span>{toast.message}</span>
          <button 
            className="app__toast-close" 
            onClick={() => setToast(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
