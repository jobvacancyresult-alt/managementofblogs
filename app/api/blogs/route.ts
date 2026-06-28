import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { mapBlogRecord } from '@/lib/blog-map'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

const withCors = (response: NextResponse) => {
  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value))
  return response
}

const blogInclude = {
  author: { select: { id: true, name: true, email: true, avatar: true } },
  site: { select: { id: true, slug: true, name: true, domain: true } },
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const category = searchParams.get('category') || undefined
    const site = searchParams.get('site') || undefined
    const slug = searchParams.get('slug') || undefined
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit') || '0', 10) : 10
    const take = limit > 0 ? limit : undefined

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (category) where.category = category
    if (site) where.site = { slug: site }

    if (slug) {
      const blog = await prisma.blog.findFirst({
        where: { ...where, slug: String(slug) },
        include: blogInclude,
      })

      if (!blog) {
        return withCors(NextResponse.json({ error: 'Blog not found' }, { status: 404 }))
      }

      return withCors(NextResponse.json({ blog: mapBlogRecord(blog) }))
    }

    const skip = take ? (page - 1) * take : 0

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: blogInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.blog.count({ where }),
    ])

    return withCors(
      NextResponse.json({
        blogs: blogs.map(mapBlogRecord),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      })
    )
  } catch (error: unknown) {
    console.error('GET blogs error:', error)
    return withCors(NextResponse.json({ error: 'Something went wrong' }, { status: 500 }))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      title, slug, description, content, featuredImage, featuredImageAlt, titleHtml,
      author, status, publishDate, metaTitle, metaDescription,
      canonicalUrl, ogTitle, ogDescription, ogImage, tags, category, readTime,
      audioUrl, audioTitle, audioDuration, site,
    } = body

    if (!title) {
      return withCors(NextResponse.json({ error: 'Required fields are missing' }, { status: 400 }))
    }

    const siteSlug = typeof site === 'string' && site.trim() ? site.trim() : 'coi'
    const siteRecord = await prisma.site.findUnique({ where: { slug: siteSlug } })
    if (!siteRecord) {
      return withCors(NextResponse.json({ error: `Unknown site: ${siteSlug}` }, { status: 400 }))
    }

    const slugify = (text: string) =>
      String(text).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')

    let finalSlug = slug && String(slug).trim() ? String(slug).trim() : slugify(title)

    let suffix = 1
    while (
      await prisma.blog.findFirst({
        where: { slug: finalSlug, siteId: siteRecord.id },
      })
    ) {
      finalSlug = `${slugify(title)}-${suffix++}`
    }

    const cleanTags = Array.isArray(tags)
      ? tags.map((t: unknown) => String(t || '').trim()).filter((t: string) => t.length > 0)
      : []
    const tagsString = cleanTags.length > 0 ? cleanTags.join(',') : null

    let authorId: number | undefined
    let authorEmail: string | undefined

    if (typeof author === 'string') {
      if (/^[0-9]+$/.test(author)) authorId = parseInt(author)
      else if (author.includes('@')) authorEmail = author.trim().toLowerCase()
    } else if (typeof author === 'number') {
      authorId = author
    } else if (author && typeof author === 'object') {
      if (typeof author.id === 'number') authorId = author.id
      else if (typeof author.id === 'string' && /^[0-9]+$/.test(author.id)) authorId = parseInt(author.id)
      if (!authorId && typeof author.email === 'string') authorEmail = author.email.trim().toLowerCase()
    }

    let authorRecord = undefined
    if (authorId !== undefined) authorRecord = await prisma.user.findUnique({ where: { id: authorId } })
    if (!authorRecord && authorEmail) authorRecord = await prisma.user.findUnique({ where: { email: authorEmail } })
    if (!authorRecord) authorRecord = await prisma.user.findFirst({ orderBy: { id: 'asc' } })

    if (!authorRecord) {
      return withCors(NextResponse.json({ error: 'Unable to resolve blog author. Please create a user first.' }, { status: 400 }))
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        titleHtml: titleHtml || null,
        slug: finalSlug,
        description: description || null,
        content: content || '',
        featuredImage: featuredImage || null,
        featuredImageAlt: featuredImageAlt || null,
        author: { connect: { id: authorRecord.id } },
        site: { connect: { id: siteRecord.id } },
        status: status || 'draft',
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || description || null,
        canonicalUrl: canonicalUrl || null,
        ogTitle: ogTitle || title,
        ogDescription: ogDescription || description || null,
        ogImage: ogImage || featuredImage || null,
        tags: tagsString,
        category: category || null,
        readTime: readTime ? String(readTime) : null,
        audioUrl: audioUrl || null,
        audioTitle: audioTitle || null,
        audioDuration: audioDuration || null,
      },
      include: blogInclude,
    })

    return withCors(
      NextResponse.json(
        { message: 'Blog created successfully', blog: mapBlogRecord(blog) },
        { status: 201 }
      )
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong'
    console.error('POST blog error:', error)
    return withCors(NextResponse.json({ error: message }, { status: 500 }))
  }
}
