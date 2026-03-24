import { forwardRef } from 'react';
import clsx from 'clsx';

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled = false,
      icon: Icon,
      iconPosition = 'left',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold tracking-[-0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.18)]';

    const variants = {
      primary:
        'bg-[var(--color-brand-500)] text-white shadow-[0_14px_32px_rgba(55,166,83,0.24)] hover:bg-[var(--color-brand-600)] active:translate-y-px',
      secondary:
        'bg-white text-[var(--color-text-strong)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] hover:bg-[#fcfcfc]',
      outline:
        'bg-transparent text-[var(--color-brand-700)] border border-[var(--color-brand-500)] hover:bg-[rgba(55,166,83,0.06)]',
      ghost:
        'bg-transparent text-[var(--color-brand-700)] hover:bg-[rgba(55,166,83,0.08)]',
    };

    const sizes = {
      sm: 'min-h-10 px-3.5 text-sm',
      md: 'min-h-11 px-4 text-sm',
      lg: 'min-h-12 px-6 text-[15px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full')}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
