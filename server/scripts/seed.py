"""Fill the jobs table.

  python -m scripts.seed --count 120          # have the LLM write realistic postings
  python -m scripts.seed --file my_jobs.json  # or load your own: a JSON list of job objects
"""
import argparse
import itertools
import json
import random
import time

import psycopg
from pgvector import Vector
from pgvector.psycopg import register_vector

from app.config import settings
from app.llm import embed, structured
from app.schemas import GENERATE_PARAMS, GeneratedJobs, JobIn

ROLE_FAMILIES = [
    "backend engineering (Python, Go, Java)", "frontend engineering (React, TypeScript)",
    "full-stack product engineering", "machine learning engineering", "LLM and applied AI engineering",
    "data engineering", "data science and analytics", "DevOps and platform engineering",
    "mobile engineering (iOS, Android, Flutter)", "security engineering", "QA and test automation",
    "engineering management", "product design and UX engineering", "site reliability engineering",
    "cloud and solutions architecture", "embedded and IoT engineering",
]
LOCATIONS = ["Bengaluru", "Hyderabad", "Pune", "Mumbai", "Delhi NCR", "Chennai", "London", "Berlin",
             "Singapore", "New York", "Toronto", "Remote (India)", "Remote (Global)", "Remote (EU)", "Remote (US)"]

SYSTEM = (
    "You write realistic, varied job postings for a job-search demo. Use fictional company names. "
    "Remote jobs must have a location starting with \"Remote\". Salary is a short range in the local "
    "currency. skills: 5-8 concrete technologies or methods. description: 60-90 words of plain text "
    "covering what the person will build and what the team values; no markdown, no bullet points."
)


def generate(count: int) -> list[JobIn]:
    jobs: list[JobIn] = []
    for family in itertools.cycle(ROLE_FAMILIES):
        if len(jobs) >= count:
            break
        locs = ", ".join(random.sample(LOCATIONS, 6))
        prompt = (f"Write 8 job postings in the area of {family}. Mix seniority levels. Spread them across "
                  f"these locations: {locs}. Roughly a third remote, a third hybrid, a third onsite.")
        try:
            batch = structured(SYSTEM, [{"role": "user", "content": prompt}], "emit_jobs",
                               "Return the generated job postings.", GENERATE_PARAMS, GeneratedJobs, temperature=0.9)
            jobs.extend(batch.jobs)
            print(f"  generated {len(jobs)}/{count}")
        except Exception as e:  # noqa: BLE001
            print(f"  batch failed ({e}); waiting 20s")
            time.sleep(20)
        time.sleep(2)  # stay inside free-tier rate limits
    return jobs[:count]


def doc(j: JobIn) -> str:
    return f"{j.title} at {j.company}. {j.mode} in {j.location}. Skills: {', '.join(j.skills)}. {j.description}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=120)
    ap.add_argument("--file")
    args = ap.parse_args()

    if args.file:
        jobs = [JobIn.model_validate(x) for x in json.load(open(args.file, encoding="utf-8"))]
    else:
        print(f"Generating {args.count} jobs…")
        jobs = generate(args.count)

    print(f"Embedding {len(jobs)} jobs…")
    vectors = embed([doc(j) for j in jobs])

    with psycopg.connect(settings.database_url) as conn:
        register_vector(conn)
        with conn.cursor() as cur:
            cur.executemany(
                """INSERT INTO jobs (title, company, location, mode, salary, skills, description, apply_url, embedding)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (title, company, location) DO NOTHING""",
                [(j.title, j.company, j.location, j.mode, j.salary, j.skills, j.description, j.apply_url, Vector(v))
                 for j, v in zip(jobs, vectors)],
            )
        conn.commit()
        n = conn.execute("SELECT count(*) FROM jobs").fetchone()[0]
    print(f"Done. jobs table now has {n} rows.")


if __name__ == "__main__":
    main()
