"use client";

import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept: string;
  fileCount: number;
}

export default function DropZone({ onFiles, accept, fileCount }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) onFiles(files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFiles]
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
          : fileCount > 0
          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
          : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        className="hidden"
      />
      {fileCount > 0 ? (
        <div>
          <div className="text-2xl mb-2">&#128196;</div>
          <p className="font-medium text-zinc-900 dark:text-white">
            {fileCount} file{fileCount > 1 ? "s" : ""} selected
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Click or drag to add more files
          </p>
        </div>
      ) : (
        <div>
          <div className="text-4xl mb-3 text-zinc-400">&#8593;</div>
          <p className="font-medium text-zinc-700 dark:text-zinc-300">
            Drag & drop your files here
          </p>
          <p className="text-sm text-zinc-500 mt-1">or click to browse (multiple files supported)</p>
        </div>
      )}
    </div>
  );
}
