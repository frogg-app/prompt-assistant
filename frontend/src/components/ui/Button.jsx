/**
 * Button Component
 * A versatile button with multiple variants and sizes
 */

import { forwardRef } from 'react';
import './Button.css';

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    loading && 'btn--loading',
    disabled && 'btn--disabled',
    Icon && !children && 'btn--icon-only',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className="btn__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        </span>
      )}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className="btn__icon btn__icon--left" size={size === 'sm' ? 14 : 16} aria-hidden="true" />
      )}
      {children && <span className="btn__text">{children}</span>}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className="btn__icon btn__icon--right" size={size === 'sm' ? 14 : 16} aria-hidden="true" />
      )}
    </button>
  );
});

export default Button;
