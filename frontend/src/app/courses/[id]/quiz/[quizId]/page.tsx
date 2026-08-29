import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { STRAPI_URL } from '@/lib/api';
import QuizForm from './QuizForm';

export const dynamic = 'force-dynamic';

async function getQuizData(courseId: string, quizId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return { allowed: false, quiz: null, user: null, pastAttempt: null };

  try {
    // Get current user
    const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return { allowed: false, quiz: null, user: null, pastAttempt: null };
    const user = await meRes.json();
    const role = user.role?.type || '';

    // Only students can take quizzes
    if (role !== 'student') return { allowed: false, quiz: null, user, pastAttempt: null };

    // Verify enrollment
    const enrollRes = await fetch(
      `${STRAPI_URL}/api/enrollments?filters[student][id][$eq]=${user.id}&filters[course][documentId][$eq]=${courseId}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    );
    const enrollData = enrollRes.ok ? await enrollRes.json() : { data: [] };
    if (!enrollData.data || enrollData.data.length === 0) {
      return { allowed: false, quiz: null, user, pastAttempt: null };
    }

    // Fetch quiz with questions (correctOptionIndex intentionally NOT passed to client — only used server-side for grading)
    const quizRes = await fetch(
      `${STRAPI_URL}/api/quizzes/${quizId}?populate[questions][fields][0]=text&populate[questions][fields][1]=options&populate[questions][fields][2]=documentId`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    );
    if (!quizRes.ok) return { allowed: true, quiz: null, user, pastAttempt: null };
    const quizData = await quizRes.json();
    const quiz = quizData.data;

    // Check for past attempt
    const attemptsRes = await fetch(
      `${STRAPI_URL}/api/quiz-attempts?filters[student][id][$eq]=${user.id}&filters[quiz][documentId][$eq]=${quizId}&sort=submittedAt:desc`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    );
    let pastAttempt = null;
    if (attemptsRes.ok) {
      const attData = await attemptsRes.json();
      if (attData.data && attData.data.length > 0) {
        pastAttempt = attData.data[0];
      }
    }

    return { allowed: true, quiz, user, pastAttempt };
  } catch {
    return { allowed: false, quiz: null, user: null, pastAttempt: null };
  }
}

export default async function QuizTakePage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id: courseId, quizId } = await params;
  const { allowed, quiz, pastAttempt } = await getQuizData(courseId, quizId);

  if (!allowed) {
    redirect(`/courses/${courseId}`);
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Quiz Not Found</h1>
          <Link href={`/courses/${courseId}`} className="text-indigo-400 font-semibold">← Back to Course</Link>
        </div>
      </div>
    );
  }

  const questions: any[] = quiz.questions || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/courses/${courseId}`}
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Course
          </Link>
          <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full font-semibold uppercase tracking-wide">
            Quiz
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-white">{quiz.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Past attempt banner */}
        {pastAttempt && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">You&apos;ve already attempted this quiz</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Last score: <span className="text-indigo-400 font-bold">{pastAttempt.score}%</span>
              </p>
            </div>
            <span className="text-2xl">📋</span>
          </div>
        )}

        <QuizForm quizId={quizId} questions={questions} courseId={courseId} />
      </div>
    </div>
  );
}
