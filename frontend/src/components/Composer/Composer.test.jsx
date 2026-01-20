/**
 * Composer Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Composer from './Composer';

describe('Composer', () => {
  it('should render textarea with placeholder', () => {
    render(<Composer />);
    expect(screen.getByPlaceholderText(/type your rough prompt/i)).toBeInTheDocument();
  });

  it('should render send button', () => {
    render(<Composer />);
    expect(screen.getByLabelText(/send prompt/i)).toBeInTheDocument();
  });

  it('should call onChange when typing', async () => {
    const onChange = vi.fn();
    render(<Composer value="" onChange={onChange} />);
    
    const textarea = screen.getByLabelText(/prompt input/i);
    await userEvent.type(textarea, 'Hello');
    
    expect(onChange).toHaveBeenCalled();
  });

  it('should disable send button when value is empty', () => {
    render(<Composer value="" />);
    
    const sendButton = screen.getByLabelText(/send prompt/i);
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when value has content', () => {
    render(<Composer value="Some text" />);
    
    const sendButton = screen.getByLabelText(/send prompt/i);
    expect(sendButton).not.toBeDisabled();
  });

  it('should call onSubmit when send button is clicked', async () => {
    const onSubmit = vi.fn();
    render(<Composer value="Test prompt" onSubmit={onSubmit} />);
    
    const sendButton = screen.getByLabelText(/send prompt/i);
    await userEvent.click(sendButton);
    
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmit on Ctrl+Enter', async () => {
    const onSubmit = vi.fn();
    render(<Composer value="Test prompt" onSubmit={onSubmit} />);
    
    const textarea = screen.getByLabelText(/prompt input/i);
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmit on Meta+Enter (Mac)', async () => {
    const onSubmit = vi.fn();
    render(<Composer value="Test prompt" onSubmit={onSubmit} />);
    
    const textarea = screen.getByLabelText(/prompt input/i);
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
    
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should not submit on Enter without modifier', async () => {
    const onSubmit = vi.fn();
    render(<Composer value="Test prompt" onSubmit={onSubmit} />);
    
    const textarea = screen.getByLabelText(/prompt input/i);
    fireEvent.keyDown(textarea, { key: 'Enter' });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should disable textarea when disabled prop is true', () => {
    render(<Composer disabled={true} />);
    
    const textarea = screen.getByLabelText(/prompt input/i);
    expect(textarea).toBeDisabled();
  });

  it('should use custom placeholder', () => {
    render(<Composer placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('should show character count when near limit', () => {
    const value = 'x'.repeat(46000); // 92% of 50000
    render(<Composer value={value} maxLength={50000} />);
    
    expect(screen.getByText(/46,000/)).toBeInTheDocument();
  });

  it('should disable send when over character limit', () => {
    const value = 'x'.repeat(50001);
    render(<Composer value={value} maxLength={50000} />);
    
    const sendButton = screen.getByLabelText(/send prompt/i);
    expect(sendButton).toBeDisabled();
  });

  it('should not submit when disabled', async () => {
    const onSubmit = vi.fn();
    render(<Composer value="Test" disabled={true} onSubmit={onSubmit} />);
    
    const textarea = screen.getByLabelText(/prompt input/i);
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should not submit when value is whitespace only', async () => {
    const onSubmit = vi.fn();
    render(<Composer value="   " onSubmit={onSubmit} />);
    
    const sendButton = screen.getByLabelText(/send prompt/i);
    expect(sendButton).toBeDisabled();
  });
});
