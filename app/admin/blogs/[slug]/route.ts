import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { mapBlogRecord } from '@/lib/blog-map'

const blogInclude = {
  author: { select: { id: true, name: true, email: true } },
  site: { select: { id: true, slug: true, name: true, domain: true } },
}

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const blog = await prisma.blog.findFirst({
      where: { slug: String(slug) },
      include: blogInclude,
    })
    if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    return NextResponse.json({ blog: mapBlogRecord(blog) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong'
    console.error('GET admin blog by slug error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const body = await req.json()
    const existing = await prisma.blog.findFirst({ where: { slug: String(slug) } })
    if (!existing) return NextResponse.json({ error: 'Blog not found' }, { status: 404 })

    const updateData: Record<string, unknown> = { ...body }
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags.join(',') : body.tags
    }
    if (body.publishDate) updateData.publishDate = new Date(body.publishDate)
    delete updateData.site

    const blog = await prisma.blog.update({
      where: { id: existing.id },
      data: updateData,
      include: blogInclude,
    })
    return NextResponse.json({ message: 'Updated successfully', blog: mapBlogRecord(blog) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong'
    console.error('PUT admin blog error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const existing = await prisma.blog.findFirst({ where: { slug: String(slug) } })
    if (!existing) return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    await prisma.blog.delete({ where: { id: existing.id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong'
    console.error('DELETE admin blog error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
