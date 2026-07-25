export type ContentType = 'blog' | 'news' | 'case_study' | 'installation' | 'general';
export type ReviewStatus = 'draft' | 'in_review' | 'approved' | 'rejected';

export interface ContentItem {
  _id: string;
  contentType: ContentType;
  title: string;
  excerpt?: string;
  body?: string;
  imageUrl?: string;
  reviewStatus: ReviewStatus;
  reviewNotes?: string;
  productId?: string;
  pageSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentListResponse {
  success: boolean;
  data: ContentItem[];
  total: number;
}
