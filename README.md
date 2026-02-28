# File Converter

A web-based file converter and tool suite for videos, photos, audio files, documents, and JSON. Built with Next.js, TypeScript, and FFmpeg.

## Features

- **Multi-file upload** - Drag & drop or click to select multiple files at once
- **Real-time progress** - Live conversion progress via Server-Sent Events (SSE)
- **Original filename preserved** - Downloaded files keep their original name with the new extension
- **Server-side conversion** - Fast and reliable conversion using FFmpeg on the backend
- **PDF & Document conversion** - Convert images and Office docs to/from PDF using pdf-lib, mupdf, and sharp
- **JSON Previewer** - Virtualized collapsible tree view optimized for large files (10K+ lines)

## Supported Formats

### Video (Active)
MP4, AVI, MKV, MOV, WEBM, FLV, WMV

### Photo (Active)
PNG, JPG, WEBP, GIF, BMP, TIFF

### Audio (Active)
MP3, WAV, AAC, OGG, FLAC, WMA

### PDF / Document (Active)
- **To PDF**: PNG, JPG, WEBP, BMP, TIFF, DOCX, XLSX, PPTX
- **From PDF**: PNG, JPG, WEBP

### JSON Previewer
Collapsible tree view with virtualized rendering for large files (10K+ lines)

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
- **Video/Audio Conversion**: fluent-ffmpeg + @ffmpeg-installer/ffmpeg
- **Photo Conversion**: FFmpeg (image formats)
- **PDF/Document**: pdf-lib + sharp + mupdf + libreoffice-convert
- **JSON Viewer**: react-window (virtualized rendering)
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
