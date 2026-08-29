'use client';

import { useState } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role?: {
    id: number;
    name: string;
    type: string;
  };
}

interface Role {
  id: number;
  name: string;
  type: string;
  description?: string;
}

interface Props {
  initialUsers: User[];
  roles: Role[];
}

export default function AdminUserTable({ initialUsers, roles }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ id: number; text: string; type: 'success' | 'error' } | null>(null);

  async function handleRoleChange(userId: number, newRoleId: number) {
    setUpdatingId(userId);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: newRoleId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMsg({ id: userId, text: data.error || 'Failed to update role', type: 'error' });
        return;
      }

      // Find role info to update local state
      const targetRole = roles.find((r) => r.id === Number(newRoleId));
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
      );
      setMsg({ id: userId, text: '✓ Role updated', type: 'success' });
    } catch {
      setMsg({ id: userId, text: 'Network error', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300 border-collapse">
        <thead>
          <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <th className="py-3 px-4">User</th>
            <th className="py-3 px-4">Email</th>
            <th className="py-3 px-4">Current Role</th>
            <th className="py-3 px-4">Assign New Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {users.map((u) => {
            const currentRoleId = u.role?.id;
            const roleType = u.role?.type || u.role?.name || 'student';
            const isUpdating = updatingId === u.id;
            const feedback = msg?.id === u.id ? msg : null;

            return (
              <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-4 px-4 font-semibold text-white">{u.username}</td>
                <td className="py-4 px-4 text-slate-400">{u.email}</td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                      roleType.toLowerCase() === 'admin'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : roleType.toLowerCase() === 'instructor'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : roleType.toLowerCase() === 'content_manager'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {u.role?.name || roleType}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <select
                      id={`role-select-${u.id}`}
                      value={currentRoleId || ''}
                      onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                      disabled={isUpdating}
                      className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>

                    {isUpdating && (
                      <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    )}

                    {feedback && (
                      <span
                        className={`text-xs font-semibold ${
                          feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {feedback.text}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
