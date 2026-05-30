"""Profile routes — 档案管理"""

import json
from pathlib import Path
from fastapi import APIRouter
from models.user_profile import UserProfile
from models.quick_profile import QuickProfile

router = APIRouter()

_DATA_DIR = Path(__file__).parent.parent / "data"

# 内存存储（Phase 2: SQLite）
_user_profiles: dict[str, UserProfile] = {}


def _load_demo_profile() -> UserProfile:
    """从 JSON 加载 demo 用户"""
    path = _DATA_DIR / "demo_user.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        return UserProfile(**data)


@router.get("/demo/profile", response_model=UserProfile)
async def get_demo_profile():
    """加载 demo 用户档案"""
    if "demo-user" not in _user_profiles:
        _user_profiles["demo-user"] = _load_demo_profile()
    return _user_profiles["demo-user"]


@router.get("/profile", response_model=UserProfile)
async def get_profile(user_id: str = "demo-user"):
    """获取用户档案"""
    if user_id not in _user_profiles:
        _user_profiles[user_id] = _load_demo_profile()
    return _user_profiles[user_id]


@router.post("/profile", response_model=UserProfile)
async def save_profile(profile: UserProfile):
    """保存用户档案"""
    profile.onboarding_complete = True
    _user_profiles[profile.user_id] = profile
    return profile


@router.post("/profile/reset")
async def reset_profile(body: dict):
    """重置用户档案"""
    user_id = body.get("user_id", "demo-user")
    if user_id in _user_profiles:
        del _user_profiles[user_id]
    return {"success": True, "message": "档案已重置"}


@router.post("/profile/quick", response_model=QuickProfile)
async def save_quick_profile(quick: QuickProfile):
    """保存快速模式档案（不持久化，仅返回）"""
    return quick
