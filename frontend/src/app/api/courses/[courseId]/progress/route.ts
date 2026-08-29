import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return NextResponse.json({ progress: 0 });

  try {
    // Get current user
    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ progress: 0 });
    const user = await meRes.json();

    // Get total lessons in course
    const courseRes = await fetch(
      `${STRAPI_URL}/api/courses/${courseId}?populate[lessons][fields][0]=id`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!courseRes.ok) return NextResponse.json({ progress: 0 });
    const courseData = await courseRes.json();
    const course = courseData.data?.attributes || courseData.data;
    const lessons: any[] = course?.lessons || [];
    const totalLessons = lessons.length;

    if (totalLessons === 0) return NextResponse.json({ progress: 0, completed: 0, total: 0 });

    // Get completed lesson count for this user in this course
    const lessonIds = lessons.map((l: any) => l.documentId || l.id);

    // Fetch completed progresses for this user — filter by lesson documentIds
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
    return NextResponse.json({ progress, completed, total: totalLessons });
  } catch {
    return NextResponse.json({ progress: 0 });
  }
}
