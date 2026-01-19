import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Gem, CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react";

const AxiomNode = ({ data }: NodeProps) => {
  const status = data.verification_status || "pending";

  const getStatusColor = () => {
    switch (status) {
      case "verified":
        return "bg-purple-950/50 border-purple-400 shadow-purple-500/20";
      case "refuted":
        return "bg-rose-950/50 border-rose-500 shadow-rose-500/20";
      case "needs_review":
        return "bg-amber-950/50 border-amber-500 border-dashed shadow-amber-500/20";
      default:
        return "bg-slate-900 border-purple-400/50";
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
        return <Loader2 size={14} className="text-purple-400 animate-spin" />;
    }
  };

  return (
    <div
      className={`relative group transition-all duration-300 ${getStatusColor()}
                  rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm
                  min-w-[200px] max-w-[300px] hover:scale-105`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-purple-400 !border-slate-800 !-top-1"
      />

      <div className="flex items-start gap-2">
        <Gem className="text-purple-400 mt-0.5 shrink-0" size={16} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-purple-300 opacity-70 font-medium">
              Axiom
            </span>
            {getStatusIcon()}
          </div>
          {/* Ensure title/text is visible without expansion */}
          <p className="text-sm text-slate-200 leading-relaxed line-clamp-4">
            {data.text || data.label}
          </p>
          {data.verification_reason && (
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 opacity-70">
              <span className="truncate max-w-[120px]">
                {data.verification_reason}
              </span>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-purple-400 !border-slate-800 !-bottom-1"
      />
    </div>
  );
};

export default memo(AxiomNode);
