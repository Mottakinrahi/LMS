import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Verify user is Admin
    const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const me = await meRes.json();
    const roleType = me.role?.type || me.role?.name || '';
    if (roleType.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 2. Fetch platform users with roles
    const usersRes = await fetch(`${STRAPI_URL}/api/users?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const users = usersRes.ok ? await usersRes.json() : [];

    // Count users by role
    const roleCounts: Record<string, number> = { admin: 0, instructor: 0, student: 0, content_manager: 0 };
    for (const u of users) {
      const type = (u.role?.type || u.role?.name || 'student').toLowerCase();
      roleCounts[type] = (roleCounts[type] || 0) + 1;
    }

    // 3. Fetch courses count
    const coursesRes = await fetch(`${STRAPI_URL}/api/courses?pagination[pageSize]=1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const coursesData = coursesRes.ok ? await coursesRes.json() : {};
    const totalCourses = coursesData.meta?.pagination?.total || 0;

    // 4. Fetch enrollments count
    const enrollRes = await fetch(`${STRAPI_URL}/api/enrollments?pagination[pageSize]=1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const enrollData = enrollRes.ok ? await enrollRes.json() : {};
    const totalEnrollments = enrollData.meta?.pagination?.total || 0;

    // 5. Fetch all system roles (for role assignment dropdown)
    const rolesRes = await fetch(`${STRAPI_URL}/api/users-permissions/roles`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const rolesData = rolesRes.ok ? await rolesRes.json() : {};
    const roles = rolesData.roles || [];

    return NextResponse.json({
      stats: {
        totalUsers: users.length,
        roleCounts,
        totalCourses,
        totalEnrollments,
      },
      users,
      roles,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
