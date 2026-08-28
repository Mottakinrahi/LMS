import { NextResponse } from 'next/server';
import { STRAPI_URL } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const { username, email, password, roleType } = await request.json();

    const response = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Registration failed' },
        { status: response.status }
      );
    }

    // If a custom role (Instructor / Student / Content Manager / Admin) was selected, update the user role
    if (roleType && data.jwt) {
      try {
        const rolesRes = await fetch(`${STRAPI_URL}/api/users-permissions/roles`, {
          headers: { Authorization: `Bearer ${data.jwt}` },
        });
        
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          const targetRole = rolesData.roles?.find(
            (r: any) => r.type === roleType || r.name.toLowerCase() === roleType.toLowerCase()
          );

          if (targetRole) {
            await fetch(`${STRAPI_URL}/api/users/${data.user.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${data.jwt}`,
              },
              body: JSON.stringify({ role: targetRole.id }),
            });
          }
        }
      } catch (roleErr) {
        console.warn('Could not set custom role during registration:', roleErr);
      }
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
      { error: err.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
