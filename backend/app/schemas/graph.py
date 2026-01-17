from enum import Enum

from pydantic import BaseModel, Field


class NodeType(str, Enum):
    CLAIM = "claim"
    EVIDENCE = "evidence"
    AXIOM = "axiom"


class RelationType(str, Enum):
    SUPPORTS = "supports"
    CONTRADICTS = "contradicts"
    ENTAILS = "entails"


class Node(BaseModel):
    id: str = Field(..., description="Unique identifier (slug or UUID)")
    type: NodeType
    text: str = Field(..., description="Concise text of the claim or evidence")
    source_span: str | None = Field(
        None, description="Exact quote from the original text"
    )
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class Edge(BaseModel):
    source: str = Field(..., description="ID of the source node")
    target: str = Field(..., description="ID of the target node")
    type: RelationType
    weight: float = Field(default=1.0, ge=0.0, le=1.0)


class GraphStructure(BaseModel):
    root_claim_id: str | None = None
    nodes: list[Node]
    edges: list[Edge]


class AnalysisRequest(BaseModel):
    text_blob: str = Field(..., max_length=100000)


class AnalysisResponse(BaseModel):
    graph_structure: GraphStructure
