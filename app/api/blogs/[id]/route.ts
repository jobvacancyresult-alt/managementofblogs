import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { mapBlogRecord } from '@/lib/blog-map'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const blogId = parseInt(id)
    if (Number.isNaN(blogId)) {
      return NextResponse.json({ error: 'Invalid blog id' }, { status: 400 })
    }

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: blogInclude,
    })
    if (!blog) return withCors(NextResponse.json({ error: 'Blog not found' }, { status: 404 }))

    return withCors(NextResponse.json({ blog: mapBlogRecord(blog) }))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong'
    console.error('GET blog by id error:', error)
    return withCors(NextResponse.json({ error: message }, { status: 500 }))
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const blogId = parseInt(id)
    if (Number.isNaN(blogId)) {
      return withCors(NextResponse.json({ error: 'Invalid blog id' }, { status: 400 }))
    }

    const body = await req.json()

    const updateData: Record<string, unknown> = {}

    const stringFields = [
      'title', 'titleHtml', 'slug', 'description', 'content', 'featuredImage', 'featuredImageAlt',
      'category', 'metaTitle', 'metaDescription', 'canonicalUrl', 'ogTitle', 'ogDescription',
      'ogImage', 'status', 'readTime', 'audioUrl', 'audioTitle', 'audioDuration',
    ] as const

    for (const field of stringFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === null ? null : String(body[field])
      }
    }

    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags.join(',') : body.tags
    }

    if (body.publishDate) {
      updateData.publishDate = new Date(body.publishDate)
    }

    if (body.site) {
      const siteRecord = await prisma.site.findUnique({ where: { slug: String(body.site) } })
      if (!siteRecord) {
        return withCors(NextResponse.json({ error: `Unknown site: ${body.site}` }, { status: 400 }))
      }
      updateData.siteId = siteRecord.id
    }

    if (body.slug && body.site) {
      const siteRecord = await prisma.site.findUnique({ where: { slug: String(body.site) } })
      if (siteRecord) {
        const conflict = await prisma.blog.findFirst({
          where: {
            slug: String(body.slug),
            siteId: siteRecord.id,
            NOT: { id: blogId },
          },
        })
        if (conflict) {
          return withCors(NextResponse.json({ error: 'Slug already exists on this site' }, { status: 400 }))
        }
      }
    }

    const blog = await prisma.blog.update({
      where: { id: blogId },
      data: updateData,
      include: blogInclude,
    })

    return withCors(NextResponse.json({ message: 'Updated successfully', blog: mapBlogRecord(blog) }))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong'
    console.error('PUT blog error:', error)
    return withCors(NextResponse.json({ error: message }, { status: 500 }))
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const blogId = parseInt(id)
    if (Number.isNaN(blogId)) {
      return withCors(NextResponse.json({ error: 'Invalid blog id' }, { status: 400 }))
    }
    await prisma.blog.delete({ where: { id: blogId } })
    return withCors(NextResponse.json({ message: 'Deleted successfully' }))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong'
    console.error('DELETE blog error:', error)
    return withCors(NextResponse.json({ error: message }, { status: 500 }))
  }
}
