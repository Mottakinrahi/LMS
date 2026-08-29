import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { STRAPI_URL } from '@/lib/api';
import AdminUserTable from './AdminUserTable';

export const dynamic = 'force-dynamic';

async function getAdminData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return { isAllowed: false, stats: null, users: [], roles: [] };

  try {
    const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return { isAllowed: false, stats: null, users: [], roles: [] };
    const me = await meRes.json();
    const roleType = (me.role?.type || me.role?.name || '').toLowerCase();

    if (roleType !== 'admin') {
      return { isAllowed: false, stats: null, users: [], roles: [] };
    }

    // Fetch stats & users from our backend API
    const usersRes = await fetch(`${STRAPI_URL}/api/users?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const users = usersRes.ok ? await usersRes.json() : [];

    const roleCounts: Record<string, number> = { admin: 0, instructor: 0, student: 0, content_manager: 0 };
    for (const u of users) {
      const type = (u.role?.type || u.role?.name || 'student').toLowerCase();
      roleCounts[type] = (roleCounts[type] || 0) + 1;
    }

    const coursesRes = await fetch(`${STRAPI_URL}/api/courses?pagination[pageSize]=1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const coursesData = coursesRes.ok ? await coursesRes.json() : {};
    const totalCourses = coursesData.meta?.pagination?.total || 0;

    const enrollRes = await fetch(`${STRAPI_URL}/api/enrollments?pagination[pageSize]=1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const enrollData = enrollRes.ok ? await enrollRes.json() : {};
    const totalEnrollments = enrollData.meta?.pagination?.total || 0;

    const rolesRes = await fetch(`${STRAPI_URL}/api/users-permissions/roles`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const rolesData = rolesRes.ok ? await rolesRes.json() : {};
    const roles = rolesData.roles || [];

    return {
      isAllowed: true,
      stats: {
        totalUsers: users.length,
        roleCounts,
        totalCourses,
        totalEnrollments,
      },
      users,
      roles,
    };
  } catch {
    return { isAllowed: false, stats: null, users: [], roles: [] };
  }
}

export default async function AdminPanelPage() {
  const { isAllowed, stats, users, roles } = await getAdminData();

  if (!isAllowed) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white">Admin Dashboard</h1>
              <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase rounded-full tracking-wider">
                System Admin
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">Platform statistics, user role assignments, and site controls</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-sm font-semibold transition-all"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-extrabold text-white">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Instructors</p>
            <p className="text-3xl font-extrabold text-indigo-400">{stats?.roleCounts?.instructor || 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Students</p>
            <p className="text-3xl font-extrabold text-emerald-400">{stats?.roleCounts?.student || 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Courses & Enrollments</p>
            <p className="text-2xl font-extrabold text-purple-400">
              {stats?.totalCourses || 0} <span className="text-xs text-slate-500 font-normal">courses</span> / {stats?.totalEnrollments || 0} <span className="text-xs text-slate-500 font-normal">enrolled</span>
            </p>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="text-xl font-bold text-white">User Role Management</h2>
            <span className="text-xs text-slate-400">{users.length} registered accounts</span>
          </div>

          <AdminUserTable initialUsers={users} roles={roles} />
        </div>
      </div>
    </div>
  );
}
