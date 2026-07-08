import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { SITES } from '@/lib/sites'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sites = await prisma.site.findMany({ orderBy: { id: 'asc' } })
    if (sites.length > 0) {
      return NextResponse.json({ sites })
    }
    return NextResponse.json({ sites: SITES })
  } catch {
    return NextResponse.json({ sites: SITES })
  }
}
