import pytest
from fastapi.testclient import TestClient

import main as main_module
from app.schemas.graph import (
    AnalysisResponse,
    Edge,
    GraphStructure,
    Node,
    NodeType,
    RelationType,
)
from main import get_mistral_service


# --- Mock Service ---
class MockMistralService:
    async def analyze_text(self, text: str) -> AnalysisResponse:
        # Return a deterministic graph for testing
        return AnalysisResponse(
            graph_structure=GraphStructure(
                root_claim_id="mock-root-123",
                nodes=[
                    Node(
                        id="node-1",
                        type=NodeType.CLAIM,
                        text="This is a test claim.",
                        source_span="test claim",
                    ),
                    Node(
                        id="node-2",
                        type=NodeType.EVIDENCE,
                        text="Evidence supporting claim.",
                        source_span="evidence",
                    ),
                ],
                edges=[
                    Edge(source="node-2", target="node-1", type=RelationType.SUPPORTS)
                ],
            )
        )

    async def verify_claim(self, claim_text: str, context: str) -> dict:
        return {
            "status": "verified",
            "reason": "Mock verification reason",
            "quote": None,
        }


# --- Fixtures ---
@pytest.fixture(autouse=True)
def disable_web_search():
    """Disable web search for all tests to use mocked MistralService."""
    original_value = main_module.ENABLE_WEB_SEARCH
    main_module.ENABLE_WEB_SEARCH = False
    yield
    main_module.ENABLE_WEB_SEARCH = original_value


@pytest.fixture(name="client")
def client_fixture():
    """Create a TestClient for the FastAPI app."""
    # Clear any leftover state
    main_module.GRAPH_STORE.clear()
    return TestClient(main_module.app)


@pytest.fixture(name="mock_mistral")
def mock_mistral_fixture():
    """Override MistralService with mock."""
    mock_service = MockMistralService()
    main_module.app.dependency_overrides[get_mistral_service] = lambda: mock_service
    yield mock_service
    main_module.app.dependency_overrides = {}


# --- Tests ---


def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "TraceGraph API is running"}


def test_analyze_flow(client, mock_mistral):
    # 1. POST /analyze
    response = client.post("/analyze", json={"text_blob": "This is a test input text."})
    assert response.status_code == 200
    data = response.json()

    # Check structure
    graph = data["graph_structure"]
    assert graph["root_claim_id"] == "mock-root-123"
    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1


def test_get_graph_after_analysis(client, mock_mistral):
    # 1. Trigger analysis to populate store
    client.post("/analyze", json={"text_blob": "Poll test"})

    # 2. Poll for the known ID
    response = client.get("/graph/mock-root-123")
    assert response.status_code == 200
    graph = response.json()

    # Check basic integrity
    assert graph["root_claim_id"] == "mock-root-123"

    # Note: TestClient runs background tasks synchronously
    claim_node = next(n for n in graph["nodes"] if n["type"] == "claim")
    assert claim_node["verification_status"] == "verified"
    assert claim_node["verification_reason"] == "Mock verification reason"


def test_get_non_existent_graph(client):
    response = client.get("/graph/nothing-here")
    assert response.status_code == 404
