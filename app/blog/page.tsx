import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSiteSlugFromHost } from '@/lib/sites'
import Link from 'next/link'

export default async function BlogPage() {
  const headersList = await headers()
  const siteSlug = getSiteSlugFromHost(headersList.get('host'))
  const blogs = await prisma.blog.findMany({
    where: { status: 'published', site: { slug: siteSlug } },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Latest Articles</h1>
        <p className="text-gray-500 mb-8">Thoughts, stories and ideas</p>
        <div className="grid grid-cols-3 gap-6">
          {blogs.map((blog: any) => (
            <div key={blog.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {blog.featuredImage && (
                <img src={blog.featuredImage} alt={blog.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                {blog.category && (
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{blog.category}</span>
                )}
                <h2 className="text-lg font-bold text-gray-900 mt-1 mb-2">{blog.title}</h2>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{blog.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{blog.author?.name || 'Author'}</span>
                  <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
              <Link href={`/blog/${blog.slug}`} className="block mx-5 mb-5 text-center py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg transition-colors">
                Read More →
              </Link>
            </div>
          ))}
        </div>
        {blogs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400">No blogs published yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}