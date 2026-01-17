# Mistral TraceGraph 🕸️

**TraceGraph** is an "Argument-as-a-Graph" (AaaG) visualization tool that transforms linear LLM outputs into verifiable, structured logic topologies. It turns complex reasoning chains into interactive Directed Acyclic Graphs (DAGs), enabling users to inspect, verify, and experiment with the logic behind the text.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-MVP-success)

## 🚀 Key Features

### Phase A: The Constructor 🏗️
*   **AI-Powered Extraction:** Uses **Mistral Large** to decompose text blobs (articles, legal contracts, debates) into atomic claims and evidence.
*   **Strict JSON Schema:** Enforces a rigid graph structure using Mistral's JSON mode for reliable rendering.
*   **Interactive Visualization:** Powered by **React Flow** and **ELK Layout engine** for automatic, hierarchical graph organization.

### Phase B: The Auditor 🕵️‍♂️
*   **Async Verification:** Once the graph is built, background tasks dispatch verification requests to **Mistral Small**.
*   **Live Status Updates:** Real-time visual feedback:
    *   🟢 **Verified:** AI confirms the claim is supported by the source.
    *   🔴 **Refuted:** AI detects a contradiction.
    *   🟡 **Uncertain:** Logic is ambiguous.

### Phase C: Interaction Layer 🎮
*   **Edit Nodes:** Click any node to modify its text directly in the UI.
*   **Smart Deletion:** Remove nodes and watch dependency propagation—orphan nodes are visually dimmed to preserve context.
*   **Sticky Selection:** Click to lock focus on a node for detailed analysis.

---

## 🛠️ Tech Stack

### Backend
*   **Python 3.12+** managed by `uv`.
*   **FastAPI**: High-performance async API.
*   **Mistral AI SDK**: Intelligence engine (`mistral-large-latest`, `mistral-small-latest`).
*   **Pytest**: Integration testing with mocked services.

### Frontend
*   **React 19** + **Vite**.
*   **React Flow**: Canvas-based graph rendering.
*   **elkjs**: Advanced graph layout algorithms.
*   **Tailwind CSS**: Glassmorphism styling and responsive design.
*   **Vitest**: Unit testing.

---

## ⚡ Getting Started

### Prerequisites
*   **Python**: Install `uv` (modern Python package manager).
*   **Node.js**: Install `npm`.
*   **Mistral API Key**: Get one from the [Mistral Console](https://console.mistral.ai/).

### Installation

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/DupuisB/TraceGraph.git
    cd TraceGraph
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    uv sync
    # Create .env file
    echo "MISTRAL_API_KEY=your_key_here" > .env
    ```

3.  **Setup Frontend**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the App

Run both servers in separate terminals:

**Backend (Port 8000)**
```bash
# From root
uv run fastapi dev backend/main.py
```

**Frontend (Port 5173)**
```bash
# From root
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to start using TraceGraph!

---

## 🧪 Testing & Quality

We enforce code quality via **pre-commit hooks** and **GitHub Actions**.

### Manually Running Tests
*   **Backend:** `uv run pytest`
*   **Frontend:** `cd frontend && npm test`
*   **Linting:** `uv run ruff check` (Backend) / `npm run lint` (Frontend)

---

## 🛣️ Roadmap

*   [x] **MVP:** Closed-context analysis (Paste Text -> Graph).
*   [ ] **V2:** RAG Integration (Verify against external docs).
*   [ ] **V2:** Comparison Mode (Mistral vs GPT logic diff maps).