# RoleMatch AI: frontend

React 18 + Vite + Tailwind CSS 3.

```bash
npm install
npm run dev
```

With no `VITE_API_URL` the app runs in **demo mode** using built-in sample jobs, so it works on Vercel before the backend exists.
To use your FastAPI backend, copy `.env.example` to `.env` and set `VITE_API_URL=https://your-api.onrender.com`.

## Backend contract (FastAPI)

Enable CORS for your Vercel domain.

| Endpoint | Request | Response |
|---|---|---|
| `POST /api/resume/parse` | multipart `file` **or** JSON `{ text }` | `{ profile, resume_id?, greeting? }` |
| `POST /api/chat` | `{ resume_id?, profile, messages: [{role, content}] }` | `{ reply, profile }` (profile updated from the chat via LLM structured output) |
| `POST /api/match` | `{ resume_id?, profile, limit }` | `{ jobs: Job[] }` |

```ts
Profile = { name, headline, skills: string[], years: number|null, locations: string[], workMode: "remote"|"hybrid"|"onsite"|"any" }
Job     = { id, title, company, location, mode: "remote"|"hybrid"|"onsite", salary?, apply_url,
            score: 0-100, matched_skills: string[], missing_skills: string[], explanation: string }
```

## Deploy
Vercel: import the repo, framework preset **Vite**, add `VITE_API_URL` in Environment Variables.
