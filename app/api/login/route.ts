import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const response = NextResponse.json({ message: 'Login successful', user: { id: String(user.id), name: user.name, email: user.email, role: user.role } })

    response.cookies.set('user', JSON.stringify({ id: String(user.id), name: user.name, email: user.email, role: user.role }), { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 })
  }
}