import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET() {
  try {
    const media = await prisma.media.findMany({ orderBy: { uploadedAt: 'desc' } })
    const safeMedia = media.map((item) => ({
      ...item,
      size: item.size !== null && item.size !== undefined ? Number(item.size) : null,
    }))
    return NextResponse.json({ media: safeMedia })
  } catch (error) {
    console.error('GET media error:', error)
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

   const isAudio = file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a)$/i)

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'blog-cms',
          resource_type: isAudio ? 'video' : 'auto',
          ...(isAudio ? {} : {
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          }),
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    const uploadResult = result as any

    const media = await prisma.media.create({ data: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      filename: file.name,
      format: uploadResult.format,
      size: BigInt(file.size),
    } })

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      media: {
        ...media,
        size: Number(media.size),
      },
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { publicId, id } = await req.json()

    await cloudinary.uploader.destroy(publicId)
    const mediaId = parseInt(id)
    await prisma.media.delete({ where: { id: mediaId } })

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}