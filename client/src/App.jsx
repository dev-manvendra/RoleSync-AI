import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import ResumePanel from "./components/ResumePanel.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import MatchesPanel from "./components/MatchesPanel.jsx";
import * as api from "./lib/api.js";
import { SAMPLE_RESUME } from "./lib/mock.js";

const TABS = [
  { id: "resume", label: "Resume" },
  { id: "chat", label: "Chat" },
  { id: "matches", label: "Matches" },
];

export default function App() {
  const [tab, setTab] = useState("resume");
  const [profile, setProfile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [sending, setSending] = useState(false);
  const [matching, setMatching] = useState(false);
  const [parseError, setParseError] = useState("");
  const [matchError, setMatchError] = useState("");
  const timer = useRef(null);
  const reqId = useRef(0);

  const runMatch = useCallback(async (p, rid) => {
    const id = ++reqId.current;
    setMatching(true);
    setMatchError("");
    try {
      const res = await api.match({ resumeId: rid, profile: p });
      if (id === reqId.current) setJobs(res.jobs);
    } catch (e) {
      if (id === reqId.current) setMatchError(e.message);
    } finally {
      if (id === reqId.current) setMatching(false);
    }
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const analyze = async ({ file, text }) => {
    setParsing(true);
    setParseError("");
    try {
      const res = await api.parseResume({ file, text });
      setProfile(res.profile);
      setResumeId(res.resume_id ?? null);
      const n = res.profile.skills.length;
      const yrs = res.profile.years != null ? ` and about ${res.profile.years} years of experience` : "";
      setMessages([{
        role: "assistant",
        content: res.greeting || `I found ${n} skills${yrs}. Do you want remote, hybrid or on-site roles? Tell me a city or a stack you'd like more of, and I'll re-rank.`,
      }]);
      setTab("chat");
      runMatch(res.profile, res.resume_id ?? null);
    } catch (e) {
      setParseError(e.message);
    } finally {
      setParsing(false);
    }
  };

  const send = async (content) => {
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setSending(true);
    try {
      const res = await api.chat({ resumeId, profile, messages: next });
      setMessages([...next, { role: "assistant", content: res.reply }]);
      if (res.profile) { setProfile(res.profile); runMatch(res.profile, resumeId); }
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `Something went wrong: ${e.message}. Try sending that again.` }]);
    } finally {
      setSending(false);
    }
  };

  const changeProfile = (p) => {
    setProfile(p);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => runMatch(p, resumeId), 500);
  };

  const reset = () => {
    reqId.current++;
    setProfile(null); setResumeId(null); setMessages([]); setJobs([]);
    setParseError(""); setMatchError(""); setTab("resume");
  };

  // On desktop the matches column is always visible, so the left column falls back to chat.
  const leftTab = tab === "matches" ? "chat" : tab;

  return (
    <div className="min-h-screen">
      <Header demo={api.DEMO} canReset={!!profile} onReset={reset} />

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:py-6">
        {/* Mobile tabs: all three views */}
        <nav className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-white p-1 shadow-lift lg:hidden" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id}
              className={`rounded-lg py-2 text-sm font-semibold transition ${tab === t.id ? "bg-ultra text-white" : "text-slate2"}`}>
              {t.label}{t.id === "matches" && jobs.length > 0 && <span className="ml-1.5 opacity-70">{jobs.length}</span>}
            </button>
          ))}
        </nav>

        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[430px_minmax(0,1fr)]">
          <div className={`${tab === "matches" ? "hidden lg:block" : ""} lg:sticky lg:top-20 lg:self-start`}>
            {/* Desktop tabs: resume | chat */}
            <div className="mb-4 hidden grid-cols-2 gap-1 rounded-xl bg-white p-1 shadow-lift lg:grid">
              {TABS.slice(0, 2).map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${leftTab === t.id ? "bg-ultra text-white" : "text-slate2 hover:text-ink"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className={leftTab === "resume" ? "" : "hidden"}>
              <ResumePanel
                profile={profile} loading={parsing} error={parseError}
                onAnalyze={analyze} onProfileChange={changeProfile} onSample={() => SAMPLE_RESUME}
              />
            </div>
            <div className={leftTab === "chat" ? "" : "hidden"}>
              <ChatPanel messages={messages} sending={sending} disabled={!profile} onSend={send} />
            </div>
          </div>

          <div className={tab === "matches" ? "" : "hidden lg:block"}>
            <MatchesPanel jobs={jobs} loading={matching} hasProfile={!!profile} error={matchError} />
          </div>
        </div>
      </main>
    </div>
  );
}
