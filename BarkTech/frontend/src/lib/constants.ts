export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const AGENT_BASE_URL = import.meta.env.VITE_AGENT_URL || '/agent';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1014530290139-uun4922gtv7k66v6j4693ehinsqlhc0j.apps.googleusercontent.com';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'bark_auth_token',
  AUTH_USER: 'bark_auth_user',
  THEME: 'bark_theme',
  SIDEBAR: 'bark_sidebar',
  CHAT_MESSAGES: 'bark_chat_messages',
  CHAT_EXPIRY: 'bark_chat_expiry',
} as const;

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-purple-100 text-purple-800',
  quoted: 'bg-indigo-100 text-indigo-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales: 'Sales',
  support: 'Support',
  viewer: 'Viewer',
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CHAT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const QUERY_KEYS = {
  AUTH: ['auth'] as const,
  PRODUCTS: ['products'] as const,
  PRODUCT: (slug: string) => ['products', slug] as const,
  PRODUCT_BY_ID: (id: string) => ['products', id] as const,
  CATEGORIES: ['categories'] as const,
  FEATURED_PRODUCTS: ['products', 'featured'] as const,
  INQUIRIES: ['inquiries'] as const,
  INQUIRY: (id: string) => ['inquiries', id] as const,
  INQUIRY_STATS: ['inquiries', 'stats'] as const,
  INVOICES: ['invoices'] as const,
  INVOICE: (id: string) => ['invoices', id] as const,
  INVOICE_STATS: ['invoices', 'stats'] as const,
} as const;
