import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Table } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiMessage } from '@/lib/api';
import { adminService } from '@/services/admin.service';
import { useAuth } from '@/store/authStore';
import type { User } from '@/types/user';

export default function ManageUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingId, setProcessingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebounced(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  function load() {
    adminService.users({ page, limit: 10, search: debounced }).then((result) => {
      setUsers(result.items);
      setTotalPages(result.totalPages);
    });
  }

  useEffect(load, [debounced, page]);

  async function action(label: string, id: string, run: () => Promise<User>) {
    if (processingId) return;
    setProcessingId(id);
    try {
      await run();
      toast.success(label);
      load();
    } catch (error) {
      toast.error(apiMessage(error, 'Admin action failed.'));
    } finally {
      setProcessingId('');
    }
  }

  async function deleteUser() {
    if (!deleteTarget || processingId) return;
    const target = deleteTarget;
    setProcessingId(target.id);
    try {
      const deleted = await adminService.deleteUser(target.id);
      toast.success('User account disabled.');
      setDeleteTarget(null);
      setUsers((current) => current.filter((item) => item.id !== target.id).map((item) => item.id === deleted.id ? deleted : item));
      load();
    } catch (error) {
      toast.error(apiMessage(error, 'Could not delete user.'));
    } finally {
      setProcessingId('');
    }
  }

  const activeAdminsOnKnownList = users.filter((item) => item.role === 'ADMIN' && item.status !== 'DELETED').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Manage users</h2><Input className="max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" /></div>
      <Card>
        <CardContent>
          {users.length ? (
            <Table>
              <thead><tr className="border-b text-[#74685f]"><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{users.map((user) => {
                const blocked = user.isBlocked || user.status === 'BLOCKED';
                const deleted = user.status === 'DELETED';
                const isCurrentAdmin = user.id === currentUser?.id;
                const isLastKnownAdmin = user.role === 'ADMIN' && activeAdminsOnKnownList <= 1 && totalPages === 1;
                const canDelete = !deleted && !isCurrentAdmin && !isLastKnownAdmin;
                return (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{deleted ? 'Deleted' : blocked ? 'Blocked' : 'Active'}</td>
                    <td className="flex flex-wrap gap-2 py-2">
                      {blocked ? (
                        <Button size="sm" disabled={deleted || processingId === user.id} onClick={() => void action('User unblocked.', user.id, () => adminService.unblockUser(user.id))}>Unblock</Button>
                      ) : (
                        <Button size="sm" variant="destructive" disabled={deleted || processingId === user.id} onClick={() => void action('User blocked.', user.id, () => adminService.blockUser(user.id))}>Block</Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="destructive" disabled={processingId === user.id} onClick={() => setDeleteTarget(user)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}</tbody>
            </Table>
          ) : <p className="text-[#74685f]">No users found.</p>}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user"
        message="Are you sure you want to delete this user? This action will disable the user account."
        confirmLabel={deleteTarget && processingId === deleteTarget.id ? 'Deleting...' : 'Delete'}
        onConfirm={() => void deleteUser()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
