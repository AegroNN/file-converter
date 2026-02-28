"use client";

import { useState } from "react";
import JsonDropZone from "@/components/json/JsonDropZone";
import JsonTreeViewer from "@/components/json/JsonTreeViewer";

export default function JsonPage() {
  const [jsonData, setJsonData] = useState<unknown>(null);
  const [fileName, setFileName] = useState("");

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">JSON Previewer</h1>
      <p className="text-zinc-500 mb-8">
        View and explore JSON files with a collapsible tree view
      </p>

      {jsonData === null ? (
        <JsonDropZone
          onJson={(data, name) => {
            setJsonData(data);
            setFileName(name);
          }}
        />
      ) : (
        <JsonTreeViewer
          data={jsonData}
          fileName={fileName}
          onClear={() => {
            setJsonData(null);
            setFileName("");
          }}
        />
      )}
    </div>
  );
}
