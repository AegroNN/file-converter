"use client";

import { useState, useCallback, useRef } from "react";
import { MediaType } from "@/lib/types";

type FileStatus = "idle" | "uploading" | "processing" | "done" | "error";

export interface FileEntry {
  id: string;
  file: File;
  outputFormat: string;
  status: FileStatus;
  progress: number;
  jobId: string | null;
  error: string | null;
}

let entryIdCounter = 0;

export function useConversion(mediaType: MediaType, defaultFormats: string[] = []) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [outputFormat, setOutputFormat] = useState(defaultFormats[0] || "");
  const filesRef = useRef<FileEntry[]>([]);

  // Keep ref in sync for use in callbacks
  const updateFiles = useCallback((updater: (prev: FileEntry[]) => FileEntry[]) => {
    setFiles((prev) => {
      const next = updater(prev);
      filesRef.current = next;
      return next;
    });
  }, []);

  const addFiles = useCallback((newFiles: File[]) => {
    const entries: FileEntry[] = newFiles.map((file) => ({
      id: `file-${++entryIdCounter}`,
      file,
      outputFormat: "",
      status: "idle" as FileStatus,
      progress: 0,
      jobId: null,
      error: null,
    }));
    updateFiles((prev) => [...prev, ...entries]);
  }, [updateFiles]);

  const removeFile = useCallback((id: string) => {
    updateFiles((prev) => prev.filter((f) => f.id !== id));
  }, [updateFiles]);

  const updateEntry = useCallback((id: string, updates: Partial<FileEntry>) => {
    updateFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, [updateFiles]);

  const startFileConversion = useCallback(
    async (entry: FileEntry, format: string) => {
      updateEntry(entry.id, { status: "uploading", progress: 0, error: null, outputFormat: format });

      const formData = new FormData();
      formData.append("file", entry.file);
      formData.append("outputFormat", format);
      formData.append("mediaType", mediaType);

      try {
        const res = await fetch("/api/convert", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const { jobId } = await res.json();
        updateEntry(entry.id, { status: "processing", jobId });

        const eventSource = new EventSource(`/api/progress/${jobId}`);
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.error) {
            updateEntry(entry.id, { status: "error", error: data.error });
            eventSource.close();
            return;
          }

          updateEntry(entry.id, { progress: data.progress });

          if (data.status === "done") {
            updateEntry(entry.id, { status: "done", progress: 100 });
            eventSource.close();
          } else if (data.status === "error") {
            updateEntry(entry.id, { status: "error", error: data.error || "Conversion failed" });
            eventSource.close();
          }
        };

        eventSource.onerror = () => {
          updateEntry(entry.id, { status: "error", error: "Connection lost" });
          eventSource.close();
        };
      } catch (err) {
        updateEntry(entry.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [mediaType, updateEntry]
  );

  const convertAll = useCallback(() => {
    const current = filesRef.current;
    const pending = current.filter((f) => f.status === "idle" || f.status === "error");
    for (const entry of pending) {
      startFileConversion(entry, outputFormat);
    }
  }, [outputFormat, startFileConversion]);

  const downloadFile = useCallback((entryId: string) => {
    const entry = filesRef.current.find((f) => f.id === entryId);
    if (!entry?.jobId) return;
    window.open(`/api/download/${entry.jobId}`, "_blank");
  }, []);

  const reset = useCallback(() => {
    updateFiles(() => []);
    setOutputFormat("");
  }, [updateFiles]);

  const hasFiles = files.length > 0;
  const allDone = hasFiles && files.every((f) => f.status === "done");
  const anyProcessing = files.some((f) => f.status === "uploading" || f.status === "processing");

  return {
    files,
    addFiles,
    removeFile,
    outputFormat,
    setOutputFormat,
    convertAll,
    downloadFile,
    reset,
    hasFiles,
    allDone,
    anyProcessing,
  };
}
