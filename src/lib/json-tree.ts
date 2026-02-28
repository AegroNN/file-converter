export interface JsonNode {
  id: string;
  key: string;
  value: unknown;
  type: "string" | "number" | "boolean" | "null" | "object" | "array";
  depth: number;
  childCount: number;
  isExpandable: boolean;
}

function getType(value: unknown): JsonNode["type"] {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const t = typeof value;
  if (t === "object") return "object";
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  return "string";
}

function getChildCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value !== null && typeof value === "object") return Object.keys(value as object).length;
  return 0;
}

export function flattenJson(
  data: unknown,
  expanded: Set<string>,
  rootKey = "root"
): JsonNode[] {
  const nodes: JsonNode[] = [];

  function walk(value: unknown, key: string, path: string, depth: number) {
    const type = getType(value);
    const childCount = getChildCount(value);
    const isExpandable = type === "object" || type === "array";

    nodes.push({
      id: path,
      key,
      value: isExpandable ? undefined : value,
      type,
      depth,
      childCount,
      isExpandable,
    });

    if (isExpandable && expanded.has(path)) {
      if (Array.isArray(value)) {
        value.forEach((item, i) => {
          walk(item, String(i), `${path}.${i}`, depth + 1);
        });
      } else if (value !== null && typeof value === "object") {
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          walk(v, k, `${path}.${k}`, depth + 1);
        }
      }
    }
  }

  walk(data, rootKey, rootKey, 0);
  return nodes;
}

export function collectAllPaths(data: unknown, rootKey = "root"): Set<string> {
  const paths = new Set<string>();

  function walk(value: unknown, path: string) {
    const type = getType(value);
    if (type !== "object" && type !== "array") return;

    paths.add(path);

    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}.${i}`));
    } else if (value !== null && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        walk(v, `${path}.${k}`);
      }
    }
  }

  walk(data, rootKey);
  return paths;
}
