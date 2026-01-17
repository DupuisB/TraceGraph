**Version:** 1.0 (MVP) | **Status:** Draft | **Owner:** Benjamin Dupuis | **Date:** 17 Jan 2026

## 1. Executive Summary

**Mistral TraceGraph** is an "Argument-as-a-Graph" (AaaG) visualization tool that transforms linear LLM outputs into verifiable, structured logic topologies.

**Problem:** Standard "Chat" interfaces suffer from linear obfuscation. Complex reasoning errors are hidden in fluid prose, making LLMs unsafe for high-stakes enterprise workflows (Legal, Audit, Financial Analysis).

**Solution:** A "Glass Box" interface where reasoning is decomposed into a Directed Acyclic Graph (DAG).

**Value Prop:** Moving Mistral from a "General Chatbot" to a "Logic Engine" for professional intelligence.

## 2. Strategic Alignment

**Why is this a "Mistral-First" Product?**

- **Showcase "Smart" vs. "Fast":** Demonstrates the specific utility of **Mistral Large** (Reasoning/Orchestration) vs. **Mistral Small** (High-throughput Verification).
- **Enterprise Focus:** Aligns with Mistral's roadmap of serving developers and businesses, rather than just consumer entertainment.
- **Native Capabilities:** Heavily utilizes Mistral's superior **JSON Mode** and **Function Calling** to enforce graph schemas.

## 3. User Personas

- **Primary: The Forensic Analyst.** Needs to dissect a competitor's press release or a legal contract to find weak logic or unverified claims.
- **Secondary: The Prompt Engineer.** Needs to visualize how the model is "thinking" to debug complex chain-of-thought prompts.

## 4. Functional Requirements (The MVP Scope)

*Scope Note: To ensure shipping speed, MVP 1.0 will focus on "Closed Context Analysis" (user pastes text) rather than external RAG.*

### Phase A: The Constructor (Graph Generation)

**User Story:** As a user, I want to paste a complex text (e.g., an article) and see it broken down into atomic claims.

- **Input:** Text Blob (max 32k tokens).
- **Model:** **Mistral Large**.
- **Prompt Strategy:** Single-shot "Architect" prompt with strict JSON schema enforcement.
- **Output:** A JSON object containing:
    - `nodes`: ID, Label (Claim/Evidence), Confidence_Score (0-1).
    - `edges`: Source, Target, Relation (Supports/Refutes/Causes).

### Phase B: The Auditor (Async Verification)

**User Story:** As a user, I want to see which parts of the argument are shaky without waiting for the whole graph to load.

- **Mechanism:** Asynchronous loops. Once the graph renders, the frontend dispatches verification requests for every "Claim" node.
- **Model:** **Mistral Small** (Low latency, low cost).
- **Task:** "Given the source text, does evidence exist for Node X? Rate logical consistency."
- **UI Feedback:** Nodes transition from `Grey (Unverified)` → `Green (Verified)` or `Red (Hallucination/Fallacy)`.

### Phase C: The Interaction Layer

**User Story:** As a user, I want to delete a premise to see how it affects the conclusion.

- **Feature:** **Live Dependency Propagation**.
- **Logic:** If Node A supports Node B, and user deletes Node A → Node B's opacity/confidence score visually drops.

## 5. Technical Specifications

### 5.1 System Architecture

- **Frontend:** React + React Flow (or D3.js).
- **Backend:** Python (FastAPI).
- **Orchestration:** Mistral Client (`mistralai` Python SDK).

### 5.2 The Data Contract (JSON Schema)

*Critical for the "Prompt Engineering" section of your application.*

```json
{
  "graph_structure": {
    "root_claim_id": "string",
    "nodes": [
      {
        "id": "string (uuid)",
        "type": "claim | evidence | axiom",
        "text": "string (concise)",
        "source_span": "string (quote from original text)"
      }
    ],
    "edges": [
      {
        "source": "node_id",
        "target": "node_id",
        "type": "supports | contradicts | entails",
        "weight": "float (0.0 - 1.0)"
      }
    ]
  }
}
```

### 5.3 API Strategy & Cost Control

- **Inference Call 1 (Construction):**
    - Model: `mistral-large-latest`
    - `temperature`: 0.2 (High determinism for structure).
    - `response_format`: `{"type": "json_object"}`.
- **Inference Call 2...N (Verification):**
    - Model: `mistral-small-latest`
    - `temperature`: 0.1.
    - **Batching:** Send verification requests in batches of 5 nodes to minimize HTTP overhead.

## 6. Success Metrics (KPIs)

- **Structure Accuracy:** % of generated graphs that are valid DAGs (no cycles, no orphaned nodes). *Goal: >95%*.
- **Latency Perception:** "Time to First Node" (TTFN). The graph should begin rendering within 3 seconds, even if verification takes longer.
- **Cost Efficiency:** Cost of analysis per 1k tokens. *Target: <$0.05 per document* (achieved by offloading verification to Mistral Small).

## 7. Future Roadmap (V2)

- **RAG Integration:** Connect to Pinecone to verify claims against a million-doc corpus (Open Context).
- **Comparison Mode:** Run the same prompt through Mistral vs. Llama vs. GPT-4 and visualize the "Shape of Thought" side-by-side.