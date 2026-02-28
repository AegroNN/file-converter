import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { updateJob, getJob } from "./jobs";

ffmpeg.setFfmpegPath(ffmpegPath);

export function runConversion(jobId: string): void {
  const job = getJob(jobId);
  if (!job) return;

  updateJob(jobId, { status: "processing" });

  ffmpeg(job.inputPath)
    .toFormat(job.outputFormat)
    .on("progress", (p) => {
      updateJob(jobId, { progress: Math.round(p.percent ?? 0) });
    })
    .on("end", () => {
      updateJob(jobId, { status: "done", progress: 100 });
    })
    .on("error", (err) => {
      updateJob(jobId, { status: "error", error: err.message });
    })
    .save(job.outputPath);
}
