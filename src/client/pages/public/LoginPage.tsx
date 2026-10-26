import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiMessage } from '@/lib/api';
import { isBlockedUser } from '@/services/auth.service';
import { roleHome, useAuth } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      if (isBlockedUser(user)) throw new Error('This account is blocked. Please contact an admin.');
      toast.success('Welcome back.');
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || roleHome(user.role), { replace: true });
    } catch (error) {
      toast.error(apiMessage(error, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-65px)] place-items-center px-4 py-10 pb-24 md:pb-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9793d]">Welcome back</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#231b17]">Login</h1>
          <p className="text-sm text-[#74685f]">Use your The Read account.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <Button className="w-full" disabled={submitting}>{submitting ? 'Logging in...' : 'Login'}</Button>
          </form>
          <p className="mt-4 text-sm text-[#74685f]">New here? <Link className="font-semibold text-[#7b2d32] underline" to="/register">Register</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}
