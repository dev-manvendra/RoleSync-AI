import { useRef, useState } from "react";
import { FileText, Loader2, Sparkles, Upload, X } from "lucide-react";

const MODES = [
  { id: "remote", label: "Remote" },
  { id: "hybrid", label: "Hybrid" },
  { id: "onsite", label: "On-site" },
  { id: "any", label: "Any" },
];

export default function ResumePanel({ profile, loading, error, onAnalyze, onProfileChange, onSample }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const pick = (f) => { if (f) { setFile(f); setText(""); } };
  const canSubmit = !loading && (file || text.trim().length > 40);

  const removeSkill = (s) => onProfileChange({ ...profile, skills: profile.skills.filter((x) => x !== s) });

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-4 shadow-lift sm:p-5">
        <h2 className="font-display text-xl font-bold tracking-tight">Add your resume</h2>
        <p className="mt-1 text-sm text-slate2">Upload a file or paste the text. We read your skills, experience and location.</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
          className={`mt-4 rounded-xl border-2 border-dashed p-4 text-center transition ${drag ? "border-ultra bg-ultra-soft" : "border-line bg-mist/60"}`}
        >
          {file ? (
            <div className="flex items-center justify-between gap-3 text-left">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <FileText size={18} className="shrink-0 text-ultra" />
                <span className="truncate">{file.name}</span>
              </span>
              <button onClick={() => setFile(null)} aria-label="Remove file" className="rounded-md p-1 text-slate2 hover:bg-white hover:text-ink"><X size={16} /></button>
            </div>
          ) : (
            <button onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center gap-1 py-2 text-sm">
              <Upload size={20} className="text-ultra" />
              <span className="font-semibold">Drop a resume here or browse</span>
              <span className="text-xs text-slate2">PDF, DOCX, TXT or MD</span>
            </button>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        {!file && (
          <>
            <div className="my-3 flex items-center gap-3 text-xs text-slate2"><span className="h-px flex-1 bg-line" />or paste text<span className="h-px flex-1 bg-line" /></div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Paste your resume here…"
              className="scroll-thin w-full resize-y rounded-xl border border-line bg-white p-3 text-sm placeholder:text-slate2/70 focus:border-ultra focus:outline-none focus:ring-2 focus:ring-ultra/20"
            />
          </>
        )}

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            disabled={!canSubmit}
            onClick={() => onAnalyze({ file, text })}
            className="inline-flex items-center gap-2 rounded-xl bg-ultra px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ultra-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "Reading resume…" : "Find my matches"}
          </button>
          <button onClick={() => { setFile(null); setText(onSample()); }} className="text-sm font-medium text-ultra hover:underline">Use a sample resume</button>
        </div>
      </section>

      {profile && (
        <section className="rounded-2xl border border-line bg-white p-4 shadow-lift sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold tracking-tight">{profile.name || "Your profile"}</h3>
              {profile.headline && <p className="truncate text-sm text-slate2">{profile.headline}</p>}
            </div>
            {profile.years != null && (
              <div className="shrink-0 rounded-lg bg-ultra-soft px-2.5 py-1 text-sm font-semibold text-ultra-deep">{profile.years} yrs</div>
            )}
          </div>

          <p className="mt-4 text-sm font-semibold">Skills we found</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-mist py-1 pl-2.5 pr-1.5 text-xs font-medium">
                {s}
                <button onClick={() => removeSkill(s)} aria-label={`Remove ${s}`} className="rounded-full p-0.5 text-slate2 hover:bg-line hover:text-ink"><X size={12} /></button>
              </span>
            ))}
          </div>

          <p className="mt-4 text-sm font-semibold">Work mode</p>
          <div role="radiogroup" className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-mist p-1">
            {MODES.map((m) => (
              <button
                key={m.id} role="radio" aria-checked={profile.workMode === m.id}
                onClick={() => onProfileChange({ ...profile, workMode: m.id })}
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${profile.workMode === m.id ? "bg-white text-ultra shadow-sm" : "text-slate2 hover:text-ink"}`}
              >{m.label}</button>
            ))}
          </div>

          {profile.locations.length > 0 && (
            <>
              <p className="mt-4 text-sm font-semibold">Locations</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.locations.map((l) => (
                  <span key={l} className="rounded-full border border-line px-2.5 py-1 text-xs font-medium">{l}</span>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
