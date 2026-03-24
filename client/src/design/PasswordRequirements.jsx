import clsx from 'clsx';
import { Check } from 'lucide-react';

const PasswordRequirements = ({ password = '' }) => {
  const requirements = [
    {
      label: 'one lowercase character',
      test: /[a-z]/.test(password),
    },
    {
      label: 'one uppercase character',
      test: /[A-Z]/.test(password),
    },
    {
      label: '8 characters minimum',
      test: password.length >= 8,
    },
    {
      label: 'one number',
      test: /[0-9]/.test(password),
    },
    {
      label: 'one special character',
      test: /[^A-Za-z0-9]/.test(password),
    },
  ];

  return (
    <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
      {requirements.map((req) => (
        <div
          key={req.label}
          className={clsx(
            'flex items-center gap-2 text-[11px] font-medium capitalize transition-colors',
            req.test ? 'text-(--color-text-body)' : 'text-(--color-text-muted)'
          )}
        >
          <div
            className={clsx(
              'flex h-3.5 w-3.5 items-center justify-center rounded-full border',
              req.test
                ? 'border-(--color-success) bg-(--color-success) text-white'
                : 'border-(--color-border-strong) bg-[#d7d7d7] text-transparent'
            )}
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </div>
          <span>{req.label}</span>
        </div>
      ))}
    </div>
  );
};

export default PasswordRequirements;
