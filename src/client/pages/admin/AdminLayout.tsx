import { FileText, LayoutDashboard, MessageSquare, ShieldPlus, Tags, UserPlus, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function AdminLayout() {
  return (
    <DashboardLayout
      title="Admin console"
      subtitle="Users, roles, and publishing."
      nav={[
        { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { to: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
        { to: '/admin/publication-queue', label: 'Publication queue', icon: <FileText className="h-4 w-4" /> },
        { to: '/admin/blogs', label: 'All articles', icon: <FileText className="h-4 w-4" /> },
        { to: '/admin/categories', label: 'Categories', icon: <Tags className="h-4 w-4" /> },
        { to: '/admin/tags', label: 'Tags', icon: <Tags className="h-4 w-4" /> },
        { to: '/admin/comments', label: 'Comments', icon: <MessageSquare className="h-4 w-4" /> },
        { to: '/admin/editors/create', label: 'Create Editor', icon: <UserPlus className="h-4 w-4" /> },
        { to: '/admin/admins/create', label: 'Create Admin', icon: <ShieldPlus className="h-4 w-4" /> },
      ]}
    />
  );
}
