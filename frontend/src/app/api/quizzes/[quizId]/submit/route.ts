import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

// POST /api/quizzes/[quizId]/submit — submit answers, grading is server-side in Strapi
export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { answers } = body; // { [questionDocId]: selectedOptionIndex }

  if (!answers) {
    return NextResponse.json({ error: 'answers is required' }, { status: 400 });
  }

  // Forward to Strapi's custom server-side grading endpoint
  const strapiRes = await fetch(`${STRAPI_URL}/api/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers }),
  });

  const data = strapiRes.ok ? await strapiRes.json() : await strapiRes.text();
  return NextResponse.json(data, { status: strapiRes.status });
}
