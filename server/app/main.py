import logging
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from . import ai, matching
from .config import settings
from .db import count_jobs, pool
from .llm import LLMError
from .resume import extract_text
from .schemas import ChatRequest, MatchRequest

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("rolematch")


@asynccontextmanager
async def lifespan(_: FastAPI):
    pool.open()
    yield
    pool.close()


app = FastAPI(title="RoleMatch AI API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_methods=["*"], allow_headers=["*"])


# Errors always use {"detail": "<string>"} because the frontend displays it directly.
@app.exception_handler(LLMError)
async def llm_error(_: Request, exc: LLMError):
    return JSONResponse({"detail": str(exc)}, status_code=502)


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    where = ".".join(str(x) for x in first.get("loc", [])[1:])
    return JSONResponse({"detail": f"Invalid request: {where} {first.get('msg', '')}".strip()}, status_code=422)


# ---- tiny in-memory rate limiter (protects your free API quota on a public demo) ----
_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(request: Request):
    ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "?")).split(",")[0].strip()
    now, q = time.monotonic(), _hits[ip]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= settings.rate_limit_per_min:
        raise HTTPException(429, "Too many requests. Wait a minute and try again.")
    q.append(now)


api = APIRouter(prefix="/api", dependencies=[Depends(rate_limit)])


@api.post("/resume/parse")
async def parse_resume(request: Request):
    """Accepts multipart (field `file`) or JSON `{ "text": "..." }`."""
    if request.headers.get("content-type", "").startswith("multipart/form-data"):
        upload = (await request.form()).get("file")
        if upload is None or not hasattr(upload, "read"):
            raise HTTPException(422, "Attach a file or send the resume text.")
        text = extract_text(upload.filename, await upload.read())
    else:
        try:
            body = await request.json()
        except Exception:  # noqa: BLE001
            raise HTTPException(422, "Send JSON like {\"text\": \"...\"} or upload a file.")
        text = (body.get("text") or "").strip()[: settings.max_resume_chars]
        if len(text) < 50:
            raise HTTPException(422, "That's too short to read. Paste more of your resume.")

    profile, greeting = await run_in_threadpool(ai.extract_profile, text)
    if not profile.skills:
        raise HTTPException(422, "No skills found. Try pasting more of your resume.")
    return {"profile": profile.model_dump(), "resume_id": None, "greeting": greeting}


@api.post("/chat")
def chat(req: ChatRequest):
    reply, profile = ai.chat_turn(req.profile, [m.model_dump() for m in req.messages])
    return {"reply": reply, "profile": profile.model_dump()}


@api.post("/match")
def match(req: MatchRequest):
    return {"jobs": matching.rank(req.profile, req.limit)}


app.include_router(api)


@app.get("/health")
def health():
    return {"ok": True, "jobs": count_jobs()}
