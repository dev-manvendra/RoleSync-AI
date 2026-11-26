// Demo-mode stand-in for the FastAPI backend, so the deployed UI works on its own.
const wait = (ms = 800) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SKILLS = ["Python","FastAPI","Django","Flask","React","Next.js","TypeScript","JavaScript","Node.js","PostgreSQL","pgvector","SQL","AWS","Docker","Kubernetes","PyTorch","LangChain","OpenAI","RAG","Tailwind CSS","GraphQL","Redis","Machine Learning","NLP","Terraform","CI/CD"];
const CITIES = { bengaluru: "Bengaluru", bangalore: "Bengaluru", delhi: "Delhi", mumbai: "Mumbai", hyderabad: "Hyderabad", pune: "Pune", london: "London", berlin: "Berlin", singapore: "Singapore", "new york": "New York", "san francisco": "San Francisco" };

export const SAMPLE_RESUME = `Aarav Mehta
Full-stack engineer

6 years of experience building web products and ML-powered features.
Skills: Python, FastAPI, React, TypeScript, PostgreSQL, Docker, AWS, OpenAI, LangChain, Tailwind CSS.

Experience
- Senior Engineer, Finwise (2022-now): built a RAG assistant on OpenAI and pgvector that cut support tickets by 31%.
- Software Engineer, Cartly (2019-2022): shipped React storefronts and FastAPI services handling 2M requests per day.

Based in Bengaluru.`;

const JOBS = [
  { id: "j1", title: "AI Product Engineer", company: "Elip AI", location: "Bengaluru", mode: "hybrid", salary: "₹35–55 LPA", skills: ["Python","FastAPI","React","OpenAI","pgvector","PostgreSQL"], apply_url: "#" },
  { id: "j2", title: "Senior Full-Stack Engineer", company: "Northwind Labs", location: "Remote (India)", mode: "remote", salary: "₹30–48 LPA", skills: ["React","TypeScript","Node.js","PostgreSQL","AWS","Docker"], apply_url: "#" },
  { id: "j3", title: "LLM Applications Engineer", company: "Parsley", location: "Remote (Global)", mode: "remote", salary: "$90–130k", skills: ["Python","LangChain","RAG","OpenAI","FastAPI","Redis"], apply_url: "#" },
  { id: "j4", title: "Machine Learning Engineer", company: "Vectorly", location: "Hyderabad", mode: "onsite", salary: "₹28–45 LPA", skills: ["Python","PyTorch","Machine Learning","NLP","Docker","Kubernetes"], apply_url: "#" },
  { id: "j5", title: "Frontend Engineer, Design Systems", company: "Loom & Co", location: "Mumbai", mode: "hybrid", salary: "₹24–38 LPA", skills: ["React","TypeScript","Tailwind CSS","GraphQL","CI/CD"], apply_url: "#" },
  { id: "j6", title: "Backend Engineer, Search", company: "Tessera", location: "Pune", mode: "hybrid", salary: "₹26–42 LPA", skills: ["Python","Django","PostgreSQL","Redis","Docker","AWS"], apply_url: "#" },
  { id: "j7", title: "Platform Engineer", company: "Granite Cloud", location: "Remote (EU)", mode: "remote", salary: "€70–95k", skills: ["Kubernetes","Terraform","AWS","Docker","CI/CD","Python"], apply_url: "#" },
  { id: "j8", title: "Staff Engineer, Applied AI", company: "Helio Health", location: "London", mode: "onsite", salary: "£95–125k", skills: ["Python","PyTorch","RAG","FastAPI","PostgreSQL","NLP"], apply_url: "#" },
];

const has = (text, term) => new RegExp(`(^|[^a-z0-9])${esc(term)}($|[^a-z0-9])`, "i").test(text);

function extract(text) {
  const skills = SKILLS.filter((s) => has(text, s));
  const yrs = [...text.matchAll(/(\d{1,2})\+?\s*(?:years|yrs)/gi)].map((m) => +m[1]);
  const lower = text.toLowerCase();
  const locations = [...new Set(Object.entries(CITIES).filter(([k]) => lower.includes(k)).map(([, v]) => v))];
  const first = text.trim().split("\n")[0].trim();
  return {
    name: first.length < 40 ? first : "",
    headline: (text.trim().split("\n")[1] || "").trim().slice(0, 60),
    skills,
    years: yrs.length ? Math.max(...yrs) : null,
    locations,
    workMode: /remote/i.test(text) ? "remote" : "any",
  };
}

export async function parseResume({ file, text }) {
  await wait(1100);
  let body = text;
  if (file) {
    if (!/\.(txt|md)$/i.test(file.name)) {
      throw new Error("Demo mode reads .txt and .md files only. Paste your resume text, or connect the backend for PDF and DOCX.");
    }
    body = await file.text();
  }
  const profile = extract(body || "");
  if (!profile.skills.length) throw new Error("No skills found. Try pasting more of your resume.");
  return { profile };
}

export async function chat({ profile, messages }) {
  await wait(900);
  const msg = messages[messages.length - 1].content;
  const lower = msg.toLowerCase();
  const next = { ...profile, skills: [...profile.skills], locations: [...profile.locations] };
  const notes = [];

  if (/\bremote\b/.test(lower)) { next.workMode = "remote"; notes.push("remote roles"); }
  else if (/hybrid/.test(lower)) { next.workMode = "hybrid"; notes.push("hybrid roles"); }
  else if (/on-?site|in the office|in-office/.test(lower)) { next.workMode = "onsite"; notes.push("on-site roles"); }
  else if (/any|flexible|don'?t mind/.test(lower)) { next.workMode = "any"; notes.push("any work mode"); }

  Object.entries(CITIES).forEach(([k, v]) => {
    if (lower.includes(k) && !next.locations.includes(v)) { next.locations.push(v); notes.push(v); }
  });
  SKILLS.forEach((s) => {
    if (has(msg, s) && !next.skills.includes(s)) { next.skills.push(s); notes.push(s); }
  });

  const reply = notes.length
    ? `Got it. I've updated your preferences: ${notes.join(", ")}. Your matches are re-ranking now. Anything else, like salary range or company size?`
    : "Thanks. I didn't catch a new preference there. You can tell me your work mode (remote, hybrid, on-site), a city, or a tech stack you want more of.";
  return { reply, profile: next };
}

export async function match({ profile }) {
  await wait(900);
  const mine = profile.skills.map((s) => s.toLowerCase());
  const jobs = JOBS.map((job) => {
    const matched = job.skills.filter((s) => mine.includes(s.toLowerCase()));
    const missing = job.skills.filter((s) => !mine.includes(s.toLowerCase()));
    const skillFit = matched.length / job.skills.length;
    const modeFit = profile.workMode === "any" || job.mode === profile.workMode ? 1 : job.mode === "hybrid" ? 0.5 : 0.2;
    const locFit = !profile.locations.length || job.mode === "remote" || profile.locations.some((l) => job.location.includes(l)) ? 1 : 0.3;
    const score = Math.round(100 * (0.6 * skillFit + 0.25 * modeFit + 0.15 * locFit));

    const parts = [];
    parts.push(matched.length
      ? `Your work with ${matched.slice(0, 3).join(", ")} covers ${matched.length} of the ${job.skills.length} skills this role asks for.`
      : "None of your listed skills overlap directly with this role.");
    if (profile.workMode !== "any") parts.push(job.mode === profile.workMode ? `It's ${job.mode}, which is what you asked for.` : `It's ${job.mode}, not ${profile.workMode} as you prefer.`);
    if (missing.length && matched.length) parts.push(`You'd be picking up ${missing.slice(0, 2).join(" and ")}.`);

    return { ...job, score, matched_skills: matched, missing_skills: missing, explanation: parts.join(" ") };
  }).sort((a, b) => b.score - a.score);
  return { jobs };
}
