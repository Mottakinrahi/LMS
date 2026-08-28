import Link from 'next/link';
import { STRAPI_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getCourses() {
  try {
    const res = await fetch(`${STRAPI_URL}/api/courses?populate=*`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error('Error fetching courses:', err);
    return [];
  }
}

export default async function CourseCatalogPage() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Course Catalog</h1>
            <p className="text-slate-400 text-sm mt-1">Explore our comprehensive range of courses</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-sm font-semibold transition-all"
          >
            &larr; Back to Dashboard
          </Link>
        </header>

        {courses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <h2 className="text-xl font-bold text-white mb-2">No courses available yet</h2>
            <p className="text-slate-400 text-sm mb-6">Check back soon or create a course as an Instructor!</p>
            <Link
              href="/instructor"
              className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
            >
              Go to Instructor Portal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => {
              const attrs = course.attributes || course;
              const owner = attrs.owner?.data?.attributes || attrs.owner;

              return (
                <div
                  key={course.id || course.documentId}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg group"
                >
                  <div className="p-6 space-y-4">
                    {attrs.coverImageUrl ? (
                      <img
                        src={attrs.coverImageUrl}
                        alt={attrs.title}
                        className="w-full h-44 object-cover rounded-xl border border-slate-800 group-hover:scale-[1.02] transition-transform"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-4xl">
                        🎓
                      </div>
                    )}

                    <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {attrs.title}
                    </h2>

                    <p className="text-slate-400 text-sm line-clamp-2">
                      {attrs.description || 'No description provided.'}
                    </p>

                    {owner && (
                      <div className="text-xs text-slate-500 font-medium">
                        Instructor: <span className="text-slate-300">{owner.username || owner.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-800/50 mt-4">
                    <Link
                      href={`/courses/${course.documentId || course.id}`}
                      className="block w-full py-2.5 text-center bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold rounded-xl border border-indigo-500/30 transition-all mt-4"
                    >
                      View Course Details
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
