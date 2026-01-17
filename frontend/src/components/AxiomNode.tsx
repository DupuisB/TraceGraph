import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { ShieldCheck } from "lucide-react";

const AxiomNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-zinc-900 border-2 border-amber-500 text-white min-w-[200px]">
      <div className="flex items-center mb-1">
        <ShieldCheck size={16} className="text-amber-400 mr-2" />
        <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
          Axiom
        </span>
      </div>
      <div className="text-sm font-medium">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-amber-500"
      />
    </div>
  );
};

export default memo(AxiomNode);
