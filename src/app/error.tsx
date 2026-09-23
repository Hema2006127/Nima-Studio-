'use client';

import { useEffect } from 'react';

// Rendered for unexpected errors. Bilingual because the locale isn't available here.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-x flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="display text-4xl">Something went wrong</h1>
      <p className="mt-2 text-ink-soft" lang="ar" dir="rtl">
        حصلت مشكلة. جرّب تاني.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-8">
        Try again · جرّب تاني
      </button>
    </main>
  );
}
