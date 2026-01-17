import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { AlertCircle } from "lucide-react";

const ClaimNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-zinc-900 border-2 border-indigo-500 text-white min-w-[200px]">
      <div className="flex items-center mb-1">
        <AlertCircle size={16} className="text-indigo-400 mr-2" />
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
          Claim
        </span>
      </div>
      <div className="text-sm font-medium">{data.label}</div>
      {data.confidence !== undefined && (
        <div className="mt-2 w-full bg-zinc-800 rounded-full h-1">
          <div
            className="bg-indigo-500 h-1 rounded-full"
            style={{ width: `${(data.confidence || 0) * 100}%` }}
          />
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
