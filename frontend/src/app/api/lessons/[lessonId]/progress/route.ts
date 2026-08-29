import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current user
    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await meRes.json();

    // Check if progress record already exists
    const existing = await fetch(
      `${STRAPI_URL}/api/lesson-progresses?filters[student][id][$eq]=${user.id}&filters[lesson][documentId][$eq]=${lessonId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const existingData = await existing.json();

    if (existingData.data && existingData.data.length > 0) {
      // Already marked complete — just return success
      return NextResponse.json({ success: true, alreadyCompleted: true });
    }

    // Create a new LessonProgress record
    const createRes = await fetch(`${STRAPI_URL}/api/lesson-progresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          student: user.id,
          lesson: lessonId,
          completedAt: new Date().toISOString(),
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json({ error: err }, { status: createRes.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
