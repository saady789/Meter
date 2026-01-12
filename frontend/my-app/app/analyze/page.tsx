"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

type PaymentStatus = "SUCCESS" | "FAILED";

type Payment = {
  id: string;
  providerId: string;
  toolId: number;
  fromAddress: string;
  toAddress: string;
  amountCents: number;
  amountDecimal: number;
  currency: string;
  ticketId?: string | null;
  status: PaymentStatus;
  createdAt: string;
};

type BalanceResponse = {
  address: string;
  amount: number;
  decimalAmount: number;
  currency: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function shortAddr(a?: string | null, left = 6, right = 4) {
  if (!a) return "NA";
  if (a.length <= left + right + 3) return a;
  return `${a.slice(0, left)}...${a.slice(-right)}`;
}

function fmtMoney(n: number, currency = "MNEE") {
  const v = Number.isFinite(n) ? n : 0;
  return `${v.toFixed(3)} ${currency}`;
}

function fmtCompact(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${Math.round(v)}`;
}

function formatDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupRevenueByDay(payments: Payment[]) {
  const map = new Map<string, number>();

  for (const p of payments) {
    if (p.status !== "SUCCESS") continue;
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
    map.set(key, (map.get(key) || 0) + (p.amountDecimal || 0));
  }

  const rows = Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, value]) => ({
      key,
      day: formatDay(key),
      revenue: Number(value.toFixed(6)),
    }));

  let running = 0;
  return rows.map((r) => {
    running += r.revenue;
    return { ...r, cumulative: Number(running.toFixed(6)) };
  });
}

function revenueByTool(payments: Payment[]) {
  const map = new Map<
    number,
    { toolId: number; calls: number; revenue: number }
  >();
  for (const p of payments) {
    if (p.status !== "SUCCESS") continue;
    const cur = map.get(p.toolId) || { toolId: p.toolId, calls: 0, revenue: 0 };
    cur.calls += 1;
    cur.revenue += p.amountDecimal || 0;
    map.set(p.toolId, cur);
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((x) => ({
      tool: `Tool ${x.toolId}`,
      calls: x.calls,
      revenue: Number(x.revenue.toFixed(6)),
    }));
}

function sumSuccessful(payments: Payment[]) {
  return payments.reduce(
    (s, p) => (p.status === "SUCCESS" ? s + (p.amountDecimal || 0) : s),
    0
  );
}

function countSuccessful(payments: Payment[]) {
  return payments.reduce((c, p) => c + (p.status === "SUCCESS" ? 1 : 0), 0);
}

function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}

function makeGradientId(seed: string) {
  return `grad_${seed.replace(/[^a-z0-9]/gi, "")}`;
}

export default function AnalyzePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const providerWalletFallback = process.env.NEXT_PUBLIC_PROVIDER_WALLET || "";

  async function loadAll(isRefresh = false) {
    try {
      setErr(null);
      isRefresh ? setRefreshing(true) : setLoading(true);

      const pRes = await fetch(`${API_BASE}/payments?ts=${Date.now()}`);
      if (!pRes.ok) throw new Error(`payments ${pRes.status}`);
      const pJson = await pRes.json();
      const list: Payment[] = Array.isArray(pJson?.payments)
        ? pJson.payments
        : [];
      setPayments(list);

      const wallet =
        list[0]?.toAddress ||
        list.find((x) => x.toAddress)?.toAddress ||
        providerWalletFallback;

      if (wallet) {
        const bRes = await fetch(
          `${API_BASE}/wallet/balance?address=${encodeURIComponent(
            wallet
          )}&ts=${Date.now()}`
        );
        if (!bRes.ok) throw new Error(`balance ${bRes.status}`);
        const bJson = (await bRes.json()) as BalanceResponse;
        setBalance(bJson);
      } else {
        setBalance(null);
      }
    } catch (e: any) {
      setErr(typeof e?.message === "string" ? e.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const successfulCalls = useMemo(() => countSuccessful(payments), [payments]);
  const totalCalls = payments.length;
  const successRate = useMemo(
    () => (totalCalls === 0 ? 0 : successfulCalls / totalCalls),
    [successfulCalls, totalCalls]
  );
  const totalEarned = useMemo(() => sumSuccessful(payments), [payments]);
  const avgPerCall = useMemo(
    () => (successfulCalls === 0 ? 0 : totalEarned / successfulCalls),
    [totalEarned, successfulCalls]
  );

  const walletAddr =
    balance?.address || payments[0]?.toAddress || providerWalletFallback || "";
  const walletBal = balance?.decimalAmount ?? 0;
  const currency = balance?.currency || payments[0]?.currency || "MNEE";

  const daily = useMemo(() => groupRevenueByDay(payments), [payments]);
  const byTool = useMemo(() => revenueByTool(payments), [payments]);

  const maxDaily = useMemo(() => {
    if (daily.length === 0) return 1;
    return clamp(
      Math.max(...daily.map((d) => d.revenue)),
      1e-6,
      Number.POSITIVE_INFINITY
    );
  }, [daily]);

  const hero = useMemo(() => {
    const last = daily[daily.length - 1];
    const today = last?.revenue ?? 0;
    return {
      today,
      week: daily.slice(-7).reduce((s, x) => s + x.revenue, 0) || 0,
    };
  }, [daily]);

  const container = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, staggerChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 opacity-80 bg-[radial-gradient(1200px_700px_at_20%_0%,rgba(234,179,8,0.14),transparent_60%)]" />
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(900px_600px_at_80%_25%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-60 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent_35%,transparent_65%,rgba(255,255,255,0.03))]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Meter</div>
              <div className="text-xs text-white/50">Analyze</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
              Provider
            </span>
            <button
              onClick={() => loadAll(true)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
              disabled={refreshing}
              type="button"
            >
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Top line */}
          <motion.div variants={item} className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-200">
                Earnings
              </span>
              <span className="text-xs text-white/45">
                Wallet {walletAddr ? shortAddr(walletAddr, 10, 6) : "Not set"}
              </span>
            </div>

            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <div className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {fmtMoney(totalEarned, currency)}
                </div>
                <div className="text-sm text-white/55 mt-1">
                  Total earned from metered calls
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-white/55">Current balance</div>
                <div className="text-xl font-semibold">
                  {fmtMoney(walletBal, currency)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Error */}
          {err && (
            <motion.div
              variants={item}
              className="rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4"
            >
              <div className="text-sm text-red-200">Failed to load data</div>
              <div className="text-xs text-white/55 mt-1">{err}</div>
              <div className="text-xs text-white/55 mt-2">
                If this is a browser CORS issue, enable CORS on your Express
                server for your Next origin.
              </div>
            </motion.div>
          )}

          {/* KPI cards */}
          <motion.div
            variants={item}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Kpi
              label="Today"
              value={fmtMoney(hero.today, currency)}
              sub="Daily revenue"
              accent
            />
            <Kpi
              label="Last 7 days"
              value={fmtMoney(hero.week, currency)}
              sub="Rolling window"
            />
            <Kpi
              label="Calls"
              value={fmtCompact(successfulCalls)}
              sub={`Success rate ${pct(successRate)}`}
            />
            <Kpi
              label="Avg per call"
              value={fmtMoney(avgPerCall, currency)}
              sub="Across successful calls"
            />
          </motion.div>

          {/* Charts */}
          <motion.div
            variants={item}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <Panel className="lg:col-span-2">
              <PanelHeader
                title="Revenue over time"
                right={loading ? "Loading" : `${daily.length} days`}
              />
              <div className="h-[280px]">
                {daily.length === 0 ? (
                  <EmptyState
                    title="No revenue yet"
                    subtitle="Once calls start, this chart will populate."
                  />
                ) : (
                  <RevenueAreaChart data={daily} maxDaily={maxDaily} />
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="By tool"
                right={loading ? "Loading" : `${byTool.length} tools`}
              />
              <div className="h-[280px]">
                {byTool.length === 0 ? (
                  <EmptyState
                    title="No tool activity yet"
                    subtitle="Calls will show up here by tool."
                  />
                ) : (
                  <ToolBarChart data={byTool} />
                )}
              </div>
            </Panel>
          </motion.div>

          {/* Recent activity */}
          <motion.div variants={item}>
            <Panel>
              <PanelHeader
                title="Recent payments"
                right={
                  loading ? "Loading" : `${Math.min(25, payments.length)} shown`
                }
              />

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] text-white/45 border-b border-white/10">
                  <div className="col-span-3">Time</div>
                  <div className="col-span-2">Tool</div>
                  <div className="col-span-3">From</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-2 text-right">Status</div>
                </div>

                {loading && <RowLine muted label="Loading activity" />}

                {!loading && payments.length === 0 && (
                  <RowLine muted label="No payments yet" />
                )}

                {!loading &&
                  payments.slice(0, 25).map((p) => (
                    <div
                      key={p.id}
                      className="grid grid-cols-12 gap-3 px-5 py-3 text-sm border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition"
                    >
                      <div className="col-span-3 text-white/60">
                        {formatTime(p.createdAt)}
                      </div>
                      <div className="col-span-2 font-mono text-white/70">
                        {p.toolId}
                      </div>
                      <div className="col-span-3 font-mono text-white/70">
                        {shortAddr(p.fromAddress, 10, 6)}
                      </div>
                      <div className="col-span-2 text-white/85">
                        {fmtMoney(p.amountDecimal, p.currency)}
                      </div>
                      <div className="col-span-2 text-right">
                        <span
                          className={[
                            "text-[11px] px-2 py-1 rounded-full border",
                            p.status === "SUCCESS"
                              ? "bg-green-400/10 text-green-200 border-green-400/20"
                              : "bg-red-400/10 text-red-200 border-red-400/20",
                          ].join(" ")}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </Panel>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-3xl border backdrop-blur p-5",
        accent
          ? "bg-yellow-400/10 border-yellow-400/20"
          : "bg-white/5 border-white/10",
      ].join(" ")}
    >
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-white/45">{sub}</div>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl bg-white/5 border border-white/10 backdrop-blur p-5",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function PanelHeader({ title, right }: { title: string; right?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="text-sm font-semibold">{title}</div>
      {right ? <div className="text-xs text-white/45">{right}</div> : null}
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="h-full w-full rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-white/45 mt-1">{subtitle}</div>
      </div>
    </div>
  );
}

function RowLine({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div
      className={`px-5 py-5 text-sm ${muted ? "text-white/45" : "text-white"}`}
    >
      {label}
    </div>
  );
}

function RevenueAreaChart({
  data,
  maxDaily,
}: {
  data: Array<{
    key: string;
    day: string;
    revenue: number;
    cumulative: number;
  }>;
  maxDaily: number;
}) {
  const gid = makeGradientId("revenue");
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ left: 6, right: 12, top: 10, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#facc15" stopOpacity={0.26} />
            <stop offset="100%" stopColor="#facc15" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.10)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={38}
          domain={[0, Math.max(maxDaily * 1.25, 0.01)]}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(10,10,10,0.92)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14,
          }}
          labelStyle={{ color: "rgba(255,255,255,0.70)" }}
          itemStyle={{ color: "rgba(255,255,255,0.88)" }}
          formatter={(v: any) => [Number(v).toFixed(3), "Revenue"]}
        />

        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#facc15"
          strokeWidth={2}
          fill={`url(#${gid})`}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ToolBarChart({
  data,
}: {
  data: Array<{ tool: string; calls: number; revenue: number }>;
}) {
  const gid = makeGradientId("tool");
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 6, right: 12, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#facc15" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#facc15" stopOpacity={0.12} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis
          dataKey="tool"
          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.10)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={38}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(10,10,10,0.92)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14,
          }}
          labelStyle={{ color: "rgba(255,255,255,0.70)" }}
          itemStyle={{ color: "rgba(255,255,255,0.88)" }}
          formatter={(v: any) => [Number(v).toFixed(3), "Revenue"]}
        />

        <Bar dataKey="revenue" fill={`url(#${gid})`} radius={[10, 10, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
