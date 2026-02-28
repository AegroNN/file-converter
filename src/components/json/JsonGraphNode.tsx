import { memo, useState, useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import type { JsonNodeData } from "@/lib/json-graph";
import type { NodeProps } from "@xyflow/react";

const typeColors: Record<string, string> = {
  string: "text-green-600 dark:text-green-400",
  number: "text-purple-600 dark:text-purple-400",
  boolean: "text-orange-600 dark:text-orange-400",
  null: "text-zinc-400",
  object: "text-blue-600 dark:text-blue-400",
  array: "text-blue-600 dark:text-blue-400",
};

const MAX_PREVIEW_LINES = 20;
const MAX_PREVIEW_DEPTH = 3;
const MAX_PREVIEW_STRING = 60;

function renderMiniTree(
  val: unknown,
  depth: number,
  lines: string[],
  indent: string,
): void {
  if (lines.length >= MAX_PREVIEW_LINES) {
    if (lines.length === MAX_PREVIEW_LINES) lines.push(`${indent}...`);
    return;
  }

  if (val === null) {
    lines.push(`${indent}<span class="text-zinc-400">null</span>`);
    return;
  }

  if (typeof val === "string") {
    const display =
      val.length > MAX_PREVIEW_STRING
        ? val.slice(0, MAX_PREVIEW_STRING) + "…"
        : val;
    lines.push(
      `${indent}<span class="text-green-600 dark:text-green-400">"${escapeHtml(display)}"</span>`,
    );
    return;
  }

  if (typeof val === "number") {
    lines.push(
      `${indent}<span class="text-purple-600 dark:text-purple-400">${val}</span>`,
    );
    return;
  }

  if (typeof val === "boolean") {
    lines.push(
      `${indent}<span class="text-orange-600 dark:text-orange-400">${val}</span>`,
    );
    return;
  }

  if (depth >= MAX_PREVIEW_DEPTH) {
    if (Array.isArray(val)) {
      lines.push(
        `${indent}<span class="text-zinc-400">[...] (${val.length} items)</span>`,
      );
    } else if (typeof val === "object") {
      lines.push(
        `${indent}<span class="text-zinc-400">{...} (${Object.keys(val).length} keys)</span>`,
      );
    }
    return;
  }

  const nextIndent = indent + "  ";

  if (Array.isArray(val)) {
    lines.push(`${indent}<span class="text-zinc-400">[</span>`);
    for (let i = 0; i < val.length && lines.length < MAX_PREVIEW_LINES; i++) {
      const prefix = `${nextIndent}<span class="text-zinc-500">${i}</span><span class="text-zinc-400">: </span>`;
      const before = lines.length;
      renderMiniTree(val[i], depth + 1, lines, "");
      if (lines.length > before) {
        lines[before] = prefix + lines[before];
      }
    }
    if (lines.length < MAX_PREVIEW_LINES) {
      lines.push(`${indent}<span class="text-zinc-400">]</span>`);
    }
  } else if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>);
    lines.push(`${indent}<span class="text-zinc-400">{</span>`);
    for (
      let i = 0;
      i < entries.length && lines.length < MAX_PREVIEW_LINES;
      i++
    ) {
      const [k, v] = entries[i];
      const prefix = `${nextIndent}<span class="text-blue-600 dark:text-blue-400">${escapeHtml(k)}</span><span class="text-zinc-400">: </span>`;
      const before = lines.length;
      renderMiniTree(v, depth + 1, lines, "");
      if (lines.length > before) {
        lines[before] = prefix + lines[before];
      }
    }
    if (lines.length < MAX_PREVIEW_LINES) {
      lines.push(`${indent}<span class="text-zinc-400">}</span>`);
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPreviewHtml(val: unknown): string {
  const lines: string[] = [];
  renderMiniTree(val, 0, lines, "");
  return lines.join("\n");
}

function HoverPreview({ jsonValue }: { jsonValue: unknown }) {
  if (jsonValue === undefined) return null;

  const html = buildPreviewHtml(jsonValue);

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none">
      <div className="bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg shadow-xl border border-zinc-700 px-3 py-2 max-w-[400px] max-h-[320px] overflow-auto">
        <pre
          className="text-[11px] font-mono leading-[1.4] whitespace-pre"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

function JsonGraphNode({ data }: NodeProps) {
  const {
    label,
    properties,
    isRoot,
    isExpandable,
    isExpanded,
    isLoadMore,
    _selected,
    _connected,
    _jsonValue,
  } = data as JsonNodeData & {
    _selected?: boolean;
    _connected?: boolean;
    _jsonValue?: unknown;
  };

  const [hovered, setHovered] = useState(false);

  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  // Special "load more" node
  if (isLoadMore) {
    return (
      <div className="rounded-lg border border-dashed border-blue-300 dark:border-blue-700 shadow-sm min-w-[160px] bg-blue-50 dark:bg-blue-950/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
        <Handle type="target" position={Position.Top} className="!bg-blue-400" />
        <div className="px-4 py-2.5 text-center">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {label}
          </p>
          {properties.length > 0 && (
            <p className="text-[10px] text-blue-500/70 dark:text-blue-400/50 mt-0.5">
              {properties[0].value}
            </p>
          )}
        </div>
        <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
      </div>
    );
  }

  const borderClass = _selected
    ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-300/50 dark:ring-blue-500/30"
    : _connected
      ? "border-blue-300 dark:border-blue-600 ring-1 ring-blue-200/50 dark:ring-blue-600/20"
      : isRoot
        ? "border-blue-400 dark:border-blue-600"
        : "border-zinc-200 dark:border-zinc-700";

  return (
    <div
      className={`relative rounded-lg border shadow-sm min-w-[180px] max-w-[320px] bg-white dark:bg-zinc-900 transition-all duration-200 cursor-pointer ${borderClass}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Handle type="target" position={Position.Top} className="!bg-zinc-400" />

      {hovered && _jsonValue !== undefined && (
        <HoverPreview jsonValue={_jsonValue} />
      )}

      <div
        className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b flex items-center justify-between gap-2 ${
          _selected
            ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800"
            : isRoot
              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
        }`}
      >
        <span className="truncate">{label}</span>
        {isExpandable && (
          <span
            className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${
              isExpanded
                ? "bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {isExpanded ? "▼" : "▶"}
          </span>
        )}
      </div>

      {properties.length > 0 && (
        <div className="px-3 py-1.5 space-y-0.5">
          {properties.map((prop, i) => (
            <div key={i} className="flex gap-2 text-xs font-mono leading-5">
              {prop.key && (
                <>
                  <span className="text-zinc-600 dark:text-zinc-400 flex-shrink-0">
                    {prop.key}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-600">:</span>
                </>
              )}
              <span
                className={`truncate ${typeColors[prop.type] || "text-zinc-500"}`}
              >
                {prop.value}
              </span>
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-zinc-400" />
    </div>
  );
}

export default memo(JsonGraphNode);
