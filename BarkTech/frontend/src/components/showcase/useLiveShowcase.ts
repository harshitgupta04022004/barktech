import { useQuery } from '@tanstack/react-query';
import { fetchLiveShowcase } from './showcaseApi';
import type { ShowcaseItem } from './showcase';

export function useLiveShowcase() {
  return useQuery<ShowcaseItem[]>({
    queryKey: ['live-showcase'],
    queryFn: async () => {
      const res = await fetchLiveShowcase();
      return res.data;
    },
    staleTime: 60_000,      // refetch every 60s for real-time feel
    refetchInterval: 60_000, // auto-refetch every 60s
    refetchOnWindowFocus: true,
  });
}
