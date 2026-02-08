import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 50MB)' },
        { status: 413 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/zip',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 415 }
      )
    }

    // In production, upload to cloud storage (S3, Cloudinary, Supabase, etc.)
    // const uploadedFile = await uploadToCloudStorage(file)

    // Mock response
    const fileUrl = `https://cdn.example.com/uploads/${Date.now()}-${file.name}`

    return NextResponse.json(
      {
        success: true,
        file: {
          id: `file_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl,
          uploadedAt: new Date(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
