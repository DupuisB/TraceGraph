import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Scale } from "lucide-react";

const AxiomNode = ({ data }: NodeProps) => {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-xl bg-amber-950/60 border-2 border-amber-500 text-white w-[220px] transition-all ${
        data.isOrphaned ? "opacity-50 grayscale" : "hover:scale-105"
      }`}
      title={data.label}
    >
      <div className="flex items-center mb-2 border-b border-white/10 pb-2">
        <Scale size={16} className="text-amber-400 mr-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 opacity-80">
          Axiom
        </span>
      </div>
      <div className="text-sm font-medium text-amber-50 leading-snug line-clamp-4">
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-amber-500"
      />
    </div>
  );
};

export default memo(AxiomNode);
