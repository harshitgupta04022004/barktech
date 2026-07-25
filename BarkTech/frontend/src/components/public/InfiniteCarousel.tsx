import { Link } from 'react-router-dom';

export interface CarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  link: string;
  badge?: string;
  badgeColor?: string;
}

interface InfiniteCarouselProps {
  items: CarouselItem[];
  speed?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
}

export function InfiniteCarousel({ items, speed = 30, reverse = false, pauseOnHover = true }: InfiniteCarouselProps) {
  // Duplicate 4x for extra smooth seamless loop
  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className="relative w-full overflow-hidden group/carousel">
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-900 to-transparent z-10" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-900 to-transparent z-10" />

      <div
        className="flex w-max gap-5"
        style={{
          animation: `carousel-h ${speed}s linear infinite ${reverse ? 'reverse' : 'normal'}`,
        }}
        onMouseEnter={(e) => {
          if (pauseOnHover) (e.currentTarget as HTMLElement).style.animationPlayState = 'paused';
        }}
        onMouseLeave={(e) => {
          if (pauseOnHover) (e.currentTarget as HTMLElement).style.animationPlayState = 'running';
        }}
      >
        {duplicatedItems.map((item, i) => (
          <Link
            key={`${item.id}-${i}`}
            to={item.link}
            className="relative flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] h-[200px] sm:h-[220px] md:h-[240px] overflow-hidden rounded-2xl group/card"
          >
            {/* Image */}
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover group-hover/card:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-primary/50 text-sm font-medium">{item.title}</span>
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Badge */}
            {item.badge && (
              <span
                className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm ${item.badgeColor || 'bg-primary text-white'}`}
              >
                {item.badge}
              </span>
            )}

            {/* Content overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-sm sm:text-base font-semibold text-white line-clamp-2 drop-shadow-lg">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="mt-1 text-xs text-gray-300 line-clamp-1 drop-shadow">{item.subtitle}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes carousel-h {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
      `}</style>
    </div>
  );
}
