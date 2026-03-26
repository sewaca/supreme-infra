from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["status"])


@router.get("/status")
async def get_status():
    return {"status": "ok", "service": "core-schedule"}
