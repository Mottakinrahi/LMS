import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const response = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ user: null }, { status: response.status });
    }

    const user = await response.json();
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
