import type { ShowcaseNews } from './showcase';

export function NewsCard({ item }: { item: ShowcaseNews }) {
  const dateStr = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="group relative flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] overflow-hidden rounded-2xl bg-gray-900/80 border border-white/[0.06] backdrop-blur-sm hover:border-blue-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer">
      {/* Image */}
      <div className="relative h-[200px] sm:h-[220px] overflow-hidden bg-gray-800/50">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />

        {/* Badge */}
        <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-600/90 text-white shadow-lg shadow-blue-600/30 backdrop-blur-sm">
          News
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400/70">{item.newsType}</span>
          {dateStr && (
            <>
              <span className="text-gray-700">·</span>
              <span className="text-[10px] text-gray-500 font-medium">{dateStr}</span>
            </>
          )}
        </div>
        <h3 className="text-[15px] font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors duration-300 leading-snug">
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.excerpt}</p>
        )}
      </div>
    </div>
  );
}
