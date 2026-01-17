import pytest
from fastapi.testclient import TestClient

from app.schemas.graph import (
    AnalysisResponse,
    Edge,
    GraphStructure,
    Node,
    NodeType,
    RelationType,
)
from main import app, get_agent_service, get_mistral_service

client = TestClient(app)


# --- Mock Services ---
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
        return {"status": "verified", "reason": "Mock verification reason"}


class MockAgentService:
    async def verify_claim_with_agent(self, claim_text: str, context: str) -> dict:
        return {
            "status": "verified",
            "reason": "Mock agent verification",
            "quote": "Mock quote",
            "source_url": "http://mock-source.com",
        }


# --- Dependency Override Fixture ---
@pytest.fixture(name="mock_services")
def mock_services_fixture():
    mock_mistral = MockMistralService()
    mock_agent = MockAgentService()

    app.dependency_overrides[get_mistral_service] = lambda: mock_mistral
    app.dependency_overrides[get_agent_service] = lambda: mock_agent

    yield
    app.dependency_overrides = {}


# --- Tests ---


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "TraceGraph API is running"}


def test_analyze_flow(mock_services):
    # 1. POST /analyze
    response = client.post("/analyze", json={"text_blob": "This is a test input text."})
    assert response.status_code == 200
    data = response.json()

    # Check structure
    graph = data["graph_structure"]
    assert graph["root_claim_id"] == "mock-root-123"
    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1


def test_get_graph_after_analysis(mock_services):
    # 1. Trigger analysis to populate store
    client.post("/analyze", json={"text_blob": "Poll test"})

    # 2. Poll for the known ID
    response = client.get("/graph/mock-root-123")
    assert response.status_code == 200
    graph = response.json()

    # Check basic integrity
    assert graph["root_claim_id"] == "mock-root-123"

    # Note: In a real async test we might need to wait for background tasks,
    # but TestClient runs background tasks synchronously after the request completes!
    # So we can expect verification to have happened.

    claim_node = next(n for n in graph["nodes"] if n["type"] == "claim")
    assert claim_node["verification_status"] == "verified"
    assert claim_node["verification_reason"] == "Mock agent verification"
    assert claim_node["verification_quote"] == "Mock quote"
    assert claim_node["source_url"] == "http://mock-source.com"


def test_get_non_existent_graph():
    response = client.get("/graph/nothing-here")
    assert response.status_code == 404
