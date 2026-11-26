import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

const SUGGESTIONS = ["Remote only", "Hybrid in Bengaluru", "I want more FastAPI work", "On-site in Hyderabad"];

export default function ChatPanel({ messages, sending, disabled, onSend }) {
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending]);

  const submit = (text) => {
    const t = text.trim();
    if (!t || sending || disabled) return;
    onSend(t);
    setDraft("");
  };

  return (
    <section className="flex h-[68vh] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-lift lg:h-[calc(100vh-9.5rem)]">
      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4 sm:p-5" aria-live="polite">
        {disabled && messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-xs">
              <p className="font-display text-lg font-bold">Add your resume first</p>
              <p className="mt-1 text-sm text-slate2">Once we've read it, you can tell us what you want: remote or on-site, a city, a tech stack.</p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border border-line bg-mist"}`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-line bg-mist px-3.5 py-3" aria-label="RoleMatch is typing">
              {[0, 150, 300].map((d) => <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate2" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-3 sm:p-4">
        {!disabled && (
          <div className="scroll-thin -mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => submit(s)} disabled={sending}
                className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium text-slate2 transition hover:border-ultra hover:text-ultra disabled:opacity-40">
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(draft); } }}
            rows={1}
            disabled={disabled}
            placeholder={disabled ? "Add your resume to start" : "Tell me what you're looking for…"}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-ultra focus:outline-none focus:ring-2 focus:ring-ultra/20 disabled:bg-mist"
          />
          <button onClick={() => submit(draft)} disabled={disabled || sending || !draft.trim()} aria-label="Send message"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ultra text-white transition hover:bg-ultra-deep disabled:opacity-40">
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </section>
  );
}
