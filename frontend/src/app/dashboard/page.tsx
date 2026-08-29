import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { STRAPI_URL } from '@/lib/api';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getUser();
  const params = await searchParams;

  if (!user) {
    redirect('/login');
  }

  const roleName = user.role?.name || user.role?.type || 'Student';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation / Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
                {roleName}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">Logged in as {user.username} ({user.email})</p>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </form>
        </header>

        {params.error === 'unauthorized' && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm font-medium">
            ⚠️ Access Denied: You do not have permission to view that restricted page.
          </div>
        )}

        {/* Role-Based Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition-all">
            <h2 className="text-lg font-bold text-white mb-2">📚 Courses</h2>
            <p className="text-slate-400 text-sm mb-4">Browse available catalog and your enrolled courses.</p>
            <Link
              href="/courses"
              className="inline-block text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View Courses &rarr;
            </Link>
          </div>

          {(roleName === 'Instructor' || roleName === 'Admin' || roleName === 'Content Manager') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition-all">
              <h2 className="text-lg font-bold text-white mb-2">🛠️ Course Management</h2>
              <p className="text-slate-400 text-sm mb-4">Create & manage your course curriculum & lessons.</p>
              <Link
                href="/instructor"
                className="inline-block text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Instructor Portal &rarr;
              </Link>
            </div>
          )}

          {roleName === 'Admin' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition-all">
              <h2 className="text-lg font-bold text-white mb-2">⚡ Admin Panel</h2>
              <p className="text-slate-400 text-sm mb-4">Manage user roles, system stats & platform permissions.</p>
              <Link
                href="/admin-panel"
                className="inline-block text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                Admin Control Panel &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
