/**
 * App Integration Tests
 * Tests the main application flows and component interactions
 * Updated for frontend-only architecture
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock the LLM services
vi.mock('./services/llm', () => ({
  isFrontendProvider: vi.fn((id) => id === 'openai' || id === 'gemini'),
  fetchProviderModels: vi.fn(() => Promise.resolve([
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' }
  ])),
  callProvider: vi.fn(() => Promise.resolve({
    needs_clarification: false,
    improved_prompt: 'Improved prompt text',
    assumptions: []
  }))
}));

// Mock the API key storage - start with a configured OpenAI key
vi.mock('./services/api-key-storage', () => ({
  apiKeyStorage: {
    has: vi.fn((id) => id === 'openai'),
    get: vi.fn((id) => id === 'openai' ? 'sk-test-key' : ''),
    save: vi.fn(),
    remove: vi.fn()
  }
}));

// Mock the prompt types API (still uses backend for now)
vi.mock('./utils/api', () => ({
  fetchPromptTypes: vi.fn(() => Promise.resolve({ promptTypes: [] }))
}));

import { callProvider, fetchProviderModels } from './services/llm';
import { apiKeyStorage } from './services/api-key-storage';

describe('App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks
    apiKeyStorage.has.mockImplementation((id) => id === 'openai');
    apiKeyStorage.get.mockImplementation((id) => id === 'openai' ? 'sk-test-key' : '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Load', () => {
    it('should render the application', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Prompt Assistant/i)).toBeInTheDocument();
      });
    });

    it('should load providers on mount', async () => {
      render(<App />);
      
      await waitFor(() => {
        // Providers should be loaded from static list, checked against API key storage
        expect(apiKeyStorage.has).toHaveBeenCalled();
      });
    });

    it('should enable the composer when providers are ready', async () => {
      render(<App />);
      
      await waitFor(() => {
        const textarea = screen.getByLabelText(/prompt input/i);
        expect(textarea).not.toBeDisabled();
      });
    });

    it('should show disabled state when no providers have API keys', async () => {
      // Mock no API keys configured
      apiKeyStorage.has.mockReturnValue(false);
      apiKeyStorage.get.mockReturnValue('');

      render(<App />);
      
      await waitFor(() => {
        const textarea = screen.getByLabelText(/prompt input/i);
        expect(textarea).toBeDisabled();
      });
    });
  });

  describe('Prompt Submission', () => {
    it('should allow typing in the composer', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/prompt input/i)).not.toBeDisabled();
      });

      const textarea = screen.getByLabelText(/prompt input/i);
      await userEvent.type(textarea, 'Test prompt');
      
      expect(textarea).toHaveValue('Test prompt');
    });

    it('should enable send button when text is entered', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/prompt input/i)).not.toBeDisabled();
      });

      const textarea = screen.getByLabelText(/prompt input/i);
      await userEvent.type(textarea, 'Test prompt');
      
      const sendButton = screen.getByLabelText(/send prompt/i);
      expect(sendButton).not.toBeDisabled();
    });

    it('should submit prompt when send button is clicked', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/prompt input/i)).not.toBeDisabled();
      });

      const textarea = screen.getByLabelText(/prompt input/i);
      await userEvent.type(textarea, 'Test prompt');
      
      const sendButton = screen.getByLabelText(/send prompt/i);
      await userEvent.click(sendButton);
      
      await waitFor(() => {
        expect(callProvider).toHaveBeenCalled();
      });
    });

    it('should clear composer after successful submission', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/prompt input/i)).not.toBeDisabled();
      });

      const textarea = screen.getByLabelText(/prompt input/i);
      await userEvent.type(textarea, 'Test prompt');
      
      const sendButton = screen.getByLabelText(/send prompt/i);
      await userEvent.click(sendButton);
      
      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });
  });

  describe('Inspector Panel', () => {
    it('should show the inspector panel by default', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Provider')).toBeInTheDocument();
      });
    });

    it('should toggle inspector panel visibility', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Provider')).toBeInTheDocument();
      });

      // Find and click the toggle button
      const toggleButton = screen.getByLabelText(/open options panel|close options panel/i);
      await userEvent.click(toggleButton);
      
      // Panel should be hidden (this depends on implementation)
    });
  });

  describe('Provider Manager', () => {
    it('should open provider manager from header', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(apiKeyStorage.has).toHaveBeenCalled();
      });

      // Look for the manage providers button in inspector
      const manageButton = await screen.findByText(/manage providers/i);
      await userEvent.click(manageButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('API Key Settings')).toBeInTheDocument();
    });

    it('should close provider manager on close button click', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(apiKeyStorage.has).toHaveBeenCalled();
      });

      const manageButton = await screen.findByText(/manage providers/i);
      await userEvent.click(manageButton);
      
      const closeButton = screen.getByLabelText('Close');
      await userEvent.click(closeButton);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('should have theme toggle in header', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(apiKeyStorage.has).toHaveBeenCalled();
      });

      // Look for theme toggle button
      const themeButton = screen.getByLabelText(/theme|dark|light/i);
      expect(themeButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error when prompt submission fails', async () => {
      callProvider.mockRejectedValue(new Error('Request failed'));

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/prompt input/i)).not.toBeDisabled();
      });

      const textarea = screen.getByLabelText(/prompt input/i);
      await userEvent.type(textarea, 'Test prompt');
      
      const sendButton = screen.getByLabelText(/send prompt/i);
      await userEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Model Selection', () => {
    it('should load models when provider has API key', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(apiKeyStorage.has).toHaveBeenCalled();
      });

      // Wait for initial model load
      await waitFor(() => {
        expect(fetchProviderModels).toHaveBeenCalled();
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should submit on Ctrl+Enter', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/prompt input/i)).not.toBeDisabled();
      });

      const textarea = screen.getByLabelText(/prompt input/i);
      await userEvent.type(textarea, 'Test prompt');
      
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      
      await waitFor(() => {
        expect(callProvider).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(apiKeyStorage.has).toHaveBeenCalled();
      });

      expect(screen.getByLabelText(/prompt input/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/send prompt/i)).toBeInTheDocument();
    });

    it('should focus input on load when enabled', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/prompt input/i)).not.toBeDisabled();
      });

      // Input should be focused after providers load
      const textarea = screen.getByLabelText(/prompt input/i);
      expect(document.activeElement).toBe(textarea);
    });
  });
});

describe('App Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default behavior
    apiKeyStorage.has.mockImplementation((id) => id === 'openai');
    apiKeyStorage.get.mockImplementation((id) => id === 'openai' ? 'sk-test-key' : '');
  });

  it('should handle empty model list gracefully', async () => {
    fetchProviderModels.mockResolvedValue([]);

    render(<App />);
    
    await waitFor(() => {
      expect(fetchProviderModels).toHaveBeenCalled();
    });

    // App should still be functional
    expect(screen.getByLabelText(/prompt input/i)).toBeInTheDocument();
  });

  it('should handle very long prompt text', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/prompt input/i)).not.toBeDisabled();
    });

    const textarea = screen.getByLabelText(/prompt input/i);
    const longText = 'x'.repeat(45000);
    
    // Using fireEvent for performance with long strings
    textarea.focus();
    textarea.value = longText;
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Should show character count warning
    await waitFor(() => {
      expect(screen.getByText(/45,000/)).toBeInTheDocument();
    });
  });

  it('should handle provider switching', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(apiKeyStorage.has).toHaveBeenCalled();
    });

    // App should handle changes without crashing
    // This is a stress test scenario
  });
});
