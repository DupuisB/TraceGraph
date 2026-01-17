import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { FileText } from "lucide-react";

const EvidenceNode = ({ data }: NodeProps) => {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-xl bg-slate-900/90 border-2 border-slate-500 text-white w-[220px] transition-all ${
        data.isOrphaned ? "opacity-50 grayscale" : "hover:scale-105"
      }`}
      title={data.label}
    >
      <div className="flex items-center mb-2 border-b border-white/10 pb-2">
        <FileText size={16} className="text-slate-400 mr-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 opacity-80">
          Evidence
        </span>
      </div>
      <div className="text-sm font-medium font-serif italic text-slate-100 leading-snug line-clamp-4">
        "{data.label}"
      </div>
      {data.source_span && (
        <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-zinc-400 truncate font-mono opacity-70">
          Source: {data.source_span}
        </div>
      )}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-emerald-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-emerald-500"
      />
    </div>
  );
};

export default memo(EvidenceNode);
