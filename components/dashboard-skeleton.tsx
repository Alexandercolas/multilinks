function Placeholder({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-shimmer bg-white/[.06] motion-reduce:animate-none ${className}`}
    />
  );
}

function SkeletonCard({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-[2rem] border border-white/15 bg-card/95 p-6 shadow-[0_24px_75px_rgba(0,0,0,.30)]">
      <Placeholder className="h-5 w-32 rounded-lg" />
      <div className="mt-6 space-y-4">
        {lines.map((width, index) => (
          <Placeholder
            key={`${width}-${index}`}
            className={`h-11 rounded-xl ${width}`}
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <main
      className="min-h-screen bg-surface text-white"
      aria-label="Cargando panel"
      aria-busy="true"
    >
      <header className="border-b border-white/10 bg-surface-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Placeholder className="h-7 w-36 rounded-md" />
          <div className="flex items-center gap-3">
            <Placeholder className="h-10 w-24 rounded-xl" />
            <Placeholder className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-7xl gap-8 overflow-x-clip px-5 py-8 pb-28 lg:grid-cols-[1fr_400px] lg:pb-8 lg:pl-24">
        <section className="min-w-0 space-y-6">
          <div className="flex min-h-16 items-end justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <Placeholder className="h-4 w-24 rounded-md" />
              <Placeholder className="h-8 w-40 max-w-full rounded-lg sm:w-56" />
            </div>
            <Placeholder className="h-11 w-28 shrink-0 rounded-xl sm:w-36" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((card) => (
              <div
                key={card}
                className="flex items-center gap-4 rounded-2xl border border-white/15 bg-card/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,.28)]"
              >
                <Placeholder className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Placeholder className="h-7 w-20 rounded-md" />
                  <Placeholder className="h-3 w-28 rounded" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex min-h-24 items-center gap-4 rounded-2xl border border-white/15 bg-card/95 p-5">
            <Placeholder className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-3">
              <Placeholder className="h-4 w-48 max-w-full rounded-md" />
              <Placeholder className="h-3 w-3/4 rounded" />
            </div>
            <Placeholder className="hidden h-10 w-28 shrink-0 rounded-xl sm:block" />
          </div>

          <SkeletonCard lines={["w-full", "w-full", "w-4/5"]} />
          <SkeletonCard lines={["w-3/4", "w-full", "w-2/3"]} />
          <SkeletonCard lines={["w-full", "w-full", "w-full"]} />
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <Placeholder className="mx-auto mb-3 h-3 w-24 rounded" />
            <div className="mx-auto h-[720px] max-w-[390px] overflow-hidden rounded-[42px] border-[10px] border-card-border bg-card-border p-4 shadow-[0_30px_90px_rgba(0,0,0,.45)]">
              <div className="h-full rounded-[30px] border border-white/[.06] bg-card/95 p-6">
                <Placeholder className="mx-auto mt-10 h-24 w-24 rounded-[28px]" />
                <Placeholder className="mx-auto mt-6 h-6 w-44 rounded-lg" />
                <Placeholder className="mx-auto mt-3 h-3 w-32 rounded" />
                <div className="mt-10 space-y-4">
                  <Placeholder className="h-16 w-full rounded-2xl" />
                  <Placeholder className="h-16 w-full rounded-2xl" />
                  <Placeholder className="h-16 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
