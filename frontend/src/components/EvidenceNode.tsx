import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { FileText } from "lucide-react";

const EvidenceNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-slate-900 border-2 border-slate-500 text-white min-w-[200px]">
      <div className="flex items-center mb-1">
        <FileText size={16} className="text-slate-400 mr-2" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Evidence
        </span>
      </div>
      <div className="text-sm font-medium font-serif italic text-slate-100">
        "{data.label}"
      </div>
      {data.source_span && (
        <div className="mt-1 text-[10px] italic text-zinc-400 truncate whitespace-pre-wrap line-clamp-2">
          "{data.source_span}"
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
