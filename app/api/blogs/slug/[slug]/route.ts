import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { mapBlogRecord } from '@/lib/blog-map'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const site = searchParams.get('site') || undefined

    const where: Record<string, unknown> = { slug }
    if (site) where.site = { slug: site }

    const blog = await prisma.blog.findFirst({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        site: { select: { id: true, slug: true, name: true, domain: true } },
      },
    })

    if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 })

    return NextResponse.json({ blog: mapBlogRecord(blog) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong'
    console.error('GET blog by slug error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
