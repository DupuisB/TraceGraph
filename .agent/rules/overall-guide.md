## Project: Mistral TraceGraph

### System Overview
- **Core Concept**: Argument-as-a-Graph (AaaG) visualization.
- **Stack**: 
    - **Backend**: Python (FastAPI), Mistral SDK.
    - **Frontend**: React, React Flow, Vite.
    - **Manager**: `uv` (Python), `npm` (Node).

### Build & Run Commands
- **Install Init**: `uv sync` (Backend), `npm install` (Frontend).
- **Dev Server**:
    - Backend: `uv run fastapi dev backend/main.py`
    - Frontend: `npm run dev` (in `frontend/`)
- **Testing**:
    - Backend: `uv run pytest`
    - Frontend: `npm test` (Vitest)
- **Lint & Format**:
    - **Ruff**: `uv run ruff check --fix` (Lint), `uv run ruff format` (Format).
    - **Type Check**: `uv run pyright` (or `uv run ty check` if available).
    - **JS/TS**: `npm run lint` (ESLint).

### Coding Standards
- **Python**:
    - **Strict Typing**: No `Any`. Use `Optional`, `List`, `Dict` from `typing` or standard collections.
    - **Docstrings**: Google Style. Required for all public modules, classes, and functions.
    - **Error Handling**: Use custom exceptions defined in `backend/app/exceptions.py`.
    - **FastAPI**: Use Pydantic models for all Request/Response schemas.
- **React/Frontend**:
    - **Components**: Functional components with TypeScript interfaces for Props.
    - **State**: Use Context for global state (Graph Data), Hooks for local logic.
    - **Styling**: CSS Modules or Tailwind (if approved). Keep it "Glassmorphism" & Premium.
- **Git**:
    - **Commits**: Conventional Commits (e.g., `feat: add graph parsing`, `fix: node overlap`).

### Architecture Guidelines
- **Phase A (Constructor)**: 
    - Keep prompt logic isolated in `backend/app/prompts/`.
    - Enforce strict JSON validation before returning to frontend.
- **Phase B (Auditor)**:
    - Verifications must be **asynchronous** (BackgroundTasks).
    - Retain specific Error states for nodes (e.g., `verified`, `refuted`, `failed_check`).

### Development Workflow
1.  **Plan**: Check `task.md` and `MVP_ACTION_PLAN.md`.
2.  **Branch**: `feat/feature-name` or `fix/bug-name`.
3.  **Code**: Follow strict typing and linting rules.
4.  **Verify**: Run `uv run ruff check` and `uv run pytest` before committing.
5.  **Commit**: Use conventional commit messages. Ensure regular commits.
