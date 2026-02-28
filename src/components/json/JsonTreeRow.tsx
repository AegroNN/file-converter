import { JsonNode } from "@/lib/json-tree";
import type { CSSProperties, ReactElement } from "react";

export interface JsonTreeRowExtraProps {
  nodes: JsonNode[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
}

function valueColor(type: JsonNode["type"]): string {
  switch (type) {
    case "string":
      return "text-green-600 dark:text-green-400";
    case "number":
      return "text-purple-600 dark:text-purple-400";
    case "boolean":
      return "text-orange-600 dark:text-orange-400";
    case "null":
      return "text-zinc-400";
    default:
      return "text-zinc-600 dark:text-zinc-400";
  }
}

function renderValue(node: JsonNode, isExpanded: boolean): React.ReactNode {
  if (node.type === "object") {
    if (isExpanded) return <span className="text-zinc-400">{"{"}</span>;
    return (
      <span className="text-zinc-400">
        {"{"}...{"}"}{" "}
        <span className="text-zinc-500 text-xs">{node.childCount} keys</span>
      </span>
    );
  }
  if (node.type === "array") {
    if (isExpanded) return <span className="text-zinc-400">{"["}</span>;
    return (
      <span className="text-zinc-400">
        {"["}...{"]"}{" "}
        <span className="text-zinc-500 text-xs">{node.childCount} items</span>
      </span>
    );
  }
  if (node.type === "string") {
    const str = node.value as string;
    const display = str.length > 120 ? str.slice(0, 120) + "…" : str;
    return <span className={valueColor(node.type)}>&quot;{display}&quot;</span>;
  }
  return (
    <span className={valueColor(node.type)}>{String(node.value)}</span>
  );
}

export default function JsonTreeRow({
  index,
  style,
  nodes,
  expanded,
  onToggle,
}: JsonTreeRowExtraProps & {
  index: number;
  style: CSSProperties;
  ariaAttributes?: Record<string, unknown>;
}): ReactElement | null {
  const node = nodes[index];
  if (!node) return null;

  const isExpanded = expanded.has(node.id);

  return (
    <div
      style={{ ...style, paddingLeft: node.depth * 20 + 8 }}
      className="flex items-center gap-1 font-mono text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/50 select-text pr-4"
    >
      {node.isExpandable ? (
        <button
          onClick={() => onToggle(node.id)}
          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex-shrink-0"
        >
          {isExpanded ? "▼" : "▶"}
        </button>
      ) : (
        <span className="w-5 flex-shrink-0" />
      )}

      <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">
        {node.key}
      </span>
      <span className="text-zinc-400 flex-shrink-0 mr-1">:</span>
      <span className="truncate">{renderValue(node, isExpanded)}</span>
    </div>
  );
}
