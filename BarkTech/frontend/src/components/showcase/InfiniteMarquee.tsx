import { useMemo } from 'react';
import { useInfiniteMarquee } from './useInfiniteMarquee';
import { ShowcaseCard } from './ShowcaseCard';
import type { ShowcaseItem } from './showcase';

interface InfiniteMarqueeProps {
  items: ShowcaseItem[];
  speed?: number;
}

export function InfiniteMarquee({ items, speed = 0.8 }: InfiniteMarqueeProps) {
  const { trackRef, handleMouseEnter, handleMouseLeave } = useInfiniteMarquee({ speed });

  const duplicated = useMemo(() => [...items, ...items], [items]);

  if (items.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden py-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-gray-950 via-gray-950/90 to-transparent z-10" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-gray-950 via-gray-950/90 to-transparent z-10" />

      <div
        ref={trackRef}
        className="flex gap-5 will-change-transform"
      >
        {duplicated.map((item, i) => (
          <ShowcaseCard key={`${item.type}-${item.id}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
