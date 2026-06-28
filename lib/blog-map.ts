export function mapBlogTags(tags: string | null | undefined) {
  if (!tags) return []
  return tags.split(',').map((t) => t.trim()).filter(Boolean)
}

export function mapBlogRecord(blog: any) {
  return {
    ...blog,
    tags: mapBlogTags(blog.tags),
    site: blog.site
      ? { id: blog.site.id, slug: blog.site.slug, name: blog.site.name, domain: blog.site.domain }
      : null,
    author: blog.author
      ? {
          id: blog.author.id,
          name: blog.author.name,
          email: blog.author.email,
          avatar: blog.author.avatar ?? undefined,
        }
      : null,
  }
}
