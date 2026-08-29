import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { STRAPI_URL } from '@/lib/api';
import BlogManagerClient from './BlogManagerClient';

export const dynamic = 'force-dynamic';

async function getManagePosts() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return { isAllowed: false, posts: [], user: null };

  try {
    const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return { isAllowed: false, posts: [], user: null };
    const user = await meRes.json();

    const roleType = (user.role?.type || user.role?.name || '').toLowerCase();
    if (!['admin', 'content_manager'].includes(roleType)) {
      return { isAllowed: false, posts: [], user: null };
    }

    // Fetch all posts including drafts
    const postsRes = await fetch(
      `${STRAPI_URL}/api/blog-posts?publicationState=preview&populate=author&sort=createdAt:desc`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    const postsData = postsRes.ok ? await postsRes.json() : { data: [] };
    return { isAllowed: true, posts: postsData.data || [], user };
  } catch {
    return { isAllowed: false, posts: [], user: null };
  }
}

export default async function BlogManagePage() {
  const { isAllowed, posts, user } = await getManagePosts();

  if (!isAllowed) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white">Blog Management Portal</h1>
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase rounded-full tracking-wider">
                Draft & Publish Control
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">Create, edit, publish, and delete blog posts (Admin & Content Manager only)</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-sm font-semibold transition-all"
            >
              Public Blog →
            </Link>
          </div>
        </header>

        <BlogManagerClient initialPosts={posts} />
      </div>
    </div>
  );
}
