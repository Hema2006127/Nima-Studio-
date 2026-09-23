'use client';

import { SubmitButton } from '@/components/form';

export function DeleteButton({
  action,
  id,
  label,
  confirmText,
  name = 'id',
  className = 'btn-danger !px-0',
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
  confirmText: string;
  name?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name={name} value={id} />
      <SubmitButton className={className} pendingText="Deleting…">
        {label}
      </SubmitButton>
    </form>
  );
}
