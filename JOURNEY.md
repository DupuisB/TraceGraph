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

**Next Steps:**
*   **RAG Integration:** Connect to a real vector DB.
*   **Comparison Mode:** Visualizing differences between models.
