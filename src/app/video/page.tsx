"use client";

import { useConversion, FileEntry } from "@/hooks/useConversion";
import { FORMATS } from "@/lib/formats";
import DropZone from "@/components/converter/DropZone";
import FormatSelector from "@/components/converter/FormatSelector";
import ConvertButton from "@/components/converter/ConvertButton";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileRow({
  entry,
  onRemove,
  onDownload,
}: {
  entry: FileEntry;
  onRemove: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.file.name}</p>
        <p className="text-xs text-zinc-500">{formatSize(entry.file.size)}</p>
      </div>

      {entry.status === "idle" && (
        <button
          onClick={onRemove}
          className="text-xs text-zinc-400 hover:text-red-500 transition-colors px-2 py-1"
        >
          Remove
        </button>
      )}

      {(entry.status === "uploading" || entry.status === "processing") && (
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${entry.progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 w-8 text-right">{entry.progress}%</span>
        </div>
      )}

      {entry.status === "done" && (
        <button
          onClick={onDownload}
          className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50"
        >
          Download
        </button>
      )}

      {entry.status === "error" && (
        <span className="text-xs text-red-500 max-w-[150px] truncate" title={entry.error || ""}>
          {entry.error || "Error"}
        </span>
      )}
    </div>
  );
}

export default function VideoPage() {
  const conversion = useConversion("video", FORMATS.video);

  const overallStatus = conversion.anyProcessing
    ? "processing"
    : conversion.allDone
    ? "done"
    : "idle";

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Video Converter</h1>
      <p className="text-zinc-500 mb-8">
        Convert your video files between different formats
      </p>

      <DropZone
        onFiles={conversion.addFiles}
        accept="video/*"
        fileCount={conversion.files.length}
      />

      {conversion.hasFiles && (
        <>
          <div className="mt-4 space-y-2">
            {conversion.files.map((entry) => (
              <FileRow
                key={entry.id}
                entry={entry}
                onRemove={() => conversion.removeFile(entry.id)}
                onDownload={() => conversion.downloadFile(entry.id)}
              />
            ))}
          </div>

          <FormatSelector
            formats={FORMATS.video}
            value={conversion.outputFormat}
            onChange={conversion.setOutputFormat}
          />

          <ConvertButton
            onClick={conversion.convertAll}
            disabled={!conversion.outputFormat || conversion.files.length === 0}
            status={overallStatus}
          />
        </>
      )}

      {conversion.allDone && (
        <div className="mt-4 space-y-3">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-sm text-center">
            All files converted successfully!
          </div>
          <button
            onClick={conversion.reset}
            className="w-full py-2.5 rounded-lg font-medium text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Convert More Files
          </button>
        </div>
      )}
    </div>
  );
}
