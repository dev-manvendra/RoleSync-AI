export default function ScoreRing({ score, size = 56 }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "#2B3FE0" : score >= 60 ? "#D98A00" : "#7A8099";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${score} percent match`}>
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E4E7F2" strokeWidth="5" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-sm font-bold">{score}</span>
    </div>
  );
}
