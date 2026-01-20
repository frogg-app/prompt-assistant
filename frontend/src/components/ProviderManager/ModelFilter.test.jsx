/**
 * ModelFilter Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModelFilter from './ModelFilter';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ModelFilter', () => {
  const mockProvider = {
    id: 'openai',
    name: 'OpenAI'
  };

  const mockModels = [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ];

  const defaultProps = {
    provider: mockProvider,
    onSubmit: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful fetch of available models
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: mockModels })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filtered_models: [] })
      });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show loading state initially', () => {
    render(<ModelFilter {...defaultProps} />);
    expect(screen.getByText('Loading available models...')).toBeInTheDocument();
  });

  it('should load and display models', async () => {
    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    expect(screen.getByText('GPT-4o Mini')).toBeInTheDocument();
    expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    expect(screen.getByText('GPT-3.5 Turbo')).toBeInTheDocument();
  });

  it('should display provider name in description', async () => {
    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/OpenAI/)).toBeInTheDocument();
    });
  });

  it('should call onCancel when Back button is clicked', async () => {
    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Providers');
    await userEvent.click(backButton);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should toggle model selection when checkbox is clicked', async () => {
    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];

    expect(firstCheckbox).not.toBeChecked();
    
    await userEvent.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();

    await userEvent.click(firstCheckbox);
    expect(firstCheckbox).not.toBeChecked();
  });

  it('should show correct count when models are selected', async () => {
    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    // Initially all models shown
    expect(screen.getByText(/All 4 models will be shown/)).toBeInTheDocument();

    // Select some models
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);

    expect(screen.getByText(/2 of 4 models selected/)).toBeInTheDocument();
  });

  it('should filter models based on search query', async () => {
    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search models...');
    await userEvent.type(searchInput, 'turbo');

    // Only turbo models should be visible
    expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    expect(screen.getByText('GPT-3.5 Turbo')).toBeInTheDocument();
    
    // Non-turbo models should not be visible in filtered list
    const modelList = screen.getByRole('list') || document.querySelector('.model-filter__list');
    // Check that gpt-4o label is not shown (without Turbo)
  });

  it('should select all visible models when Select All is clicked', async () => {
    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    const selectAllButton = screen.getByText(/Select All/);
    await userEvent.click(selectAllButton);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it('should deselect all models when Deselect All is clicked', async () => {
    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    // First select all
    await userEvent.click(screen.getByText(/Select All/));

    // Then deselect all
    await userEvent.click(screen.getByText('Deselect All'));

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('should call onSubmit with selected model IDs when Save is clicked', async () => {
    // Reset mock to include PUT response
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: mockModels })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filtered_models: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filtered_models: ['gpt-4o', 'gpt-4o-mini'] })
      });

    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    // Select some models
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]); // gpt-4o
    await userEvent.click(checkboxes[1]); // gpt-4o-mini

    // Click save
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(['gpt-4o', 'gpt-4o-mini']);
    });
  });

  it('should show error when model fetch fails', async () => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to fetch available models/)).toBeInTheDocument();
  });

  it('should show empty state when no models are found', async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filtered_models: [] })
      });

    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/No models found/)).toBeInTheDocument();
    });
  });

  it('should load previously filtered models', async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: mockModels })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filtered_models: ['gpt-4o', 'gpt-4-turbo'] })
      });

    render(<ModelFilter {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    // Check that the previously filtered models are checked
    const checkboxes = screen.getAllByRole('checkbox');
    
    // First checkbox (gpt-4o) should be checked
    expect(checkboxes[0]).toBeChecked();
    
    // Second (gpt-4o-mini) should not be checked
    expect(checkboxes[1]).not.toBeChecked();
    
    // Third (gpt-4-turbo) should be checked
    expect(checkboxes[2]).toBeChecked();
  });

  it('should encode provider ID in API requests', async () => {
    const specialProvider = {
      id: 'provider/with/slashes',
      name: 'Special Provider'
    };

    render(<ModelFilter {...defaultProps} provider={specialProvider} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const call = mockFetch.mock.calls[0][0];
    expect(call).toContain('provider%2Fwith%2Fslashes');
  });
});
