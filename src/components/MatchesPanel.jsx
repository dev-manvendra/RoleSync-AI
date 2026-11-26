import JobCard from "./JobCard.jsx";

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-white p-5">
      <div className="flex gap-4"><div className="h-11 w-11 rounded-xl bg-line" /><div className="flex-1 space-y-2"><div className="h-4 w-2/3 rounded bg-line" /><div className="h-3 w-1/3 rounded bg-line" /></div><div className="h-14 w-14 rounded-full bg-line" /></div>
      <div className="mt-4 h-16 rounded-xl bg-mist" />
    </div>
  );
}

export default function MatchesPanel({ jobs, loading, hasProfile, error }) {
  if (!hasProfile) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-line bg-white/50 p-8 text-center">
        <div className="max-w-sm">
          <h2 className="font-display text-2xl font-bold tracking-tight">Jobs ranked by meaning, not keywords</h2>
          <p className="mt-2 text-sm text-slate2">Add your resume and your matches appear here, each with a plain-English reason it fits.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight">Your matches</h2>
        <span className="text-sm text-slate2">{loading ? "Re-ranking…" : `${jobs.length} roles, best fit first`}</span>
      </div>
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className={`space-y-4 transition-opacity ${loading && jobs.length ? "opacity-50" : ""}`}>
        {loading && !jobs.length
          ? [0, 1, 2].map((i) => <Skeleton key={i} />)
          : jobs.map((j, i) => <JobCard key={j.id} job={j} rank={i + 1} />)}
      </div>
    </div>
  );
}
