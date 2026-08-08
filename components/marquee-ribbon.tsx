export function MarqueeRibbon({ items }: { items: string[] }) {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y-2 border-ink bg-ink py-3">
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap hover:[animation-play-state:paused]">
        {loop.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-display text-sm font-bold uppercase tracking-widest text-lime"
          >
            {item} <span className="text-white/30">//</span>
          </span>
        ))}
      </div>
    </div>
  );
}
