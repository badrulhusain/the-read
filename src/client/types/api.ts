export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
  meta?: PaginatedResponse<never>['meta'];
}

export interface ApiErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  categoryId?: string;
  tag?: string;
  tagId?: string;
}
