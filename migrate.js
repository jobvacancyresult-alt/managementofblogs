const { MongoClient } = require('mongodb')
const mysql = require('mysql2/promise')
const MONGODB_URI = 'mongodb+srv://blogadmin:blogadmin123@blog-cms.0epqmn7.mongodb.net/blog-cms?retryWrites=true&w=majority'
const mysqlConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'blog_cms',
  port: 3306
}

const SITES = [
  { slug: 'coi', name: 'Culture of Internet', domain: 'cultureofinternet.com', shortName: 'COI' },
  { slug: 'com', name: 'Culture of Marketing', domain: 'cultureofmarketing.com', shortName: 'COM' },
  { slug: 'jvr', name: 'Job Vacancy Result', domain: 'jobvacancyresult.com', shortName: 'JVR' },
]

function normalizeSiteSlug(value) {
  if (!value) return null
  const slug = String(value).toLowerCase().trim()
  if (['coi', 'com', 'jvr'].includes(slug)) return slug
  if (slug.includes('cultureofinternet')) return 'coi'
  if (slug.includes('cultureofmarketing')) return 'com'
  if (slug.includes('jobvacancyresult')) return 'jvr'
  return null
}

function resolveBlogSiteSlug(blog) {
  const candidates = []
  if (typeof blog.site === 'string') candidates.push(blog.site)
  if (blog.site && typeof blog.site === 'object') {
    if (typeof blog.site.slug === 'string') candidates.push(blog.site.slug)
    if (typeof blog.site.name === 'string') candidates.push(blog.site.name)
    if (typeof blog.site.domain === 'string') candidates.push(blog.site.domain)
  }
  if (typeof blog.siteSlug === 'string') candidates.push(blog.siteSlug)
  if (typeof blog.site_id === 'string') candidates.push(blog.site_id)
  if (typeof blog.siteId === 'string') candidates.push(blog.siteId)
  if (typeof blog.domain === 'string') candidates.push(blog.domain)

  for (const candidate of candidates) {
    const slug = normalizeSiteSlug(candidate)
    if (slug) return slug
  }
  return 'coi'
}

async function migrate() {
  console.log(' Connecting to MongoDB...')
  const mongoClient = new MongoClient(MONGODB_URI)
  await mongoClient.connect()
  const db = mongoClient.db('blog-cms')
  console.log(' Connecting to MySQL...')
  const conn = mysql.createPool(mysqlConfig)
  // ===== USERS =====
  console.log('👤 Migrating users...')
  const users = await db.collection('users').find({}).toArray()
  for (const user of users) {
    await conn.execute(
      `INSERT INTO users (email, name, password, avatar, role, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE email=email`,
      [
        user.email || '',
        user.name || '',
        user.password || '',
        user.avatar || '',
        user.role || 'editor',
        user.createdAt ? new Date(user.createdAt) : new Date()
      ]
    )
  }
  console.log(` Users migrated: ${users.length}`)

  // ===== MEDIA =====
  console.log(' Migrating media...')
  const mediaCursor = db.collection('media').find({})
  let mediaChunk = []
  let mediaCount = 0
  while (await mediaCursor.hasNext()) {
    const item = await mediaCursor.next()
    mediaChunk.push([
      item.filename || '',
      item.url || '',
      item.publicId || '',
      item.size || 0
    ])
    mediaCount++
    if (mediaChunk.length >= 100) {
      const placeholders = mediaChunk.map(() => '(?, ?, ?, ?)').join(', ')
      const flatValues = mediaChunk.flat()
      await conn.query(
        `INSERT INTO media (filename, url, publicId, size)
         VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE url=VALUES(url)`,
        flatValues
      )
      mediaChunk = []
    }
  }
  if (mediaChunk.length > 0) {
    const placeholders = mediaChunk.map(() => '(?, ?, ?, ?)').join(', ')
    const flatValues = mediaChunk.flat()
    await conn.query(
      `INSERT INTO media (filename, url, publicId, size)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE url=VALUES(url)`,
      flatValues
    )
  }
  console.log(` Media migrated: ${mediaCount}`)

  console.log(' Seeding sites...')
  const [siteTableRows] = await conn.execute("SHOW TABLES LIKE 'sites'")
  const siteTableName = siteTableRows.length > 0 ? 'sites' : 'site'

  for (const site of SITES) {
    await conn.execute(
      `INSERT INTO ${siteTableName} (slug, name, domain, shortName)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), domain = VALUES(domain), shortName = VALUES(shortName)`,
      [site.slug, site.name, site.domain, site.shortName]
    )
  }
  const [siteRows] = await conn.execute(`SELECT id, slug FROM ${siteTableName}`)
  const siteMap = new Map(siteRows.map((row) => [row.slug, row.id]))

  console.log(' Migrating blogs...')
  console.log(' Migrating blogs...')
  const blogs = await db.collection('blogs').find({}).toArray()
  console.log(`Total blogs in MongoDB: ${blogs.length}`)
  // Skip duplicate slugs ending in -1, -2, -3 etc
  const uniqueBlogs = []
  const seenSlugs = new Set()
  for (const blog of blogs) {
    if (!blog.slug) continue
    // Skip if slug ends with -1, -2, -3 etc (duplicates)
    if (/\-\d+$/.test(blog.slug)) continue
    // Skip if slug already seen
    if (seenSlugs.has(blog.slug)) continue
    seenSlugs.add(blog.slug)
    uniqueBlogs.push(blog)
  }
  console.log(`Unique blogs to migrate: ${uniqueBlogs.length}`)
  let blogCount = 0
  let skipped = 0
  for (const blog of uniqueBlogs) {
    const tags = Array.isArray(blog.tags) ? blog.tags.join(',') : ''
    const siteSlug = resolveBlogSiteSlug(blog)
    const siteId = siteMap.get(siteSlug)
    try {
      await conn.execute(
        `INSERT INTO blog (
          title, titleHtml, slug, description, content,
          featuredImage, featuredImageAlt,
          category, tags,
          metaTitle, metaDescription, canonicalUrl,
          ogTitle, ogDescription, ogImage,
          status, readTime, views,
          audioUrl, audioTitle, audioDuration,
          publishDate, createdAt, updatedAt,
          site_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          content = VALUES(content),
          updatedAt = VALUES(updatedAt),
          site_id = VALUES(site_id)`,
        [
          blog.title || '',
          blog.titleHtml || '',
          blog.slug,
          blog.description || '',
          blog.content || '',
          blog.featuredImage || '',
          blog.featuredImageAlt || '',
          blog.category || '',
          tags,
          blog.metaTitle || '',
          blog.metaDescription || '',
          blog.canonicalUrl || '',
          blog.ogTitle || '',
          blog.ogDescription || '',
          blog.ogImage || '',
          blog.status || 'draft',
          String(blog.readTime || ''),
          blog.views || 0,
          blog.audioUrl || '',
          blog.audioTitle || '',
          blog.audioDuration || '',
          blog.publishDate ? new Date(blog.publishDate) : null,
          blog.createdAt ? new Date(blog.createdAt) : new Date(),
          blog.updatedAt ? new Date(blog.updatedAt) : new Date(),
          siteId
        ]
      )
      blogCount++
    } catch (err) {
      console.log(` Skipped: "${blog.title}" — ${err.message}`)
      skipped++
    }
  }
  console.log(`Blogs migrated: ${blogCount}`)
  if (skipped > 0) console.log(` Skipped: ${skipped}`)

  await mongoClient.close()
  await conn.end()
  console.log('Migration COMPLETE!')
}
migrate().catch(console.error)