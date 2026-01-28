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

  it('should render theme toggle button', () => {
    render(<Header />);
    expect(screen.getByLabelText(/switch to/i)).toBeInTheDocument();
  });

  it('should render menu button on mobile', () => {
    render(<Header onMenuClick={vi.fn()} />);
    expect(screen.getByLabelText(/open navigation menu/i)).toBeInTheDocument();
  });

  it('should call onMenuClick when menu button is clicked', () => {
    const onMenuClick = vi.fn();
    render(<Header onMenuClick={onMenuClick} />);
    
    fireEvent.click(screen.getByLabelText(/open navigation menu/i));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
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

  it('should show new chat button when there are messages', () => {
    const onNewChat = vi.fn();
    render(<Header hasMessages={true} onNewChat={onNewChat} />);
    expect(screen.getByLabelText(/start new chat/i)).toBeInTheDocument();
  });

  it('should call onNewChat when new chat button is clicked', () => {
    const onNewChat = vi.fn();
    render(<Header hasMessages={true} onNewChat={onNewChat} />);
    
    fireEvent.click(screen.getByLabelText(/start new chat/i));
    expect(onNewChat).toHaveBeenCalledTimes(1);
  });

  it('should not show new chat button when there are no messages', () => {
    render(<Header hasMessages={false} />);
    expect(screen.queryByLabelText(/start new chat/i)).not.toBeInTheDocument();
  });
});
