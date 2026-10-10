import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PASSWORD_RULES } from './schemas';

const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;

/** Live strength meter: the rules are shown as text + icons, never colour alone. */
export function PasswordStrength({ password }: { password: string }) {
  const passed = PASSWORD_RULES.map((rule) => rule.test(password));
  const score = passed.filter(Boolean).length;

  return (
    <div aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {PASSWORD_RULES.map((rule, i) => (
          <span
            key={rule.id}
            className={cn(
              'h-1.5 rounded-full transition-colors duration-300',
              i < score
                ? score === 4
                  ? 'bg-[#10B981]'
                  : score >= 3
                    ? 'bg-[#F59E0B]'
                    : 'bg-rose'
                : 'soft-inset',
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex items-start justify-between gap-3 text-[12px] font-semibold">
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {PASSWORD_RULES.map((rule, i) => (
            <li
              key={rule.id}
              className={cn('flex items-center gap-1', passed[i] ? 'text-success' : 'text-subtle')}
            >
              <Check className={cn('size-3', !passed[i] && 'opacity-30')} aria-hidden="true" />
              {rule.label}
              <span className="sr-only">{passed[i] ? '(met)' : '(not met yet)'}</span>
            </li>
          ))}
        </ul>
        {password && (
          <span className={cn('shrink-0', score === 4 ? 'text-success' : 'text-subtle')}>
            {LABELS[score]}
          </span>
        )}
      </div>
    </div>
  );
}
