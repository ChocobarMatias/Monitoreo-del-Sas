import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [form, setForm] = useState({ email: '', password: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    await login(form.email, form.password);
    navigate('/dashboard');
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md p-4">
      <h1 className="mb-6 text-2xl font-bold">Security Workforce</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-white p-4 shadow">
        <input className="w-full rounded border p-2" placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full rounded border p-2" type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className="w-full rounded bg-indigo-600 p-2 text-white">
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </main>
  );
}
