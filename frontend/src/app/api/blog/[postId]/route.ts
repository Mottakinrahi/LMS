import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

// PUT /api/blog/[postId] — update or change publish status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { publishStatus } = body; // 'publish' | 'unpublish'

  const payload: any = { data: {} };
  if (publishStatus === 'publish') {
    payload.data.publishedAt = new Date().toISOString();
  } else if (publishStatus === 'unpublish') {
    payload.data.publishedAt = null;
  }

  const res = await fetch(`${STRAPI_URL}/api/blog-posts/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = res.ok ? await res.json() : await res.text();
  return NextResponse.json(data, { status: res.status });
}

// DELETE /api/blog/[postId] — delete blog post
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/blog-posts/${postId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json({ error: errText }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
