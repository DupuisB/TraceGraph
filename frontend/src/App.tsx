import { useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { Send, Loader2, Share2, Layers } from "lucide-react";

import ClaimNode from "./components/ClaimNode";
import EvidenceNode from "./components/EvidenceNode";
import AxiomNode from "./components/AxiomNode";

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
}

interface GraphEdge {
  source: string;
  target: string;
  type: "supports" | "contradicts" | "entails";
  weight?: number;
}

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

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

      // Basic layout logic (simple row-based for nodes)
      const newNodes: Node[] = structure.nodes.map(
        (n: GraphNode, idx: number) => ({
          id: n.id,
          type: n.type,
          data: {
            label: n.text,
            source_span: n.source_span,
            confidence: n.confidence,
          },
          position: { x: 250, y: idx * 150 }, // Initial vertical layout
        }),
      );

      const newEdges: Edge[] = structure.edges.map(
        (e: GraphEdge, idx: number) => ({
          id: `e-${idx}`,
          source: e.source,
          target: e.target,
          label: e.type,
          animated: true,
          style: { stroke: e.type === "contradicts" ? "#ef4444" : "#6366f1" },
        }),
      );

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error("Error analyzing text:", error);
      alert("Failed to analyze text. Is the backend running?");
    } finally {
      setLoading(false);
    }
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
          nodeTypes={nodeTypes}
          fitView
          className="bg-zinc-950"
        >
          <Background color="#27272a" gap={20} />
          <Controls className="!bg-zinc-900 !border-zinc-800 !fill-white" />
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
          <button className="p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all text-zinc-400">
            <Share2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
