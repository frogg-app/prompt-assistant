/**
 * ProviderManager Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProviderManager from './ProviderManager';

// Mock child components
vi.mock('./ProviderForm', () => ({
  default: ({ onCancel, onSubmit }) => (
    <div data-testid="provider-form">
      <button onClick={onCancel}>Cancel</button>
      <button onClick={() => onSubmit({ id: 'test', name: 'Test' })}>Submit</button>
    </div>
  )
}));

vi.mock('./ModelFilter', () => ({
  default: ({ provider, onCancel }) => (
    <div data-testid="model-filter">
      Filtering: {provider?.name}
      <button onClick={onCancel}>Back</button>
    </div>
  )
}));

describe('ProviderManager', () => {
  const mockProviders = [
    { id: 'openai', name: 'OpenAI', available: true, builtin: true },
    { id: 'claude', name: 'Claude', available: false, builtin: true },
    { id: 'custom-1', name: 'Custom Provider', available: true, builtin: false, config: { type: 'api_key' } }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    providers: mockProviders,
    onProviderAdded: vi.fn(),
    onProviderUpdated: vi.fn(),
    onProviderDeleted: vi.fn(),
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
    expect(screen.getByText('Manage Providers')).toBeInTheDocument();
  });

  it('should display Add Custom Provider button', () => {
    render(<ProviderManager {...defaultProps} />);
    expect(screen.getByText('Add Custom Provider')).toBeInTheDocument();
  });

  it('should display Rescan Models button', () => {
    render(<ProviderManager {...defaultProps} />);
    expect(screen.getByText('Rescan Models')).toBeInTheDocument();
  });

  it('should call onRescan when Rescan Models button is clicked', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    const rescanButton = screen.getByText('Rescan Models');
    await userEvent.click(rescanButton);
    
    expect(defaultProps.onRescan).toHaveBeenCalledTimes(1);
  });

  it('should show "Rescanning..." text when isRescanning is true', () => {
    render(<ProviderManager {...defaultProps} isRescanning={true} />);
    expect(screen.getByText('Rescanning...')).toBeInTheDocument();
  });

  it('should disable Rescan button when isRescanning is true', () => {
    render(<ProviderManager {...defaultProps} isRescanning={true} />);
    
    const rescanButton = screen.getByText('Rescanning...').closest('button');
    expect(rescanButton).toBeDisabled();
  });

  it('should display custom providers in the list', () => {
    render(<ProviderManager {...defaultProps} />);
    expect(screen.getByText('Custom Provider')).toBeInTheDocument();
  });

  it('should display built-in providers section', () => {
    render(<ProviderManager {...defaultProps} />);
    expect(screen.getByText('Built-in Providers')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('should show availability status for built-in providers', () => {
    render(<ProviderManager {...defaultProps} />);
    expect(screen.getByText('✓ Available')).toBeInTheDocument();
    expect(screen.getByText('✗ Not configured')).toBeInTheDocument();
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

  it('should switch to add view when Add Custom Provider is clicked', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    await userEvent.click(screen.getByText('Add Custom Provider'));
    
    expect(screen.getByText('Add New Provider')).toBeInTheDocument();
    expect(screen.getByTestId('provider-form')).toBeInTheDocument();
  });

  it('should switch to edit view when Edit button is clicked on custom provider', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    const editButtons = screen.getAllByText('Edit');
    await userEvent.click(editButtons[0]); // Click first Edit button (custom provider)
    
    expect(screen.getByText('Edit Provider')).toBeInTheDocument();
  });

  it('should switch to filter view when Filter Models is clicked', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    const filterButtons = screen.getAllByText('Filter Models');
    await userEvent.click(filterButtons[0]);
    
    expect(screen.getByText('Filter Models')).toBeInTheDocument();
    expect(screen.getByTestId('model-filter')).toBeInTheDocument();
  });

  it('should return to list view when Cancel is clicked in add form', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    await userEvent.click(screen.getByText('Add Custom Provider'));
    expect(screen.getByText('Add New Provider')).toBeInTheDocument();
    
    await userEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Manage Providers')).toBeInTheDocument();
  });

  it('should call onProviderAdded when form is submitted in add view', async () => {
    render(<ProviderManager {...defaultProps} />);
    
    await userEvent.click(screen.getByText('Add Custom Provider'));
    await userEvent.click(screen.getByText('Submit'));
    
    expect(defaultProps.onProviderAdded).toHaveBeenCalledWith({ id: 'test', name: 'Test' });
  });

  it('should show delete confirmation and call onProviderDeleted', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<ProviderManager {...defaultProps} />);
    
    const deleteButton = screen.getByText('Delete');
    await userEvent.click(deleteButton);
    
    expect(confirmSpy).toHaveBeenCalled();
    expect(defaultProps.onProviderDeleted).toHaveBeenCalledWith('custom-1');
    
    confirmSpy.mockRestore();
  });

  it('should not delete when confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    render(<ProviderManager {...defaultProps} />);
    
    const deleteButton = screen.getByText('Delete');
    await userEvent.click(deleteButton);
    
    expect(confirmSpy).toHaveBeenCalled();
    expect(defaultProps.onProviderDeleted).not.toHaveBeenCalled();
    
    confirmSpy.mockRestore();
  });

  it('should show Settings button for available built-in providers', () => {
    render(<ProviderManager {...defaultProps} />);
    
    // OpenAI is available, should have Settings button
    const settingsButtons = screen.getAllByText('Settings');
    expect(settingsButtons.length).toBeGreaterThan(0);
  });

  it('should display empty state when no custom providers exist', () => {
    const propsWithNoCustom = {
      ...defaultProps,
      providers: mockProviders.filter(p => p.builtin)
    };
    
    render(<ProviderManager {...propsWithNoCustom} />);
    
    expect(screen.getByText('No custom providers configured.')).toBeInTheDocument();
  });

  it('should have spinning animation class when rescanning', () => {
    render(<ProviderManager {...defaultProps} isRescanning={true} />);
    
    const rescanButton = screen.getByText('Rescanning...').closest('button');
    const svg = rescanButton.querySelector('svg');
    
    expect(svg).toHaveClass('spinning');
  });
});
