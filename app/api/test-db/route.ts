import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      }
    })
    
    const formatted = users.map(u => ({
      id: u.id,
      email: u.email,
      emailLength: u.email.length,
      name: u.name,
    }))

    return NextResponse.json({ users: formatted })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
