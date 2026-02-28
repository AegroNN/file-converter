# File Converter

A web-based file converter for videos, photos, and audio files. Built with Next.js, TypeScript, and FFmpeg.

## Features

- **Multi-file upload** - Drag & drop or click to select multiple files at once
- **Real-time progress** - Live conversion progress via Server-Sent Events (SSE)
- **Original filename preserved** - Downloaded files keep their original name with the new extension
- **Server-side conversion** - Fast and reliable conversion using FFmpeg on the backend

## Supported Formats

### Video (Active)
MP4, AVI, MKV, MOV, WEBM, FLV, WMV

### Photo (Coming Soon)
PNG, JPG, WEBP, GIF, BMP, TIFF

### Audio (Coming Soon)
MP3, WAV, AAC, OGG, FLAC, WMA

## How It Works

1. Select one or more files via drag & drop or file browser
2. Choose the desired output format from the dropdown
3. Click **Convert** to start the conversion
4. Each file shows its own progress bar during conversion
5. Once done, click **Download** on each file to save the result

### Architecture

```
Browser                          Server (Next.js API Routes)
  |                                  |
  |-- POST /api/convert ------------>|  Upload file, create job, start FFmpeg
  |<--------- { jobId } ------------|
  |                                  |
  |-- GET /api/progress/[jobId] ---->|  SSE stream with real-time progress
  |<========= SSE events ===========|
  |                                  |
  |-- GET /api/download/[jobId] ---->|  Download converted file
  |<========= file stream ==========|
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Conversion**: fluent-ffmpeg + @ffmpeg-installer/ffmpeg
- **Progress**: Server-Sent Events (SSE)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## License

MIT
