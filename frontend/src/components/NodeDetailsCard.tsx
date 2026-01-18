import {
  X,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { memo } from "react";

interface NodeDetailsCardProps {
  node: any;
  onClose: () => void;
}

const NodeDetailsCard = ({ node, onClose }: NodeDetailsCardProps) => {
  if (!node) return null;

  const {
    label,
    text,
    type,
    verification_status,
    verification_reason,
    verification_quote,
    citations,
  } = node.data;

  // Handle both label (claims) and text (evidence/axiom)
  const content = label || text || "";
  const status = verification_status || "pending";

  const getStatusColor = () => {
    switch (status) {
      case "verified":
        return "text-emerald-400 bg-emerald-950/30 border-emerald-500/30";
      case "refuted":
        return "text-rose-400 bg-rose-950/30 border-rose-500/30";
      case "needs_review":
        return "text-amber-400 bg-amber-950/30 border-amber-500/30";
      default:
        return "text-blue-400 bg-blue-950/30 border-blue-500/30";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "verified":
        return <CheckCircle2 size={16} />;
      case "refuted":
        return <XCircle size={16} />;
      case "needs_review":
        return <Eye size={16} />;
      default:
        return <Loader2 size={16} className="animate-spin" />;
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-20 w-[400px] max-h-[80vh] flex flex-col bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded-full border text-xs font-medium uppercase tracking-wider ${getStatusColor()}`}
          >
            {getStatusIcon()}
            <span>{status.replace("_", " ")}</span>
          </div>
          <span className="text-zinc-500 text-xs font-mono uppercase opacity-70">
            {type || node.type}
          </span>
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
        {/* Main Content */}
        <div className="text-base font-medium text-zinc-100 leading-relaxed">
          {content}
        </div>

        {/* Verification Logic */}
        {status !== "pending" && (
          <div className="mt-6 flex flex-col gap-4">
            {/* Quote */}
            {verification_quote && (
              <div className="relative pl-4 border-l-2 border-indigo-500/50">
                <p className="text-sm italic text-zinc-400 leading-relaxed">
                  "{verification_quote}"
                </p>
              </div>
            )}

            {/* Reason */}
            {verification_reason && (
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                  Analysis
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {verification_reason}
                </p>
              </div>
            )}

            {/* Citations */}
            {citations && citations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  Sources{" "}
                  <span className="bg-zinc-800 text-zinc-400 px-1.5 rounded-full text-[10px]">
                    {citations.length}
                  </span>
                </h4>
                <div className="flex flex-col gap-2">
                  {citations.map((citation: any, i: number) => (
                    <a
                      key={i}
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 border border-white/5 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="mt-1 p-1 bg-indigo-500/10 rounded text-indigo-400 group-hover:text-indigo-300">
                        <ExternalLink size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-300 group-hover:text-indigo-200 truncate transition-colors">
                          {citation.title || "External Source"}
                        </div>
                        <div className="text-xs text-zinc-500 truncate group-hover:text-zinc-400">
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

export default memo(NodeDetailsCard);
