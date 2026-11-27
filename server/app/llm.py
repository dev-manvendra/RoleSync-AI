import json
import logging
import re

from openai import OpenAI
from pydantic import BaseModel

from .config import settings

log = logging.getLogger("rolematch.llm")

_chat = OpenAI(base_url=settings.llm_base_url, api_key=settings.llm_api_key or "missing", timeout=45, max_retries=2)
_embed = OpenAI(base_url=settings.embed_base_url, api_key=settings.embed_key or "missing", timeout=45, max_retries=2)


class LLMError(Exception):
    """Raised with a message that is safe to show to the user."""


def embed(texts: list[str]) -> list[list[float]]:
    out: list[list[float]] = []
    for i in range(0, len(texts), 32):
        batch = texts[i:i + 32]
        try:
            res = _embed.embeddings.create(model=settings.embed_model, input=batch, dimensions=settings.embed_dim)
        except Exception as e:  # noqa: BLE001
            log.exception("embedding failed")
            raise LLMError("The AI provider couldn't embed that text. Try again in a moment.") from e
        out.extend(d.embedding for d in sorted(res.data, key=lambda d: d.index))
    return out


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.M).strip()
    return json.loads(text)


def structured(system: str, messages: list[dict], name: str, description: str,
               parameters: dict, model_cls: type[BaseModel], temperature: float = 0.2):
    """Get reliable JSON out of the model.

    Primary path: forced tool call (function calling). Fallback: JSON mode with the
    schema in the prompt. Either way the result is validated by pydantic.
    """
    msgs = [{"role": "system", "content": system}, *messages]
    try:
        res = _chat.chat.completions.create(
            model=settings.llm_model, messages=msgs, temperature=temperature,
            tools=[{"type": "function", "function": {"name": name, "description": description, "parameters": parameters}}],
            tool_choice={"type": "function", "function": {"name": name}},
        )
        return model_cls.model_validate_json(res.choices[0].message.tool_calls[0].function.arguments)
    except Exception as first:  # noqa: BLE001
        log.warning("tool call failed (%s); retrying in JSON mode", first)

    try:
        msgs[0] = {"role": "system", "content": f"{system}\n\nReturn ONLY a JSON object matching this JSON schema:\n{json.dumps(parameters)}"}
        res = _chat.chat.completions.create(
            model=settings.llm_model, messages=msgs, temperature=temperature,
            response_format={"type": "json_object"},
        )
        return model_cls.model_validate(_parse_json(res.choices[0].message.content or ""))
    except Exception as e:  # noqa: BLE001
        log.exception("structured output failed")
        raise LLMError("The AI provider didn't respond properly. Try again in a moment.") from e
