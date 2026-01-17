import { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Send,
  Loader2,
  Share2,
  Layers,
  Plus,
  Minus,
  Maximize,
  Lock,
  Unlock,
  HelpCircle,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

import ClaimNode from "./components/ClaimNode";
import EvidenceNode from "./components/EvidenceNode";
import AxiomNode from "./components/AxiomNode";
import Guide from "./components/Guide";

const nodeTypes = {
  claim: ClaimNode,
  evidence: EvidenceNode,
  axiom: AxiomNode,
};

interface GraphNode {
  id: string;
  type: "claim" | "evidence" | "axiom";
  text: string;
  source_span?: string;
  confidence?: number;
  verification_status?:
    | "pending"
    | "verified"
    | "refuted"
    | "uncertain"
    | "needs_review";
  verification_reason?: string;
  verification_quote?: string;
  isOrphaned?: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "supports" | "contradicts" | "entails";
  weight?: number;
}

const GraphControls = ({
  isLocked,
  toggleLock,
}: {
  isLocked: boolean;
  toggleLock: () => void;
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-3">
      {/* Zoom Group */}
      <div className="flex flex-col bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <button
          onClick={() => zoomIn()}
          className="p-2 hover:bg-white/10 text-white transition-colors"
          title="Zoom In"
        >
          <Plus size={14} />
        </button>
        <div className="h-[1px] bg-zinc-800 w-full" />
        <button
          onClick={() => zoomOut()}
          className="p-2 hover:bg-white/10 text-white transition-colors"
          title="Zoom Out"
        >
          <Minus size={14} />
        </button>
      </div>

      {/* Fit View */}
      <button
        onClick={() => fitView()}
        className="p-2 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl text-white hover:bg-white/10 shadow-2xl transition-colors"
        title="Fit Graph to View"
      >
        <Maximize size={14} />
      </button>

      {/* Map Lock */}
      <button
        onClick={toggleLock}
        className={`p-2 backdrop-blur border rounded-xl shadow-2xl transition-colors ${
          isLocked
            ? "bg-indigo-600 border-indigo-500 text-white"
            : "bg-zinc-900/90 border-zinc-800 text-white hover:bg-white/10"
        }`}
        title={isLocked ? "Unlock View" : "Lock View"}
      >
        {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
      </button>
    </div>
  );
};

const Flow = () => {
  // Load initial state from localStorage
  const savedText = localStorage.getItem("tracegraph-text") || "";
  const savedNodes = JSON.parse(
    localStorage.getItem("tracegraph-nodes") || "[]",
  );
  const savedEdges = JSON.parse(
    localStorage.getItem("tracegraph-edges") || "[]",
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(savedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(savedEdges);
  const [text, setText] = useState(savedText);
  const [loading, setLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem("tracegraph-text", text);
  }, [text]);

  useEffect(() => {
    localStorage.setItem("tracegraph-nodes", JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem("tracegraph-edges", JSON.stringify(edges));
  }, [edges]);

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!selectedNode) {
        // Only hover if no selection
        setHoveredNode(node);
      }
    },
    [selectedNode],
  );

  const onNodeMouseLeave = useCallback(() => {
    if (!selectedNode) {
      setHoveredNode(null);
    }
  }, [selectedNode]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setHoveredNode(null); // Clear hover to avoid conflict
    setIsEditing(false); // Reset edit mode
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setIsEditing(false);
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const analyzeText = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text_blob: text }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      const structure = data.graph_structure;

      // Initial Layout using ELK
      await updateGraphWithLayout(structure);

      // Start polling for verification status
      if (structure.root_claim_id) {
        pollGraphStatus(structure.root_claim_id);
      }
    } catch (error) {
      console.error("Error analyzing text:", error);
      alert("Failed to analyze text. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleEditNode = (nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, label: newLabel },
          };
        }
        return node;
      }),
    );
  };

  const handleDeleteNode = (nodeId: string) => {
    // 1. Identify all descendants (orphans)
    const descendants = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current !== nodeId) descendants.add(current); // Don't add self to orphans

      const children = edges
        .filter((e) => e.source === current)
        .map((e) => e.target);

      stack.push(...children);
    }

    // 2. Remove the deleted node
    setNodes((nds) => {
      const remainingNodes = nds.filter((n) => n.id !== nodeId);

      // 3. Mark descendants as orphaned
      return remainingNodes.map((n) => {
        if (descendants.has(n.id)) {
          return {
            ...n,
            data: { ...n.data, isOrphaned: true },
          };
        }
        return n;
      });
    });

    // 4. Remove connected edges
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
    );

    // Close modal if open
    setHoveredNode(null);
  };

  const pollGraphStatus = (graphId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/graph/${graphId}`);
        if (!res.ok) return;
        const data = await res.json();

        // We just update data here, preserving layout if possible?
        // For simplicity in MVP, we re-layout or just update node data.
        // Re-layouting on every poll might be jumpy.
        // Let's just update the node data (verification status) without moving them.
        setNodes((nodes) =>
          nodes.map((n) => {
            const updatedNode = data.nodes.find(
              (un: GraphNode) => un.id === n.id,
            );
            if (updatedNode) {
              return {
                ...n,
                data: {
                  ...n.data,
                  verification_status: updatedNode.verification_status,
                  verification_reason: updatedNode.verification_reason,
                  verification_quote: updatedNode.verification_quote,
                },
              };
            }
            return n;
          }),
        );

        // Stop polling if all claims are verified
        const pendingClaims = data.nodes.some(
          (n: GraphNode) =>
            n.type === "claim" && n.verification_status === "pending",
        );
        if (!pendingClaims) {
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2000);
  };

  const updateGraphWithLayout = async (structure: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  }) => {
    const rawNodes = structure.nodes.map((n: GraphNode) => ({
      id: n.id,
      type: n.type,
      data: {
        label: n.text,
        source_span: n.source_span,
        confidence: n.confidence,
        verification_status: n.verification_status,
        verification_reason: n.verification_reason,
      },
      position: { x: 0, y: 0 }, // ELK will decide
    }));

    const rawEdges = structure.edges.map((e: GraphEdge, idx: number) => ({
      id: `e-${idx}`,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      label: e.type,
      animated: true,
      style: {
        stroke: e.type === "contradicts" ? "#ef4444" : "#6366f1",
        strokeWidth: 2,
      },
    }));

    // Apply ELK Layout
    const { nodes: layoutedNodes, edges: layoutedEdges } =
      await getLayoutedElements(rawNodes, rawEdges);

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden font-sans text-white">
      {/* Sidebar / Input Panel */}
      <div className="w-[400px] border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex flex-col p-6 z-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Layers size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TraceGraph</h1>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <label className="text-sm font-medium text-zinc-400">
            Input Context
          </label>
          <textarea
            className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none placeholder:text-zinc-600 transition-all"
            placeholder="Paste your text here (e.g., a news article or reasoning chain)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={analyzeText}
            disabled={loading || !text.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {loading ? "Analyzing..." : "Analyze Argument"}
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-900 text-[10px] text-zinc-500 flex justify-between">
          <span>Mistral TraceGraph v1.0</span>
          <span>Powered by Mistral Large</span>
        </div>
      </div>

      {/* Graph Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-zinc-950"
          panOnDrag={!isLocked}
          zoomOnScroll={!isLocked}
          panOnScroll={!isLocked}
          zoomOnPinch={!isLocked}
          zoomOnDoubleClick={!isLocked}
          nodesDraggable={!isLocked}
        >
          <Background color="#27272a" gap={20} />
          <GraphControls
            isLocked={isLocked}
            toggleLock={() => setIsLocked(!isLocked)}
          />
          <MiniMap
            className="!bg-zinc-900 !border-zinc-800"
            maskColor="rgba(0, 0, 0, 0.7)"
            nodeColor={(n) => {
              if (n.type === "claim") return "#6366f1";
              if (n.type === "evidence") return "#10b981";
              return "#f59e0b";
            }}
          />
        </ReactFlow>

        {/* Graph Overlay UI */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
            title="Help & Legend"
          >
            <HelpCircle size={20} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link copied to clipboard! (Simulation)");
            }}
            className="p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
            title="Share Graph"
          >
            <Share2 size={20} />
          </button>
        </div>

        <Guide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

        {/* Hover/Selection Modal Card */}
        {(selectedNode || hoveredNode) && (
          <div className="fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out">
            <div
              className="glass-panel p-5 rounded-2xl w-[350px] shadow-2xl border-l-4 animate-in slide-in-from-right-10 fade-in duration-300"
              style={{
                borderLeftColor:
                  (selectedNode || hoveredNode)!.data.verification_status ===
                  "verified"
                    ? "#10b981"
                    : (selectedNode || hoveredNode)!.data
                          .verification_status === "refuted"
                      ? "#f43f5e"
                      : "#6366f1",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  {(selectedNode || hoveredNode)!.type} Details
                </span>
                {(selectedNode || hoveredNode)!.data.confidence && (
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-300">
                    {Math.round(
                      (selectedNode || hoveredNode)!.data.confidence! * 100,
                    )}
                    % Conf
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="mb-4">
                  <textarea
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y min-h-[100px]"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (selectedNode) {
                          handleEditNode(selectedNode.id, editValue);
                          setIsEditing(false);
                          // Update local selected node data to reflect change immediately in UI if needed,
                          // but reacting to nodes state change is better.
                          setSelectedNode((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  data: { ...prev.data, label: editValue },
                                }
                              : null,
                          );
                        }
                      }}
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-medium leading-snug mb-3 text-white">
                    {(selectedNode || hoveredNode)!.data.label}
                  </h3>

                  {(selectedNode || hoveredNode)!.data.verification_reason && (
                    <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-sm text-zinc-300">
                      <span className="text-xs font-bold text-zinc-400 block mb-1 uppercase">
                        Analysis
                      </span>
                      {(selectedNode || hoveredNode)!.data.verification_reason}
                    </div>
                  )}

                  {(selectedNode || hoveredNode)!.data.source_span && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-zinc-500 italic">
                      "{(selectedNode || hoveredNode)!.data.source_span}"
                    </div>
                  )}
                </>
              )}

              {/* Node Actions (Hide in Edit Mode) */}
              {!isEditing && (
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const active = selectedNode || hoveredNode;
                      if (!active) return;

                      // If it's a hover interaction, lock it first? Or just allow editing?
                      // Let's force select properly to edit.
                      setSelectedNode(active);
                      setEditValue(active.data.label);
                      setIsEditing(true);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    title="Edit Text"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          "Delete this node? Dependents will be orphaned.",
                        )
                      ) {
                        const active = selectedNode || hoveredNode;
                        if (active) {
                          handleDeleteNode(active.id);
                          setSelectedNode(null); // Clear selection after delete
                        }
                      }
                    }}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-colors"
                    title="Delete Node"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { getLayoutedElements } from "./utils/layout";

function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;
