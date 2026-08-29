import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL('/login', request.url));
  res.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
  return res;
}

// Handle direct browser GET navigation gracefully
export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL('/login', request.url));
  res.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
  return res;
}
