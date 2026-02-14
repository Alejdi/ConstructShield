export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border bg-muted"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl border bg-muted" />
    </div>
  );
}
