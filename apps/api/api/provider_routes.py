"""Provider 状态路由"""

from fastapi import APIRouter
from providers.factory import get_provider_factory

router = APIRouter()


@router.get("/provider/status")
async def get_provider_status():
    """获取当前 Provider 状态"""
    factory = await get_provider_factory()
    return await factory.get_status()


@router.get("/provider/list")
async def list_providers():
    """列出所有可用的 Provider"""
    factory = await get_provider_factory()
    providers = []
    for name, provider in factory._providers.items():
        providers.append({
            "name": provider.get_name(),
            "key": name,
            "mode": provider.get_mode(),
            "is_active": provider == factory._active_provider,
        })
    return {"providers": providers}


@router.post("/provider/switch")
async def switch_provider(body: dict):
    """切换活跃 Provider

    Body: { "provider": "mock_meituan" | "mock_mcdonalds" | "mcdonalds_mcp" | "manual" }
    """
    provider_name = body.get("provider", "")
    factory = await get_provider_factory()
    provider = factory._providers.get(provider_name)

    if not provider:
        return {"success": False, "message": f"Provider '{provider_name}' not found. Available: {list(factory._providers.keys())}"}

    factory._active_provider = provider
    return {"success": True, "message": f"Switched to {provider.get_name()}", "active_provider": provider.get_name()}
