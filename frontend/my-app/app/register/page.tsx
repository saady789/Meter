"use client";

import { useMemo, useState } from "react";
import { Toaster, toast } from "sonner";

type VerifiedTool = {
  name: string;
  description?: string;
};

type Step = 1 | 2 | 3 | 4;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

function makeProviderId() {
  return Math.random().toString(36).slice(2, 12);
}

function maskMiddle(s: string, head = 10, tail = 6) {
  const v = (s || "").trim();
  if (v.length <= head + tail) return v;
  return `${v.slice(0, head)}...${v.slice(-tail)}`;
}

function parsePriceCents(v: string) {
  if (v.trim() === "") return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  if (n < 0) return null;
  return Math.floor(n);
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);

  const [mcpUrl, setMcpUrl] = useState("");
  const [tools, setTools] = useState<VerifiedTool[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});

  const [wallet, setWallet] = useState("");
  const [walletVerified, setWalletVerified] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Keep internal state, but do not show to user until Step 4
  const [providerId, setProviderId] = useState(makeProviderId());
  const [generatedLink, setGeneratedLink] = useState("");

  const [busyVerifyMcp, setBusyVerifyMcp] = useState(false);
  const [busyVerifyWallet, setBusyVerifyWallet] = useState(false);
  const [busyRegister, setBusyRegister] = useState(false);

  const toolRows = useMemo(() => {
    return tools.map((t) => {
      const raw = prices[t.name] ?? "";
      const parsed = parsePriceCents(raw);
      return {
        ...t,
        rawPrice: raw,
        parsedPrice: parsed,
        ok: parsed !== null,
      };
    });
  }, [tools, prices]);

  const pricingReady = useMemo(() => {
    if (!tools.length) return false;
    return toolRows.every((t) => t.ok);
  }, [tools.length, toolRows]);

  const registerReady = useMemo(() => {
    return (
      step === 4 &&
      mcpUrl.trim().length > 0 &&
      tools.length > 0 &&
      pricingReady &&
      walletVerified &&
      wallet.trim().length > 0 &&
      providerId.trim().length > 0
    );
  }, [
    step,
    mcpUrl,
    tools.length,
    pricingReady,
    walletVerified,
    wallet,
    providerId,
  ]);

  const toolPayload = useMemo(() => {
    return toolRows.map((t) => ({
      toolName: t.name,
      priceCents: t.parsedPrice ?? 0,
    }));
  }, [toolRows]);

  function hardResetAfterUrlChange(nextUrl: string) {
    setMcpUrl(nextUrl);
    setTools([]);
    setPrices({});
    setWallet("");
    setWalletVerified(false);
    setWalletBalance(null);
    setProviderId(makeProviderId());
    setGeneratedLink("");
    setStep(1);
  }

  async function handleVerifyMcp() {
    const url = mcpUrl.trim();
    if (!url) {
      toast.error("Paste your MCP URL.");
      return;
    }

    setBusyVerifyMcp(true);
    setGeneratedLink("");
    setTools([]);
    setPrices({});
    setWallet("");
    setWalletVerified(false);
    setWalletBalance(null);
    setProviderId(makeProviderId());

    try {
      const res = await fetch(`${API_BASE}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Verify failed.");

      const detected: VerifiedTool[] = Array.isArray(data?.tools)
        ? data.tools
        : [];
      if (!detected.length) {
        toast.error("No tools detected. Check the MCP URL.");
        return;
      }

      const nextPrices: Record<string, string> = {};
      for (const t of detected) nextPrices[t.name] = "";

      setTools(detected);
      setPrices(nextPrices);

      toast.success(`Connected. Found ${detected.length} tools.`);
      setStep(2);
    } catch (e: any) {
      toast.error(e?.message || "Verify failed.");
    } finally {
      setBusyVerifyMcp(false);
    }
  }

  function handleContinuePricing() {
    if (!tools.length) {
      toast.error("Verify your MCP first.");
      return;
    }
    if (!pricingReady) {
      toast.error("Set a valid price for every tool.");
      return;
    }
    setStep(3);
  }

  async function handleVerifyWallet() {
    const address = wallet.trim();
    if (!address) {
      toast.error("Paste your payout wallet.");
      return;
    }

    setBusyVerifyWallet(true);
    setWalletVerified(false);
    setWalletBalance(null);

    try {
      const res = await fetch(`${API_BASE}/verify-wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Wallet verify failed.");
      if (!data?.verified)
        throw new Error(data?.error || "Wallet verify failed.");

      const bal =
        typeof data?.balance === "number" && Number.isFinite(data.balance)
          ? data.balance
          : null;

      setWalletVerified(true);
      setWalletBalance(bal);

      toast.success(
        bal === null ? "Wallet verified." : `Wallet verified. ${bal} MNEE`
      );
      setStep(4);
    } catch (e: any) {
      setWalletVerified(false);
      setWalletBalance(null);
      toast.error(e?.message || "Wallet verify failed.");
    } finally {
      setBusyVerifyWallet(false);
    }
  }

  async function handleRegister() {
    if (!registerReady) {
      toast.error("Complete the steps first.");
      return;
    }

    const id = providerId.trim().toLowerCase();
    setProviderId(id);

    setBusyRegister(true);
    setGeneratedLink("");

    try {
      const res = await fetch(`${API_BASE}/register-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: id,
          mcpUrl: mcpUrl.trim(),
          walletPublicKey: wallet.trim(),
          tools: toolPayload,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Register failed.");

      const link = data?.monetizedMcpUrl || `${API_BASE}/mcp/${id}`;
      setGeneratedLink(link);

      toast.success("Meter link minted.");
    } catch (e: any) {
      toast.error(e?.message || "Register failed.");
    } finally {
      setBusyRegister(false);
    }
  }

  async function copyLink() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Copied.");
    } catch {
      toast.error("Copy failed.");
    }
  }

  const mintSummary = useMemo(() => {
    const pricedCount = toolRows.filter((t) => t.ok).length;
    const total = toolRows.length;

    const pricingLabel =
      total === 0
        ? "No tools"
        : pricedCount === total
        ? `${total} tools priced`
        : `${pricedCount}/${total} priced`;

    return {
      mcpLabel: mcpUrl ? maskMiddle(mcpUrl, 18, 10) : "Not connected",
      pricingLabel,
      walletLabel: wallet ? maskMiddle(wallet, 12, 8) : "Not set",
    };
  }, [toolRows, wallet, mcpUrl]);

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <Toaster richColors position="top-right" />

      {/* Cinematic background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(212,175,55,0.20),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(212,175,55,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.08]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-10">
        {/* Top */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.65)]" />
              Meter
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Turn MCP tools into paid endpoints
            </h1>

            <p className="max-w-2xl text-sm text-white/70">
              Connect your MCP server, price each tool, add a payout wallet,
              then mint one link.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Status</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
              {generatedLink ? "Link minted" : "In setup"}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <StepPill active={step === 1} done={step > 1} label="1. Connect" />
            <Rail />
            <StepPill active={step === 2} done={step > 2} label="2. Price" />
            <Rail />
            <StepPill active={step === 3} done={step > 3} label="3. Wallet" />
            <Rail />
            <StepPill active={step === 4} done={false} label="4. Mint" />
          </div>
        </div>

        {/* Main flow only */}
        <div className="mt-8 space-y-6">
          {step === 1 && (
            <Panel>
              <PanelHeader
                kicker="Connect"
                title="Paste your MCP server URL"
                subtitle="We detect tools. Nothing is stored yet."
              />

              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <TextInput
                  value={mcpUrl}
                  onChange={(e) => hardResetAfterUrlChange(e.target.value)}
                  placeholder="https://your-mcp-host/mcp"
                />
                <GoldButton
                  onClick={handleVerifyMcp}
                  loading={busyVerifyMcp}
                  label="Verify"
                />
              </div>

              <Hint>Use a URL reachable from the internet, not localhost.</Hint>
            </Panel>
          )}

          {step === 2 && (
            <Panel>
              <PanelHeader
                kicker="Pricing"
                title="Price each tool per call"
                subtitle="Set cents per invocation. Keep it simple."
              />

              <div className="mt-5 space-y-3">
                {toolRows.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-white/15"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="mt-1 text-xs text-white/60">
                          {t.description || "No description provided."}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/45">cents</span>
                        <input
                          type="number"
                          min={0}
                          className={[
                            "w-28 rounded-xl border bg-white/5 px-3 py-2 text-sm text-white outline-none",
                            "focus:ring-2 focus:ring-[#D4AF37]/20",
                            t.ok
                              ? "border-white/10 focus:border-[#D4AF37]/60"
                              : "border-red-500/40 focus:border-red-400/60",
                          ].join(" ")}
                          placeholder="0"
                          value={t.rawPrice}
                          onChange={(e) =>
                            setPrices((p) => ({
                              ...p,
                              [t.name]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {!t.ok && (
                      <div className="mt-2 text-xs text-red-200/90">
                        Enter a valid non negative integer.
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <GhostButton onClick={() => setStep(1)} label="Back" />
                <PrimaryButton
                  onClick={handleContinuePricing}
                  disabled={!pricingReady}
                  label="Continue"
                />
              </div>
            </Panel>
          )}

          {step === 3 && (
            <Panel>
              <PanelHeader
                kicker="Wallet"
                title="Add your payout wallet"
                subtitle="Public address only. Used for payouts."
              />

              <div className="mt-5">
                <Label>Payout wallet address</Label>
                <TextInput
                  value={wallet}
                  onChange={(e) => {
                    setWallet(e.target.value);
                    setWalletVerified(false);
                    setWalletBalance(null);
                  }}
                  placeholder="Paste your wallet public key"
                />

                <div className="mt-2 text-xs text-white/60">
                  {walletVerified ? (
                    <span className="text-[#D4AF37]">Verified</span>
                  ) : (
                    <span className="text-white/60">Not verified</span>
                  )}
                  {walletBalance !== null ? (
                    <span className="text-white/50">
                      {" "}
                      · {walletBalance} MNEE
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Good to know</div>
                  <div className="mt-1 text-sm text-white/75">
                    Meter never asks for private keys. This address is only
                    where payouts go.
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <GhostButton onClick={() => setStep(2)} label="Back" />
                <GoldButton
                  onClick={handleVerifyWallet}
                  loading={busyVerifyWallet}
                  label="Verify wallet"
                />
              </div>
            </Panel>
          )}

          {step === 4 && (
            <Panel>
              <PanelHeader
                kicker="Mint"
                title="Pick a link handle and mint"
                subtitle="This is the only moment we show the handle."
              />

              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <Label>Link handle</Label>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <TextInput
                      value={providerId}
                      onChange={(e) => setProviderId(e.target.value)}
                      placeholder="short-handle"
                    />
                    <button
                      onClick={() => setProviderId(makeProviderId())}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 cursor-pointer"
                      type="button"
                    >
                      Random
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-white/55">
                    Keep it short. This becomes your public link path.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm font-semibold text-white">Review</div>
                  <div className="mt-3 grid gap-3">
                    <SummaryRow
                      label="MCP server"
                      value={mintSummary.mcpLabel}
                      ok={mcpUrl.trim().length > 0 && tools.length > 0}
                    />
                    <SummaryRow
                      label="Pricing"
                      value={mintSummary.pricingLabel}
                      ok={pricingReady}
                    />
                    <SummaryRow
                      label="Payout wallet"
                      value={mintSummary.walletLabel}
                      ok={walletVerified && wallet.trim().length > 0}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] p-4">
                  <div className="text-xs text-[#D4AF37]">
                    What happens after mint
                  </div>
                  <div className="mt-2 text-sm text-white/75">
                    Agents pay first. Meter verifies proof, then forwards the
                    call to your MCP server.
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <GhostButton onClick={() => setStep(3)} label="Back" />
                <PrimaryButton
                  onClick={handleRegister}
                  disabled={!registerReady || busyRegister}
                  label={busyRegister ? "Minting..." : "Mint link"}
                />
              </div>

              {generatedLink && (
                <div className="mt-6 rounded-3xl border border-[#D4AF37]/25 bg-black/40 p-5 shadow-[0_40px_120px_rgba(212,175,55,0.10)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Your Meter link
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        Share this with agents or MCP clients.
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      Minted
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <code className="break-all rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/90">
                      {generatedLink}
                    </code>

                    <button
                      onClick={copyLink}
                      className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80 transition hover:bg-white/10"
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          )}
        </div>

        <div className="mt-10 text-center text-xs text-white/35">
          Meter prototype UI
        </div>
      </div>
    </main>
  );
}

function Rail() {
  return <div className="h-px w-8 bg-white/10" />;
}

function StepPill({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  const cls = active
    ? "border-[#D4AF37]/45 bg-[#D4AF37]/15 text-[#D4AF37]"
    : done
    ? "border-white/15 bg-white/10 text-white/80"
    : "border-white/10 bg-white/5 text-white/55";

  return (
    <div className={`rounded-full border px-3 py-1 text-xs transition ${cls}`}>
      {label}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      {children}
    </section>
  );
}

function PanelHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-xs text-[#D4AF37]">{kicker}</div>
      <div className="mt-1 text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-white/65">{subtitle}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-xs text-white/60">{children}</div>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 text-xs text-white/55">{children}</div>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none",
        "placeholder:text-white/35",
        "focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function GoldButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={[
        "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
        "bg-gradient-to-b from-[#D4AF37] to-[#8A6E22] text-black",
        "hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer",
      ].join(" ")}
    >
      {loading ? "Working..." : label}
    </button>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition cursor-pointer",
        "hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function GhostButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 cursor-pointer"
    >
      {label}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="min-w-0">
        <div className="text-xs text-white/55">{label}</div>
        <div className="mt-1 text-sm text-white/85 break-words">{value}</div>
      </div>
      <span
        className={[
          "mt-1 h-2.5 w-2.5 rounded-full",
          ok ? "bg-[#D4AF37]" : "bg-white/20",
        ].join(" ")}
      />
    </div>
  );
}
