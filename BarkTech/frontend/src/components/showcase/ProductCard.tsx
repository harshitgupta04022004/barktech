import { Link } from 'react-router-dom';
import type { ShowcaseProduct } from './showcase';

export function ProductCard({ item }: { item: ShowcaseProduct }) {
  return (
    <Link
      to={`/products/${item.slug}`}
      className="group relative flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] overflow-hidden rounded-2xl bg-gray-900/80 border border-white/[0.06] backdrop-blur-sm hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10"
    >
      {/* Image */}
      <div className="relative h-[200px] sm:h-[220px] overflow-hidden bg-gray-800/50">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />

        {/* Badge */}
        <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/90 text-white shadow-lg shadow-primary/30 backdrop-blur-sm">
          Product
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/70">{item.category}</span>
        <h3 className="mt-1.5 text-[15px] font-bold text-white line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-snug">
          {item.name}
        </h3>
        <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
        <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          View Details
          <svg className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>
    </Link>
  );
}
