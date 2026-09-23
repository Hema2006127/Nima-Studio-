const STYLES: Record<string, string> = {
  pending: 'bg-soft text-ink-soft',
  draft: 'bg-soft text-ink-soft',
  quoted: 'bg-media text-ink',
  sent: 'bg-media text-ink',
  confirmed: 'bg-success-bg text-success-fg',
  accepted: 'bg-success-bg text-success-fg',
  completed: 'bg-ink/10 text-ink',
  cancelled: 'bg-danger/10 text-danger',
  declined: 'bg-danger/10 text-danger',
  expired: 'bg-danger/10 text-danger',
  published: 'bg-success-bg text-success-fg',
  unpublished: 'bg-soft text-ink-soft',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-block whitespace-nowrap px-2 py-1 text-xs ${STYLES[status] ?? 'bg-soft text-ink-soft'}`}>
      {label ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
