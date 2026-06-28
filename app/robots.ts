import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${process.env.NEXTAUTH_URL}/sitemap.xml`,
    host: process.env.NEXTAUTH_URL,
  }
}