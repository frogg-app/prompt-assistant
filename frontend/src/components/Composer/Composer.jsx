/**
 * Composer Component
 * Text input area for writing prompts
 */

import { useRef, useEffect, useCallback } from 'react';
import { Button } from '../ui';
import './Composer.css';

// Send icon
const SendIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

export default function Composer({
  value = '',
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Type your rough prompt here...',
  maxLength = 50000
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, 56),
      200 // Max height
    );
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e) => {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit?.();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!disabled && value.trim()) {
      onSubmit?.();
    }
  };

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer__container">
        <textarea
          ref={textareaRef}
          className="composer__input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Prompt input"
          rows={1}
        />
        
        <div className="composer__actions">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={disabled || !value.trim() || isOverLimit}
            aria-label="Send prompt"
            className="composer__send"
          >
            <SendIcon />
          </Button>
        </div>
      </div>
      
      {isNearLimit && (
        <div className="composer__footer">
          <span 
            className={`composer__count ${isOverLimit ? 'composer__count--error' : ''}`}
            aria-live="polite"
          >
            {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        </div>
      )}
    </form>
  );
}
