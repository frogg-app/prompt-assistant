/**
 * ChatWindow Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatWindow from './ChatWindow';

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('ChatWindow', () => {
  it('should render empty state when no messages', () => {
    render(<ChatWindow messages={[]} />);
    expect(screen.getByText(/tips for better prompts/i)).toBeInTheDocument();
  });

  it('should render empty state tips', () => {
    render(<ChatWindow messages={[]} />);
    expect(screen.getByText(/be specific/i)).toBeInTheDocument();
  });

  it('should render user messages', () => {
    const messages = [
      { id: '1', type: 'user', content: 'Hello world', timestamp: new Date() }
    ];
    render(<ChatWindow messages={messages} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('should render assistant messages', () => {
    const messages = [
      { id: '1', type: 'assistant', content: 'Hi there!', timestamp: new Date() }
    ];
    render(<ChatWindow messages={messages} />);
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should render multiple messages', () => {
    const messages = [
      { id: '1', type: 'user', content: 'Question', timestamp: new Date() },
      { id: '2', type: 'assistant', content: 'Answer', timestamp: new Date() }
    ];
    render(<ChatWindow messages={messages} />);
    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByText('Answer')).toBeInTheDocument();
  });

  it('should show loading indicator when isLoading is true', () => {
    const messages = [
      { id: '1', type: 'user', content: 'Test', timestamp: new Date() }
    ];
    render(<ChatWindow messages={messages} isLoading={true} />);
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it('should not show loading indicator when isLoading is false', () => {
    const messages = [
      { id: '1', type: 'user', content: 'Test', timestamp: new Date() }
    ];
    render(<ChatWindow messages={messages} isLoading={false} />);
    expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
  });

  it('should render improved prompt messages', () => {
    const messages = [
      { 
        id: '1', 
        type: 'improved-prompt', 
        content: 'Improved version', 
        timestamp: new Date() 
      }
    ];
    render(<ChatWindow messages={messages} />);
    expect(screen.getByText('Improved version')).toBeInTheDocument();
  });

  it('should have accessible log role', () => {
    render(<ChatWindow messages={[]} />);
    expect(screen.getByRole('log')).toBeInTheDocument();
  });
});
