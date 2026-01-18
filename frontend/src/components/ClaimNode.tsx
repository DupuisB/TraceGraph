import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react";

const ClaimNode = ({ data, selected }: NodeProps) => {
  const status = data.verification_status || "pending";

  const getStatusColor = () => {
    switch (status) {
      case "verified":
        return "bg-emerald-950/50 border-emerald-500 shadow-emerald-500/20";
      case "refuted":
        return "bg-rose-950/50 border-rose-500 shadow-rose-500/20";
      case "needs_review":
        // Yellow to indicate human attention needed
        return "bg-amber-950/50 border-amber-500 border-dashed shadow-amber-500/20";
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
        return <Eye size={16} className="text-amber-400 mr-2" />;
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
      } ${selected ? "z-50 scale-105" : "z-0"}`}
    >
      <div
        className={`px-4 py-3 shadow-lg rounded-xl border-2 transition-all relative overflow-hidden ${getStatusColor()} ${
          selected ? "w-[300px]" : "w-[220px]"
        }`}
      >
        <div className="flex items-center mb-2 border-b border-white/10 pb-2">
          {getStatusIcon()}
          <span className="text-[10px] uppercase tracking-widest font-bold ml-2 opacity-80">
            {status === "needs_review" ? "Review" : "Claim"}
          </span>
        </div>

        {/* Main Text */}
        <div
          className={`text-sm font-medium leading-snug text-zinc-100 ${
            selected ? "" : "line-clamp-3"
          }`}
        >
          {data.label}
        </div>

        {/* Verification Logic Display - Only when selected */}
        {data.verification_status !== "pending" && (
          <>
            {!selected && (
              <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-zinc-500" />
                Click to see verification details
              </div>
            )}

            <div
              className={`transition-all duration-300 overflow-hidden ${
                selected
                  ? "max-h-[500px] opacity-100 mt-3"
                  : "max-h-0 opacity-0 mt-0"
              }`}
            >
              <div className="flex flex-col gap-2">
                {data.verification_quote && (
                  <div className="text-[10px] italic text-zinc-400 border-l-2 border-white/10 pl-2">
                    "{data.verification_quote}"
                  </div>
                )}

                {data.verification_reason && (
                  <div className="text-[10px] leading-relaxed p-2 bg-black/20 rounded border border-white/5">
                    <span className="opacity-80">
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
                          (
                            citation: { title: string; url: string },
                            i: number,
                          ) => (
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
            </div>
          </>
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
