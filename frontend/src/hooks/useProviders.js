import { useState, useEffect, useCallback, useRef } from 'react';
import { getModelDisplayInfo } from '../utils/schema';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../utils/constants';
import { isFrontendProvider, fetchProviderModels } from '../services/llm';
import { apiKeyStorage } from '../services/api-key-storage';

/**
 * Built-in frontend providers that call APIs directly from the browser
 * CLI-based providers (copilot, claude) are not included as they require backend
 */
const FRONTEND_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    available: false, // Will be set based on API key
    supports_dynamic_models: true,
    setup: {
      env: [],
      docs: 'https://platform.openai.com/api-keys',
      steps: [
        'Create an API key in the OpenAI dashboard.',
        'Enter your API key in the settings below.',
        'Your key is stored locally in your browser.'
      ]
    }
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    available: false, // Will be set based on API key
    supports_dynamic_models: true,
    setup: {
      env: [],
      docs: 'https://ai.google.dev/gemini-api/docs/api-key',
      steps: [
        'Create a Gemini API key in Google AI Studio.',
        'Enter your API key in the settings below.',
        'Your key is stored locally in your browser.'
      ]
    }
  }
];

/**
 * Hook for managing providers and models state
 * Frontend-only: providers use API keys stored in localStorage
 * Models are cached and only fetched once on launch or when manually rescanned
 * @returns {Object} Provider and model state and handlers
 */
export function useProviders() {
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [providersReady, setProvidersReady] = useState(false);
  const [providerError, setProviderError] = useState(null);
  const [modelHint, setModelHint] = useState('');
  
  // Track if models have been fetched for a provider (to avoid refetching)
  const fetchedModelsRef = useRef(new Set());
  
  const [selectedProvider, setSelectedProvider] = useLocalStorage(
    STORAGE_KEYS.LAST_PROVIDER,
    ''
  );
  const [selectedModel, setSelectedModel] = useLocalStorage(
    STORAGE_KEYS.LAST_MODEL,
    ''
  );

  // Load providers function - now uses local API key storage
  const loadProviders = useCallback(async () => {
    setIsLoadingProviders(true);
    setProviderError(null);
    
    try {
      // Build provider list based on which ones have API keys configured
      const providerList = FRONTEND_PROVIDERS.map(provider => {
        const hasKey = apiKeyStorage.has(provider.id);
        return {
          ...provider,
          available: hasKey,
          unavailable_reason: hasKey ? '' : 'API key not configured. Click to add your key.'
        };
      });
      
      setProviders(providerList);
      
      const hasAvailable = providerList.some(p => p.available);
      setProvidersReady(hasAvailable);
      
      if (hasAvailable) {
        // Use stored provider if available, otherwise first available
        const storedProviderAvailable = providerList.some(
          p => p.id === selectedProvider && p.available
        );
        
        if (!storedProviderAvailable) {
          // Clear both provider and model if stored provider is not available
          const firstAvailable = providerList.find(p => p.available);
          if (firstAvailable) {
            setSelectedProvider(firstAvailable.id);
          } else {
            setSelectedProvider('');
          }
          setSelectedModel(''); // Clear model when provider changes
        }
      } else {
        setProviderError(
          'No API keys configured. Add your OpenAI or Gemini API key to get started.'
        );
      }
    } catch (error) {
      setProviderError('Failed to load providers.');
      setProvidersReady(false);
    } finally {
      setIsLoadingProviders(false);
    }
  }, [selectedProvider, setSelectedProvider, setSelectedModel]);

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  // Load models when provider changes (uses cache, only fetch once per session)
  useEffect(() => {
    async function loadModels() {
      if (!selectedProvider || !providersReady) {
        setModels([]);
        setSelectedModel(''); // Clear model when no provider is selected
        return;
      }
      
      // Check if this is a frontend provider
      if (!isFrontendProvider(selectedProvider)) {
        setModelHint('This provider requires backend support (CLI-based).');
        setModels([]);
        return;
      }
      
      // Get API key for this provider
      const apiKey = apiKeyStorage.get(selectedProvider);
      if (!apiKey) {
        setModelHint('API key not configured.');
        setModels([]);
        return;
      }
      
      setIsLoadingModels(true);
      setModelHint('');
      
      try {
        // Fetch models using the frontend service
        const modelList = await fetchProviderModels(selectedProvider, apiKey);
        
        // Mark as fetched
        fetchedModelsRef.current.add(selectedProvider);
        
        // Enhance models with display info
        const enhancedModels = modelList.map(model => {
          const displayInfo = getModelDisplayInfo(model.id, model.label);
          return {
            ...model,
            ...displayInfo
          };
        });
        
        setModels(enhancedModels);
        setModelHint(`Loaded ${enhancedModels.length} models.`);
        
        // Use stored model if available, otherwise first in list
        const storedModelAvailable = enhancedModels.some(m => m.id === selectedModel);
        if (!storedModelAvailable && enhancedModels.length > 0) {
          setSelectedModel(enhancedModels[0].id);
        }
      } catch (error) {
        console.error('Failed to load models:', error);
        setModelHint('Failed to load models. Check your API key.');
        setModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    }
    
    loadModels();
  }, [selectedProvider, providersReady, setSelectedModel]);

  // Rescan all providers (manual refresh)
  const handleRescan = useCallback(async () => {
    setIsRescanning(true);
    
    try {
      // Clear the fetched cache to force reload
      fetchedModelsRef.current.clear();
      
      // Reload providers
      await loadProviders();
      
      // If we have a selected provider with an API key, reload its models
      if (selectedProvider && isFrontendProvider(selectedProvider)) {
        const apiKey = apiKeyStorage.get(selectedProvider);
        if (apiKey) {
          setIsLoadingModels(true);
          const modelList = await fetchProviderModels(selectedProvider, apiKey);
          fetchedModelsRef.current.add(selectedProvider);
          
          const enhancedModels = modelList.map(model => {
            const displayInfo = getModelDisplayInfo(model.id, model.label);
            return { ...model, ...displayInfo };
          });
          
          setModels(enhancedModels);
          setModelHint(`Loaded ${enhancedModels.length} models.`);
          setIsLoadingModels(false);
        }
      }
    } catch (error) {
      console.error('Rescan failed:', error);
    } finally {
      setIsRescanning(false);
    }
  }, [selectedProvider, loadProviders]);

  // Refresh models for a specific provider (e.g. after API key changes)
  const refreshModelsForProvider = useCallback(async (providerId) => {
    // Clear cache for this provider so next fetch gets fresh data
    fetchedModelsRef.current.delete(providerId);
    
    // If this is the currently selected provider, reload models immediately
    if (providerId === selectedProvider && isFrontendProvider(providerId)) {
      const apiKey = apiKeyStorage.get(providerId);
      if (!apiKey) {
        setModels([]);
        setModelHint('API key not configured.');
        return;
      }
      
      setIsLoadingModels(true);
      
      try {
        const modelList = await fetchProviderModels(providerId, apiKey);
        fetchedModelsRef.current.add(providerId);
        
        const enhancedModels = modelList.map(model => {
          const displayInfo = getModelDisplayInfo(model.id, model.label);
          return { ...model, ...displayInfo };
        });
        
        setModels(enhancedModels);
        setModelHint(`Loaded ${enhancedModels.length} models.`);
        
        // If currently selected model is no longer available, select first
        const storedModelAvailable = enhancedModels.some(m => m.id === selectedModel);
        if (!storedModelAvailable && enhancedModels.length > 0) {
          setSelectedModel(enhancedModels[0].id);
        }
      } catch (error) {
        console.error('Failed to refresh models:', error);
        setModelHint('Failed to load models.');
      } finally {
        setIsLoadingModels(false);
      }
    }
  }, [selectedProvider, selectedModel, setSelectedModel]);

  // Get currently selected model object
  const currentModel = models.find(m => m.id === selectedModel) || null;
  const currentProvider = providers.find(p => p.id === selectedProvider) || null;

  const handleProviderChange = useCallback((providerId) => {
    setSelectedProvider(providerId);
    setSelectedModel(''); // Reset model when provider changes
  }, [setSelectedProvider, setSelectedModel]);

  const handleModelChange = useCallback((modelId) => {
    setSelectedModel(modelId);
  }, [setSelectedModel]);

  return {
    // State
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
    modelHint,
    
    // Actions
    setSelectedProvider: handleProviderChange,
    setSelectedModel: handleModelChange,
    refreshProviders: loadProviders,
    rescanProviders: handleRescan,
    refreshModelsForProvider
  };
}
