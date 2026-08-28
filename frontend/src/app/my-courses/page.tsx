import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { STRAPI_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getMyEnrollments() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return { enrollments: [], user: null };

  try {
    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return { enrollments: [], user: null };
    const user = await meRes.json();

    const enrollRes = await fetch(
      `${STRAPI_URL}/api/enrollments?filters[student][id][$eq]=${user.id}&populate[course][populate]=*`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    const data = enrollRes.ok ? await enrollRes.json() : { data: [] };
    return { enrollments: data.data || [], user };
  } catch {
    return { enrollments: [], user: null };
  }
}

export default async function MyCoursesPage() {
  const { enrollments, user } = await getMyEnrollments();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">My Enrolled Courses</h1>
            <p className="text-slate-400 text-sm mt-1">Continue your learning journey</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-sm font-semibold transition-all"
          >
            Dashboard
          </Link>
        </header>

        {enrollments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">You are not enrolled in any courses yet</h2>
            <p className="text-slate-400 text-sm">Browse our course catalog to find a course you'd like to take.</p>
            <Link
              href="/courses"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((item: any) => {
              const course = item.course?.data?.attributes || item.course?.attributes || item.course;
              const courseDocId = item.course?.data?.documentId || item.course?.documentId || item.course?.id;

              if (!course) return null;

              return (
                <div
                  key={item.id || item.documentId}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">{course.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{course.description || 'No description'}</p>
                  </div>

                  <div className="pt-6 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-semibold">✓ Enrolled</span>
                    <Link
                      href={`/courses/${courseDocId}`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      Open Course &rarr;
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
