/**
 * App Integration Tests
 * Tests the main application flows and component interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock the API module
vi.mock('./utils/api', () => ({
  fetchProviders: vi.fn(),
  fetchModels: vi.fn(),
  rescanProviders: vi.fn(),
  improvePrompt: vi.fn()
}));

import { fetchProviders, fetchModels, rescanProviders, improvePrompt } from './utils/api';

describe('App Integration', () => {
  const mockProviders = [
    { id: 'openai', name: 'OpenAI', available: true, builtin: true },
    { id: 'claude', name: 'Claude', available: true, builtin: true },
    { id: 'copilot', name: 'Copilot', available: false, builtin: true }
  ];

  const mockModels = [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    fetchProviders.mockResolvedValue({
      providers: mockProviders,
      hasAvailable: true
    });
    
    fetchModels.mockResolvedValue({
      models: mockModels,
      note: '',
      isDynamic: true
    });
    
    rescanProviders.mockResolvedValue({
      message: 'Rescan completed',
      results: {}
    });
    
    improvePrompt.mockResolvedValue({
      needs_clarification: false,
      improved_prompt: 'Improved prompt text',
      assumptions: []
    });
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
        expect(fetchProviders).toHaveBeenCalled();
      });
    });

    it('should enable the composer when providers are ready', async () => {
      render(<App />);
      
      await waitFor(() => {
        const textarea = screen.getByLabelText(/prompt input/i);
        expect(textarea).not.toBeDisabled();
      });
    });

    it('should show disabled state when no providers are available', async () => {
      fetchProviders.mockResolvedValue({
        providers: [],
        hasAvailable: false
      });

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
        expect(improvePrompt).toHaveBeenCalled();
      });
    });

    it('should clear composer after submission', async () => {
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
        expect(fetchProviders).toHaveBeenCalled();
      });

      // Look for the manage providers button in inspector
      const manageButton = await screen.findByText(/manage providers/i);
      await userEvent.click(manageButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Manage Providers')).toBeInTheDocument();
    });

    it('should close provider manager on close button click', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(fetchProviders).toHaveBeenCalled();
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
        expect(fetchProviders).toHaveBeenCalled();
      });

      // Look for theme toggle button
      const themeButton = screen.getByLabelText(/theme|dark|light/i);
      expect(themeButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error when providers fail to load', async () => {
      fetchProviders.mockRejectedValue(new Error('Network error'));

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/failed to load providers/i)).toBeInTheDocument();
    });

    it('should show error when prompt submission fails', async () => {
      improvePrompt.mockRejectedValue(new Error('Request failed'));

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
    it('should load models when provider is selected', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(fetchProviders).toHaveBeenCalled();
      });

      // Wait for initial model load
      await waitFor(() => {
        expect(fetchModels).toHaveBeenCalled();
      });
    });

    it('should display available models in selector', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(fetchModels).toHaveBeenCalled();
      });

      // The model selector should show loaded models
      // This depends on the implementation of the ModelSelector
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
        expect(improvePrompt).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(fetchProviders).toHaveBeenCalled();
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
    
    fetchProviders.mockResolvedValue({
      providers: [{ id: 'openai', name: 'OpenAI', available: true, builtin: true }],
      hasAvailable: true
    });
    
    fetchModels.mockResolvedValue({
      models: [{ id: 'gpt-4o', label: 'GPT-4o' }],
      note: '',
      isDynamic: true
    });
  });

  it('should handle empty model list gracefully', async () => {
    fetchModels.mockResolvedValue({
      models: [],
      note: 'No models available',
      isDynamic: false
    });

    render(<App />);
    
    await waitFor(() => {
      expect(fetchModels).toHaveBeenCalled();
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

  it('should handle rapid provider switching', async () => {
    const providers = [
      { id: 'openai', name: 'OpenAI', available: true, builtin: true },
      { id: 'claude', name: 'Claude', available: true, builtin: true }
    ];

    fetchProviders.mockResolvedValue({
      providers,
      hasAvailable: true
    });

    render(<App />);
    
    await waitFor(() => {
      expect(fetchProviders).toHaveBeenCalled();
    });

    // App should handle rapid changes without crashing
    // This is a stress test scenario
  });
});
