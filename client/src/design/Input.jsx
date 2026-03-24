import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      iconPosition = 'left',
      isValid,
      variant = 'outline',
      size = 'md',
      fullWidth = true,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'w-full rounded-[10px] border bg-white text-[15px] text-[var(--color-text-strong)] transition placeholder:text-[var(--color-text-muted)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

    const variantStyles = {
      outline: clsx(
        'border-[var(--color-border-subtle)] focus:border-[var(--color-border-focus)] focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]',
        error && 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[rgba(209,77,77,0.12)]',
        isValid && 'border-[var(--color-success)] focus:border-[var(--color-success)]'
      ),
    };

    const sizes = {
      sm: 'min-h-10 px-3.5 text-sm',
      md: 'min-h-11 px-4 text-[15px]',
      lg: 'min-h-12 px-4.5 text-base',
    };

    return (
      <div className={clsx(fullWidth ? 'w-full' : 'w-auto')}>
        {label && (
          <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-text-body)]">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          )}

          <input
            ref={ref}
            className={clsx(
              baseStyles,
              variantStyles[variant],
              sizes[size],
              Icon && iconPosition === 'left' && 'pl-10',
              Icon && iconPosition === 'right' && 'pr-10'
            )}
            {...props}
          />

          {Icon && iconPosition === 'right' && (
            <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-xs font-medium text-[var(--color-error)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
