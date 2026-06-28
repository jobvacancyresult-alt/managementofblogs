import Link from 'next/link'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'
export default async function AnalyticsPage() {
  const totalBlogs = await prisma.blog.count()
  const publishedBlogs = await prisma.blog.count({ where: { status: 'published' } })
  const draftBlogs = await prisma.blog.count({ where: { status: 'draft' } })
  const totalViewsAgg = await prisma.blog.aggregate({ _sum: { views: true } })
  const totalViews = Number(totalViewsAgg._sum.views || 0)

  const topBlogs = await prisma.blog.findMany({ where: { status: 'published' }, orderBy: { views: 'desc' }, take: 10, select: { id: true, title: true, slug: true, views: true, category: true, publishDate: true } })
  const topBlogsSafe = topBlogs.map((blog: any) => ({ ...blog, views: Number(blog.views || 0) }))

  const categoryDataRaw: any = await prisma.$queryRaw`
    SELECT category as category, COUNT(*) as count, SUM(views) as views
    FROM Blog
    GROUP BY category
    ORDER BY views DESC
  `
  const categoryData = (categoryDataRaw || []).map((cat: any) => ({
    ...cat,
    views: Number(cat.views || 0),
    count: Number(cat.count || 0),
  }))

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Blog CMS</h1>
          <Link
            href="/admin/blogs/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
          >
            + New Blog
          </Link>
        </div>
      </nav>

      <div className="flex">

        {/* Sidebar */}
        <aside className="w-56 min-h-screen bg-gray-900 border-r border-gray-800 p-4">
          <nav className="space-y-1">
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/blogs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm transition-colors">
              All Blogs
            </Link>
            <Link href="/admin/blogs/new" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm transition-colors">
              New Blog
            </Link>
            <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium">
              Analytics
            </Link>
            <Link href="/blog" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm transition-colors">
              View Site
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8">

          <div className="mb-8">
            <h2 className="text-2xl font-bold">Analytics</h2>
            <p className="text-gray-400 mt-1">Track your blog performance</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-3xl font-bold mt-1 text-blue-400">{totalViews}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm">Total Blogs</p>
              <p className="text-3xl font-bold mt-1">{totalBlogs}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm">Published</p>
              <p className="text-3xl font-bold mt-1 text-green-400">{publishedBlogs}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm">Drafts</p>
              <p className="text-3xl font-bold mt-1 text-yellow-400">{draftBlogs}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">

            {/* Top Blogs */}
            <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Top Blogs by Views</h3>
              <div className="space-y-3">
                {topBlogs.length === 0 ? (
                  <p className="text-gray-400 text-sm">No blogs yet</p>
                ) : (
                  topBlogs.map((blog: any, index: number) => (
                    <div key={blog.id} className="flex items-center gap-4 py-2 border-b border-gray-800 last:border-0">
                      <span className="text-gray-500 text-sm w-6">{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{blog.title}</p>
                        <p className="text-xs text-gray-400">/blog/{blog.slug}</p>
                      </div>
                      <span className="text-blue-400 text-sm font-medium">{blog.views} views</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Top Categories</h3>
              <div className="space-y-3">
                {categoryData.length === 0 ? (
                  <p className="text-gray-400 text-sm">No categories yet</p>
                ) : (
                  categoryData.map((cat: any) => (
                    <div key={cat.category || 'uncategorized'} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{cat.category || 'Uncategorized'}</p>
                        <p className="text-xs text-gray-400">{cat.count} blogs</p>
                      </div>
                      <span className="text-blue-400 text-sm">{cat.views} views</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

