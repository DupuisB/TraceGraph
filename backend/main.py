import asyncio
from typing import Annotated

from dotenv import find_dotenv, load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.exceptions import TraceGraphError
from app.schemas.graph import (
    AnalysisRequest,
    AnalysisResponse,
    GraphStructure,
    VerificationStatus,
)
from app.services.agent_service import AgentService
from app.services.mistral_service import MistralService

load_dotenv(find_dotenv())

app = FastAPI(title="TraceGraph API")

# In-memory store for graph states (for MVP polling)
# Key: root_claim_id (or temporary ID), Value: GraphStructure
GRAPH_STORE: dict[str, GraphStructure] = {}

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For MVP, allowing all. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_mistral_service() -> MistralService:
    return MistralService()


def get_agent_service() -> AgentService:
    return AgentService()


async def process_verification_tasks(
    graph: GraphStructure, agent_service: AgentService, context: str
):
    """Background task to verify all claims in the graph in parallel using Agents."""
    print(f"--> [Auditor Agent] Starting verification ({len(graph.nodes)} nodes)...")

    # Identify nodes to verify (Claims, Evidence, Axioms)
    # Why verify Axioms? If extracted from text, they are assertions to be checked.
    nodes_to_verify = [
        node for node in graph.nodes if node.type in ("claim", "evidence", "axiom")
    ]

    # Initialize verification tasks
    tasks = [
        agent_service.verify_claim_with_agent(node.text, context)
        for node in nodes_to_verify
    ]

    # Execute efficiently in parallel
    results = await asyncio.gather(*tasks)

    for node, result in zip(nodes_to_verify, results, strict=False):
        status_str = result.get("status", "needs_review").lower()
        reason = result.get("reason", "")
        quote = result.get("quote", None)
        source_url = result.get("source_url", None)

        try:
            node.verification_status = VerificationStatus(status_str)
        except ValueError:
            # Fallback to NEEDS_REVIEW if model returns something unexpected
            node.verification_status = VerificationStatus.NEEDS_REVIEW

        node.verification_reason = reason
        node.verification_quote = quote
        node.source_url = source_url
        print(
            f"    - Verified '{node.id}': {node.verification_status} "
            f"(Source: {source_url})"
        )

    # Update the store with the fully verified graph
    if graph.root_claim_id:
        GRAPH_STORE[graph.root_claim_id] = graph
    print(f"--> [Auditor] Verification complete for graph {graph.root_claim_id}")


@app.get("/")
async def root():
    return {"message": "TraceGraph API is running"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    service: Annotated[MistralService, Depends(get_mistral_service)],
    agent_service: Annotated[AgentService, Depends(get_agent_service)],
):
    """Analyze a text blob and return a logic graph."""
    print(
        f"--> [Analyze] Starting analysis for text ({len(request.text_blob)} chars)..."
    )
    try:
        response = await service.analyze_text(request.text_blob)

        # Store initial graph state
        if response.graph_structure.root_claim_id:
            # Use root_claim_id as the key for simplicity in MVP
            GRAPH_STORE[response.graph_structure.root_claim_id] = (
                response.graph_structure
            )

        # Schedule background verification
        background_tasks.add_task(
            process_verification_tasks,
            response.graph_structure,
            agent_service,
            request.text_blob,
        )

        return response
    except TraceGraphError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal error occurred") from e


@app.get("/graph/{graph_id}", response_model=GraphStructure)
async def get_graph(graph_id: str):
    """Poll for the latest graph state including verification statuses."""
    if graph_id not in GRAPH_STORE:
        raise HTTPException(status_code=404, detail="Graph not found")
    return GRAPH_STORE[graph_id]
