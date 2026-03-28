import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export function ResetPasswordPage() {
  const [search] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');

  const token = search.get('token') || '';

  const onSubmit = async (e) => {
    e.preventDefault();
    await api.post('/auth/reset-password', { token, newPassword });
    setStatus('Password reset complete. You can now login.');
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md p-4">
      <h1 className="mb-4 text-2xl font-bold">Reset Password</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-white p-4 shadow">
        <input
          className="w-full rounded border p-2"
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button className="w-full rounded bg-indigo-600 p-2 text-white">Update password</button>
      </form>
      {status ? <p className="mt-3 rounded bg-emerald-100 p-2 text-sm text-emerald-700">{status}</p> : null}
      <Link className="mt-4 inline-block text-sm text-indigo-700" to="/">
        Back to login
      </Link>
    </main>
  );
}
