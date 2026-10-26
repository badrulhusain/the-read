export interface Author {
  id: string;
  name: string;
  initials: string;
  role: 'ADMIN' | 'AUTHOR' | 'USER';
  dept: string;
  year: string;
}

export interface Tag {
  id: string;
  name: string;
  hue: string;
}

export type BlockType = 'p' | 'h2' | 'pull';

export interface ContentBlock {
  type: BlockType;
  text: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  coverAccent: string;
  coverImageUrl?: string;
  author: Author;
  createdAt: string;
  readTime: number;
  tags: Tag[];
  views: number;
  comments: number;
  reactions: number;
  featured?: boolean;
  content: ContentBlock[];
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  rawContent?: string;
}

export interface Announcement {
  id: string;
  kind: string;
  title: string;
  body: string;
  time: string;
  pinned?: boolean;
}

export interface Notification {
  id: string;
  kind: 'comment' | 'follow' | 'reaction' | 'mention' | 'editorial';
  actor: Author | null;
  text: string;
  target: string | null;
  time: string;
  unread: boolean;
}

export interface ScheduleItem {
  time: string;
  title: string;
  room: string;
  kind: string;
  highlight?: boolean;
}

export interface TrendingItem {
  title: string;
  author: string;
  reads: string;
}

export type RouteKey = 'dashboard' | 'feed' | 'write' | 'post' | 'notifications' | 'profile';
export type RoleKey = 'student' | 'faculty' | 'admin';
export type AccentKey = 'burgundy' | 'forest' | 'ochre' | 'indigo' | 'slate';
