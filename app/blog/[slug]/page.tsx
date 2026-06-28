import { Metadata } from 'next'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSiteSlugFromHost } from '@/lib/sites'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'
import RelatedPosts from '@/components/ui/RelatedPosts'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const headersList = await headers()
  const siteSlug = getSiteSlugFromHost(headersList.get('host'))
  const blog = await prisma.blog.findFirst({ where: { slug, status: 'published', site: { slug: siteSlug } }, include: { author: { select: { name: true } } } })
  if (!blog) return { title: 'Blog Not Found' }
  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.description,
    alternates: { canonical: `${process.env.NEXTAUTH_URL}/blog/${slug}` },
    openGraph: {
      title: blog.ogTitle || blog.title,
      description: blog.ogDescription || blog.description,
      images: blog.ogImage ? [{ url: blog.ogImage }] : [],
      type: 'article',
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const headersList = await headers()
  const siteSlug = getSiteSlugFromHost(headersList.get('host'))
  const blog = await prisma.blog.findFirst({ where: { slug, site: { slug: siteSlug } }, include: { author: { select: { name: true, avatar: true } } } })
  if (!blog || blog.status !== 'published') notFound()

  await prisma.blog.update({ where: { id: blog.id }, data: { views: { increment: 1 } } })

  const relatedPosts = await prisma.blog.findMany({ where: { status: 'published', site: { slug: siteSlug }, category: blog.category, id: { not: blog.id } }, take: 3 })

  return (
    <div className="min-h-screen bg-white">

      <JsonLd
        title={blog.title}
        description={blog.description}
        slug={blog.slug}
        image={blog.featuredImage || ''}
        authorName={blog.author?.name || 'Author'}
        publishDate={blog.publishDate ? blog.publishDate.toISOString() : ''}
        updatedDate={blog.updatedAt ? blog.updatedAt.toISOString() : ''}
        category={blog.category || ''}
      />

      {/* Navbar */}
      <nav className="border-b border-gray-100 px-6 py-3 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">BlogCMS</Link>
          <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900">← All Articles</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-3 gap-10">

          {/* Main Content */}
          <article className="col-span-2">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Link href="/" className="hover:text-gray-600">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-gray-600">Blog</Link>
              <span>/</span>
              <span className="text-gray-600">{blog.title}</span>
            </div>

            {/* Category */}
            {blog.category && (
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold uppercase tracking-wide rounded-full mb-4">
                {blog.category}
              </span>
            )}

            {/* Title */}
            <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
              {blog.title}
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-500 mb-6 leading-relaxed">
              {blog.description}
            </p>

            {/* Author */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {blog.author?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{blog.author?.name || 'Author'}</p>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{new Date(blog.publishDate).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}</span>
                  {Number(blog.readTime) > 0 && <span>· {Number(blog.readTime)} min read</span>}
                  <span>· {Number(blog.views)} views</span>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {blog.featuredImage && (
              <div className="mb-8 rounded-2xl overflow-hidden">
                <img src={blog.featuredImage} alt={blog.title} className="w-full object-cover" />
              </div>
            )}

            {/* Blog Content */}
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Related Posts */}
            <RelatedPosts posts={JSON.parse(JSON.stringify(relatedPosts))} />

          </article>

          {/* Sidebar */}
          <aside className="col-span-1">
            <div className="sticky top-20 space-y-6">

             
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}