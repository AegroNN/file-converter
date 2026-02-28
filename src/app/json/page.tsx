"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import JsonDropZone from "@/components/json/JsonDropZone";
import JsonTreeViewer from "@/components/json/JsonTreeViewer";

const JsonGraphViewer = dynamic(
  () => import("@/components/json/JsonGraphViewer"),
  { ssr: false },
);

type ViewMode = "tree" | "graph";

export default function JsonPage() {
  const [jsonData, setJsonData] = useState<unknown>(null);
  const [fileName, setFileName] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  const clearData = () => {
    setJsonData(null);
    setFileName("");
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">JSON Previewer</h1>
        {jsonData !== null && (
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === "tree"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Tree View
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === "graph"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Graph View
            </button>
          </div>
        )}
      </div>
      <p className="text-zinc-500 mb-8">
        View and explore JSON files with a collapsible tree view or visual graph
      </p>

      {jsonData === null ? (
        <JsonDropZone
          onJson={(data, name) => {
            setJsonData(data);
            setFileName(name);
          }}
        />
      ) : viewMode === "tree" ? (
        <JsonTreeViewer data={jsonData} fileName={fileName} onClear={clearData} />
      ) : (
        <JsonGraphViewer data={jsonData} fileName={fileName} onClear={clearData} />
      )}
    </div>
  );
}
