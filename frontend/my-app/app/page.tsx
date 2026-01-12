"use client";

import Link from "next/link";

// ============================================================================
// METER Landing Page
// Outcome first YC style copy, same premium infra look
// ============================================================================

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10">
      <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.65)]" />
      {children}
    </span>
  );
}

function GlowButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#D4AF37] to-[#8A6E22] px-5 py-3 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(212,175,55,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="absolute -left-24 top-0 h-full w-24 animate-[shine_2.6s_ease-in-out_infinite] bg-white/30 blur-xl [transform:skewX(-20deg)]" />
      </span>
    </Link>
  );
}

function GhostButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/10"
    >
      {children}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}

function Card({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group cursor-pointer rounded-3xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07] hover:shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-[#D4AF37] transition-colors duration-300 group-hover:border-[#D4AF37]/25">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold text-white">{title}</div>
          <div className="mt-1 text-sm leading-relaxed text-white/65">
            {desc}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="text-xs font-medium uppercase tracking-wide text-[#D4AF37]">
        {kicker}
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-white/65 md:text-base">
        {subtitle}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-white/10" />;
}

function CodeBlock({
  title,
  lines,
  accent = "gold",
}: {
  title: string;
  lines: string[];
  accent?: "gold" | "cyan";
}) {
  const isGold = accent === "gold";
  const borderColor = isGold ? "border-[#D4AF37]/20" : "border-cyan-300/15";
  const dotColor = isGold ? "bg-[#D4AF37]" : "bg-cyan-300";

  return (
    <div
      className={`cursor-pointer rounded-3xl ${borderColor} border bg-black/35 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-black/45`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/65">
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          {title}
        </div>
        <div className="text-[10px] text-white/40">read only</div>
      </div>

      <div className="mt-4 space-y-2 font-mono text-xs leading-relaxed text-white/75">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-3">
            <span className="w-6 text-white/25">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="break-words">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrbitVisual() {
  return (
    <div className="relative mx-auto h-[380px] w-full max-w-[520px]">
      <div className="absolute inset-0 rounded-[40px] border border-white/10 bg-white/5" />
      <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.18),transparent_60%)]" />
      <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.06),transparent_55%)]" />

      <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] opacity-70" />
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06] opacity-50" />

      <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <div className="animate-[float_6s_ease-in-out_infinite] rounded-3xl border border-[#D4AF37]/25 bg-black/40 px-5 py-4 shadow-[0_25px_90px_rgba(212,175,55,0.14)]">
          <div className="text-[11px] font-medium uppercase tracking-wide text-[#D4AF37]">
            METER
          </div>
          <div className="mt-1 text-sm font-semibold text-white">
            Pay gated MCP endpoint
          </div>
          <div className="mt-2 text-xs text-white/60">
            Proof in, request routed to your server.
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 animate-[orbit_14s_linear_infinite]">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/80">
            MCP Server
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 animate-[orbit_18s_linear_infinite]">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/80">
            Agent
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 animate-[orbit_22s_linear_infinite]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/80">
            MNEE
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[40px]">
        <div className="absolute -top-12 left-0 h-20 w-full animate-[scan_5.5s_ease-in-out_infinite] bg-white/10 opacity-40 blur-2xl" />
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(212,175,55,0.18),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(212,175,55,0.10),transparent_55%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] opacity-[0.07] [background-size:18px_18px]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.25%22/%3E%3C/svg%3E')]" />
    </div>
  );
}

function Navbar() {
  return (
    <header className="relative mx-auto max-w-6xl px-6 pt-8">
      <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
            <span className="h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.7)]" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">
              Meter
            </div>
            <div className="text-xs text-white/55">Paid MCP endpoints</div>
          </div>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          <a
            href="#outcomes"
            className="cursor-pointer rounded-xl px-3 py-2 text-xs text-white/70 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white"
          >
            Outcomes
          </a>
          <a
            href="#why"
            className="cursor-pointer rounded-xl px-3 py-2 text-xs text-white/70 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white"
          >
            Why it wins
          </a>
          <a
            href="#trust"
            className="cursor-pointer rounded-xl px-3 py-2 text-xs text-white/70 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white"
          >
            Trust
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <GhostButton href="/register">Open Console</GhostButton>
          </div>
          <GlowButton href="/register">Mint paid MCP link</GlowButton>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const bullets = [
    {
      k: "Price per tool call",
      v: "Set cents per invocation. Costs are readable by agents.",
    },
    {
      k: "Pay gates execution",
      v: "Proof required before the request is routed to your server.",
    },
    {
      k: "No billing stack",
      v: "Skip subscriptions, invoices, and custom auth layers.",
    },
    {
      k: "Wallet payouts",
      v: "Non custodial. You provide a public address and receive settlement.",
    },
  ];

  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">
      <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-[fadeInUp_0.6s_ease-out_forwards]">
          <Pill>Charge for MCP tools</Pill>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
            Monetize your MCP server in minutes
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
            Meter wraps your MCP server with a pay gate. Set per tool prices,
            share one endpoint, and get paid automatically. Agents pay in MNEE.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Pill>Per call pricing</Pill>
            <Pill>Proof gated routing</Pill>
            <Pill>Non custodial payouts</Pill>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <GlowButton href="/register">Start earning</GlowButton>
            <GhostButton href="#outcomes">See outcomes</GhostButton>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {bullets.map((b) => (
              <div
                key={b.k}
                className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]"
              >
                <div className="text-xs font-medium text-white">{b.k}</div>
                <div className="mt-1 text-xs leading-relaxed text-white/60">
                  {b.v}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Setup time" value="Minutes" />
            <Stat label="Pricing model" value="Per tool" />
            <Stat label="Charge unit" value="Cents per call" />
            <Stat label="Paid to" value="Your wallet" />
          </div>
        </div>

        <div className="relative">
          <OrbitVisual />

          <div className="mt-5 grid gap-3">
            <CodeBlock
              title="Register tools + pricing"
              accent="gold"
              lines={[
                "POST /register-service",
                "{",
                '  providerId: "your-key",',
                '  mcpUrl: "https://your-mcp/mcp",',
                "  tools: [{ toolName, priceCents }],",
                "  walletPublicKey",
                "}",
              ]}
            />
            <CodeBlock
              title="Agent call (with payment proof)"
              accent="cyan"
              lines={[
                "POST /mcp/:providerId",
                "{",
                '  tool: "summarize_text",',
                "  args: { ... },",
                "  paymentProof: { txHash }",
                "}",
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function OutcomesSection() {
  const outcomes = [
    {
      title: "Usage becomes revenue",
      desc: "Every tool call can earn. No contracts or enterprise sales needed.",
      icon: "◉",
    },
    {
      title: "Predictable costs for agents",
      desc: "Per call pricing makes budgeting and tool selection programmatic.",
      icon: "¢",
    },
    {
      title: "One endpoint to share",
      desc: "Agents call a single paid URL instead of negotiating access per tool.",
      icon: "↗",
    },
    {
      title: "Non custodial payouts",
      desc: "Meter never holds your keys. Funds settle to your public wallet address.",
      icon: "🔒",
    },
  ];

  return (
    <section id="outcomes" className="relative mx-auto max-w-6xl px-6 py-16">
      <SectionTitle
        kicker="Outcomes"
        title="Turn MCP usage into income"
        subtitle="Meter makes monetization native: price tools, verify payment proof, then route requests to your existing MCP server."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {outcomes.map((o) => (
          <Card
            key={o.title}
            title={o.title}
            desc={o.desc}
            icon={<span className="text-sm">{o.icon}</span>}
          />
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">Without Meter</div>
          <div className="mt-2 text-sm text-white/65">
            You ship great tools, then spend weeks building monetization and
            access control.
          </div>

          <div className="mt-5 space-y-3">
            {[
              "API keys and custom auth",
              "Subscriptions, invoices, retries",
              "Hard to quote per call cost",
              "Revenue does not match usage",
            ].map((t) => (
              <div
                key={t}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 transition hover:bg-black/35"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                <div className="text-sm text-white/70">{t}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#D4AF37]/[0.18] bg-black/35 p-6 shadow-[0_40px_120px_rgba(212,175,55,0.10)]">
          <div className="text-sm font-semibold text-white">With Meter</div>
          <div className="mt-2 text-sm text-white/65">
            Meter becomes the gate. Your server stays the source of truth.
          </div>

          <div className="mt-5 space-y-3">
            {[
              "Prices live next to tools",
              "Proof required before execution",
              "Route to your existing MCP",
              "Track calls and payouts",
            ].map((t) => (
              <div
                key={t}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] p-3 transition hover:bg-[#D4AF37]/[0.09]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                <div className="text-sm text-white/80">{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const reasons = [
    {
      title: "Pay first, then execute",
      desc: "A single rule that removes billing complexity and access disputes.",
      icon: "✓",
    },
    {
      title: "Per call is programmable",
      desc: "Agents can compare tools, plan spend, and retry safely.",
      icon: "¢",
    },
    {
      title: "You stay in control",
      desc: "Keep your server, your tooling, your infra. Meter is just the gate.",
      icon: "⛭",
    },
  ];

  return (
    <section id="why" className="relative mx-auto max-w-6xl px-6 py-16">
      <SectionTitle
        kicker="Why it wins"
        title="Built for agent procurement"
        subtitle="Agents need three things: a price, a proof format, and an endpoint. Meter standardizes that into a simple primitive."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {reasons.map((r) => (
          <Card
            key={r.title}
            title={r.title}
            desc={r.desc}
            icon={<span className="text-sm">{r.icon}</span>}
          />
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <CodeBlock
          title="What you ship"
          accent="gold"
          lines={[
            "Paid MCP endpoint",
            "Per tool pricing",
            "Wallet settlement",
            "Usage and revenue tracking",
          ]}
        />
        <CodeBlock
          title="What agents get"
          accent="cyan"
          lines={[
            "One URL to call",
            "Known cost per tool",
            "Proof gated execution",
            "Clean procurement loop",
          ]}
        />
      </div>
    </section>
  );
}

function TrustSection() {
  const items = [
    {
      title: "Public wallet only",
      desc: "No private keys, no custody, no permissions handed over.",
      icon: "🔒",
    },
    {
      title: "Verification before routing",
      desc: "Payment proof is checked before your tool ever runs.",
      icon: "🧾",
    },
    {
      title: "Auditable usage",
      desc: "Calls and payouts are easy to track and reconcile.",
      icon: "◉",
    },
  ];

  return (
    <section id="trust" className="relative mx-auto max-w-6xl px-6 py-16">
      <SectionTitle
        kicker="Trust"
        title="Safe by default"
        subtitle="Minimal surface area. Non custodial payouts. Proof verified before execution."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map((f) => (
          <Card
            key={f.title}
            title={f.title}
            desc={f.desc}
            icon={<span className="text-sm">{f.icon}</span>}
          />
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-20">
      <div className="rounded-[40px] border border-[#D4AF37]/[0.18] bg-black/45 p-8 shadow-[0_60px_160px_rgba(212,175,55,0.10)] md:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-[#D4AF37]">
              Start charging today
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Mint a paid MCP link in minutes
            </div>
            <div className="mt-2 max-w-2xl text-sm text-white/65">
              Set prices per tool call and share one endpoint. When agents use
              your tools, you get paid.
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <GhostButton href="/register">Open Console</GhostButton>
            <GlowButton href="/register">Mint paid MCP link</GlowButton>
          </div>
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-white/35">
        Meter prototype · paid MCP endpoints · proof gated tool calls
      </footer>
    </section>
  );
}

export default function Index() {
  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <style>{`
        @keyframes orbit {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0.1; }
          50% { transform: translateY(420px); opacity: 0.35; }
          100% { transform: translateY(0); opacity: 0.1; }
        }
        @keyframes shine {
          0% { transform: translateX(-140%) skewX(-20deg); opacity: 0; }
          20% { opacity: 0.25; }
          60% { opacity: 0; }
          100% { transform: translateX(500%) skewX(-20deg); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Background />
      <Navbar />
      <HeroSection />

      <div className="relative mx-auto max-w-6xl px-6">
        <Divider />
      </div>

      <OutcomesSection />

      <div className="relative mx-auto max-w-6xl px-6">
        <Divider />
      </div>

      <WhySection />

      <div className="relative mx-auto max-w-6xl px-6">
        <Divider />
      </div>

      <TrustSection />
      <CTASection />
    </main>
  );
}
