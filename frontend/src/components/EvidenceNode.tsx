import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { BookOpen } from "lucide-react";

const EvidenceNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-zinc-900 border-2 border-emerald-500 text-white min-w-[200px]">
      <div className="flex items-center mb-1">
        <BookOpen size={16} className="text-emerald-400 mr-2" />
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
          Evidence
        </span>
      </div>
      <div className="text-sm font-medium">{data.label}</div>
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
