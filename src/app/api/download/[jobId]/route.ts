import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat, rm } from "fs/promises";
import path from "path";
import { getJob, deleteJob } from "@/lib/jobs";
import { Readable } from "stream";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "done") {
    return NextResponse.json(
      { error: "Conversion not complete" },
      { status: 400 }
    );
  }

  const fileStat = await stat(job.outputPath).catch(() => null);
  if (!fileStat) {
    return NextResponse.json({ error: "Output file not found" }, { status: 404 });
  }

  const baseName = job.originalName.replace(/\.[^.]+$/, "");
  const fileName = `${baseName}.${job.outputFormat}`;
  const nodeStream = createReadStream(job.outputPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  // Schedule cleanup after a delay
  const jobDir = path.dirname(job.outputPath);
  setTimeout(async () => {
    await rm(jobDir, { recursive: true, force: true }).catch(() => {});
    deleteJob(jobId);
  }, 30000);

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": fileStat.size.toString(),
    },
  });
}
