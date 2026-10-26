import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiMessage } from '@/lib/api';
import { useAuth } from '@/store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Name must be at least 2 characters.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setSubmitting(true);
    try {
      await register(form);
      toast.success('Account created.');
      navigate('/blogs', { replace: true });
    } catch (error) {
      toast.error(apiMessage(error, 'Could not register. Please check your details.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-65px)] place-items-center px-4 py-10 pb-24 md:pb-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9793d]">Join the journal</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#231b17]">Register</h1>
          <p className="text-sm text-[#74685f]">Create a reader account.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
            <Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
            <p className="text-xs font-medium text-[#74685f]">Password must be at least 6 characters.</p>
            <Button className="w-full" disabled={submitting}>{submitting ? 'Creating...' : 'Create account'}</Button>
          </form>
          <p className="mt-4 text-sm text-[#74685f]">Already registered? <Link className="font-semibold text-[#7b2d32] underline" to="/login">Login</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}
