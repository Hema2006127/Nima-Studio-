export function PageSkeleton() {
  return (
    <div className="container-x animate-pulse py-14" aria-busy="true" aria-live="polite">
      <div className="h-3 w-24 bg-media" />
      <div className="mt-4 h-12 w-2/3 max-w-md bg-media" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="aspect-video bg-media" />
            <div className="mt-4 h-5 w-1/2 bg-media" />
          </div>
        ))}
      </div>
    </div>
  );
}
