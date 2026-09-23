// Small presentational helpers shared by admin pages (server components).

export function PageHeader({ title, actions, description }: { title: string; actions?: React.ReactNode; description?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-4xl sm:text-5xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Notice({ children, tone = 'success' }: { children: React.ReactNode; tone?: 'success' | 'error' }) {
  return (
    <p
      role="status"
      className={`mb-6 px-4 py-3 text-sm ${tone === 'success' ? 'bg-success-bg text-success-fg' : 'border border-danger/30 bg-danger/5 text-danger'}`}
    >
      {children}
    </p>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line text-start text-xs uppercase tracking-wider text-ink-soft">
            {head.map((h, i) => (
              <th key={i} className="px-5 py-3 text-start font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card px-6 py-12 text-center text-sm text-ink-soft">{children}</div>;
}
