import { NextRequest } from "next/server";
import { getJob } from "@/lib/jobs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        const job = getJob(jobId);

        if (!job) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Job not found" })}\n\n`)
          );
          clearInterval(interval);
          controller.close();
          return;
        }

        const data = {
          status: job.status,
          progress: job.progress,
          error: job.error,
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );

        if (job.status === "done" || job.status === "error") {
          clearInterval(interval);
          controller.close();
        }
      }, 500);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
