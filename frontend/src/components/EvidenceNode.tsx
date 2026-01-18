import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { FileText, CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react";

const EvidenceNode = ({ data, selected }: NodeProps) => {
  const status = data.verification_status || "pending";

  const getStatusColor = () => {
    switch (status) {
      case "verified":
        return "bg-blue-950/50 border-blue-400 shadow-blue-500/20";
      case "refuted":
        return "bg-rose-950/50 border-rose-500 shadow-rose-500/20";
      case "needs_review":
        return "bg-amber-950/50 border-amber-500 border-dashed shadow-amber-500/20";
      default:
        return "bg-slate-900 border-blue-400/50";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "verified":
        return <CheckCircle2 size={14} className="text-emerald-400" />;
      case "refuted":
        return <XCircle size={14} className="text-rose-400" />;
      case "needs_review":
        return <Eye size={14} className="text-amber-400" />;
      default:
        return <Loader2 size={14} className="text-blue-400 animate-spin" />;
    }
  };

  return (
    <div
      className={`relative group transition-all duration-300 ${getStatusColor()} 
                  rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm
                  min-w-[200px] max-w-[300px] ${
                    selected ? "z-50 scale-105" : "z-0 hover:scale-105"
                  }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-blue-400 !border-slate-800 !-top-1"
      />

      <div className="flex items-start gap-2">
        <FileText className="text-blue-400 mt-0.5 shrink-0" size={16} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-blue-300 opacity-70 font-medium">
              Evidence
            </span>
            {getStatusIcon()}
          </div>

          <p
            className={`text-sm text-slate-200 leading-relaxed ${selected ? "" : "line-clamp-3"}`}
          >
            {data.text}
          </p>

          {data.verification_reason && (
            <>
              {!selected && (
                <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1 opacity-70">
                  <span className="w-1 h-1 rounded-full bg-zinc-500" />
                  Click for details
                </div>
              )}

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  selected
                    ? "max-h-[300px] opacity-100 mt-2"
                    : "max-h-0 opacity-0 mt-0"
                }`}
              >
                <p className="text-xs text-slate-400 italic border-t border-white/10 pt-2">
                  {data.verification_reason}
                </p>

                {/* Citations */}
                {data.citations && data.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <div className="flex flex-wrap gap-1">
                      {data.citations
                        .slice(0, 3)
                        .map((citation: any, i: number) => (
                          <a
                            key={i}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-400 hover:text-blue-300 underline truncate max-w-[180px] block"
                            title={citation.title}
                          >
                            {citation.title || "Source"}
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-blue-400 !border-slate-800 !-bottom-1"
      />
    </div>
  );
};

export default memo(EvidenceNode);
