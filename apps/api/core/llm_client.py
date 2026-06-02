import json
import logging
from openai import AsyncOpenAI
from core.config import get_settings

logger = logging.getLogger(__name__)


def _get_client() -> AsyncOpenAI | None:
    settings = get_settings()
    if not settings.CF_AIG_TOKEN:
        logger.warning("CF_AIG_TOKEN not set, LLM calls will return fallback")
        return None
    return AsyncOpenAI(
        api_key=settings.CF_AIG_TOKEN,
        base_url=settings.CF_AIG_BASE_URL,
    )


async def generate_json(system_prompt: str, user_prompt: str, schema_hint: dict | None = None) -> dict:
    """Call LLM and parse JSON response. Returns fallback on failure."""
    client = _get_client()
    if client is None:
        return {"error": "LLM not configured", "fallback": True}

    settings = get_settings()
    try:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        if schema_hint:
            messages[0]["content"] += f"\n\nRespond with valid JSON matching this schema:\n{json.dumps(schema_hint)}"

        response = await client.chat.completions.create(
            model=settings.GEMMA_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=2048,
        )
        text = response.choices[0].message.content or "{}"
        # Try to extract JSON from markdown code blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"LLM generate_json failed: {e}")
        return {"error": str(e), "fallback": True}


async def generate_text(system_prompt: str, user_prompt: str) -> str:
    """Call LLM and return plain text. Returns fallback on failure."""
    client = _get_client()
    if client is None:
        return "[LLM not configured]"

    settings = get_settings()
    try:
        response = await client.chat.completions.create(
            model=settings.GEMMA_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.5,
            max_tokens=1024,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"LLM generate_text failed: {e}")
        return f"[LLM error: {e}]"
