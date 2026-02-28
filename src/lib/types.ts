export type MediaType = "video" | "photo" | "audio";

export type JobStatus = "pending" | "processing" | "done" | "error";

export interface ConversionJob {
  id: string;
  mediaType: MediaType;
  inputPath: string;
  outputPath: string;
  outputFormat: string;
  originalName: string;
  status: JobStatus;
  progress: number;
  error?: string;
}
