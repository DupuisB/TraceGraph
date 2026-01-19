<div align="center">
  <h1>TraceGraph 🕸️</h1>
  <h3><i>Graph Argument Decomposition Engine</i></h3>

  <p>
    <a href="https://oyster-app-a6yld.ondigitalocean.app">
      <img src="https://img.shields.io/badge/LIVE_DEMO-Click_Here-success?style=for-the-badge&logo=vercel" alt="Live Demo" />
    </a>
  </p>
  
  <p>
    <i>⚠️ Note: The live demo runs on limited Mistral API credits. If it fails, the quota may be exhausted.</i>
  </p>

  <div>
    <img src="https://img.shields.io/badge/Status-MVP-blue" alt="Status" />
    <img src="https://img.shields.io/badge/Tech-Mistral_Large_%7C_React_Flow-F59E0B" alt="Stack" />
    <img src="https://img.shields.io/badge/Domain-Argument_Analysis-slate" alt="Focus" />
  </div>

  <br />

  <img src="./media/demo.gif" alt="TraceGraph Demo" width="100%" />
</div>

> **Disclaimer:** This project is currently a WIP, more features are coming. (see [Limitations](#limitations) for more details)

---

## 1. Solving "Linear Obfuscation"

**The Problem:** LLMs excel at generating fluid prose, but this fluency acts as a "smooth veneer" that hides logical fallacies. For high-stakes domains (Legal, Audit, Forensic Analysis), a linear chat interface is insufficient. It is impossible to verify a 10-page argument when it is presented as a single stream of text. We call this **"Linear Obfuscation."**

**The Solution:** **TraceGraph** is an *Argument-as-a-Graph (AaaG)* engine. It leverages LLMs to break down arguments into atomic units (nodes) and dependency relationships (edges). This transformation exposes the topology of an argument, making it auditable, verifiable, and structurally rigorous.

> **What this product is:** As of the current iteration, this products acts as a **reasoning help**. An example use case would be to paste an argumentative text (editorial, press release, etc.) and see it broken down into atomic claims. The tool will then attempt to verify the claims individually, and will connect the ones that condradict and support each other. This allows users to better understand the logic of an argument. Note that the tool **does not decide what is true or false**, but rather **presents the evidence for and against** each claim present in the text.

---

## 2. System Architecture

I employ a **"Split-Brain" Architecture** to optimize for both structural integrity and verification speed.

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

## 3.  Key technical choices

### Agentic Verification
Standard RAG systems are limited by their embedding retrieval window. I solve the **"Stale Knowledge"** problem by integrating the **Mistral Agents API** with native `web_search`.
*   **The Workflow:** When the *Claim Router* detects a factual assertion (e.g., "France's GDP increased in 2025"), it dispatches an autonomous agent to perform live research.
*   **The Result:** Users see **"Web Enhanced"** cards with clickable citations, ensuring the graph is grounded in current reality, not just training data.

### Cognitive Bias Design
I did not keep a typical "Fact Checkers." Research shows that binary "True/False" labels on uncertain claims often fail.
*   **The Backfire Effect:** Citing *DeVerna et al. (2024)*, we know that labeling ambiguous claims as "Uncertain" paradoxically *increases* belief in misinformation.
*   **My Decision:** I removed all "Warning/Uncertain" badges. Instead, ambiguous nodes default to a neutral, clinical **"Needs Human Review"** state. This lowers cognitive defense mechanisms and encourages the user to engage with the evidence.

### Cost-Latency
A key constraint in GenAI products is the "Intelligence-Cost Tradeoff."
*   **Architect:** I use **Mistral Large** only once per session (for graph construction), where high reasoning capability is non-negotiable.
*   **Auditors:** I use **Mistral Small** for parallelized internal consistency checks. This reduces verification costs, while maintaining high throughput via `asyncio` parallelization.

---

## 4. Limitations

-   **Web Search:** If web search is not enabled, **it considers the raw text as a source of truth** when it comes to factual claims. This is how the tool is supposed to work, but it is important to be aware of this limitation.
-   **Verifier:** The verifier agent, as currently implemented, verifies the claims one by one. It does not consider the connected argument, and only checks the claim in isolation.
> The **Verifier** issue means that the tool **does not decide what is true or false**, but rather **presents the evidence for and against** each claim present in the text. One claim may be supported by one source, but contradicted by another.

---

## 5. Installation & Setup

### Prerequisites
*   **Python 3.12+** (using `uv`)
*   **Node.js 20+**
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

## Citations

1.  **DeVerna, M. R., et al. (2024).** *"Fact-checking information from large language models can decrease headline discernment."* Frontiers in Artificial Intelligence.
    *   *Application:* Informed the removal of "Uncertain" UI badges to mitigate the Backfire Effect.
2.  **Pan, Y., et al. (2024).** *"The perils and promises of generative AI for fact-checking."*
    *   *Application:* Informed the "Quote Extraction" requirement in our Auditor prompt to prevent hallucinated explanations.
3.  **Zhang, Y., et al. (2024).** *"Generative LLMs in automated fact-checking: A survey."*
    *   *Application:* Validated the architectural shift from Closed-Context verification to Agentic RAG for open-domain claims.