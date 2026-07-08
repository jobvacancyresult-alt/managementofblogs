import Link from 'next/link'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const totalBlogs = await prisma.blog.count()
  const publishedBlogs = await prisma.blog.count({ where: { status: 'published' } })
  const draftBlogs = await prisma.blog.count({ where: { status: 'draft' } })
  const totalViewsData = await prisma.blog.aggregate({ _sum: { views: true } })
  const views = Number(totalViewsData._sum.views || 0)
  const recentBlogs = await prisma.blog.findMany({ include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 5 })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold text-gray-900">Blog CMS</span>
            <div className="flex items-center gap-1">
              <Link href="/admin" className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg">
                Dashboard
              </Link>
              <Link href="/admin/blogs" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Posts
              </Link>
              <Link href="/admin/media" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Media
              </Link>
              <Link href="/admin/analytics" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Analytics
              </Link>
              <Link href="/blog" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                View Site
              </Link>
            </div>
          </div>
          <Link
            href="/admin/blogs/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + New Post
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">



        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Total Posts</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalBlogs}</p>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{publishedBlogs}</p>
            <p className="text-xs text-gray-400 mt-1">Live on site</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Drafts</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{draftBlogs}</p>
            <p className="text-xs text-gray-400 mt-1">Not published</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Total Views</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{views}</p>
            <p className="text-xs text-gray-400 mt-1">All posts</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/blogs/new"
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
              <span className="text-xl">✏️</span>
            </div>
            <h3 className="font-semibold text-gray-900">Write New Post</h3>
            <p className="text-sm text-gray-500 mt-1">Start writing a new blog post</p>
          </Link>
          <Link
            href="/admin/media"
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
              <span className="text-xl">🖼️</span>
            </div>
            <h3 className="font-semibold text-gray-900">Upload Media</h3>
            <p className="text-sm text-gray-500 mt-1">Add images to your library</p>
          </Link>
          <Link
            href="/admin/analytics"
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900">View Analytics</h3>
            <p className="text-sm text-gray-500 mt-1">Track your blog performance</p>
          </Link>
        </div>

        {/* Recent Posts */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Posts</h2>
            <Link href="/admin/blogs" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>

          {recentBlogs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-400">No posts yet.</p>
              <Link
                href="/admin/blogs/new"
                className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
              >
                Create your first post
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Views</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentBlogs.map((blog: any) => (
                  <tr key={blog.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{blog.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">/blog/{blog.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        blog.status === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{blog.views || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(blog.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/blogs/${blog.id}/edit`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          Edit
                        </Link>
                        <Link href={`/blog/${blog.slug}`} target="_blank" className="text-xs text-gray-400 hover:text-gray-600">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  )
}






