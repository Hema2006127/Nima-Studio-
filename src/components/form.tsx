'use client';

import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/lib/types';

export function SubmitButton({
  children,
  pendingText,
  className = 'btn-primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || props.disabled} aria-busy={pending} className={className} {...props}>
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p role="alert" className="border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p role="status" className="border border-success-fg/20 bg-success-bg px-3.5 py-2.5 text-sm text-success-fg">
        {state.message}
      </p>
    );
  }
  return null;
}

export function FieldError({ state, name }: { state: ActionState; name: string }) {
  const msg = state?.fieldErrors?.[name];
  return msg ? <p className="field-error">{msg}</p> : null;
}
