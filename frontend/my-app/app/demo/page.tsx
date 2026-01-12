"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "agent";

type Message = {
  id: string;
  role: Role;
  content: string;
  ts: number;
};

const STORAGE_KEY = "meter_chat_v2";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m} ${ampm}`;
}

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const starter: Message = useMemo(
    () => ({
      id: uid(),
      role: "agent",
      ts: Date.now(),
      content: "Hi. I am a Meter powered agent. Ask me anything.",
    }),
    []
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setMessages([starter]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setMessages([starter]);
        return;
      }
      setMessages(parsed);
    } catch {
      setMessages([starter]);
    }
  }, [starter]);

  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: text,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));

      const reply =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply
          : "No response returned.";

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "agent",
          content: reply,
          ts: Date.now(),
        },
      ]);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "agent",
            content: "Something went wrong.",
            ts: Date.now(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    abortRef.current?.abort();
    setLoading(false);
    setMessages([starter]);
    setInput("");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([starter]));
    } catch {}
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_50%_0%,rgba(234,179,8,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(800px_600px_at_50%_100%,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      {/* header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-yellow-400" />
            </div>
            <div>
              <div className="text-sm font-semibold">Meter</div>
              <div className="text-xs text-white/50">Agent console</div>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            Clear
          </button>
        </div>
      </header>

      {/* chat */}
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-6">
        <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur flex flex-col min-h-[75vh]">
          {/* status */}
          <div className="px-6 py-3 border-b border-white/10 text-xs text-white/50 flex justify-between">
            <span>Meter runtime active</span>
            <span>{loading ? "Reasoning" : "Ready"}</span>
          </div>

          {/* messages */}
          <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[80%]">
                    <div
                      className={[
                        "rounded-2xl px-5 py-4 text-sm leading-relaxed border",
                        isUser
                          ? "bg-yellow-400 text-black border-yellow-400/40"
                          : "bg-black/30 text-white border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]",
                      ].join(" ")}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={`mt-1 text-[11px] ${
                        isUser ? "text-right text-white/40" : "text-white/40"
                      }`}
                    >
                      {formatTime(msg.ts)}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-5 py-4 text-sm bg-black/30 border border-white/10 text-white/60">
                  Thinking
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* input */}
          <div className="border-t border-white/10 p-4">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                placeholder="Ask a question"
                className="flex-1 resize-none rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400/40"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-2xl bg-yellow-400 text-black px-6 py-3 text-sm font-semibold disabled:opacity-50 hover:brightness-95 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
