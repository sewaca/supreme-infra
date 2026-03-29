from fastapi import APIRouter

router = APIRouter(tags=["status"])


@router.get("/status")
async def get_status():
    return {"status": "ok", "service": "core-messages"}
