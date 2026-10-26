import { UserCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function UserLayout() {
  return (
    <DashboardLayout
      title="Reader profile"
      subtitle="Manage your account information."
      nav={[
        { to: '/profile', label: 'Profile', icon: <UserCircle className="h-4 w-4" /> },
      ]}
    />
  );
}
