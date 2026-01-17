import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react";

const ClaimNode = ({ data }: NodeProps) => {
  const status = data.verification_status || "pending";

  const getStatusColor = () => {
    switch (status) {
      case "verified":
        return "bg-emerald-950/50 border-emerald-500 shadow-emerald-500/20";
      case "refuted":
        return "bg-rose-950/50 border-rose-500 shadow-rose-500/20";
      case "needs_review":
        // Research-backed: Neutral styling to avoid "False Security" of warning colors
        return "bg-slate-900 border-slate-500 border-dashed opacity-80";
      default:
        // Default covers pending/uncertain
        return "bg-zinc-900 border-indigo-500";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "verified":
        return <CheckCircle2 size={16} className="text-emerald-400 mr-2" />;
      case "refuted":
        return <XCircle size={16} className="text-rose-400 mr-2" />;
      case "needs_review":
        return <Eye size={16} className="text-slate-400 mr-2" />;
      default:
        return (
          <Loader2 size={16} className="text-indigo-400 mr-2 animate-spin" />
        );
    }
  };

  return (
    <div
      className={`relative group transition-all duration-300 ${
        data.isOrphaned ? "opacity-50 grayscale" : "hover:scale-105"
      }`}
    >
      <div
        className={`px-4 py-3 shadow-lg rounded-xl border-2 w-[220px] transition-all relative overflow-hidden ${getStatusColor()}`}
      >
        <div className="flex items-center mb-2 border-b border-white/10 pb-2">
          {getStatusIcon()}
          <span className="text-[10px] uppercase tracking-widest font-bold ml-2 opacity-80">
            {status === "needs_review" ? "Review" : "Claim"}
          </span>
        </div>

        {/* Main Text with Clamping */}
        <div className="text-sm font-medium leading-snug line-clamp-4 text-zinc-100">
          {data.label}
        </div>

        {/* Verification Logic Display */}
        {data.verification_status !== "pending" && (
          <div className="mt-3 flex flex-col gap-2">
            {data.verification_quote && (
              <div className="text-[10px] italic text-zinc-400 border-l-2 border-white/10 pl-2">
                "{data.verification_quote}"
              </div>
            )}

            {data.verification_reason && (
              <div className="text-[10px] leading-relaxed p-2 bg-black/20 rounded border border-white/5">
                <span className="opacity-80 line-clamp-3">
                  {data.verification_reason}
                </span>
              </div>
            )}

            {/* V2: Web Search Citations */}
            {data.citations && data.citations.length > 0 && (
              <div className="text-[10px] mt-1">
                <span className="opacity-60 block mb-1">Sources:</span>
                <div className="flex flex-wrap gap-1">
                  {data.citations
                    .slice(0, 3)
                    .map(
                      (citation: { title: string; url: string }, i: number) => (
                        <a
                          key={i}
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 underline truncate max-w-[180px]"
                          title={citation.title}
                        >
                          {citation.title || citation.url}
                        </a>
                      ),
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-indigo-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-indigo-500"
      />
    </div>
  );
};

export default memo(ClaimNode);
