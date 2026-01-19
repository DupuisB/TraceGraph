import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from "reactflow";

const CustomEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "supports":
        return "#10b981"; // Emerald 500
      case "contradicts":
        return "#f43f5e"; // Rose 500
      case "entails":
        return "#6366f1"; // Indigo 500
      default:
        return "#71717a"; // Zinc 500
    }
  };

  const color = getEdgeColor(label as string);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, stroke: color, strokeWidth: 2 }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <div
            className="px-2 py-0.5 rounded-full shadow-lg border backdrop-blur-md transition-all hover:scale-105"
            style={{
              backgroundColor: `${color}15`, // 10% opacity
              borderColor: `${color}40`, // 25% opacity
              color: color,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
