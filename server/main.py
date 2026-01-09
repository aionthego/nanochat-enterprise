import os 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import router
from .config import settings

app = FastAPI(title="NanoChat Enterprise Controller")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def health_check():
    return {
        "status": "ok", 
        "base_dir": settings.NANOCHAT_BASE_DIR,
        "nproc": settings.NPROC_PER_NODE
    }
