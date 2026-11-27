# RoleMatch AI: backend

FastAPI + PostgreSQL/pgvector + any OpenAI-compatible LLM (Gemini by default).

## Run locally
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # fill DATABASE_URL and LLM_API_KEY
python -m scripts.init_db                             # creates extension + jobs table
python -m scripts.seed --count 120                    # LLM writes jobs, embeds them, inserts them
uvicorn app.main:app --reload
```
Open http://localhost:8000/docs to try each endpoint. `GET /health` should show your job count.

Quick check:
```bash
curl -X POST localhost:8000/api/resume/parse -H "Content-Type: application/json" \
  -d '{"text":"Senior engineer, 6 years. Python, FastAPI, React, PostgreSQL, AWS. Built a RAG assistant with OpenAI and pgvector. Based in Bengaluru."}'
```

## Connect the frontend
In the frontend `.env`: `VITE_API_URL=http://localhost:8000`, then restart `npm run dev`.

## How it works
| Endpoint | What happens |
|---|---|
| `POST /api/resume/parse` | pypdf / python-docx extract text, then a forced tool call returns structured profile JSON |
| `POST /api/chat` | LLM replies and returns the full updated profile (work mode, locations, skills, notes) |
| `POST /api/match` | Embed the candidate, pgvector cosine search for 30+ candidates, re-rank with skill overlap and preference fit, one LLM call explains the top N |

Score = 45% semantic similarity + 30% skill overlap + 25% work-mode and location fit (see `app/scoring.py`).
Resumes are never stored; the profile lives in the browser.

## Switching providers
Everything is env vars. Groq for chat has no embeddings, so keep Gemini or OpenAI for `EMBED_*`:
```
LLM_BASE_URL=https://api.groq.com/openai/v1   LLM_MODEL=<a Groq model that supports tool calling>
EMBED_API_KEY=<gemini key>                    (EMBED_* stay on Gemini)
```
OpenAI: `LLM_BASE_URL=https://api.openai.com/v1`, `LLM_MODEL=gpt-4o-mini`, `EMBED_MODEL=text-embedding-3-small`, `EMBED_DIM=1536`.
**If you change `EMBED_MODEL` or `EMBED_DIM`:** `DROP TABLE jobs;` then re-run `init_db` and `seed`.

## Deploy (Render)
New Web Service from this repo, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
Env vars: `DATABASE_URL`, `LLM_API_KEY`, `ALLOWED_ORIGINS=https://your-app.vercel.app` (comma-separate extra origins).
