import { Inbox, LayoutDashboard, PenLine, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function EditorLayout() {
  return (
    <DashboardLayout
      title="Editor desk"
      subtitle="Review, improve, and recommend contributor submissions."
      nav={[
        { to: '/editor', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { to: '/editor/submissions', label: 'Submissions', icon: <Inbox className="h-4 w-4" /> },
        { to: '/editor/my-work', label: 'My work', icon: <PenLine className="h-4 w-4" /> },
        { to: '/editor/articles/new', label: 'New article', icon: <Plus className="h-4 w-4" /> },
      ]}
    />
  );
}
