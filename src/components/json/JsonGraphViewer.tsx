"use client";

import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import type { Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { jsonToGraph, resolveJsonPath, type JsonNodeData } from "@/lib/json-graph";
import JsonGraphNode from "./JsonGraphNode";

const nodeTypes = { jsonNode: JsonGraphNode };

interface JsonGraphViewerProps {
  data: unknown;
  fileName: string;
  onClear: () => void;
}

function GraphInner({ data, fileName, onClear }: JsonGraphViewerProps) {
  const { fitView, setCenter, getNode } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(["root"]),
  );
  const [childLimits, setChildLimits] = useState<Map<string, number>>(
    () => new Map(),
  );
  const isInitialLayout = useRef(true);
  const draggedPositions = useRef(new Map<string, { x: number; y: number }>());

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Only fitView on fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.2 }), 100);
    return () => clearTimeout(timer);
  }, [isFullscreen, fitView]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  // Regenerate graph when expandedPaths or childLimits change
  const { graphNodes, graphEdges } = useMemo(() => {
    const result = jsonToGraph(data, expandedPaths, childLimits);
    return { graphNodes: result.nodes, graphEdges: result.edges };
  }, [data, expandedPaths, childLimits]);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  const onNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChangeBase>[0]) => {
      onNodesChangeBase(changes);
      for (const change of changes) {
        if (change.type === "position" && change.position && !change.dragging) {
          draggedPositions.current.set(change.id, { ...change.position });
        }
      }
    },
    [onNodesChangeBase],
  );

  // Build adjacency maps
  const { childrenMap, parentMap, nodeLabelMap } = useMemo(() => {
    const cm = new Map<string, string[]>();
    const pm = new Map<string, string>();
    const lm = new Map<string, string>();

    for (const edge of graphEdges) {
      const list = cm.get(edge.source) || [];
      list.push(edge.target);
      cm.set(edge.source, list);
      pm.set(edge.target, edge.source);
    }

    for (const node of graphNodes) {
      const d = node.data as JsonNodeData;
      lm.set(node.id, d.label);
    }

    return { childrenMap: cm, parentMap: pm, nodeLabelMap: lm };
  }, [graphNodes, graphEdges]);

  const layoutNodes = useCallback(
    (
      incomingNodes: Node<JsonNodeData>[],
      shouldFitView: boolean,
    ) => {
      const NODE_WIDTH = 220;
      const NODE_HEIGHT = 120;
      const H_GAP = 60;
      const V_GAP = 80;

      const layoutChildren = new Map<string, string[]>();
      for (const edge of graphEdges) {
        const list = layoutChildren.get(edge.source) || [];
        list.push(edge.target);
        layoutChildren.set(edge.source, list);
      }

      const positions = new Map<string, { x: number; y: number }>();
      let xOffset = 0;

      function layoutNode(nodeId: string, depth: number): number {
        const ch = layoutChildren.get(nodeId) || [];

        if (ch.length === 0) {
          const x = xOffset;
          xOffset += NODE_WIDTH + H_GAP;
          positions.set(nodeId, { x, y: depth * (NODE_HEIGHT + V_GAP) });
          return x;
        }

        // Separate real children from "load more" nodes
        const realChildren = ch.filter((id) => !id.startsWith("lm-"));
        const loadMoreChildren = ch.filter((id) => id.startsWith("lm-"));

        const childXs: number[] = [];
        for (const child of realChildren) {
          childXs.push(layoutNode(child, depth + 1));
        }

        // Place "load more" nodes to the right of last real child, same depth
        for (const lmId of loadMoreChildren) {
          const x = xOffset;
          xOffset += NODE_WIDTH + H_GAP;
          positions.set(lmId, { x, y: depth * (NODE_HEIGHT + V_GAP) + NODE_HEIGHT + V_GAP });
          childXs.push(x);
        }

        const minX = Math.min(...childXs);
        const maxX = Math.max(...childXs);
        const x = (minX + maxX) / 2;

        positions.set(nodeId, { x, y: depth * (NODE_HEIGHT + V_GAP) });
        return x;
      }

      layoutNode("root", 0);

      const laid = incomingNodes.map((n) => {
        const dragged = draggedPositions.current.get(n.id);
        const pos = dragged || positions.get(n.id);
        const nd = n.data as JsonNodeData;
        const jsonValue = nd.jsonPath && !nd.isLoadMore
          ? resolveJsonPath(data, nd.jsonPath)
          : undefined;
        const updated = {
          ...n,
          data: { ...n.data, _jsonValue: jsonValue },
        };
        if (pos) return { ...updated, position: pos };
        return updated;
      });

      setNodes(laid);
      setEdges(graphEdges);

      if (shouldFitView) {
        setTimeout(() => fitView({ padding: 0.2 }), 50);
      }
    },
    [data, graphEdges, setNodes, setEdges, fitView],
  );

  // When graph data changes, re-layout
  useEffect(() => {
    const shouldFit = isInitialLayout.current;
    isInitialLayout.current = false;

    layoutNodes(graphNodes, shouldFit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphNodes, graphEdges]);

  const navigateToNode = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      const node = getNode(nodeId);
      if (node) {
        setCenter(node.position.x + 110, node.position.y + 60, {
          zoom: 1.2,
          duration: 400,
        });
      }
    },
    [getNode, setCenter],
  );

  // Highlight edges
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        const isConnected =
          selectedNodeId &&
          (edge.source === selectedNodeId || edge.target === selectedNodeId);
        return {
          ...edge,
          style: isConnected
            ? { stroke: "#3b82f6", strokeWidth: 2.5 }
            : { stroke: "#94a3b8", strokeWidth: 1.5 },
          animated: !!isConnected,
        };
      }),
    );
  }, [selectedNodeId, setEdges]);

  // Highlight selected/connected nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          _selected: n.id === selectedNodeId,
          _connected:
            selectedNodeId !== null &&
            (parentMap.get(selectedNodeId) === n.id ||
              (childrenMap.get(selectedNodeId) || []).includes(n.id)),
        },
      })),
    );
  }, [selectedNodeId, setNodes, parentMap, childrenMap]);

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeData = node.data as JsonNodeData;

      // Handle "load more" click
      if (nodeData.isLoadMore && nodeData.loadMoreParentPath) {
        setChildLimits((prev) => {
          const next = new Map(prev);
          const current = next.get(nodeData.loadMoreParentPath!) ?? 10;
          next.set(nodeData.loadMoreParentPath!, current + 10);
          return next;
        });
        return;
      }

      // Toggle expand/collapse if expandable
      if (nodeData.isExpandable) {
        setExpandedPaths((prev) => {
          const next = new Set(prev);
          if (next.has(nodeData.jsonPath)) {
            // Collapse: remove this path and all descendant paths
            for (const p of prev) {
              if (p.startsWith(nodeData.jsonPath) && p !== "root") {
                next.delete(p);
              }
            }
          } else {
            next.add(nodeData.jsonPath);
          }
          return next;
        });
      }

      // Toggle selection
      setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const connections = useMemo(() => {
    if (!selectedNodeId) return null;
    const parent = parentMap.get(selectedNodeId);
    const children = childrenMap.get(selectedNodeId) || [];
    return {
      parent: parent
        ? { id: parent, label: nodeLabelMap.get(parent) || parent }
        : null,
      children: children.map((id) => ({
        id,
        label: nodeLabelMap.get(id) || id,
      })),
    };
  }, [selectedNodeId, parentMap, childrenMap, nodeLabelMap]);

  const handleRelayout = useCallback(() => {
    isInitialLayout.current = true;
    draggedPositions.current.clear();
    layoutNodes(graphNodes, true);
  }, [graphNodes, layoutNodes]);

  const expandAll = useCallback(() => {
    const allPaths = new Set<string>(["root"]);
    const queue = ["root"];

    while (queue.length > 0) {
      const path = queue.shift()!;
      const val = resolveJsonPath(data, path);

      if (val !== null && typeof val === "object" && val !== undefined) {
        const entries = Array.isArray(val)
          ? (val as unknown[]).map((v, i) => [String(i), v] as const)
          : Object.entries(val as Record<string, unknown>);

        for (const [k, v] of entries) {
          if (v !== null && typeof v === "object") {
            const childPath = `${path}.${k}`;
            if (allPaths.size < 200) {
              allPaths.add(childPath);
              queue.push(childPath);
            }
          }
        }
      }
    }

    isInitialLayout.current = true;
    draggedPositions.current.clear();
    setExpandedPaths(allPaths);
  }, [data]);

  const collapseAll = useCallback(() => {
    isInitialLayout.current = true;
    draggedPositions.current.clear();
    setExpandedPaths(new Set(["root"]));
    setChildLimits(new Map());
    setSelectedNodeId(null);
  }, []);

  const toolbar = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium truncate max-w-[200px]" title={fileName}>
          {fileName}
        </p>
        <span className="text-xs text-zinc-500">{nodes.length} nodes</span>
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
          onClick={toggleFullscreen}
          className="px-3 py-1 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
        <button
          onClick={handleRelayout}
          className="px-3 py-1 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          Re-layout
        </button>
        {!isFullscreen && (
          <button
            onClick={onClear}
            className="px-3 py-1 text-xs rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );

  const navPanel = connections && selectedNodeId && (
    <div className="absolute top-3 right-3 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 overflow-hidden">
      <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
          {nodeLabelMap.get(selectedNodeId)}
        </p>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {connections.parent && (
          <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              Parent
            </p>
            <button
              onClick={() => navigateToNode(connections.parent!.id)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block w-full text-left"
            >
              ↑ {connections.parent.label}
            </button>
          </div>
        )}
        {connections.children.length > 0 && (
          <div className="px-3 py-1.5">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              Children ({connections.children.length})
            </p>
            <div className="space-y-0.5">
              {connections.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => navigateToNode(child.id)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block w-full text-left"
                >
                  ↓ {child.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {!connections.parent && connections.children.length === 0 && (
          <div className="px-3 py-2">
            <p className="text-xs text-zinc-400">No connections</p>
          </div>
        )}
      </div>
    </div>
  );

  const graphContent = (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      minZoom={0.05}
      maxZoom={2}
      defaultEdgeOptions={{
        type: "smoothstep",
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      }}
    >
      <Background gap={20} size={1} />
      <Controls />
      <MiniMap
        nodeStrokeWidth={3}
        className="!bg-zinc-100 dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-700"
      />
    </ReactFlow>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          {toolbar}
        </div>
        <div className="flex-1 relative">
          {graphContent}
          {navPanel}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {toolbar}
      <div
        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden relative"
        style={{ height: "calc(100vh - 260px)" }}
      >
        {graphContent}
        {navPanel}
      </div>
    </div>
  );
}

export default function JsonGraphViewer(props: JsonGraphViewerProps) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}
