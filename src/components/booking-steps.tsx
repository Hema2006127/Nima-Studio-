export function Steps({ t, active }: { t: { booking: { step1: string; step2: string; step3: string } }; active: number }) {
  const steps = [t.booking.step1, t.booking.step2, t.booking.step3];
  return (
    <ol className="mt-10 max-w-md">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < active ? 'done' : n === active ? 'active' : 'todo';
        return (
          <li key={label} className="flex items-center gap-4 border-b border-line py-4">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs ${
                state === 'active' ? 'border-ink text-ink' : state === 'done' ? 'border-primary bg-primary text-primary-fg' : 'border-line text-ink-soft'
              }`}
            >
              {state === 'done' ? '✓' : n}
            </span>
            <span className={state === 'todo' ? 'text-ink-soft' : 'text-ink'}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
