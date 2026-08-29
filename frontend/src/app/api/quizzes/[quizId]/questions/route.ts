import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

// POST /api/quizzes/[quizId]/questions — add a question to a quiz
export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { text, options, correctOptionIndex } = body;

  if (!text || !options || correctOptionIndex === undefined) {
    return NextResponse.json({ error: 'text, options, and correctOptionIndex are required' }, { status: 400 });
  }

  const createRes = await fetch(`${STRAPI_URL}/api/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        text,
        options,
        correctOptionIndex,
        quiz: quizId,
      },
    }),
  });

  const data = createRes.ok ? await createRes.json() : await createRes.text();
  return NextResponse.json(data, { status: createRes.status });
}
