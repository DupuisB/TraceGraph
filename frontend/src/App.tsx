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
  Plus,
  Minus,
  Maximize,
  Lock,
  Unlock,
  HelpCircle,
  FileText,
} from "lucide-react";

import ClaimNode from "./components/ClaimNode";
import EvidenceNode from "./components/EvidenceNode";
import AxiomNode from "./components/AxiomNode";
import Guide from "./components/Guide";
import NodeDetailsCard from "./components/NodeDetailsCard";
import CustomEdge from "./components/CustomEdge";

const nodeTypes = {
  claim: ClaimNode,
  evidence: EvidenceNode,
  axiom: AxiomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// V2: Citation from web search
interface Citation {
  title: string;
  url: string;
  source: string;
}

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
  citations?: Citation[];
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
  const [isLocked, setIsLocked] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  // Add web search toggle state (default true for V2)
  const [enableWebSearch, setEnableWebSearch] = useState(true);

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
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
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
        body: JSON.stringify({
          text_blob: text,
          enable_web_search: enableWebSearch,
        }),
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
                  citations: updatedNode.citations,
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
      type: "custom",
      label: e.type,
      animated: true,
      data: { weight: e.weight },
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
          <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg shadow-amber-500/20">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-mistral-bg"
            >
              <circle cx="4" cy="18" r="2" />
              <circle cx="12" cy="6" r="2" />
              <circle cx="20" cy="18" r="2" />
              <path d="M4 18L12 6L20 18" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">TraceGraph</h1>
            <p className="text-[10px] text-zinc-500 tracking-wide">
              Graph Argument Decomposition
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-400">
              Input Context
            </label>
            <button
              onClick={() => setText(EXAMPLE_TEXT)}
              className="px-2 py-1 text-[10px] bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-1.5"
            >
              <FileText size={10} />
              Load Example
            </button>
          </div>
          <textarea
            className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none placeholder:text-zinc-600 transition-all"
            placeholder="Paste your text here (e.g., a news article or reasoning chain)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex items-center justify-between bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/50">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-5 rounded-full relative transition-colors duration-200 cursor-pointer ${enableWebSearch ? "bg-indigo-600" : "bg-zinc-700"}`}
                onClick={() => setEnableWebSearch(!enableWebSearch)}
              >
                <div
                  className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${enableWebSearch ? "translate-x-4" : "translate-x-0"}`}
                />
              </div>
              <span className="text-zinc-400 text-xs font-medium">
                Enable Web Search Verification
              </span>
            </div>
            {enableWebSearch && (
              <span className="text-[10px] text-indigo-400 bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-900/50">
                Active
              </span>
            )}
          </div>

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
          <span>TraceGraph v1.0</span>
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
          edgeTypes={edgeTypes}
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
          <NodeDetailsCard
            node={selectedNode || hoveredNode}
            onClose={() => setSelectedNode(null)}
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
      </div>
    </div>
  );
};

import { getLayoutedElements } from "./utils/layout";

const EXAMPLE_TEXT = `Market Briefing: The AI Hardware Landscape (Q1 2025)

The artificial intelligence sector continues to be driven by significant hardware constraints. NVIDIA remains the dominant player in the GPU market, capitalizing on its H100 tensor core architecture which has become the industry standard for training Large Language Models (LLMs). This market position is reinforced by their CUDA software moat, which locks developers into their ecosystem.

However, competitive dynamics are shifting. In a surprising move last week, Apple announced it has acquired OpenAI for $700 billion, effectively ending its partnership with Microsoft. This acquisition aims to integrate ChatGPT directly into the iPhone 16's kernel, replacing Siri entirely by next month.

Meanwhile, the open-source community is rallying around efficient inference. Mistral AI released "Mixtral 8x7B" in December 2023, a sparse mixture-of-experts model that outperforms Llama 2 70B on most benchmarks while using 6x fewer active parameters during inference. Analysts suggest this efficiency could reduce enterprise serving costs by 40% year-over-year.`;

function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;
