import hashlib
import json
import logging

from . import ai
from .config import settings
from .db import search_jobs
from .llm import LLMError, embed
from .schemas import Profile
from .scoring import (fallback_explanation, final_score, location_fit, mode_fit,
                      semantic_score, skill_overlap)

log = logging.getLogger("rolematch.match")

_VEC_CACHE: dict[str, list[float]] = {}
_EXPL_CACHE: dict[str, str] = {}


def _sha(obj) -> str:
    return hashlib.sha1(json.dumps(obj, sort_keys=True).encode()).hexdigest()


def _content_document(p: Profile) -> str:
    """What the candidate IS (not what they prefer), so toggling work mode doesn't re-embed."""
    parts = [p.headline, p.summary]
    if p.targetRoles:
        parts.append("Target roles: " + ", ".join(p.targetRoles))
    if p.skills:
        parts.append("Skills: " + ", ".join(p.skills))
    if p.years is not None:
        parts.append(f"{p.years:g} years of experience")
    return ". ".join(x for x in parts if x)


def _profile_vector(p: Profile) -> list[float]:
    doc = _content_document(p)
    key = _sha(doc)
    if key not in _VEC_CACHE:
        if len(_VEC_CACHE) > 500:
            _VEC_CACHE.clear()
        _VEC_CACHE[key] = embed([doc or "software professional"])[0]
    return _VEC_CACHE[key]


def _expl_key(p: Profile, job_id: str) -> str:
    return _sha([p.summary, sorted(s.lower() for s in p.skills), p.workMode,
                 sorted(l.lower() for l in p.locations), p.notes, job_id])


def rank(profile: Profile, limit: int) -> list[dict]:
    rows = search_jobs(_profile_vector(profile), max(limit * 3, 30))

    scored = []
    for r in rows:
        matched, missing = skill_overlap(profile.skills, r["skills"])
        sem = semantic_score(float(r["similarity"]), settings.sim_floor, settings.sim_ceil)
        score = final_score(sem, len(matched), len(r["skills"]),
                            mode_fit(profile.workMode, r["mode"]),
                            location_fit(profile.locations, r["location"], r["mode"]))
        scored.append({**r, "id": str(r["id"]), "score": score,
                       "matched_skills": matched, "missing_skills": missing})
    scored.sort(key=lambda j: j["score"], reverse=True)
    top = scored[:limit]

    # One LLM call for every job we haven't explained for this profile yet.
    todo = [j for j in top if _expl_key(profile, j["id"]) not in _EXPL_CACHE]
    if todo:
        try:
            for jid, text in ai.explain(profile, todo).items():
                _EXPL_CACHE[_expl_key(profile, jid)] = text
        except LLMError:
            log.warning("explanations unavailable; using templates")
        if len(_EXPL_CACHE) > 2000:
            _EXPL_CACHE.clear()

    out = []
    for j in top:
        text = _EXPL_CACHE.get(_expl_key(profile, j["id"])) or fallback_explanation(
            j, j["matched_skills"], j["missing_skills"], profile.workMode)
        out.append({"id": j["id"], "title": j["title"], "company": j["company"], "location": j["location"],
                    "mode": j["mode"], "salary": j["salary"] or "", "apply_url": j["apply_url"] or "#",
                    "score": j["score"], "matched_skills": j["matched_skills"],
                    "missing_skills": j["missing_skills"], "explanation": text})
    return out
