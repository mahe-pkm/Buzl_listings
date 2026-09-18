import type { Category } from './business';

export interface CategoryWithDetails extends Category {
  parent_name: string | null;
  total_listings: number;
  published_listings: number;
  child_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategorySummaryMetrics {
  total: number;
  active: number;
  inactive: number;
  topLevel: number;
  inUse: number;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  parent_id?: string | null;
  sort_order?: number;
  active?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parent_id?: string | null;
  sort_order?: number;
  active?: boolean;
}
