/**
 * ProviderManager Component Tests
 * Updated for frontend-only API key management UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProviderManager from './ProviderManager';

// Mock the services
vi.mock('../../services/api-key-storage', () => ({
  apiKeyStorage: {
    has: vi.fn(() => false),
    get: vi.fn(() => ''),
    save: vi.fn(),
    remove: vi.fn()
  }
}));

vi.mock('../../services/llm', () => ({
  testProviderApiKey: vi.fn(() => Promise.resolve({ valid: true }))
}));

describe('ProviderManager', () => {
  const mockProviders = [
    { 
      id: 'openai', 
      name: 'OpenAI', 
      available: false,
      setup: {
        docs: 'https://platform.openai.com/api-keys',
        steps: ['Get your API key']
      }
    },
    { 
      id: 'gemini', 
      name: 'Google Gemini', 
      available: false,
      setup: {
        docs: 'https://ai.google.dev/gemini-api/docs/api-key',
        steps: ['Get your API key']
      }
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    providers: mockProviders,
    onRescan: vi.fn(),
    isRescanning: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<ProviderManager {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<ProviderManager {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('API Key Settings')).toBeInTheDocument();
  });

  it('should display info banner about local storage', () => {
    render(<ProviderManager {...defaultProps} />);
    expect(screen.getByText(/Your API keys are stored locally/i)).toBeInTheDocument();
    expect(screen.getByText(/Keys are never sent to any server/i)).toBeInTheDocument();
  });

  it('should display provider cards', () => {
    render(<ProviderManager {...defaultProps} />);
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Google Gemini')).toBeInTheDocument();
  });

  it('should show "Not Configured" status when no API key', () => {
    render(<ProviderManager {...defaultProps} />);
    const notConfiguredElements = screen.getAllByText(/Not Configured/i);
    expect(notConfiguredElements.length).toBeGreaterThan(0);
  });

  it('should show "Add Key" button for unconfigured providers', () => {
    render(<ProviderManager {...defaultProps} />);
    const addKeyButtons = screen.getAllByText('Add Key');
    expect(addKeyButtons.length).toBe(2); // One for each provider
  });

  it('should call onClose when close button is clicked', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    await userEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    const overlay = screen.getByRole('dialog').parentElement;
    await userEvent.click(overlay);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should not call onClose when modal content is clicked', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    const modal = screen.getByRole('dialog');
    await userEvent.click(modal);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should display footer note about CLI providers', () => {
    render(<ProviderManager {...defaultProps} />);
    expect(screen.getByText('About CLI-based providers')).toBeInTheDocument();
    expect(screen.getByText(/Copilot CLI and Claude Code/i)).toBeInTheDocument();
  });

  it('should show API key input when Add Key is clicked', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    const addKeyButtons = screen.getAllByText('Add Key');
    await userEvent.click(addKeyButtons[0]); // Click first Add Key button
    
    expect(screen.getByPlaceholderText(/Enter your OpenAI API key/i)).toBeInTheDocument();
  });

  it('should show Test Key and Save Key buttons in key form', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    const addKeyButtons = screen.getAllByText('Add Key');
    await userEvent.click(addKeyButtons[0]);
    
    expect(screen.getByText('Test Key')).toBeInTheDocument();
    expect(screen.getByText('Save Key')).toBeInTheDocument();
  });

  it('should show Cancel button in key form', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    const addKeyButtons = screen.getAllByText('Add Key');
    await userEvent.click(addKeyButtons[0]);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should hide key form when Cancel is clicked', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    const addKeyButtons = screen.getAllByText('Add Key');
    await userEvent.click(addKeyButtons[0]);
    
    expect(screen.getByPlaceholderText(/Enter your OpenAI API key/i)).toBeInTheDocument();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(screen.queryByPlaceholderText(/Enter your OpenAI API key/i)).not.toBeInTheDocument();
  });
});
