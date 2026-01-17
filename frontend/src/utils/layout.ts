import ELK from "elkjs/lib/elk.bundled";
import type { Edge, Node } from "reactflow";

const elk = new ELK();

const elkOptions = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "150",
  "elk.spacing.nodeNode": "100",
  "elk.direction": "DOWN",
  "elk.layered.edgeRouting": "SPLINES",
};

export const getLayoutedElements = async (nodes: Node[], edges: Edge[]) => {
  const graph = {
    id: "root",
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({
      ...node,
      // Narrower width for better reading flow
      width: 220,
      height: 140,
    })),
    edges: edges.map((edge) => ({
      ...edge,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  try {
    const layoutedGraph = await elk.layout(graph);

    const layoutedNodes = nodes.map((node) => {
      const layoutedNode = layoutedGraph.children?.find(
        (n) => n.id === node.id,
      );
      if (layoutedNode) {
        return {
          ...node,
          position: {
            x: layoutedNode.x || 0,
            y: layoutedNode.y || 0,
          },
        };
      }
      return node;
    });

    return { nodes: layoutedNodes, edges };
  } catch (error) {
    console.error("ELK Layout Error:", error);
    return { nodes, edges };
  }
};
