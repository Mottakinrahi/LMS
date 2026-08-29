import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { STRAPI_URL } from '@/lib/api';
import MarkCompleteButton from './MarkCompleteButton';

export const dynamic = 'force-dynamic';

async function getLessonData(courseId: string, lessonId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return { allowed: false, lesson: null, course: null, lessons: [], userId: null, isCompleted: false };

  try {
    // 1. Verify User
    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return { allowed: false, lesson: null, course: null, lessons: [], userId: null, isCompleted: false };
    const user = await meRes.json();

    // 2. Verify Enrollment or Admin/Instructor access
    const roleName = user.role?.name || user.role?.type || '';
    const isStaff = roleName === 'Admin' || roleName === 'Instructor' || roleName === 'Content Manager';

    if (!isStaff) {
      const enrollRes = await fetch(
        `${STRAPI_URL}/api/enrollments?filters[student][id][$eq]=${user.id}&filters[course][documentId][$eq]=${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
      );

      if (!enrollRes.ok) return { allowed: false, lesson: null, course: null, lessons: [], userId: null, isCompleted: false };
      const enrollData = await enrollRes.json();
      if (!enrollData.data || enrollData.data.length === 0) {
        return { allowed: false, lesson: null, course: null, lessons: [], userId: null, isCompleted: false };
      }
    }

    // 3. Fetch Course and Lessons
    const courseRes = await fetch(
      `${STRAPI_URL}/api/courses/${courseId}?populate[lessons][sort]=order:asc`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    if (!courseRes.ok) return { allowed: true, lesson: null, course: null, lessons: [], userId: null, isCompleted: false };
    const courseData = await courseRes.json();
    const course = courseData.data?.attributes || courseData.data;
    const lessons = course?.lessons || [];

    // Find target lesson
    const lesson = lessons.find(
      (l: any) => l.documentId === lessonId || String(l.id) === lessonId
    );

    // 4. Check if this lesson is already completed by the student
    let isCompleted = false;
    if (lesson) {
      const progressRes = await fetch(
        `${STRAPI_URL}/api/lesson-progresses?filters[student][id][$eq]=${user.id}&filters[lesson][documentId][$eq]=${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      );
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        isCompleted = progressData.data && progressData.data.length > 0;
      }
    }

    return { allowed: true, lesson, course, lessons, userId: user.id, isCompleted };
  } catch (err) {
    return { allowed: false, lesson: null, course: null, lessons: [], userId: null, isCompleted: false };
  }
}

export default async function LessonViewerPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: courseId, lessonId } = await params;
  const { allowed, lesson, course, lessons, isCompleted } = await getLessonData(courseId, lessonId);

  if (!allowed) {
    redirect(`/courses/${courseId}`);
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Lesson Not Found</h1>
          <Link href={`/courses/${courseId}`} className="text-indigo-400 font-semibold">
            &larr; Back to Course
          </Link>
        </div>
      </div>
    );
  }

  // Find prev/next lessons
  const currentIndex = lessons.findIndex(
    (l: any) => l.documentId === lessonId || String(l.id) === lessonId
  );
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/courses/${courseId}`}
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            &larr; Back to Course Overview
          </Link>
          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Lesson {lesson.order || currentIndex + 1} of {lessons.length}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-extrabold text-white">{lesson.title}</h1>
            {/* Completion badge */}
            {isCompleted && (
              <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                ✓ Completed
              </span>
            )}
          </div>

          {/* Video Player Embed if videoUrl exists */}
          {lesson.videoUrl && (
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black">
              {lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={lesson.videoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <video src={lesson.videoUrl} controls className="w-full h-full" />
              )}
            </div>
          )}

          {/* Lesson Content Body */}
          <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4">
            {lesson.content || 'No text content provided for this lesson.'}
          </div>

          {/* Mark Complete Button */}
          <div className="pt-4 border-t border-slate-800/60">
            <MarkCompleteButton lessonId={lessonId} isCompleted={isCompleted} />
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
            {prevLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${prevLesson.documentId || prevLesson.id}`}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700 transition-all"
              >
                &larr; Previous Lesson
              </Link>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${nextLesson.documentId || nextLesson.id}`}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
              >
                Next Lesson &rarr;
              </Link>
            ) : (
              <Link
                href={`/courses/${courseId}`}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all"
              >
                ✓ Complete Course
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
