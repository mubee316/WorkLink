import { forwardRef } from 'react';

const Checkbox = forwardRef(
  ({ label, error, helperText, ...props }, ref) => {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-6 items-center">
          <input
            ref={ref}
            type="checkbox"
            className="h-4.5 w-4.5 cursor-pointer rounded-sm border border-(--color-border-strong) bg-white text-(--color-brand-600) transition-colors focus:ring-4 focus:ring-[rgba(55,166,83,0.12)] focus:ring-offset-0 checked:border-(--color-brand-600) checked:bg-(--color-brand-600)"
            {...props}
          />
        </div>
        <div className="flex-1">
          {label && (
            <label className="block cursor-pointer text-[13px] leading-5 text-(--color-text-body)">
              {label}
            </label>
          )}
          {error && (
            <p className="mt-1 text-xs font-medium text-(--color-error)">{error}</p>
          )}
          {helperText && !error && (
            <p className="mt-1 text-xs text-(--color-text-muted)">{helperText}</p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
