# TraceGraph Backend API

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