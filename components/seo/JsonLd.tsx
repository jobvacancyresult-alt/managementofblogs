interface BlogJsonLdProps {
  title: string
  description: string
  slug: string
  image: string
  authorName: string
  publishDate: string
  updatedDate: string
  category: string
}

export default function JsonLd({
  title,
  description,
  slug,
  image,
  authorName,
  publishDate,
  updatedDate,
  category,
}: BlogJsonLdProps) {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${siteUrl}/blog/${slug}`,
        headline: title,
        description: description,
        image: image,
        datePublished: publishDate,
        dateModified: updatedDate,
        url: `${siteUrl}/blog/${slug}`,
        author: {
          '@type': 'Person',
          name: authorName,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Blog CMS',
          url: siteUrl,
        },
        articleSection: category,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: `${siteUrl}/blog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: title,
            item: `${siteUrl}/blog/${slug}`,
          },
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
