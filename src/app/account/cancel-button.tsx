'use client';

import { useActionState } from 'react';
import { cancelBooking } from './actions';
import { FormMessage, SubmitButton } from '@/components/form';

export function CancelBookingButton({ bookingId, label, confirmText }: { bookingId: string; label: string; confirmText: string }) {
  const [state, action] = useActionState(cancelBooking, null);
  return (
    <form
      action={action}
      className="ms-auto"
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="booking_id" value={bookingId} />
      {state?.error && <FormMessage state={state} />}
      <SubmitButton className="btn-danger">{label}</SubmitButton>
    </form>
  );
}
