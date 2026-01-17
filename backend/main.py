from typing import Annotated

from dotenv import find_dotenv, load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.exceptions import TraceGraphError
from app.schemas.graph import AnalysisRequest, AnalysisResponse
from app.services.mistral_service import MistralService

load_dotenv(find_dotenv())

app = FastAPI(title="TraceGraph API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For MVP, allowing all. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_mistral_service() -> MistralService:
    return MistralService()


@app.get("/")
async def root():
    return {"message": "TraceGraph API is running"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    request: AnalysisRequest,
    service: Annotated[MistralService, Depends(get_mistral_service)],
):
    """Analyze a text blob and return a logic graph."""
    try:
        return await service.analyze_text(request.text_blob)
    except TraceGraphError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal error occurred") from e
