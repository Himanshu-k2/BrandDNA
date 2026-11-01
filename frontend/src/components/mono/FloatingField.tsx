import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Check, CircleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FloatingFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  error?: string;
  trailing?: ReactNode;
}

/**
 * Underline input with a floating label. The label sits at body size (16px)
 * and scales to 0.75 (= 12px caption) when focused or filled.
 */
export function FloatingField({ label, error, trailing, className, id, ...props }: FloatingFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="relative pt-6">
        <input
          id={fieldId}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'peer h-12 w-full border-0 border-b bg-transparent text-ui text-ink outline-none placeholder:text-transparent',
            trailing ? 'pr-12' : undefined,
            error ? 'border-danger' : 'border-silver'
          )}
          {...props}
        />
        <label
          htmlFor={fieldId}
          className={cn(
            'pointer-events-none absolute top-9 left-0 origin-left text-ui transition-[transform,color] duration-200 ease-(--ease-refined)',
            'peer-focus:-translate-y-8 peer-focus:scale-75 peer-focus:text-ink',
            'peer-[:not(:placeholder-shown)]:-translate-y-8 peer-[:not(:placeholder-shown)]:scale-75',
            error ? 'text-danger' : 'text-graphite'
          )}
        >
          {label}
        </label>
        {/* Focus underline grows from the left in Almost Black. */}
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute bottom-0 left-0 h-0.5 w-full origin-left bg-ink transition-transform duration-400 ease-(--ease-refined) peer-focus:scale-x-100',
            error ? 'scale-x-100 bg-danger' : 'scale-x-0'
          )}
        />
        {trailing && <div className="absolute right-0 bottom-1 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="flex items-center gap-1 text-caption font-medium text-danger">
          <CircleAlert className="size-4 shrink-0" strokeWidth={1.5} />
          {error}
        </p>
      )}
    </div>
  );
}

export function MonoCheckbox({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-caption text-graphite select-none">
      <span className="relative flex size-5 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={event => onChange(event.target.checked)}
          className="peer size-5 cursor-pointer appearance-none rounded-min border border-mid bg-paper transition-colors checked:border-ink checked:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        />
        <Check className="pointer-events-none absolute size-4 text-paper opacity-0 peer-checked:opacity-100" strokeWidth={1.5} aria-hidden />
      </span>
      {children}
    </label>
  );
}

interface FloatingTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'> {
  label: string;
  hint?: string;
  error?: string;
}

/**
 * Soft-bordered textarea (4px floor: it sits in 24px-padded cards) with a floating label: 16px at rest,
 * scaled to 0.75 (12px caption) on focus or when filled. Almost Black focus border.
 */
export function FloatingTextArea({ label, hint, error, className, id, rows = 3, ...props }: FloatingTextAreaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const noteId = `${fieldId}-note`;
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <textarea
          id={fieldId}
          rows={rows}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? noteId : undefined}
          className={cn(
            'peer block w-full resize-y rounded-min border bg-paper px-4 pt-8 pb-3 text-body text-ink outline-none transition-colors duration-200 placeholder:text-transparent disabled:cursor-not-allowed disabled:opacity-40',
            error ? 'border-danger focus:border-danger' : 'border-silver focus:border-ink',
            className
          )}
          {...props}
        />
        <label
          htmlFor={fieldId}
          className={cn(
            'pointer-events-none absolute top-4 left-4 origin-left text-ui transition-[transform,color] duration-200 ease-(--ease-refined)',
            'peer-focus:-translate-y-2 peer-focus:scale-75 peer-focus:text-ink',
            'peer-[:not(:placeholder-shown)]:-translate-y-2 peer-[:not(:placeholder-shown)]:scale-75',
            error ? 'text-danger' : 'text-graphite'
          )}
        >
          {label}
        </label>
      </div>
      {(error || hint) && (
        <p id={noteId} className={cn('flex items-center gap-1 text-caption', error ? 'font-medium text-danger' : 'text-mid')}>
          {error && <CircleAlert className="size-4 shrink-0" strokeWidth={1.5} />}
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
