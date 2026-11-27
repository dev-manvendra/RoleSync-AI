import * as mock from "./mock.js";

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const DEMO = !BASE;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).detail; } catch { /* ignore */ }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}

const json = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** POST /api/resume/parse  (multipart "file" OR JSON {text}) -> { profile, resume_id?, greeting? } */
export async function parseResume({ file, text }) {
  if (DEMO) return mock.parseResume({ file, text });
  if (file) {
    const form = new FormData();
    form.append("file", file);
    return request("/api/resume/parse", { method: "POST", body: form });
  }
  return request("/api/resume/parse", json({ text }));
}

/** POST /api/chat  { resume_id?, profile, messages } -> { reply, profile } */
export async function chat({ resumeId, profile, messages }) {
  if (DEMO) return mock.chat({ profile, messages });
  return request("/api/chat", json({ resume_id: resumeId, profile, messages }));
}

/** POST /api/match  { resume_id?, profile, limit } -> { jobs: Job[] } */
export async function match({ resumeId, profile, limit = 10 }) {
  if (DEMO) return mock.match({ profile });
  return request("/api/match", json({ resume_id: resumeId, profile, limit }));
}
