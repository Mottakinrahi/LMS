'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  initialPosts: any[];
}

export default function BlogManagerClient({ initialPosts }: Props) {
  const [posts, setPosts] = useState<any[]>(initialPosts);

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [publishNow, setPublishNow] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  // Action states
  const [actionId, setActionId] = useState<string | null>(null);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateErr('');
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, coverImageUrl, publishNow }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateErr(typeof data === 'string' ? data : data.error || 'Failed to create blog post');
        return;
      }
      const newPost = data.data;
      setPosts((prev) => [newPost, ...prev]);
      setTitle('');
      setBody('');
      setCoverImageUrl('');
      setPublishNow(false);
    } catch {
      setCreateErr('Network error');
    } finally {
      setCreating(false);
    }
  }

  async function handleTogglePublish(docId: string, currentPublishedAt: string | null) {
    setActionId(docId);
    const newStatus = currentPublishedAt ? 'unpublish' : 'publish';
    try {
      const res = await fetch(`/api/blog/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishStatus: newStatus }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => {
            const pDocId = p.documentId || p.id;
            if (pDocId === docId) {
              const updatedAttrs = p.attributes ? { ...p.attributes, publishedAt: newStatus === 'publish' ? new Date().toISOString() : null } : { ...p, publishedAt: newStatus === 'publish' ? new Date().toISOString() : null };
              return p.attributes ? { ...p, attributes: updatedAttrs } : updatedAttrs;
            }
            return p;
          })
        );
      }
    } catch {
      // ignore
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    setActionId(docId);
    try {
      const res = await fetch(`/api/blog/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => (p.documentId || p.id) !== docId));
      }
    } catch {
      // ignore
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-10">
      {/* Create Blog Post Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl">
        <h2 className="text-xl font-bold text-white">+ Create New Article</h2>
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
              Article Title
            </label>
            <input
              id="blog-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Introducing Next.js 15 in our LMS"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
              Cover Image URL (Optional)
            </label>
            <input
              id="blog-image-input"
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-xxx"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
              Article Body
            </label>
            <textarea
              id="blog-body-input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={6}
              placeholder="Write your blog post content here..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="publish-now-checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="accent-indigo-500 w-4 h-4"
            />
            <label htmlFor="publish-now-checkbox" className="text-xs text-slate-300 font-semibold cursor-pointer">
              Publish immediately (uncheck to save as Draft)
            </label>
          </div>

          {createErr && <p className="text-red-400 text-xs">{createErr}</p>}

          <button
            id="create-blog-btn"
            type="submit"
            disabled={creating}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/25"
          >
            {creating ? 'Saving…' : publishNow ? '🚀 Publish Article' : '💾 Save as Draft'}
          </button>
        </form>
      </div>

      {/* Existing Blog Posts List with Draft / Published Badges */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl">
        <h2 className="text-xl font-bold text-white">All Blog Posts ({posts.length})</h2>

        {posts.length === 0 ? (
          <p className="text-slate-400 text-sm">No blog posts created yet.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const attrs = post.attributes || post;
              const docId = post.documentId || post.id;
              const isPublished = !!attrs.publishedAt;
              const isLoadingThis = actionId === docId;

              return (
                <div
                  key={docId}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-base">{attrs.title}</h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isPublished
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {isPublished ? '✓ Published' : '📝 Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{attrs.body}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(docId, attrs.publishedAt)}
                      disabled={isLoadingThis}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isPublished
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {isLoadingThis ? '...' : isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link
                      href={`/blog/${docId}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(docId)}
                      disabled={isLoadingThis}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold"
                    >
                      Delete
                    </button>
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
