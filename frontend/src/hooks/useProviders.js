import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProviders, fetchModels, rescanProviders } from '../utils/api';
import { getModelDisplayInfo } from '../utils/schema';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Hook for managing providers and models state
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

  // Load models when provider changes (uses cache, only fetch once per session)
  useEffect(() => {
    async function loadModels() {
      if (!selectedProvider || !providersReady) {
        setModels([]);
        setSelectedModel(''); // Clear model when no provider is selected
        return;
      }
      
      // Check if we already fetched models for this provider this session
      const alreadyFetched = fetchedModelsRef.current.has(selectedProvider);
      
      setIsLoadingModels(true);
      setModelHint('');
      
      try {
        // Don't force refresh - use cache
        const { models: modelList, note, isDynamic } = await fetchModels(selectedProvider, false);
        
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

  // Rescan all providers (manual refresh)
  const handleRescan = useCallback(async () => {
    setIsRescanning(true);
    
    try {
      await rescanProviders();
      
      // Clear the fetched cache to force reload
      fetchedModelsRef.current.clear();
      
      // Reload providers and models
      await loadProviders();
      
      // If we have a selected provider, reload its models
      if (selectedProvider) {
        setIsLoadingModels(true);
        const { models: modelList, note } = await fetchModels(selectedProvider, true);
        fetchedModelsRef.current.add(selectedProvider);
        
        const enhancedModels = modelList.map(model => {
          const displayInfo = getModelDisplayInfo(model.id, model.label);
          return { ...model, ...displayInfo };
        });
        
        setModels(enhancedModels);
        if (note) setModelHint(note);
        setIsLoadingModels(false);
      }
    } catch (error) {
      console.error('Rescan failed:', error);
    } finally {
      setIsRescanning(false);
    }
  }, [selectedProvider, loadProviders]);

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
    rescanProviders: handleRescan
  };
}
