import Link from 'next/link';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getCourseDetails(id: string) {
  try {
    const res = await fetch(`${STRAPI_URL}/api/courses/${id}?populate[lessons][sort]=order:asc&populate[owner]=*&populate[quizzes][fields][0]=title&populate[quizzes][fields][1]=documentId`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (err) {
    return null;
  }
}

async function checkEnrollment(courseId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return { isEnrolled: false, user: null };

  try {
    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return { isEnrolled: false, user: null };
    const user = await meRes.json();

    const enrollRes = await fetch(
      `${STRAPI_URL}/api/enrollments?filters[student][id][$eq]=${user.id}&filters[course][documentId][$eq]=${courseId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    if (!enrollRes.ok) return { isEnrolled: false, user };
    const enrollData = await enrollRes.json();
    return {
      isEnrolled: enrollData.data && enrollData.data.length > 0,
      user,
    };
  } catch {
    return { isEnrolled: false, user: null };
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseDetails(id);
  const { isEnrolled, user } = await checkEnrollment(id);

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Course Not Found</h1>
          <Link href="/courses" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            &larr; Back to Course Catalog
          </Link>
        </div>
      </div>
    );
  }

  const attrs = course.attributes || course;
  const lessons = attrs.lessons || [];
  const quizzes = attrs.quizzes || [];
  const owner = attrs.owner?.data?.attributes || attrs.owner;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/courses" className="inline-block text-sm font-semibold text-slate-400 hover:text-white transition-colors">
          &larr; Back to Catalog
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          {attrs.coverImageUrl && (
            <img
              src={attrs.coverImageUrl}
              alt={attrs.title}
              className="w-full h-64 object-cover rounded-xl border border-slate-800"
            />
          )}

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white">{attrs.title}</h1>
            {owner && (
              <p className="text-sm text-slate-400">
                Created by <span className="text-indigo-400 font-semibold">{owner.username || owner.email}</span>
              </p>
            )}
          </div>

          <p className="text-slate-300 text-base leading-relaxed">{attrs.description || 'No description available.'}</p>

          {/* Enroll / Continue Action */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {isEnrolled ? (
              <div className="flex items-center gap-4 w-full justify-between">
                <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-semibold">
                  ✓ Enrolled in this course
                </span>
                {lessons.length > 0 && (
                  <Link
                    href={`/courses/${id}/lessons/${lessons[0].documentId || lessons[0].id}`}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    Start Learning &rarr;
                  </Link>
                )}
              </div>
            ) : user ? (
              <form action={`/api/courses/${id}/enroll`} method="POST" className="w-full sm:w-auto">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  Enroll Now
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-center transition-all"
              >
                Sign in to Enroll
              </Link>
            )}
          </div>
        </div>

        {/* Lessons List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Course Curriculum ({lessons.length} Lessons)</h2>

          {lessons.length === 0 ? (
            <p className="text-slate-400 text-sm">No lessons created for this course yet.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson: any, index: number) => (
                <div
                  key={lesson.id || lesson.documentId}
                  className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center text-sm">
                      {lesson.order || index + 1}
                    </span>
                    <span className="font-semibold text-white">{lesson.title}</span>
                  </div>

                  {isEnrolled ? (
                    <Link
                      href={`/courses/${id}/lessons/${lesson.documentId || lesson.id}`}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      View Lesson &rarr;
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500">🔒 Enrolled Students Only</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Quizzes Section — shown to enrolled students */}
        {isEnrolled && quizzes.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">📝 Quizzes ({quizzes.length})</h2>
            <div className="space-y-3">
              {quizzes.map((quiz: any) => (
                <div
                  key={quiz.documentId || quiz.id}
                  className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl"
                >
                  <span className="font-semibold text-white">{quiz.title}</span>
                  <Link
                    href={`/courses/${id}/quiz/${quiz.documentId || quiz.id}`}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Take Quiz →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
