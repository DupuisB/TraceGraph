import { X, ExternalLink, Globe } from "lucide-react";
import { type Node } from "reactflow";

interface NodeDetailsCardProps {
  node: Node | null;
  onClose: () => void;
}

interface Citation {
  title: string;
  url: string;
  source: string;
}

const NodeDetailsCard = ({ node, onClose }: NodeDetailsCardProps) => {
  if (!node) return null;

  const data = node.data;
  const status = data.verification_status || "pending";

  const getStatusColor = () => {
    switch (status) {
      case "verified":
        return "text-emerald-400 bg-emerald-950/30 border-emerald-500/50";
      case "refuted":
        return "text-rose-400 bg-rose-950/30 border-rose-500/50";
      case "needs_review":
        return "text-slate-400 bg-slate-900/30 border-slate-500/50";
      default:
        return "text-zinc-400 bg-zinc-800/50 border-zinc-700/50";
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-50 w-[400px] max-h-[80vh] flex flex-col bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor()}`}
          >
            {status.replace("_", " ")}
          </span>
          <span className="text-xs font-mono text-zinc-500 uppercase">
            {node.type}
          </span>
          {data.citations && data.citations.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Globe size={10} />
              Web Enhanced
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto p-5 custom-scrollbar">
        {/* Main Text */}
        <div className="text-lg font-medium text-zinc-100 leading-normal mb-6">
          {data.label || data.text}
        </div>

        {/* Verification Logic */}
        {data.verification_status !== "pending" && (
          <div className="space-y-4">
            {/* Quote */}
            {data.verification_quote && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                  Relevant Quote
                </span>
                <blockquote className="text-sm italic text-zinc-300 border-l-2 border-indigo-500/50 pl-3 py-1 bg-white/5 rounded-r-lg">
                  "{data.verification_quote}"
                </blockquote>
              </div>
            )}

            {/* Reasoning */}
            {data.verification_reason && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                  Analysis
                </span>
                <div className="text-sm text-zinc-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                  {data.verification_reason}
                </div>
              </div>
            )}

            {/* Citations */}
            {data.citations && data.citations.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                  Sources
                </span>
                <div className="grid gap-2">
                  {data.citations.map((citation: Citation, i: number) => (
                    <a
                      key={i}
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="mt-1 p-1 rounded bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                        <ExternalLink size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-indigo-300 group-hover:text-indigo-200 truncate">
                          {citation.title || new URL(citation.url).hostname}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {citation.url}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeDetailsCard;
