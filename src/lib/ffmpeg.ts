import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { updateJob, getJob } from "./jobs";

ffmpeg.setFfmpegPath(ffmpegPath);

export function runConversion(jobId: string): void {
  const job = getJob(jobId);
  if (!job) return;

  updateJob(jobId, { status: "processing" });

  const command = ffmpeg(job.inputPath);

  if (job.mediaType === "photo") {
    command.outputOptions("-frames:v", "1");
  } else {
    command.toFormat(job.outputFormat);
  }

  command
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
