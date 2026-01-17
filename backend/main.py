from fastapi import FastAPI

app = FastAPI(title="TraceGraph API")


@app.get("/")
async def root():
    return {"message": "TraceGraph API is running"}
