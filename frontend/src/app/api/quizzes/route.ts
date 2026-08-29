import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

// GET /api/quizzes?courseId=xxx — list quizzes for a course
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  const url = courseId
    ? `${STRAPI_URL}/api/quizzes?filters[course][documentId][$eq]=${courseId}&populate[questions]=true`
    : `${STRAPI_URL}/api/quizzes?populate[questions]=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = res.ok ? await res.json() : { data: [] };
  return NextResponse.json(data);
}

// POST /api/quizzes — create a quiz for a course (Instructor/Admin/CM only)
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { title, courseId } = body;

  if (!title || !courseId) {
    return NextResponse.json({ error: 'title and courseId are required' }, { status: 400 });
  }

  // Verify caller is staff
  const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await meRes.json();
  const role = user.role?.type || '';
  if (!['admin', 'instructor', 'content_manager'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const createRes = await fetch(`${STRAPI_URL}/api/quizzes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: { title, course: courseId } }),
  });

  const data = createRes.ok ? await createRes.json() : await createRes.text();
  return NextResponse.json(data, { status: createRes.status });
}
