# Mistral TraceGraph - MVP Action Plan

This document outlines the detailed steps required to build the Mistral TraceGraph MVP (Version 1.0), based on `PVD.md`.

## Phase 0: Infrastructure & Setup
**Goal:** Establish a robust foundation for the application.

1.  **Repository Structure**
    *   Initialize Git repository (done).
    *   Create `backend/` (FastAPI) and `frontend/` (React) directories.
    *   Setup `pre-commit` hooks:
        *   **Python:** `ruff` (Linting/Formatting) and `pyright` (Type Checking).
        *   **JS/TS:** `ESLint` + `Prettier`.
    *   *Metric:* Clean lint and type check run on CI.

2.  **Environment Management**
    *   **Python:** `uv` (Strictly).
    *   **Node:** `npm` (Strictly).
    *   Configuration: `.env` file template for API keys (MISTRAL_API_KEY).

## Phase A: The Constructor (Graph Generation)
**Goal:** Transform text into a valid DAG using Mistral Large.

### Backend (Python/FastAPI)
1.  **Mistral Client Integration**
    *   Implement async client using `mistralai` SDK.
    *   Create Pydantic models for the Graph Schema (`Node`, `Edge`, `Graph`).
    *   *Test:* Unit test validating the schema against example JSONs.

2.  **Graph Extraction Logic**
    *   Implement the "Architect" prompt for `mistral-large-latest`.
    *   Enforce JSON mode and Validation (retry logic if JSON is malformed).
    *   *Metric:* **Structure Accuracy** (>95% of responses parse as valid DAGs).
    *   *Test:* Integration test with sample articles; simple acyclic check.

3.  **API Endpoint: `/analyze`**
    *   POST endpoint accepting `text_blob`.
    *   Returns the generated Graph JSON.

### Frontend (React)
1.  **React Flow Setup**
    *   Initialize React app with `reactflow`.
    *   Create custom Node components (`ClaimNode`, `EvidenceNode`).
    *   Create custom Edge components (types: `supports`, `refutes`).

2.  **Input Interface**
    *   Text area for user input (supporting 32k tokens).
    *   Submit button triggering the `/analyze` endpoint.

3.  **Graph Visualization**
    *   Render the fetched graph.
    *   Implement auto-layout (dagre or elkjs) to ensure readability.
    *   *Metric:* **Time to First Node (TTFN)** < 3s (Client-side measurement).
    *   *Test:* E2E test (Cypress/Playwright): Paste text -> Wait -> Verify Nodes appear.

## Phase B: The Auditor (Async Verification)
**Goal:** Verify claims asynchronously using Mistral Small.

### Backend
1.  **Verification Logic**
    *   Implement "Auditor" prompt for `mistral-small-latest`.
    *   Function: `verify_claim(claim_text, source_text) -> (status, confidence)`.
    *   *Metric:* **Cost Efficiency** (<$0.05/1k tokens). Monitor token usage logs.

2.  **Async Task Queue**
    *   Use FastAPI `BackgroundTasks` (for MVP) or a lightweight queue.
    *   Dispatch verification jobs for each "Claim" node upon graph creation.

3.  **Status Endpoint / WebSocket**
    *   Implement logic to push updates: `node_id: verified | disputed`.
    *   API: `GET /graph/{id}/status` polling or WebSocket connection.

### Frontend
1.  **Live Status Updates**
    *   Poll status endpoint or listen to socket.
    *   Update Node UI colors: Grey (Pending) -> Green (Verified) / Red (Fallacy).
    *   *Test:* Mock backend delay; verify UI transitions from Loading to Result state.

## Phase C: The Interaction Layer
**Goal:** Enable user experimentation with the logic graph.

1.  **Node Operations**
    *   Implement "Delete Node" action in React Flow.
    *   Implement "Edit Node Text" (optional for MVP, good for refinement).

2.  **Dependency Propagation**
    *   **Frontend Logic:** If Node A is deleted, find all children `C` where `A -> C`.
    *   Visually dim or flag dependent nodes.
    *   *Test:* Unit test on graph data structure: Delete Root -> Verify Children are marked.

## Testing & CI/CD Strategy
-   **Backend:** `pytest` (Unit), `httpx` (Integration).
-   **Frontend:** `Vitest` (Unit), `Playwright` (E2E).
-   **CI:** generic GitHub Actions workflow running tests on PR.
