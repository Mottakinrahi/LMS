import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STRAPI_URL } from '@/lib/api';

// GET /api/blog — list blog posts (public queries only published, staff can request drafts)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isManage = searchParams.get('manage') === 'true';

  let headers: Record<string, string> = {};
  if (isManage) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = isManage
    ? `${STRAPI_URL}/api/blog-posts?publicationState=preview&populate=author`
    : `${STRAPI_URL}/api/blog-posts?filters[publishedAt][$notNull]=true&populate=author`;

  const res = await fetch(url, { headers, cache: 'no-store' });
  const data = res.ok ? await res.json() : { data: [] };
  return NextResponse.json(data);
}

// POST /api/blog — create new blog post (Content Manager & Admin only)
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check role
  const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await meRes.json();
  const roleType = (user.role?.type || user.role?.name || '').toLowerCase();
  if (!['admin', 'content_manager'].includes(roleType)) {
    return NextResponse.json({ error: 'Forbidden: Only Admin & Content Managers can post blog articles' }, { status: 403 });
  }

  const body = await request.json();
  const { title, body: postBody, coverImageUrl, publishNow } = body;

  if (!title || !postBody) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }

  const payload: any = {
    data: {
      title,
      body: postBody,
      coverImageUrl: coverImageUrl || null,
      author: user.id,
    },
  };

  if (publishNow) {
    payload.data.publishedAt = new Date().toISOString();
  }

  const createRes = await fetch(`${STRAPI_URL}/api/blog-posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = createRes.ok ? await createRes.json() : await createRes.text();
  return NextResponse.json(data, { status: createRes.status });
}
