import { ConversionJob } from "./types";

const globalForJobs = globalThis as typeof globalThis & {
  __fileConverterJobs?: Map<string, ConversionJob>;
};

if (!globalForJobs.__fileConverterJobs) {
  globalForJobs.__fileConverterJobs = new Map<string, ConversionJob>();
}

const jobs = globalForJobs.__fileConverterJobs;

export function createJob(job: ConversionJob): void {
  jobs.set(job.id, job);
}

export function getJob(id: string): ConversionJob | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<ConversionJob>): void {
  const job = jobs.get(id);
  if (job) {
    Object.assign(job, updates);
  }
}

export function deleteJob(id: string): void {
  jobs.delete(id);
}
