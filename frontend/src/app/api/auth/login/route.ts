import { NextResponse } from 'next/server';
import { STRAPI_URL } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Invalid credentials' },
        { status: response.status }
      );
    }

    // Fetch complete user with role populated
    const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${data.jwt}`,
      },
    });

    const userWithRole = meRes.ok ? await meRes.json() : data.user;

    const res = NextResponse.json({ user: userWithRole });

    // Store JWT in httpOnly cookie
    res.cookies.set('token', data.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
