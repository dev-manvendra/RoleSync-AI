"""Pure scoring helpers: no network, no database, easy to unit test."""

ALIASES = {
    "js": "javascript", "ts": "typescript", "node": "node.js", "nodejs": "node.js",
    "reactjs": "react", "react.js": "react", "next": "next.js", "nextjs": "next.js",
    "postgres": "postgresql", "psql": "postgresql", "k8s": "kubernetes",
    "golang": "go", "tailwind": "tailwind css", "tailwindcss": "tailwind css",
    "ml": "machine learning", "gpt": "openai", "amazon web services": "aws",
    "ci cd": "ci/cd", "cicd": "ci/cd", "fast api": "fastapi",
}


def norm(skill: str) -> str:
    s = skill.strip().lower()
    return ALIASES.get(s, s)


def skill_overlap(profile_skills: list[str], job_skills: list[str]) -> tuple[list[str], list[str]]:
    mine = {norm(s) for s in profile_skills}
    matched = [s for s in job_skills if norm(s) in mine]
    missing = [s for s in job_skills if norm(s) not in mine]
    return matched, missing


def mode_fit(pref: str, job_mode: str) -> float:
    if pref == "any" or pref == job_mode:
        return 1.0
    return 0.5 if job_mode == "hybrid" else 0.15


def location_fit(locations: list[str], job_location: str, job_mode: str) -> float:
    if not locations or job_mode == "remote":
        return 1.0
    jl = job_location.lower()
    return 1.0 if any(l.lower() in jl or jl in l.lower() for l in locations if l) else 0.3


def semantic_score(similarity: float, floor: float, ceil: float) -> float:
    return min(1.0, max(0.0, (similarity - floor) / (ceil - floor)))


def final_score(sem: float, matched: int, total: int, mfit: float, lfit: float) -> int:
    skill = matched / total if total else 0.0
    pref = 0.6 * mfit + 0.4 * lfit
    return round(100 * (0.45 * sem + 0.30 * skill + 0.25 * pref))


def fallback_explanation(job: dict, matched: list[str], missing: list[str], work_mode: str) -> str:
    parts = []
    if matched:
        parts.append(f"Your experience with {', '.join(matched[:3])} covers {len(matched)} of the {len(job['skills'])} skills this role lists.")
    else:
        parts.append("This role is a conceptual fit, though none of its listed skills appear on your resume.")
    if work_mode != "any":
        parts.append(f"It's {job['mode']}, which matches what you asked for." if job["mode"] == work_mode
                     else f"It's {job['mode']}, while you prefer {work_mode}.")
    if matched and missing:
        parts.append(f"You'd be picking up {' and '.join(missing[:2])}.")
    return " ".join(parts)
