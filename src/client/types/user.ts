import type { UserRole } from './auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBlocked?: boolean;
  status?: 'ACTIVE' | 'BLOCKED' | string;
  createdAt?: string;
}

export interface AdminStats {
  totalUsers?: number;
  users?: number;
  totalAuthors?: number;
  authors?: number;
  totalEditors?: number;
  editors?: number;
  totalAdmins?: number;
  admins?: number;
  totalBlogs?: number;
  submittedBlogs?: number;
  underReviewBlogs?: number;
  approvedBlogs?: number;
  publishedBlogs?: number;
  rejectedBlogs?: number;
}
