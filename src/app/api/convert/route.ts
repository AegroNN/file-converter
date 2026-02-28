import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { createJob } from "@/lib/jobs";
import { runConversion } from "@/lib/ffmpeg";
import { FORMATS } from "@/lib/formats";
import { MediaType } from "@/lib/types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const outputFormat = formData.get("outputFormat") as string | null;
  const mediaType = (formData.get("mediaType") as MediaType) || "video";

  if (!file || !outputFormat) {
    return NextResponse.json(
      { error: "File and outputFormat are required" },
      { status: 400 }
    );
  }

  const formats = FORMATS[mediaType];
  if (!formats.includes(outputFormat)) {
    return NextResponse.json(
      { error: "Unsupported output format" },
      { status: 400 }
    );
  }

  const jobId = randomUUID();
  const jobDir = path.join(tmpdir(), "file-converter", jobId);
  await mkdir(jobDir, { recursive: true });

  const inputExt = path.extname(file.name) || ".tmp";
  const inputPath = path.join(jobDir, `input${inputExt}`);
  const outputPath = path.join(jobDir, `output.${outputFormat}`);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(inputPath, buffer);

  createJob({
    id: jobId,
    mediaType,
    inputPath,
    outputPath,
    outputFormat,
    originalName: file.name,
    status: "pending",
    progress: 0,
  });

  runConversion(jobId);

  return NextResponse.json({ jobId });
}
