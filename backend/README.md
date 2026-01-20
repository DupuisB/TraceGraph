# TraceGraph Backend API 🛰️

The TraceGraph backend is a FastAPI-powered service that handles argument decomposition and parallel logic auditing using Mistral AI's flagship models.

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/` | **Root / Health Check**: Confirms the service is live. |
| **POST** | `/analyze` | **Trigger Analysis**: Accepts a text blob, builds a DAG with Mistral Large, and initiates async verification. |
| **GET** | `/graph/{graph_id}` | **Poll Graph State**: Retrieves updated verification statuses for a specific graph. |

## Documentation

When the server is running, you can access the interactive Swagger documentation and test the endpoints directly at:
- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

## Key Implementation Details

- **Orchestration**: Uses `Mistral Large` for structural decomposition (Architect) and `Mistral Small` / `Mistral Agents` for verification (Auditor).
- **Asynchrony**: Leverages `asyncio` and FastAPI `BackgroundTasks` for non-blocking verification loops.
- **Environment**: Managed via `uv` with strict Pydantic-based configuration.
