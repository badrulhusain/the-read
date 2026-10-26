import type { Announcement, ScheduleItem } from './types';

export const CAMPUS = { name: 'Ashworth College', motto: 'Lectio. Veritas. Lumen.', est: 1897 };

// Static content — no backend endpoints for these yet
export const ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', kind: 'Editorial', title: 'Submissions open for the Spring Quarterly', body: 'The Read is accepting long-form essays (1,500–4,000 words) for the Spring 2026 print issue. Deadline May 14.', time: '2h ago', pinned: true },
  { id: 'a2', kind: 'Campus', title: 'Whitfield Library extends 24-hour access through finals', body: 'Third and fourth floors will remain open overnight from April 28 through May 12.', time: 'Yesterday' },
  { id: 'a3', kind: 'Event', title: "Editorial meeting — The Read", body: 'Thursday 6pm, Whitfield 3F. Open to all contributors.', time: '2 days ago' },
];

export const SCHEDULE_TODAY: ScheduleItem[] = [
  { time: '09:00', title: 'ENGL 311 — The Long 19th Century', room: 'Harcourt 204', kind: 'class' },
  { time: '11:30', title: 'Editorial meeting — The Read', room: 'Whitfield 3F', kind: 'meeting', highlight: true },
  { time: '14:00', title: 'Office hours — Prof. Ames', room: 'Morris 112', kind: 'office' },
  { time: '18:00', title: 'Guest lecture: Philosophy Dept.', room: 'Harcourt Auditorium', kind: 'event' },
];

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}
