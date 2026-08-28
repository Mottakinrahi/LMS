import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!meRes.ok) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const user = await meRes.json();

    // Check existing enrollment
    const checkRes = await fetch(
      `${STRAPI_URL}/api/enrollments?filters[student][id][$eq]=${user.id}&filters[course][documentId][$eq]=${courseId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (checkData.data && checkData.data.length > 0) {
        return NextResponse.redirect(new URL(`/courses/${courseId}`, request.url));
      }
    }

    // Create Enrollment
    const createRes = await fetch(`${STRAPI_URL}/api/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          student: user.id,
          course: courseId,
          enrolledAt: new Date().toISOString(),
        },
      }),
    });

    if (!createRes.ok) {
      console.error('Enrollment creation failed:', await createRes.text());
    }

    return NextResponse.redirect(new URL(`/courses/${courseId}`, request.url));
  } catch (err: any) {
    console.error('Enrollment route error:', err);
    return NextResponse.redirect(new URL('/courses', request.url));
  }
}
