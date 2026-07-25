import type { ShowcaseItem } from './showcase';
import { ProductCard } from './ProductCard';
import { NewsCard } from './NewsCard';
import { InstallationCard } from './InstallationCard';

export function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  switch (item.type) {
    case 'product':
      return <ProductCard item={item} />;
    case 'news':
      return <NewsCard item={item} />;
    case 'installation':
      return <InstallationCard item={item} />;
    default:
      return null;
  }
}
