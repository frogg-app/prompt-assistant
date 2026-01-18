/**
 * Select Component
 * A styled select dropdown with label support
 */

import { forwardRef } from 'react';
import './Select.css';

const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    options = [],
    placeholder,
    disabled = false,
    loading = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={`select-field ${className}`}>
      {label && (
        <label htmlFor={selectId} className="select-field__label">
          {label}
        </label>
      )}
      <div className="select-field__wrapper">
        <select
          ref={ref}
          id={selectId}
          className={`select-field__select ${error ? 'select-field__select--error' : ''}`}
          disabled={disabled || loading}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value || option.id}
              value={option.value || option.id}
              disabled={option.disabled}
            >
              {option.label || option.name || option.displayName}
            </option>
          ))}
        </select>
        {loading && (
          <div className="select-field__loading" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="select-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="select-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;
