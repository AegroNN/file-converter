"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { List } from "react-window";
import { flattenJson, collectAllPaths } from "@/lib/json-tree";
import JsonTreeRow, { type JsonTreeRowExtraProps } from "./JsonTreeRow";

const ROW_HEIGHT = 28;

interface JsonTreeViewerProps {
  data: unknown;
  fileName: string;
  onClear: () => void;
}

export default function JsonTreeViewer({ data, fileName, onClear }: JsonTreeViewerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["root"]));
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(500);

  useEffect(() => {
    function updateHeight() {
      if (containerRef.current) {
        const top = containerRef.current.getBoundingClientRect().top;
        setListHeight(Math.max(300, window.innerHeight - top - 32));
      }
    }
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const nodes = useMemo(() => flattenJson(data, expanded), [data, expanded]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(collectAllPaths(data));
  }, [data]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set(["root"]));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium truncate max-w-[200px]" title={fileName}>
            {fileName}
          </p>
          <span className="text-xs text-zinc-500">
            {nodes.length.toLocaleString()} visible nodes
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Collapse All
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1 text-xs rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
      >
        <List<JsonTreeRowExtraProps>
          style={{ height: listHeight }}
          rowCount={nodes.length}
          rowHeight={ROW_HEIGHT}
          rowComponent={JsonTreeRow}
          rowProps={{ nodes, expanded, onToggle: toggle }}
          overscanCount={20}
        />
      </div>
    </div>
  );
}
