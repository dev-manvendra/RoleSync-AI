import { ExternalLink, MapPin } from "lucide-react";
import ScoreRing from "./ScoreRing.jsx";

const MODE_LABEL = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };
const TINTS = ["#E8EBFF", "#FFF3D6", "#E3F5EE", "#FDE8EF", "#EAF2FB"];

function Avatar({ name }) {
  const tint = TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-ink" style={{ background: tint }}>
      {name[0]}
    </div>
  );
}

export default function JobCard({ job, rank }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-lift transition hover:border-ultra/40 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <Avatar name={job.company} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold leading-snug tracking-tight">{job.title}</h3>
          <p className="text-sm text-slate2">{job.company}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate2">
            <span className="inline-flex items-center gap-1"><MapPin size={13} />{job.location}</span>
            <span className="rounded-md bg-mist px-1.5 py-0.5">{MODE_LABEL[job.mode] || job.mode}</span>
            {job.salary && <span>{job.salary}</span>}
          </div>
        </div>
        <ScoreRing score={job.score} />
      </div>

      <div className="mt-4 rounded-xl bg-ultra-soft/60 p-3.5">
        <p className="text-sm font-semibold text-ultra-deep">{rank === 1 ? "Why this is your top match" : "Why it fits"}</p>
        <p className="mt-1 text-sm leading-relaxed">{job.explanation}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {job.matched_skills.map((s) => (
          <span key={s} className="rounded-full bg-ultra px-2.5 py-1 text-xs font-medium text-white">{s}</span>
        ))}
        {job.missing_skills.map((s) => (
          <span key={s} title="Not on your resume" className="rounded-full border border-dashed border-slate2/50 px-2.5 py-1 text-xs font-medium text-slate2">{s}</span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate2">Filled = on your resume. Dashed = a gap.</span>
        <a href={job.apply_url || "#"} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold transition hover:border-ultra hover:text-ultra">
          View role <ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
}
