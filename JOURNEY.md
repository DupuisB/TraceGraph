# TraceGraph Development Journey: From Concept to Portfolio MVP

**Date:** Jan 17, 2026
**Project:** Mistral TraceGraph
**Stack:** Python (FastAPI, Mistral SDK), TypeScript (React, React Flow, Vite)

---

## 1. Effectuation: The "Blank Slate" Problem
We started with a high-level goal: **"Transform linear LLM text into a verifiable logic graph."**
The initial challenge was defining *what* this actually meant in terms of engineering. We didn't want just another chatbot.

### Key Decisions
*   **The "PVD" (Product Vision Document):** We established a formal PVD immediately to align on the "Forensic Analyst" persona. This prevented scope creep (e.g., "Add chat features!") and kept us focused on *verification*.
*   **Split-Brain Architecture:** We decided early to use **Mistral Large** for structure (Process A) and **Mistral Small** for verification (Process B). This was a crucial economic decision—using Large for everything would be too slow/expensive; using Small for structure would yield broken JSON.

---

## 2. Phase 0: The Infrastructure & "Strictness"
We chose to be strict from line 1.
*   **`uv` over `pip`:** Verification speeds were instant.
*   **Strict Typing:** We enforced `mypy`/`pyright` on Python and `tsc` on TypeScript.
    *   *Why?* AI-generated code often drifts. Strict typing acted as our guardrail.
*   **Pre-commit Hooks:** We set up `ruff` and `eslint` immediately. This paid off later when we added CI/CD, as the code was already clean.

---

## 3. Phase A: The Constructor (Taming the LLM)
**Challenge:** How to force an LLM to output a graph that doesn't crash the frontend?
**Failure Mode:** Early prompts resulted in markdown chatter ("Here is your graph...") which broke `json.loads`.

### The Solution
1.  **Strict JSON Mode:** We forced `response_format={"type": "json_object"}`.
2.  **The "Architect" Prompt:** We didn't just ask for a graph; we defined a rigorous schema (Nodes, Edges, IDs).
3.  **Visualization:** We chose **React Flow**.
    *   *Problem:* React Flow's default layout (Dagre) is often messy for complex logic chains.
    *   *Fix:* We integrated **ELK (Eclipse Layout Kernel)**. This was a "Step Up" moment—moving from a toy graph to a professional orthogonal layout.

---

## 4. Phase B: The Auditor (Performance Bottlenecks)
**Challenge:** Verification takes time. If a text has 20 claims, verifying them sequentially takes ~30 seconds. The UI felt "dead."

### Evolution
1.  **Async Polling (MVP):** We implemented `BackgroundTasks` in FastAPI. The user got the graph immediately (fast TTFN), and nodes turned Green/Red over time.
2.  **The "Expert Review" Optimization:**
    *   *Critique:* `await service.verify_claim` inside a loop is blocking.
    *   *Fix:* We refactored to `asyncio.gather(*tasks)`. This reduced verification time from *linear* ($O(N)$) to *constant-ish* ($O(1)$ + network overhead), checking all claims in parallel. A massive performance win.

---

## 5. Phase C: The Interaction Layer (Making it "Alive")
A static graph is just a picture. We wanted a *tool*.
*   **Adopting "Glassmorphism":** We moved away from standard UI libraries to custom Tailwind backdrops. It differentiates the app visually.
*   **Logic Propagation:** We implemented "Smart Deletion."
    *   *Detail:* When deleting a parent node, we didn't just delete the children; we marked them as "orphans" (dimmed). This respects the user's mental model of dependency.
*   **Sticky Selection:** Originally, hover cards flickered. We added a "Click-to-Stick" state, allowing users to deeply inspect nodes without losing context.

---

## 6. Fortification: CI/CD & Testing
We didn't just ship the code; we ensured it stays shipped.
*   **Mocking the Wallet:** We realized running `pytest` shouldn't cost money. We created a `MockMistralService` that returns deterministic JSONs.
*   **GitHub Actions:** We built a pipeline that runs Backend (Test/Lint) and Frontend (Build/TypeCheck) in parallel.
*   **Frontend Types:** We caught 4-5 implicit `any` types in `App.tsx` during the final polish, proving the value of our strict `tsc` hook.

---

## 7. Final Reflections
We built more than an MVP. We built a **System**.
*   It's resilient (Robust Error Handling).
*   It's efficient (Parallel Async).
*   It's maintainable (Strict Typing & CI).

---

## 8. Validation: The Research Pivot
**"Building the right thing" vs. "Building the thing right."**
We paused to analyze three key papers (DeVerna et al. 2024, etc.).
*   **The "Backfire" Discovery:** We learned that "Uncertain" labels actually harm user trust.
*   **The Pivot:** We renamed the status to "Needs Human Review" and changed the UI from "Warning Yellow" to "Neutral Blue." We also forced the AI to quote its sources (`quote` field) to combat hallucinated explanations.
*   **Result:** A tool that is safer and scientifically grounded.

<details><summary> <h3> Detailed explanation:</h3></summary>

    This update refines the `TraceGraph` project from a generic fact-checker to a research-backed "Consistency Auditor" based on the following academic insights:

    * **Mitigating the "Backfire Effect"**: DeVerna et al. (2024) demonstrated that labeling information as "Uncertain" can paradoxically increase user belief in misinformation compared to no labeling at all. To mitigate this cognitive bias, the "Uncertain" label was removed and replaced with a neutral, action-oriented **"Needs Review"** directive.

    * **Grounding Hallucinations**: Pan et al. (2024) highlighted that while Generative AI can assist in fact-checking, it is prone to hallucinating explanations even when the verdict is correct. Addressing this, the backend `Auditor` prompt was restructured to enforce the extraction of **exact quotes** from the source text before a verdict is rendered, ensuring logic is grounded in evidence rather than the model's internal parameters.

    * **Architectural Validity**: Zhang et al. (2024) validated the efficacy of decomposing complex claims into atomic units (like a graph) but noted the limitations of LLMs regarding "stale knowledge" in open-domain checking. Consequently, the project scope was tightened to "Closed Context" consistency checking to align with current technical capabilities.

    **Summary of Code Changes**:
    Based on these findings, the `dernier_commit.txt` file implements a rewrite of the `Auditor` system prompt to mandate quote extraction (`auditor.py`), updates the `Node` schema to include a `verification_quote` field (`graph.py`), and redesigns the UI to replace warning colors with neutral administrative signals for ambiguous claims (`ClaimNode.tsx`).

    ---

    ### References

    DeVerna, M. R., Yan, H. Y., Pierri, F., Menczer, F., & Yang, K. (2024). Fact-checking information from large language models can decrease headline discernment. *arXiv preprint*.

    Pan, Y., et al. (2024). The perils and promises of generative AI for fact-checking. *Frontiers in Artificial Intelligence*, 7, 1341697.

    Zhang, Y., et al. (2024). Generative LLMs in automated fact-checking: A survey. *arXiv preprint arXiv:2407.02351*.
</details>
---

## 9. Phase 2: The Agentic Shift (V2)
**Goal:** Transition from a "Closed Context" validator to an "Open World" researcher.
**Strategy:** Leverage Mistral's **Agents API** and **Native Web Search**.

### The Challenge
*   The MVP cannot verify external facts (e.g., "Paris GDP in 2024").
*   LLMs suffer from "stale knowledge" (training data cutoff).

### The Architecture
We implemented a **3-Service Design**:
1.  **`AgentService`:** Creates a persistent Mistral Agent with `web_search` tool enabled.
2.  **`ClaimRouter`:** Classifies claims as "logic" vs "fact" using Mistral Small.
3.  **`VerificationOrchestrator`:** Unifies the routing logic—facts go to the Agent, logic stays internal.

### Feature Flag
```bash
ENABLE_WEB_SEARCH=true  # Activate V2 mode
```
When enabled, the system:
1.  Routes each claim through the classifier.
2.  If classified as "fact" (with >70% confidence), dispatches to the Web Agent.
3.  Parses citations from the response and displays them on the graph node.

### Frontend Updates
*   Added `Citation` model to schema.
*   `ClaimNode.tsx` now renders clickable source links when citations are present.

### Why Native Web Search?
*   **Cost:** Avoid Tavily/Serper API fees.
*   **Simplicity:** One SDK, one auth mechanism.
*   **Enterprise:** Mistral handles compliance and rate limits.
