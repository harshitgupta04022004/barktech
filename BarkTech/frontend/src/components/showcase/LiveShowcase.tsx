import { useLiveShowcase } from './useLiveShowcase';
import { InfiniteMarquee } from './InfiniteMarquee';

export function LiveShowcase() {
  const { data: items, isLoading, isError } = useLiveShowcase();

  if (isLoading || isError || !items || items.length === 0) return null;

  return (
    <section className="relative bg-gradient-to-b from-gray-950 via-gray-900/80 to-gray-950 py-20 sm:py-28 overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute top-0 left-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative">
        {/* Section Header */}
        <div className="text-center mb-14 sm:mb-16 px-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Live Showcase</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Explore Our World
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
            Products, news, and successful installations — updated in real time
          </p>
        </div>

        {/* Marquee */}
        <InfiniteMarquee items={items} speed={0.6} />
      </div>
    </section>
  );
}
