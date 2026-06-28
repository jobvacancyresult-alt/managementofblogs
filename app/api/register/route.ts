import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) return NextResponse.json({ error: 'All fields are required' }, { status: 400 })

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) return NextResponse.json({ error: 'User already exists' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({ data: { name, email, password: hashed, role: role || 'writer' } })

    return NextResponse.json({ message: 'User created successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 })
  }
}