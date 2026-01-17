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
      className={`px-4 py-3 shadow-lg rounded-xl border-2 text-white w-[220px] transition-all duration-300 hover:scale-105 ${getStatusColor()}`}
      title={data.label} // Native tooltip for full text
    >
      <div className="flex items-center mb-2 border-b border-white/10 pb-2">
        {getStatusIcon()}
        <span className="text-[10px] uppercase tracking-widest font-bold ml-2 opacity-80">
          Claim
        </span>
      </div>

      {/* Main Text with Clamping */}
      <div className="text-sm font-medium leading-snug line-clamp-4 text-zinc-100">
        {data.label}
      </div>

      {data.verification_reason && (
        <div className="mt-3 text-[10px] leading-relaxed p-2 bg-black/20 rounded border border-white/5">
          <span className="font-bold opacity-70 block mb-1">Reasoning:</span>
          <span className="opacity-80 line-clamp-3">
            {data.verification_reason}
          </span>
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
