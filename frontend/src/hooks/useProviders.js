import { useState, useEffect, useCallback } from 'react';
import { fetchProviders, fetchModels } from '../utils/api';
import { getModelDisplayInfo } from '../utils/schema';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Hook for managing providers and models state
 * @returns {Object} Provider and model state and handlers
 */
export function useProviders() {
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [providersReady, setProvidersReady] = useState(false);
  const [providerError, setProviderError] = useState(null);
  const [modelHint, setModelHint] = useState('');
  
  const [selectedProvider, setSelectedProvider] = useLocalStorage(
    STORAGE_KEYS.LAST_PROVIDER,
    ''
  );
  const [selectedModel, setSelectedModel] = useLocalStorage(
    STORAGE_KEYS.LAST_MODEL,
    ''
  );

  // Load providers function
  const loadProviders = useCallback(async () => {
    setIsLoadingProviders(true);
    setProviderError(null);
    
    try {
      const { providers: providerList, hasAvailable } = await fetchProviders();
      setProviders(providerList);
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
          'No providers are configured. Add credentials or authenticate a CLI provider to continue.'
        );
      }
    } catch (error) {
      setProviderError('Failed to load providers. Check your connection.');
      setProvidersReady(false);
    } finally {
      setIsLoadingProviders(false);
    }
  }, [selectedProvider, setSelectedProvider, setSelectedModel]);

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  // Load models when provider changes
  useEffect(() => {
    async function loadModels() {
      if (!selectedProvider || !providersReady) {
        setModels([]);
        setSelectedModel(''); // Clear model when no provider is selected
        return;
      }
      
      setIsLoadingModels(true);
      setModelHint('');
      
      try {
        const { models: modelList, note, isDynamic } = await fetchModels(selectedProvider);
        
        // Enhance models with display info
        const enhancedModels = modelList.map(model => {
          const displayInfo = getModelDisplayInfo(model.id, model.label);
          return {
            ...model,
            ...displayInfo
          };
        });
        
        setModels(enhancedModels);
        
        // Set model hint
        if (note) {
          setModelHint(note);
        } else if (!isDynamic) {
          setModelHint('Using fallback model list.');
        }
        
        // Use stored model if available, otherwise first in list
        const storedModelAvailable = enhancedModels.some(m => m.id === selectedModel);
        if (!storedModelAvailable && enhancedModels.length > 0) {
          setSelectedModel(enhancedModels[0].id);
        }
      } catch {
        setModelHint('Failed to load models.');
        setModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    }
    
    loadModels();
  }, [selectedProvider, providersReady, setSelectedModel]);

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
    providersReady,
    providerError,
    modelHint,
    
    // Actions
    setSelectedProvider: handleProviderChange,
    setSelectedModel: handleModelChange,
    refreshProviders: loadProviders
  };
}
