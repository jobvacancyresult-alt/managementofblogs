import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogs = await prisma.blog.findMany({ where: { status: 'published' }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: 'desc' } })

  const blogUrls = blogs.map((blog) => ({
    url: `${process.env.NEXTAUTH_URL}/blog/${blog.slug}`,
    lastModified: blog.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: `${process.env.NEXTAUTH_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${process.env.NEXTAUTH_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...blogUrls,
  ]
}