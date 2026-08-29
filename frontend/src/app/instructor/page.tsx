import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { STRAPI_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getInstructorCourses() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return { courses: [], user: null };

  try {
    const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return { courses: [], user: null };
    const user = await meRes.json();

    const roleName = user.role?.name || user.role?.type || '';
    let url = `${STRAPI_URL}/api/courses?populate=*`;

    // Filter by owner if Instructor
    if (roleName === 'Instructor' || roleName === 'instructor') {
      url = `${STRAPI_URL}/api/courses?filters[owner][id][$eq]=${user.id}&populate=*`;
    }

    const coursesRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const coursesData = coursesRes.ok ? await coursesRes.json() : { data: [] };
    return { courses: coursesData.data || [], user };
  } catch {
    return { courses: [], user: null };
  }
}

export default async function InstructorDashboardPage() {
  const { courses, user } = await getInstructorCourses();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Instructor Portal</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your courses, lessons, and curriculum</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-sm font-semibold transition-all"
            >
              Dashboard
            </Link>
            <Link
              href="/instructor/courses/create"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm"
            >
              + Create New Course
            </Link>
          </div>
        </header>

        {courses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">You haven't created any courses yet</h2>
            <p className="text-slate-400 text-sm">Start building your curriculum today.</p>
            <Link
              href="/instructor/courses/create"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
            >
              Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => {
              const attrs = course.attributes || course;
              const docId = course.documentId || course.id;

              return (
                <div
                  key={docId}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">{attrs.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{attrs.description || 'No description'}</p>
                  </div>

                  <div className="pt-6 border-t border-slate-800/80 mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/instructor/courses/${docId}/lessons`}
                      className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold rounded-lg transition-all"
                    >
                      Manage Lessons →
                    </Link>
                    <Link
                      href={`/instructor/courses/${docId}/quiz`}
                      className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-xs font-semibold rounded-lg transition-all"
                    >
                      Quiz Builder →
                    </Link>
                    <Link
                      href={`/courses/${docId}`}
                      className="px-3 py-2 text-slate-400 hover:text-white text-xs font-medium"
                    >
                      View Public Page
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
