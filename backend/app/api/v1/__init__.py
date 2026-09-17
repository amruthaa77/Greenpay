from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.admin import router as admin_router
from app.api.v1.rewards import router as rewards_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Citizens"])
api_router.include_router(admin_router, prefix="/admin", tags=["Municipal Operations"])
api_router.include_router(rewards_router, prefix="/rewards", tags=["Green Points Rewards"])
