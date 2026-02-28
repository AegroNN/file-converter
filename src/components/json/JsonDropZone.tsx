"use client";

import { useCallback, useRef, useState, DragEvent } from "react";

interface JsonDropZoneProps {
  onJson: (data: unknown, name: string) => void;
}

export default function JsonDropZone({ onJson }: JsonDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const parseAndEmit = useCallback(
    (text: string, name: string) => {
      try {
        const data = JSON.parse(text);
        setError(null);
        onJson(data, name);
      } catch {
        setError("Invalid JSON — parse error");
      }
    },
    [onJson]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const file = files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => parseAndEmit(reader.result as string, file.name);
      reader.readAsText(file);
    },
    [parseAndEmit]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handlePaste = useCallback(() => {
    if (!pasteValue.trim()) return;
    parseAndEmit(pasteValue, "pasted.json");
    setPasteValue("");
    setPasteMode(false);
  }, [pasteValue, parseAndEmit]);

  if (pasteMode) {
    return (
      <div className="space-y-3">
        <textarea
          autoFocus
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          placeholder='Paste your JSON here...'
          className="w-full h-48 p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handlePaste}
            disabled={!pasteValue.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            Preview JSON
          </button>
          <button
            onClick={() => { setPasteMode(false); setError(null); }}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
          dragging
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="text-2xl">{ "{}" }</span>
        <p className="text-sm text-zinc-500">
          Drop a JSON file here or click to browse
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); setPasteMode(true); }}
        className="mt-3 w-full py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
      >
        Or paste JSON text
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
