from typing import Literal

from pydantic import BaseModel, Field

WorkMode = Literal["remote", "hybrid", "onsite", "any"]


# ---------- API models (field names match the React frontend) ----------
class Profile(BaseModel):
    name: str = ""
    headline: str = ""
    summary: str = ""
    skills: list[str] = Field(default_factory=list)
    years: float | None = None
    locations: list[str] = Field(default_factory=list)
    workMode: WorkMode = "any"
    targetRoles: list[str] = Field(default_factory=list)
    notes: str = ""


class Msg(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    profile: Profile
    messages: list[Msg] = Field(min_length=1, max_length=40)
    resume_id: str | None = None


class MatchRequest(BaseModel):
    profile: Profile
    limit: int = Field(10, ge=1, le=20)
    resume_id: str | None = None


# ---------- Models the LLM must return ----------
class ExtractedProfile(BaseModel):
    name: str = ""
    headline: str = ""
    summary: str = ""
    skills: list[str] = Field(default_factory=list)
    years: float = -1
    locations: list[str] = Field(default_factory=list)
    workMode: WorkMode = "any"
    targetRoles: list[str] = Field(default_factory=list)
    greeting: str = ""


class ProfileUpdate(BaseModel):
    reply: str
    skills: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    workMode: WorkMode = "any"
    targetRoles: list[str] = Field(default_factory=list)
    notes: str = ""


class ExplanationItem(BaseModel):
    id: str
    explanation: str


class Explanations(BaseModel):
    items: list[ExplanationItem]


class JobIn(BaseModel):
    title: str
    company: str
    location: str
    mode: Literal["remote", "hybrid", "onsite"]
    salary: str = ""
    skills: list[str]
    description: str
    apply_url: str = "#"


class GeneratedJobs(BaseModel):
    jobs: list[JobIn]


# ---------- JSON schemas for tool calling (kept flat for broad provider support) ----------
_S = {"type": "string"}
_MODE = {"type": "string", "enum": ["remote", "hybrid", "onsite", "any"]}


def _arr(item: dict) -> dict:
    return {"type": "array", "items": item}


def _obj(props: dict, required: list[str] | None = None) -> dict:
    return {"type": "object", "properties": props, "required": required or list(props)}


EXTRACT_PARAMS = _obj({
    "name": _S,
    "headline": {**_S, "description": "Current or target job title, max 8 words"},
    "summary": {**_S, "description": "Two factual sentences in third person"},
    "skills": _arr(_S),
    "years": {"type": "number", "description": "Total professional years, or -1 if unclear"},
    "locations": _arr(_S),
    "workMode": _MODE,
    "targetRoles": _arr(_S),
    "greeting": _S,
})

UPDATE_PARAMS = _obj({
    "reply": {**_S, "description": "1-3 friendly sentences for the user"},
    "skills": _arr(_S),
    "locations": _arr(_S),
    "workMode": _MODE,
    "targetRoles": _arr(_S),
    "notes": {**_S, "description": "Short sentence list of other preferences: salary, company size, deal-breakers"},
})

EXPLAIN_PARAMS = _obj({
    "items": _arr(_obj({"id": _S, "explanation": _S}))
})

GENERATE_PARAMS = _obj({
    "jobs": _arr(_obj({
        "title": _S, "company": _S, "location": _S,
        "mode": {"type": "string", "enum": ["remote", "hybrid", "onsite"]},
        "salary": _S, "skills": _arr(_S), "description": _S,
    }))
})
