# Mistral TraceGraph - Strategic Roadmap (V2: Mistral Native)

**Core Philosophy:** Move from "Chat" to "Agentic Reasoning."
**Tech Stack:** Mistral Large (Orchestrator) + Mistral Agents API (Research) + React Flow (Viz).

## Phase 1: The Foundation (Logic & Safety)

**Goal:** Build the "Closed Context" MVP that builds the graph and safely flags uncertainty.

### 1.1 Backend: Optimized Logic Engine

* **Parallel Verification:** Refactor `process_verification_tasks` to use `asyncio.gather`.
* *Metric:* Verify 10 nodes in <2 seconds.


* **Prompt Engineering (Grounding):**
* Update `auditor.py` to enforce **Quote Extraction**. The model must return `{"status": "verified", "quote": "exact sentence..."}`.
* *Docs:* [Mistral Prompting Capabilities](https://www.google.com/search?q=https://docs.mistral.ai/guides/prompting/)



### 1.2 Frontend: Psychological Safety

* **The "Needs Review" Update:**
* Remove "Uncertain" (Yellow) warnings. Replace with "Needs Review" (Neutral Blue/Grey) to prevent the *backfire effect*.
* Update Legend: "Needs Review = requires human judgment."



---

## Phase 2: The "Agentic" Shift (Replacing Tavily)

**Goal:** Solve "Stale Knowledge" using Mistral's native Web Search tool, effectively turning the app into an autonomous researcher.

### 2.1 Backend: The Agent Implementation

* **Action:** Create a dedicated **Auditor Agent** using the SDK.
* **Tool Configuration:** Enable the native `web_search` capability.
* **Implementation Spec:**
```python
# See Documentation: https://docs.mistral.ai/agents/tools/built-in/websearch/
agent = client.agents.create(
    model="mistral-large-latest",
    name="TraceGraph Auditor",
    instructions="You are a strict fact-checker. Use web_search to find recent data...",
    tools=[{"type": "web_search"}] # <--- Native Mistral Tool
)

```



### 2.2 The "Fact Oracle" Workflow

* **Router Logic:** Use a lightweight classifier (Mistral Small) to decide:
* *Is this logic?*  Use Internal Validator.
* *Is this a fact (e.g., "GDP 2024")?*  Call **Auditor Agent**.


* **Citation Handling:** Parse the `tool_calls` output from the Agent API to extract URLs and display them in the graph node.

---

## Phase 3: Advanced "Fractal" Reasoning

**Goal:** Allow users to "drill down" into complex claims.

### 3.1 Recursive Graphing

* **Interaction:** User double-clicks a "Claim Node".
* **Action:** Trigger a new `/analyze` job on *just that node's text*, effectively generating a sub-graph.
* **UI:** Display the sub-graph in a modal or side-panel.

---

## 📚 Essential Documentation & References

Use these official resources for the implementation:

1. **Agents API Overview:**
* *Docs:* [Mistral Agents & Tools](https://www.google.com/search?q=https://docs.mistral.ai/agents/introduction/)
* *Why:* Understanding how `agent_id` works vs standard model calls.


2. **Native Web Search Tool:**
* *Docs:* [Built-in Web Search Connector](https://www.google.com/url?sa=E&source=gmail&q=https://docs.mistral.ai/agents/tools/built-in/websearch/)
* *Why:* Critical for configuring the `tools=[{"type": "web_search"}]` parameter correctly.


3. **Mistral Python SDK:**
* *Repo:* [mistralai/client-python](https://github.com/mistralai/client-python)
* *Why:* Copy the async examples for `client.agents.complete_async`.



### Why this roadmap works for the application:

1. **It's "Product" Heavy:** You aren't just coding; you are leveraging platform features (Agents) to reduce technical debt.
2. **It's Research-Backed:** You cite DeVerna et al. for the UI changes.
3. **It's Enterprise-Ready:** You use the secure, native Web Search rather than a "hacky" third-party scraper.
