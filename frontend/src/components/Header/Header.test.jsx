/**
 * Header Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('should render the brand name', () => {
    render(<Header />);
    expect(screen.getByText('Prompt Assistant')).toBeInTheDocument();
  });

  it('should render export button', () => {
    render(<Header />);
    expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    render(<Header />);
    expect(screen.getByLabelText(/switch to/i)).toBeInTheDocument();
  });

  it('should render inspector toggle button', () => {
    render(<Header />);
    expect(screen.getByLabelText(/options panel/i)).toBeInTheDocument();
  });

  it('should call onExportJSON when export button is clicked', () => {
    const onExportJSON = vi.fn();
    render(<Header onExportJSON={onExportJSON} />);
    
    fireEvent.click(screen.getByLabelText(/export/i));
    expect(onExportJSON).toHaveBeenCalledTimes(1);
  });

  it('should call onThemeChange when theme toggle is clicked', () => {
    const onThemeChange = vi.fn();
    render(<Header theme="light" onThemeChange={onThemeChange} />);
    
    fireEvent.click(screen.getByLabelText(/switch to dark/i));
    expect(onThemeChange).toHaveBeenCalledWith('dark');
  });

  it('should toggle from dark to light theme', () => {
    const onThemeChange = vi.fn();
    render(<Header theme="dark" onThemeChange={onThemeChange} />);
    
    fireEvent.click(screen.getByLabelText(/switch to light/i));
    expect(onThemeChange).toHaveBeenCalledWith('light');
  });

  it('should call onToggleInspector when panel button is clicked', () => {
    const onToggleInspector = vi.fn();
    render(<Header onToggleInspector={onToggleInspector} />);
    
    fireEvent.click(screen.getByLabelText(/options panel/i));
    expect(onToggleInspector).toHaveBeenCalledTimes(1);
  });

  it('should show "Hide" when inspector is visible', () => {
    render(<Header inspectorVisible={true} />);
    expect(screen.getByLabelText(/hide options panel/i)).toBeInTheDocument();
  });

  it('should show "Show" when inspector is hidden', () => {
    render(<Header inspectorVisible={false} />);
    expect(screen.getByLabelText(/show options panel/i)).toBeInTheDocument();
  });
});
