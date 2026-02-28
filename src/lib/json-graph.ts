import type { Node, Edge } from "@xyflow/react";

interface PropertyRow {
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "null" | "object" | "array";
}

export interface JsonNodeData {
  label: string;
  properties: PropertyRow[];
  isRoot?: boolean;
  isExpandable?: boolean;
  isExpanded?: boolean;
  isLoadMore?: boolean;
  loadMoreParentPath?: string;
  remainingCount?: number;
  jsonPath: string;
  [key: string]: unknown;
}

export interface GraphResult {
  nodes: Node<JsonNodeData>[];
  edges: Edge[];
}

const MAX_STRING_LEN = 30;
const MAX_PROPERTIES = 15;
const PAGE_SIZE = 10;

function getType(val: unknown): PropertyRow["type"] {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val as PropertyRow["type"];
}

function formatValue(val: unknown): string {
  if (val === null) return "null";
  if (typeof val === "string") {
    return val.length > MAX_STRING_LEN
      ? `"${val.slice(0, MAX_STRING_LEN)}…"`
      : `"${val}"`;
  }
  if (typeof val === "boolean" || typeof val === "number") return String(val);
  if (Array.isArray(val)) return `Array(${val.length})`;
  if (typeof val === "object") return `Object(${Object.keys(val!).length})`;
  return String(val);
}

/** Resolve a dot-separated path like "root.foo.0.bar" against the original data */
export function resolveJsonPath(data: unknown, jsonPath: string): unknown {
  const parts = jsonPath.split(".");
  let current: unknown = data;
  for (let i = 1; i < parts.length; i++) {
    if (current === null || typeof current !== "object") return undefined;
    if (Array.isArray(current)) {
      current = current[Number(parts[i])];
    } else {
      current = (current as Record<string, unknown>)[parts[i]];
    }
  }
  return current;
}

function buildNodeForValue(
  key: string,
  val: unknown,
  nodeId: string,
  jsonPath: string,
  isExpanded: boolean,
  isRoot: boolean,
  visibleCount: number,
): {
  node: Node<JsonNodeData>;
  childEntries: { key: string; jsonPath: string }[];
  totalChildren: number;
} {
  const isArray = Array.isArray(val);
  const allEntries = isArray
    ? (val as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(val as Record<string, unknown>);

  const properties: PropertyRow[] = [];
  const allChildEntries: { key: string; jsonPath: string }[] = [];

  for (const [k, v] of allEntries) {
    if (v !== null && typeof v === "object") {
      allChildEntries.push({ key: k, jsonPath: `${jsonPath}.${k}` });
    } else {
      if (properties.length < MAX_PROPERTIES) {
        properties.push({ key: k, value: formatValue(v), type: getType(v) });
      }
    }
  }

  const totalPrimitives = allEntries.length - allChildEntries.length;
  if (properties.length < totalPrimitives) {
    properties.push({
      key: "",
      value: `… ${totalPrimitives - properties.length} more`,
      type: "null",
    });
  }

  const hasChildren = allChildEntries.length > 0;

  if (hasChildren && !isExpanded) {
    properties.push({
      key: "",
      value: `${allChildEntries.length} nested — click to expand`,
      type: "object",
    });
  }

  const count = isArray
    ? (val as unknown[]).length
    : Object.keys(val as Record<string, unknown>).length;
  const label = isArray ? `${key} [${count}]` : `${key} {${count}}`;

  const node: Node<JsonNodeData> = {
    id: nodeId,
    type: "jsonNode",
    position: { x: 0, y: 0 },
    data: {
      label,
      properties,
      isRoot,
      isExpandable: hasChildren,
      isExpanded,
      jsonPath,
    },
  };

  // Only return visible slice of children
  const visibleChildren = isExpanded
    ? allChildEntries.slice(0, visibleCount)
    : [];

  return {
    node,
    childEntries: visibleChildren,
    totalChildren: allChildEntries.length,
  };
}

export function jsonToGraph(
  data: unknown,
  expandedPaths: Set<string>,
  childLimits: Map<string, number>,
): GraphResult {
  const nodes: Node<JsonNodeData>[] = [];
  const edges: Edge[] = [];

  if (data === null || typeof data !== "object") {
    nodes.push({
      id: "root",
      type: "jsonNode",
      position: { x: 0, y: 0 },
      data: {
        label: "root",
        properties: [
          { key: "value", value: formatValue(data), type: getType(data) },
        ],
        isRoot: true,
        isExpandable: false,
        isExpanded: false,
        jsonPath: "root",
      },
    });
    return { nodes, edges };
  }

  const queue: {
    key: string;
    jsonPath: string;
    parentNodeId: string | null;
  }[] = [{ key: "root", jsonPath: "root", parentNodeId: null }];
  let qi = 0;

  while (qi < queue.length) {
    const item = queue[qi++];
    const val = resolveJsonPath(data, item.jsonPath);

    if (val === null || typeof val !== "object") continue;

    const nodeId = item.jsonPath;
    const isExpanded = expandedPaths.has(item.jsonPath);
    const visibleCount = childLimits.get(item.jsonPath) ?? PAGE_SIZE;

    const { node, childEntries, totalChildren } = buildNodeForValue(
      item.key,
      val,
      nodeId,
      item.jsonPath,
      isExpanded,
      item.parentNodeId === null,
      visibleCount,
    );

    nodes.push(node);

    if (item.parentNodeId) {
      edges.push({
        id: `e-${item.parentNodeId}-${nodeId}`,
        source: item.parentNodeId,
        target: nodeId,
      });
    }

    for (const child of childEntries) {
      queue.push({
        key: child.key,
        jsonPath: child.jsonPath,
        parentNodeId: nodeId,
      });
    }

    // Add "load more" node if there are hidden children
    if (isExpanded && visibleCount < totalChildren) {
      const remaining = totalChildren - visibleCount;
      const loadMoreId = `lm-${item.jsonPath}`;
      nodes.push({
        id: loadMoreId,
        type: "jsonNode",
        position: { x: 0, y: 0 },
        data: {
          label: `+ Load ${Math.min(remaining, PAGE_SIZE)} more`,
          properties: [
            {
              key: "",
              value: `${remaining} of ${totalChildren} remaining`,
              type: "null",
            },
          ],
          isLoadMore: true,
          loadMoreParentPath: item.jsonPath,
          remainingCount: remaining,
          jsonPath: `${item.jsonPath}.__loadmore__`,
        },
      });
      edges.push({
        id: `e-${nodeId}-${loadMoreId}`,
        source: nodeId,
        target: loadMoreId,
      });
    }
  }

  return { nodes, edges };
}
