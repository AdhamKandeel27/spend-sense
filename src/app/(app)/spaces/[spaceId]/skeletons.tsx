export function OverviewSkeleton() {
  return (
    <div aria-busy aria-label="Loading" className="loading-placeholder">
      <div className="h-56 bg-[#cfd3cd] lg:h-64" />
      <div className="mx-auto max-w-6xl px-5 pt-7 lg:px-10">
        <div className="h-16 bg-line" />
        <div className="mt-4 h-24 w-2/3 bg-line" />
        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[3/4] bg-line" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div aria-busy aria-label="Loading" className="mx-auto max-w-3xl loading-placeholder px-5 pt-8 lg:px-10">
      <div className="h-6 w-40 bg-line" />
      <div className="mt-6 h-12 bg-line" />
      <div className="mt-4 h-12 bg-line" />
      <div className="mt-4 h-40 bg-line" />
    </div>
  );
}
