import Link from 'next/link';
import { STRAPI_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getPublishedPosts() {
  try {
    const res = await fetch(`${STRAPI_URL}/api/blog-posts?filters[publishedAt][$notNull]=true&populate=author`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">LMS Platform Blog</h1>
            <p className="text-slate-400 text-sm mt-1">Articles, announcements, and learning tutorials</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-sm font-semibold transition-all"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {posts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">No published articles yet</h2>
            <p className="text-slate-400 text-sm">Check back soon for news and tutorials.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => {
              const attrs = post.attributes || post;
              const docId = post.documentId || post.id;
              const author = attrs.author?.data?.attributes || attrs.author;
              const dateStr = attrs.publishedAt
                ? new Date(attrs.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '';

              return (
                <div
                  key={docId}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                >
                  {attrs.coverImageUrl && (
                    <img
                      src={attrs.coverImageUrl}
                      alt={attrs.title}
                      className="w-full h-48 object-cover border-b border-slate-800"
                    />
                  )}

                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{author?.username || 'Editorial Team'}</span>
                      <span>{dateStr}</span>
                    </div>

                    <h2 className="text-lg font-bold text-white hover:text-indigo-400 transition-colors">
                      <Link href={`/blog/${docId}`}>{attrs.title}</Link>
                    </h2>

                    <p className="text-slate-400 text-sm line-clamp-3">{attrs.body}</p>
                  </div>

                  <div className="px-6 pb-6 pt-2">
                    <Link
                      href={`/blog/${docId}`}
                      className="inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Read Article &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
