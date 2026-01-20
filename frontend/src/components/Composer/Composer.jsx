/**
 * Composer Component
 * Modern, polished text input area for writing prompts
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import './Composer.css';

// Send icon - paper plane style
const SendIcon = ({ size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className="composer__send-icon"
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

// Loading spinner
const LoadingSpinner = ({ size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className="composer__spinner"
  >
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none"
      strokeLinecap="round"
      strokeDasharray="31.4 31.4"
      strokeDashoffset="10"
    />
  </svg>
);

export default function Composer({
  value = '',
  onChange,
  onSubmit,
  disabled = false,
  submitDisabled = false,
  isLoading = false,
  placeholder = 'Enter your rough prompt here...',
  maxLength = 50000
}) {
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea based on content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to calculate new scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height with min/max bounds
    const minHeight = 52;
    const maxHeight = 200;
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );
    
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Focus textarea on mount if not disabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    // Prevent exceeding max length
    if (newValue.length <= maxLength) {
      onChange?.(newValue);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!submitDisabled && !isLoading && value.trim()) {
      onSubmit?.();
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;
  const canSubmit = !submitDisabled && !isLoading && value.trim().length > 0;

  // Container classes
  const containerClasses = [
    'composer__container',
    isFocused && 'composer__container--focused',
    disabled && 'composer__container--disabled',
    isLoading && 'composer__container--loading'
  ].filter(Boolean).join(' ');

  return (
    <div className="composer">
      <form className="composer__form" onSubmit={handleSubmit}>
        <div className={containerClasses}>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            className="composer__input"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            aria-label="Prompt input"
            aria-describedby={isNearLimit ? 'composer-count' : undefined}
            rows={1}
            autoComplete="off"
            spellCheck="true"
          />
          
          {/* Send button */}
          <button
            type="submit"
            className={`composer__send-btn ${canSubmit ? 'composer__send-btn--active' : ''}`}
            disabled={!canSubmit}
            aria-label={isLoading ? 'Sending...' : 'Send prompt'}
            title={isLoading ? 'Sending...' : 'Send (Ctrl+Enter)'}
          >
            {isLoading ? <LoadingSpinner /> : <SendIcon />}
          </button>
        </div>

        {/* Footer with character count and hints */}
        <div className="composer__footer">
          <span className="composer__hint">
            Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to send
          </span>
          
          {isNearLimit && (
            <span 
              id="composer-count"
              className={`composer__count ${isOverLimit ? 'composer__count--error' : 'composer__count--warning'}`}
              role="status"
              aria-live="polite"
            >
              {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
