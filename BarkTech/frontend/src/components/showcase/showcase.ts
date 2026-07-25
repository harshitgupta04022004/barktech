export type ShowcaseItemType = 'product' | 'news' | 'installation';

export interface ShowcaseProduct {
  type: 'product';
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  image: string;
  createdAt: string;
}

export interface ShowcaseNews {
  type: 'news';
  id: string;
  title: string;
  slug: string;
  newsType: string;
  excerpt: string;
  image: string;
  publishedAt: string;
}

export interface ShowcaseInstallation {
  type: 'installation';
  id: string;
  machineModel: string;
  clientName: string;
  location: string;
  status: string;
  image: string;
  date: string;
}

export type ShowcaseItem = ShowcaseProduct | ShowcaseNews | ShowcaseInstallation;

export interface LiveShowcaseResponse {
  success: boolean;
  data: ShowcaseItem[];
  total: number;
  updatedAt: string;
}
