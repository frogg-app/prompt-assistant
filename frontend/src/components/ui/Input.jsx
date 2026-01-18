/**
 * Input Component
 * A styled text input with label support
 */

import { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    type = 'text',
    disabled = false,
    className = '',
    id,
    icon: Icon,
    ...props
  },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`input-field ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-field__label">
          {label}
        </label>
      )}
      <div className="input-field__wrapper">
        {Icon && (
          <Icon className="input-field__icon" size={16} aria-hidden="true" />
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`input-field__input ${error ? 'input-field__input--error' : ''} ${Icon ? 'input-field__input--with-icon' : ''}`}
          disabled={disabled}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="input-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="input-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
