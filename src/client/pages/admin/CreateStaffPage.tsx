import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiMessage } from '@/lib/api';
import { adminService } from '@/services/admin.service';

export default function CreateStaffPage() {
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admins/');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Name must be at least 2 characters.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setSubmitting(true);
    try {
      if (isAdmin) await adminService.createAdmin(form);
      else await adminService.createEditor(form);
      toast.success(`${isAdmin ? 'Admin' : 'Editor'} created.`);
      navigate('/admin/users');
    } catch (error) {
      toast.error(apiMessage(error, 'Could not create account. Email may already exist.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <h2 className="text-2xl font-semibold">Create {isAdmin ? 'admin' : 'editor'}</h2>
        {isAdmin && <p className="text-sm font-medium text-red-600">Admins have full control of The Read.</p>}
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
          <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          <Input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
          <p className="text-xs font-medium text-[#74685f]">Password must be at least 6 characters.</p>
          <Button disabled={submitting}>{submitting ? 'Creating...' : `Create ${isAdmin ? 'admin' : 'editor'}`}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
