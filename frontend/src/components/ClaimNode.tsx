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
        return "bg-amber-950/50 border-amber-500 border-dashed shadow-amber-500/20";
      default:
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

        <div className="text-sm font-medium leading-snug line-clamp-4 text-zinc-100">
          {data.label}
        </div>

        {data.verification_status !== "pending" && (
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
            <span className="truncate max-w-[120px] opacity-70">
              {data.verification_reason}
            </span>
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
