# Mistral TraceGraph 🕸️

### *Deconstructing LLM Reasoning into Verifiable Logic Topologies*

![Demo Placeholder](https://placehold.co/800x400?text=TraceGraph+Demo:+Logic+Auditing+in+Action)

---

## 1. The Product Thesis: Solving "Linear Obfuscation"

**The Problem:** Large Language Models excel at generating fluid prose, but this fluency acts as a "smooth veneer" that hides logical fallacies. For high-stakes domains (Legal, Audit, Forensic Analysis), a linear chat interface is insufficient. It is impossible to verify a 10-page argument when it is presented as a single stream of text. We call this **"Linear Obfuscation."**

**The Solution:** **Mistral TraceGraph** is an *Argument-as-a-Graph (AaaG)* engine. It forces the LLM to break its own reasoning into atomic units (nodes) and dependency relationships (edges). This transformation exposes the topology of the argument, making it auditable, verifiable, and structurally rigorous.

> **Why Mistral?** We chose the Mistral ecosystem for its unique "Model Specialization" capabilities—using **Mistral Large** for high-fidelity architectural reasoning and **Mistral Agents** for autonomous research.

---

## 2. System Architecture

We employ a **"Split-Brain" Architecture** to optimize for both structural integrity and verification speed.

```mermaid
graph TD
    User([User Input]) -->|POST /analyze| API[FastAPI Backend]

    subgraph "Phase A: The Architect (Structural Integrity)"
        API -->|Strict JSON Schema| Large[Mistral Large]
        Large -->|DAG Topolgy| API
    end

    API -->|Render Graph| UI[React Flow Frontend]

    subgraph "Phase B: The Auditor (Agentic Verification)"
        API -->|Async Dispatch| Router{Claim Router}
        
        Router -->|Internal Logic| Small[Mistral Small]
        Small -->|Consistency Check| DB[(Graph Store)]
        
        Router -->|External Fact| Agent[Mistral Agent]
        Agent -- Native Web Search --> Web((Internet))
        Web -->|Citations| Agent
        Agent -->|Grounded Verdict| DB
    end

    DB -.->|Real-time Polling| UI
    
    style Large fill:#6366f1,stroke:#fff,color:#fff
    style Agent fill:#ec4899,stroke:#fff,color:#fff
    style Small fill:#10b981,stroke:#fff,color:#fff
```

---

## 3. The Mistral Advantage: Key Features

### 🧠 Agentic Verification (The "Agentic RAG" Shift)
Standard RAG systems are limited by their embedding retrieval window. We solve the **"Stale Knowledge"** problem by integrating the **Mistral Agents API** with native `web_search`.
*   **The Workflow:** When the *Claim Router* detects a factual assertion (e.g., "France's GDP increased in 2025"), it dispatches an autonomous agent to perform live research.
*   **The Result:** Users see **"Web Enhanced"** cards with clickable citations, ensuring the graph is grounded in current reality, not just training data.

### 🛡️ Psychological Safety & Cognitive Bias Design
We do not build typical "Fact Checkers." Research shows that binary "True/False" labels on uncertain claims often fail.
*   **The Backfire Effect:** Citing *DeVerna et al. (2024)*, we know that labeling ambiguous claims as "Uncertain" paradoxically *increases* belief in misinformation.
*   **Our PM Decision:** We removed all "Warning/Uncertain" badges. Instead, ambiguous nodes default to a neutral, clinical **"Needs Human Review"** state. This lowers cognitive defense mechanisms and encourages the user to engage with the evidence.

### ⚡ Cost-Latency Orchestration
A key constraint in GenAI products is the "Intelligence-Cost Tradeoff."
*   **Architect:** We use **Mistral Large** only once per session (for graph construction), where high reasoning capability is non-negotiable.
*   **Auditors:** We use **Mistral Small** for parallelized internal consistency checks. This reduces verification costs by ~60% compared to a monolithic model approach, while maintaining high throughput via `asyncio` parallelization.

---

## 4. Installation & Setup

### Prerequisites
*   **Python 3.12+** (Managed by `uv` for speed)
*   **Node.js 20+** (LTS)
*   **Mistral API Key** (Required for Agents & Models)

### Quick Start

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/DupuisB/TraceGraph.git
    cd TraceGraph
    ```

2.  **Initialize Backend**
    ```bash
    cd backend
    uv sync
    echo 'MISTRAL_API_KEY="your-mistral-key"' > .env
    ```

3.  **Initialize Frontend**
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Run the System**
    *   Backend: `uv run fastapi dev backend/main.py`
    *   Frontend: `npm run dev`

Access the dashboard at `http://localhost:5173`.

---

## 5. Research & Academic Grounding

This product is not just an engineering exercise; it is an implementation of specific safety research:

1.  **DeVerna, M. R., et al. (2024).** *"Fact-checking information from large language models can decrease headline discernment."* Frontiers in Artificial Intelligence.
    *   *Application:* Informed the removal of "Uncertain" UI badges to mitigate the Backfire Effect.
2.  **Pan, Y., et al. (2024).** *"The perils and promises of generative AI for fact-checking."*
    *   *Application:* Informed the "Quote Extraction" requirement in our Auditor prompt to prevent hallucinated explanations.
3.  **Zhang, Y., et al. (2024).** *"Generative LLMs in automated fact-checking: A survey."*
    *   *Application:* Validated the architectural shift from Closed-Context verification to Agentic RAG for open-domain claims.