import type { LiveShowcaseResponse } from './showcase';

const API_BASE = '/api';

export async function fetchLiveShowcase(): Promise<LiveShowcaseResponse> {
  const res = await fetch(`${API_BASE}/live-showcase`);
  if (!res.ok) {
    throw new Error(`Failed to fetch live showcase: ${res.status}`);
  }
  return res.json();
}
