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
      `${STRAPI_URL}/api/enrollments?filters[student][id][$eq]=${user.id}&populate[course][populate][lessons][fields][0]=id`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    const data = enrollRes.ok ? await enrollRes.json() : { data: [] };
    const enrollments = data.data || [];

    // For each enrolled course, compute progress
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (item: any) => {
        const course = item.course?.data?.attributes || item.course?.attributes || item.course;
        const courseDocId = item.course?.data?.documentId || item.course?.documentId || item.course?.id;
        const lessons: any[] = course?.lessons || [];
        const totalLessons = lessons.length;

        if (totalLessons === 0) return { ...item, progress: 0, completed: 0, total: 0 };

        const lessonIds = lessons.map((l: any) => l.documentId || l.id);
        const progressRes = await fetch(
          `${STRAPI_URL}/api/lesson-progresses?filters[student][id][$eq]=${user.id}&filters[lesson][documentId][$in]=${lessonIds.join('&filters[lesson][documentId][$in]=')}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let completed = 0;
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          completed = progressData.data?.length || 0;
        }

        const progress = Math.round((completed / totalLessons) * 100);
        return { ...item, progress, completed, total: totalLessons };
      })
    );

    return { enrollments: enrollmentsWithProgress, user };
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
            <p className="text-slate-400 text-sm">Browse our course catalog to find a course you&apos;d like to take.</p>
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

              const progress: number = item.progress ?? 0;
              const completed: number = item.completed ?? 0;
              const total: number = item.total ?? 0;
              const isFinished = progress === 100;

              return (
                <div
                  key={item.id || item.documentId}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">{course.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{course.description || 'No description'}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {total > 0 ? `${completed} / ${total} lessons` : 'No lessons yet'}
                      </span>
                      <span
                        className={`font-bold ${
                          isFinished
                            ? 'text-emerald-400'
                            : progress > 0
                            ? 'text-indigo-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isFinished
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-800/80 mt-5 flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isFinished ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {isFinished ? '🎉 Completed!' : progress > 0 ? '📚 In Progress' : '⏳ Not Started'}
                    </span>
                    <Link
                      href={`/courses/${courseDocId}`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      {progress > 0 ? 'Continue →' : 'Open Course →'}
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
