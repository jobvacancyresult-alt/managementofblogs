import Link from 'next/link'

interface Post {
  id: string | number
  title: string
  slug: string
  description: string
  featuredImage: string
  category: string
  readTime: number
  publishDate: string
}

interface RelatedPostsProps {
  posts: Post[]
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Related Articles
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            {post.featuredImage && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

            <div className="p-4">
              {post.category && (
                <span className="text-blue-600 text-xs font-semibold uppercase tracking-wide">
                  {post.category}
                </span>
              )}
              <h4 className="text-base font-bold text-gray-900 mt-1 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {post.title}
              </h4>
              <p className="text-gray-500 text-sm line-clamp-2">
                {post.description}
              </p>
              {post.readTime > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {post.readTime} min read
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}