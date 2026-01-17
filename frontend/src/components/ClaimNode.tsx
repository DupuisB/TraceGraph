import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { CheckCircle2, XCircle, HelpCircle, Loader2 } from "lucide-react";

const ClaimNode = ({ data }: NodeProps) => {
  const status = data.verification_status || "pending";

  const getStatusColor = () => {
    switch (status) {
      case "verified":
        return "bg-emerald-950/50 border-emerald-500 shadow-emerald-500/20";
      case "refuted":
        return "bg-rose-950/50 border-rose-500 shadow-rose-500/20";
      case "uncertain":
        return "bg-amber-950/30 border-amber-500 shadow-amber-500/20";
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
      case "uncertain":
        return <HelpCircle size={16} className="text-amber-400 mr-2" />;
      default:
        return (
          <Loader2 size={16} className="text-indigo-400 mr-2 animate-spin" />
        );
    }
  };

  return (
    <div
      className={`px-4 py-2 shadow-lg rounded-lg border-2 text-white min-w-[200px] transition-all duration-500 ${getStatusColor()}`}
    >
      <div className="flex items-center mb-1">
        {getStatusIcon()}
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Claim
        </span>
      </div>
      <div className="text-sm font-medium">{data.label}</div>
      {data.verification_reason && (
        <div className="mt-2 text-[10px] text-zinc-400 border-t border-zinc-800 pt-1 italic">
          {data.verification_reason}
        </div>
      )}
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
