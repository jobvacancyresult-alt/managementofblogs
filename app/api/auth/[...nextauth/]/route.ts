import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } })
          if (!user) return null
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null
          return { id: String(user.id), email: user.email, name: user.name, role: user.role }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role
          token.id = user.id
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    },
  },
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }