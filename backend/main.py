import asyncio
import os
from typing import Annotated

from dotenv import find_dotenv, load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.exceptions import TraceGraphError
from app.schemas.graph import (
    AnalysisRequest,
    AnalysisResponse,
    GraphStructure,
)
from app.services.mistral_service import MistralService

# V2: Import orchestrator and agent service
from app.services.verification_orchestrator import VerificationOrchestrator

load_dotenv(find_dotenv())

app = FastAPI(title="TraceGraph API")

# Feature flag for web search (V2)
ENABLE_WEB_SEARCH = os.getenv("ENABLE_WEB_SEARCH", "false").lower() == "true"

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


def get_orchestrator(
    mistral_service: MistralService,
    enable_web_search: bool | None = None,
) -> VerificationOrchestrator:
    """Create orchestrator with optional web search.

    Args:
        mistral_service: The MistralService instance.
        enable_web_search: Override for web search. None = use env default.
    """
    # Use request override if provided, else fall back to env var
    web_search_enabled = (
        enable_web_search if enable_web_search is not None else ENABLE_WEB_SEARCH
    )

    agent_service = None
    if web_search_enabled:
        from app.services.agent_service import AgentService

        agent_service = AgentService()

    return VerificationOrchestrator(
        mistral_service=mistral_service,
        agent_service=agent_service,
        enable_web_search=web_search_enabled,
    )


async def process_verification_tasks(
    graph: GraphStructure,
    orchestrator: VerificationOrchestrator,
    context: str,
):
    """Background task to verify all claims in the graph in parallel."""
    print(f"--> [Auditor] Starting verification ({len(graph.nodes)} nodes)...")
    print(f"    Web Search Enabled: {ENABLE_WEB_SEARCH}")

    # Verify claims AND evidence/axioms that may contain verifiable facts
    # The ClaimRouter will determine if each needs web search or logic check
    verifiable = [
        node for node in graph.nodes if node.type in ("claim", "evidence", "axiom")
    ]

    # Verify all nodes in parallel using orchestrator
    tasks = [orchestrator.verify_claim(node, context) for node in verifiable]
    await asyncio.gather(*tasks)

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

        # Schedule background verification (V2: use orchestrator)
        orchestrator = get_orchestrator(service, request.enable_web_search)
        background_tasks.add_task(
            process_verification_tasks,
            response.graph_structure,
            orchestrator,
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
