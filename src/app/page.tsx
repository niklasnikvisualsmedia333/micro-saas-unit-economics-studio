"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import {
  AlertTriangle,
  BarChart3,
  Bot,
  Calculator,
  CheckCircle2,
  Copy,
  Download,
  FileDown,
  Gauge,
  GitCompare,
  HelpCircle,
  LineChart,
  ListChecks,
  Plus,
  Radar,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar as ReRadar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { aiCostPerUser, calculateScenario } from "@/lib/calculations";
import { money, number, percent } from "@/lib/format";
import {
  getFounderRecommendations,
  getRiskRadar,
  getSensitivityTable,
  scenarioToCsv,
} from "@/lib/insights";
import { createAiFeature, editableModelPricing } from "@/lib/models";
import {
  demoScenarios,
  duplicateScenario,
  scenarioFromTemplate,
  scenarioTemplates,
} from "@/lib/scenarios";
import {
  loadScenarios,
  parseScenarioImport,
  parseSharedScenario,
  saveScenarios,
} from "@/lib/storage";
import {
  defaultSimulationSettings,
  estimateAssetValue,
  getExperimentPlan,
  getIdeaScore,
  SimulationSettings,
  simulateGrowth,
} from "@/lib/simulator";
import { AiFeature, Scenario } from "@/lib/types";

type PageKey =
  | "dashboard"
  | "builder"
  | "ai"
  | "pricing"
  | "simulator"
  | "risk"
  | "compare"
  | "about";

const navItems: { key: PageKey; label: string; icon: typeof Gauge }[] = [
  { key: "dashboard", label: "Dashboard", icon: Gauge },
  { key: "builder", label: "Scenario Builder", icon: Calculator },
  { key: "ai", label: "AI/API Cost Guard", icon: Bot },
  { key: "pricing", label: "Break-even & Pricing", icon: LineChart },
  { key: "simulator", label: "Growth Simulator", icon: SlidersHorizontal },
  { key: "risk", label: "Risk Radar", icon: Radar },
  { key: "compare", label: "Comparison", icon: GitCompare },
  { key: "about", label: "How it works", icon: HelpCircle },
];

const chartColors = ["#14b8a6", "#6366f1", "#f59e0b", "#f43f5e", "#22c55e"];

export default function Home() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeId, setActiveId] = useState("");
  const [page, setPage] = useState<PageKey>("dashboard");
  const [importError, setImportError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // localStorage is browser-only, so scenarios hydrate after mount.
    const shared = new URLSearchParams(window.location.search).get("scenario");
    if (shared) {
      try {
        const scenario = parseSharedScenario(shared);
        setScenarios([scenario, ...loadScenarios()]);
        setActiveId(scenario.id);
        setNotice("Shared scenario imported into this browser.");
        window.history.replaceState({}, "", window.location.pathname);
        return;
      } catch {
        setNotice("Shared scenario link could not be imported.");
      }
    }
    const loaded = loadScenarios();
    setScenarios(loaded);
    setActiveId(loaded[0]?.id ?? "");
  }, []);

  useEffect(() => {
    if (scenarios.length > 0) saveScenarios(scenarios);
  }, [scenarios]);

  const activeScenario = scenarios.find((scenario) => scenario.id === activeId) ?? scenarios[0];
  const result = useMemo(
    () => (activeScenario ? calculateScenario(activeScenario) : null),
    [activeScenario],
  );

  function updateScenario(patch: Partial<Scenario>) {
    if (!activeScenario) return;
    setScenarios((current) =>
      current.map((scenario) =>
        scenario.id === activeScenario.id
          ? { ...scenario, ...patch, updatedAt: new Date().toISOString() }
          : scenario,
      ),
    );
  }

  function updateNumber(key: keyof Scenario, value: string) {
    updateScenario({ [key]: Number(value) || 0 } as Partial<Scenario>);
  }

  function updateFeature(featureId: string, patch: Partial<AiFeature>) {
    if (!activeScenario) return;
    updateScenario({
      aiFeatures: activeScenario.aiFeatures.map((feature) =>
        feature.id === featureId ? { ...feature, ...patch } : feature,
      ),
    });
  }

  function addScenario() {
    const base = duplicateScenario(demoScenarios()[0]);
    base.name = "New scenario";
    setScenarios((current) => [base, ...current]);
    setActiveId(base.id);
    setPage("builder");
  }

  function removeScenario(id: string) {
    const next = scenarios.filter((scenario) => scenario.id !== id);
    setScenarios(next.length > 0 ? next : demoScenarios());
    if (id === activeId) setActiveId(next[0]?.id ?? "demo-lean-b2b");
  }

  function exportScenarios() {
    const blob = new Blob([JSON.stringify(scenarios, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "micro-saas-scenarios.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const blob = new Blob([scenarioToCsv(scenarios)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "micro-saas-scenario-summary.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function shareScenario() {
    const encoded = btoa(encodeURIComponent(JSON.stringify(activeScenario)));
    const url = `${window.location.origin}${window.location.pathname}?scenario=${encoded}`;
    await navigator.clipboard.writeText(url);
    setNotice("Share link copied. It contains this scenario only.");
  }

  function createFromTemplate(template: Scenario) {
    const scenario = scenarioFromTemplate(template);
    setScenarios((current) => [scenario, ...current]);
    setActiveId(scenario.id);
    setPage("builder");
  }

  async function importScenarios(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = parseScenarioImport(await file.text());
      setScenarios(imported);
      setActiveId(imported[0]?.id ?? "");
      setImportError("");
    } catch {
      setImportError("Import failed. Please choose a valid scenario JSON export.");
    } finally {
      event.target.value = "";
    }
  }

  if (!activeScenario || !result) {
    return <main className="min-h-screen p-8 text-slate-100">Loading studio...</main>;
  }

  return (
    <main className="min-h-screen text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/60 p-5 lg:block">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-teal-400 text-slate-950">
                <BarChart3 size={21} />
              </div>
              <div>
                <p className="text-sm font-semibold">Micro-SaaS</p>
                <h1 className="text-lg font-semibold leading-tight">Unit Economics Studio</h1>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setPage(item.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    page === item.key
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Active scenario</p>
            <select
              value={activeScenario.id}
              onChange={(event) => setActiveId(event.target.value)}
              className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
            <HealthBadge status={result.healthStatus} className="mt-3" />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">Editable local scenarios, no API keys, no database</p>
                <h2 className="text-2xl font-semibold">{activeScenario.name}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <IconButton label="New" icon={Plus} onClick={addScenario} />
                <IconButton
                  label="Duplicate"
                  icon={Copy}
                  onClick={() => {
                    const copy = duplicateScenario(activeScenario);
                    setScenarios((current) => [copy, ...current]);
                    setActiveId(copy.id);
                  }}
                />
                <IconButton label="Export" icon={Download} onClick={exportScenarios} />
                <IconButton label="CSV" icon={FileDown} onClick={exportCsv} />
                <IconButton label="Share" icon={Share2} onClick={shareScenario} />
                <IconButton
                  label="Import"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                />
                <IconButton
                  label="Reset demos"
                  icon={RefreshCw}
                  onClick={() => {
                    const demos = demoScenarios();
                    setScenarios(demos);
                    setActiveId(demos[0].id);
                  }}
                />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={importScenarios}
            />
            {importError ? <p className="mt-2 text-sm text-rose-300">{importError}</p> : null}
            {notice ? <p className="mt-2 text-sm text-teal-200">{notice}</p> : null}
            <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPage(item.key)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                    page === item.key ? "bg-white text-slate-950" : "bg-white/10 text-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </header>

          <div className="p-4 lg:p-8">
            {page === "dashboard" ? (
              <Dashboard scenario={activeScenario} result={result} />
            ) : null}
            {page === "builder" ? (
              <ScenarioBuilder
                scenario={activeScenario}
                updateScenario={updateScenario}
                updateNumber={updateNumber}
                createFromTemplate={createFromTemplate}
              />
            ) : null}
            {page === "ai" ? (
              <AiCostGuard
                scenario={activeScenario}
                updateScenario={updateScenario}
                updateFeature={updateFeature}
              />
            ) : null}
            {page === "pricing" ? <Pricing scenario={activeScenario} result={result} /> : null}
            {page === "simulator" ? <GrowthSimulator scenario={activeScenario} /> : null}
            {page === "risk" ? <RiskRadarPage scenario={activeScenario} result={result} /> : null}
            {page === "compare" ? (
              <Comparison
                scenarios={scenarios}
                activeId={activeId}
                setActiveId={setActiveId}
                removeScenario={removeScenario}
              />
            ) : null}
            {page === "about" ? <About /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Dashboard({
  scenario,
  result,
}: {
  scenario: Scenario;
  result: ReturnType<typeof calculateScenario>;
}) {
  const recommendations = getFounderRecommendations(scenario);
  const growthData = Array.from({ length: 10 }, (_, index) => {
    const paidUsers = Math.max(1, Math.round((scenario.paidUsers || 20) * (index + 1) * 0.35));
    const simulated = calculateScenario({ ...scenario, paidUsers });
    return {
      users: paidUsers,
      revenue: Math.round(simulated.mrr),
      costs: Math.round(simulated.totalMonthlyCosts),
      profit: Math.round(simulated.netProfit),
    };
  });
  const costBreakdown = [
    { name: "Fixed", value: result.fixedCosts },
    { name: "Payment", value: result.paymentProcessingCosts },
    { name: "Non-AI variable", value: result.nonAiVariableCosts },
    { name: "AI/API", value: result.aiMonthlyCost },
  ].filter((item) => item.value > 0);
  const sensitivityData = [10, 25, 50, 75, 100, 150, 200].map((calls) => {
    const aiFeatures = scenario.aiFeatures.map((feature) => ({
      ...feature,
      callsPerPaidUserPerMonth: calls,
    }));
    const simulated = calculateScenario({ ...scenario, aiFeatures });
    return { calls, margin: Math.round(simulated.grossMarginPercentage) };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="MRR" value={money(result.mrr, scenario.currency)} />
        <Metric label="ARR" value={money(result.arr, scenario.currency)} />
        <Metric label="Paid users" value={number(scenario.paidUsers)} />
        <Metric label="Free users" value={number(scenario.freeUsers)} />
        <Metric label="Total monthly cost" value={money(result.totalMonthlyCosts, scenario.currency)} />
        <Metric label="AI/API monthly cost" value={money(result.aiMonthlyCost, scenario.currency)} />
        <Metric label="Net profit" value={money(result.netProfit, scenario.currency)} tone={result.netProfit >= 0 ? "good" : "bad"} />
        <Metric label="Gross margin" value={percent(result.grossMarginPercentage)} tone={result.grossMarginPercentage >= 70 ? "good" : "bad"} />
        <Metric label="Break-even users" value={number(result.breakEvenPaidUsers)} />
        <Metric label="Users for target MRR" value={number(result.requiredPaidUsersForTargetMRR)} />
        <Metric label="Churned users/month" value={number(result.monthlyChurnedUsers)} />
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-slate-400">Business health</p>
          <HealthBadge status={result.healthStatus} className="mt-3" />
        </div>
      </div>

      <Warnings warnings={result.warnings} />

      <Card title="What to do next">
        <div className="grid gap-3 md:grid-cols-2">
          {recommendations.map((recommendation) => (
            <div key={recommendation} className="rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              {recommendation}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Revenue vs costs over user growth">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData}>
              <CartesianGrid stroke="#263142" />
              <XAxis dataKey="users" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area dataKey="revenue" stroke="#14b8a6" fill="#14b8a633" />
              <Area dataKey="costs" stroke="#f43f5e" fill="#f43f5e22" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Profit curve by paid users">
          <ResponsiveContainer width="100%" height={280}>
            <ReLineChart data={growthData}>
              <CartesianGrid stroke="#263142" />
              <XAxis dataKey="users" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={3} dot={false} />
            </ReLineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Cost breakdown">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={costBreakdown} dataKey="value" nameKey="name" outerRadius={96} label>
                {costBreakdown.map((_, index) => (
                  <Cell key={index} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Margin sensitivity to API calls">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sensitivityData}>
              <CartesianGrid stroke="#263142" />
              <XAxis dataKey="calls" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="margin" fill="#14b8a6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ScenarioBuilder({
  scenario,
  updateScenario,
  updateNumber,
  createFromTemplate,
}: {
  scenario: Scenario;
  updateScenario: (patch: Partial<Scenario>) => void;
  updateNumber: (key: keyof Scenario, value: string) => void;
  createFromTemplate: (scenario: Scenario) => void;
}) {
  const templates = scenarioTemplates();

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Card title="Start from a template">
        <div className="grid gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => createFromTemplate(template)}
              className="rounded-lg border border-white/10 bg-slate-950/40 p-4 text-left transition hover:border-teal-300/50 hover:bg-white/[0.07]"
            >
              <p className="font-medium">{template.name}</p>
              <p className="mt-1 text-sm text-slate-400">{template.description}</p>
            </button>
          ))}
        </div>
      </Card>
      <Card title="Scenario identity">
        <Label label="Name">
          <input className={inputClass} value={scenario.name} onChange={(e) => updateScenario({ name: e.target.value })} />
        </Label>
        <Label label="Description">
          <textarea className={`${inputClass} min-h-24`} value={scenario.description} onChange={(e) => updateScenario({ description: e.target.value })} />
        </Label>
        <Label label="Currency">
          <select className={inputClass} value={scenario.currency} onChange={(e) => updateScenario({ currency: e.target.value as Scenario["currency"] })}>
            <option>EUR</option>
            <option>USD</option>
            <option>GBP</option>
          </select>
        </Label>
      </Card>
      <Card title="Traffic and conversion">
        <NumberField label="Monthly visitors" value={scenario.monthlyVisitors} onChange={(v) => updateNumber("monthlyVisitors", v)} />
        <NumberField label="Signup conversion %" value={scenario.signupConversionRate} onChange={(v) => updateNumber("signupConversionRate", v)} />
        <NumberField label="Free to paid conversion %" value={scenario.freeToPaidConversionRate} onChange={(v) => updateNumber("freeToPaidConversionRate", v)} />
        <NumberField label="Monthly churn %" value={scenario.monthlyChurnRate} onChange={(v) => updateNumber("monthlyChurnRate", v)} />
      </Card>
      <Card title="Users and pricing">
        <NumberField label="Paid users" value={scenario.paidUsers} onChange={(v) => updateNumber("paidUsers", v)} />
        <NumberField label="Free users" value={scenario.freeUsers} onChange={(v) => updateNumber("freeUsers", v)} />
        <NumberField label="Average price per month" value={scenario.averagePricePerMonth} onChange={(v) => updateNumber("averagePricePerMonth", v)} />
        <NumberField label="Target MRR" value={scenario.targetMRR} onChange={(v) => updateNumber("targetMRR", v)} />
        <NumberField label="Target ARR" value={scenario.targetARR} onChange={(v) => updateNumber("targetARR", v)} />
      </Card>
      <Card title="Costs">
        <NumberField label="Fixed monthly costs" value={scenario.fixedMonthlyCosts} onChange={(v) => updateNumber("fixedMonthlyCosts", v)} />
        <NumberField label="Variable cost per paid user" value={scenario.variableCostPerPaidUser} onChange={(v) => updateNumber("variableCostPerPaidUser", v)} />
        <NumberField label="Variable cost per free user" value={scenario.variableCostPerFreeUser} onChange={(v) => updateNumber("variableCostPerFreeUser", v)} />
        <NumberField label="Payment fee %" value={scenario.paymentFeePercent} onChange={(v) => updateNumber("paymentFeePercent", v)} />
        <NumberField label="Payment fixed fee" value={scenario.paymentFeeFixed} onChange={(v) => updateNumber("paymentFeeFixed", v)} />
      </Card>
    </div>
  );
}

function GrowthSimulator({ scenario }: { scenario: Scenario }) {
  const [settings, setSettings] = useState<SimulationSettings>(() =>
    defaultSimulationSettings(scenario),
  );

  useEffect(() => {
    setSettings(defaultSimulationSettings(scenario));
  }, [scenario]);

  const simulation = useMemo(() => simulateGrowth(scenario, settings), [scenario, settings]);
  const ideaScore = getIdeaScore(scenario);
  const asset = estimateAssetValue(scenario);
  const experiments = getExperimentPlan(scenario);
  const finalMonth = simulation[simulation.length - 1];
  const firstMonth = simulation[0];

  function updateSetting(key: keyof SimulationSettings, value: string) {
    setSettings((current) => ({ ...current, [key]: Number(value) || 0 }));
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Idea score"
          value={`${ideaScore.score}/100`}
          tone={ideaScore.score >= 70 ? "good" : ideaScore.score < 50 ? "bad" : undefined}
        />
        <Metric label="Verdict" value={ideaScore.verdict} />
        <Metric label="Month 12 MRR" value={money(finalMonth.mrr, scenario.currency)} />
        <Metric label="Estimated asset value" value={money(asset.estimatedValue, scenario.currency)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card title="Simulation controls">
          <div className="grid gap-3 md:grid-cols-2">
            <NumberField label="Months" value={settings.months} onChange={(v) => updateSetting("months", v)} />
            <NumberField label="Starting paid users" value={settings.startingPaidUsers} onChange={(v) => updateSetting("startingPaidUsers", v)} />
            <NumberField label="Starting free users" value={settings.startingFreeUsers} onChange={(v) => updateSetting("startingFreeUsers", v)} />
            <NumberField label="New paid users / month" value={settings.monthlyNewPaidUsers} onChange={(v) => updateSetting("monthlyNewPaidUsers", v)} />
            <NumberField label="Visitor growth % / month" value={settings.monthlyVisitorGrowthRate} onChange={(v) => updateSetting("monthlyVisitorGrowthRate", v)} />
            <NumberField label="Free user growth % / month" value={settings.monthlyFreeUserGrowthRate} onChange={(v) => updateSetting("monthlyFreeUserGrowthRate", v)} />
            <NumberField label="Price growth % / month" value={settings.priceGrowthRate} onChange={(v) => updateSetting("priceGrowthRate", v)} />
            <NumberField label="AI usage growth % / month" value={settings.aiUsageGrowthRate} onChange={(v) => updateSetting("aiUsageGrowthRate", v)} />
            <NumberField label="Fixed cost growth % / month" value={settings.fixedCostGrowthRate} onChange={(v) => updateSetting("fixedCostGrowthRate", v)} />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Base churn, payment fees, token usage, and editable OpenAI/API model costs still come from Scenario Builder and AI/API Cost Guard.
          </p>
        </Card>

        <ChartCard title="Revenue, costs, and profit over time">
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={simulation}>
              <CartesianGrid stroke="#263142" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area dataKey="mrr" name="MRR" stroke="#14b8a6" fill="#14b8a633" />
              <Area dataKey="totalCosts" name="Total costs" stroke="#f43f5e" fill="#f43f5e22" />
              <Area dataKey="netProfit" name="Net profit" stroke="#6366f1" fill="#6366f122" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Variable and AI/API costs while scaling">
          <ResponsiveContainer width="100%" height={300}>
            <ReLineChart data={simulation}>
              <CartesianGrid stroke="#263142" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="variableCosts" name="Variable costs" stroke="#f59e0b" strokeWidth={3} dot={false} />
              <Line dataKey="aiCosts" name="AI/API costs" stroke="#f43f5e" strokeWidth={3} dot={false} />
            </ReLineChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card title="Founder experiment plan">
          <div className="space-y-3">
            {experiments.map((experiment) => (
              <div key={experiment.title} className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <ListChecks className="mt-0.5 text-teal-300" size={18} />
                  <div>
                    <p className="font-medium">{experiment.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{experiment.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="TrustMRR-style asset benchmark">
          <dl className="space-y-3 text-sm">
            {[
              ["Month 1 MRR", money(firstMonth.mrr, scenario.currency)],
              ["Month 12 MRR", money(finalMonth.mrr, scenario.currency)],
              ["Month 12 AI/API cost", money(finalMonth.aiCosts, scenario.currency)],
              ["Month 12 net profit", money(finalMonth.netProfit, scenario.currency)],
              ["Estimated annual owner earnings", money(asset.sellerDiscretionaryEarnings, scenario.currency)],
              ["Revenue multiple assumption", `${asset.revenueMultiple.toFixed(1)}x ARR`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-white/10 pb-2">
                <dt className="text-slate-400">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Idea score reasons">
          <div className="grid gap-3 md:grid-cols-2">
            {ideaScore.reasons.map((reason) => (
              <div key={reason} className="rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                {reason}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function RiskRadarPage({
  scenario,
  result,
}: {
  scenario: Scenario;
  result: ReturnType<typeof calculateScenario>;
}) {
  const radarData = getRiskRadar(scenario);
  const sensitivity = getSensitivityTable(scenario);
  const recommendations = getFounderRecommendations(scenario);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <ChartCard title="Risk radar">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#263142" />
              <PolarAngleAxis dataKey="factor" stroke="#cbd5e1" />
              <ReRadar dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.28} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card title="Decision brief">
          <div className="space-y-4 text-sm leading-6 text-slate-300">
            <p>
              Current health is <strong className="text-white">{result.healthStatus}</strong> with{" "}
              {percent(result.grossMarginPercentage)} gross margin and{" "}
              {money(result.netProfit, scenario.currency)} monthly net profit.
            </p>
            <div className="space-y-3">
              {recommendations.map((recommendation) => (
                <div key={recommendation} className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                  {recommendation}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Sensitivity table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="border-b border-white/10 py-3">Case</th>
                <th className="border-b border-white/10 py-3">Net profit</th>
                <th className="border-b border-white/10 py-3">Gross margin</th>
                <th className="border-b border-white/10 py-3">Health</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((row) => (
                <tr key={row.case}>
                  <td className="border-b border-white/10 py-3 text-slate-300">{row.case}</td>
                  <td className="border-b border-white/10 py-3">{money(row.netProfit, scenario.currency)}</td>
                  <td className="border-b border-white/10 py-3">{percent(row.margin)}</td>
                  <td className="border-b border-white/10 py-3">
                    <HealthBadge status={row.health} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AiCostGuard({
  scenario,
  updateScenario,
  updateFeature,
}: {
  scenario: Scenario;
  updateScenario: (patch: Partial<Scenario>) => void;
  updateFeature: (featureId: string, patch: Partial<AiFeature>) => void;
}) {
  const result = calculateScenario(scenario);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
        Model prices are editable assumptions for planning only. They are not live pricing and should be verified before launch.
      </div>
      <div className="flex justify-end">
        <IconButton
          label="Add feature"
          icon={Plus}
          onClick={() => updateScenario({ aiFeatures: [...scenario.aiFeatures, createAiFeature()] })}
        />
      </div>
      {scenario.aiFeatures.length === 0 ? (
        <EmptyState text="No AI/API features yet. Add one to see usage costs per free and paid user." />
      ) : (
        <div className="space-y-4">
          {scenario.aiFeatures.map((feature) => {
            const freeCost = aiCostPerUser(feature, "free");
            const paidCost = aiCostPerUser(feature, "paid");
            const total = freeCost * scenario.freeUsers + paidCost * scenario.paidUsers;
            const ratio = result.mrr ? (total / result.mrr) * 100 : 0;

            return (
              <Card key={feature.id} title={feature.name}>
                <div className="grid gap-4 lg:grid-cols-4">
                  <Label label="Feature name">
                    <input className={inputClass} value={feature.name} onChange={(e) => updateFeature(feature.id, { name: e.target.value })} />
                  </Label>
                  <Label label="Model">
                    <select
                      className={inputClass}
                      value={feature.modelName}
                      onChange={(event) => {
                        const model = editableModelPricing.find((item) => item.name === event.target.value);
                        updateFeature(feature.id, {
                          modelName: event.target.value,
                          inputCostPerMillionTokens: model?.inputCostPerMillionTokens ?? feature.inputCostPerMillionTokens,
                          outputCostPerMillionTokens: model?.outputCostPerMillionTokens ?? feature.outputCostPerMillionTokens,
                        });
                      }}
                    >
                      {editableModelPricing.map((model) => (
                        <option key={model.name}>{model.name}</option>
                      ))}
                    </select>
                  </Label>
                  <NumberField label="Input tokens/call" value={feature.inputTokensPerCall} onChange={(v) => updateFeature(feature.id, { inputTokensPerCall: Number(v) || 0 })} />
                  <NumberField label="Output tokens/call" value={feature.outputTokensPerCall} onChange={(v) => updateFeature(feature.id, { outputTokensPerCall: Number(v) || 0 })} />
                  <NumberField label="Calls/free user/mo" value={feature.callsPerFreeUserPerMonth} onChange={(v) => updateFeature(feature.id, { callsPerFreeUserPerMonth: Number(v) || 0 })} />
                  <NumberField label="Calls/paid user/mo" value={feature.callsPerPaidUserPerMonth} onChange={(v) => updateFeature(feature.id, { callsPerPaidUserPerMonth: Number(v) || 0 })} />
                  <NumberField label="Input cost / 1M tokens" value={feature.inputCostPerMillionTokens} onChange={(v) => updateFeature(feature.id, { inputCostPerMillionTokens: Number(v) || 0 })} />
                  <NumberField label="Output cost / 1M tokens" value={feature.outputCostPerMillionTokens} onChange={(v) => updateFeature(feature.id, { outputCostPerMillionTokens: Number(v) || 0 })} />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <Metric label="Cost/free user" value={money(freeCost, scenario.currency)} />
                  <Metric label="Cost/paid user" value={money(paidCost, scenario.currency)} />
                  <Metric label="Monthly feature cost" value={money(total, scenario.currency)} />
                  <Metric label="% of revenue" value={percent(ratio)} tone={ratio > 20 ? "bad" : "good"} />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={feature.enabled} onChange={(e) => updateFeature(feature.id, { enabled: e.target.checked })} />
                    Enabled
                  </label>
                  <button
                    onClick={() => updateScenario({ aiFeatures: scenario.aiFeatures.filter((item) => item.id !== feature.id) })}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-400/30 px-3 py-2 text-sm text-rose-200 hover:bg-rose-400/10"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Pricing({
  scenario,
  result,
}: {
  scenario: Scenario;
  result: ReturnType<typeof calculateScenario>;
}) {
  const rows = [
    ["Break-even paid users", number(result.breakEvenPaidUsers), "Customers needed before monthly profit turns positive."],
    ["Paid users for target MRR", number(result.requiredPaidUsersForTargetMRR), `Target MRR is ${money(scenario.targetMRR, scenario.currency)}.`],
    ["Paid users for target ARR", number(result.requiredPaidUsersForTargetARR), `Target ARR is ${money(scenario.targetARR, scenario.currency)}.`],
    ["Price for 80% gross margin", money(result.requiredPriceForTargetGrossMargin, scenario.currency), "Based on current per-user costs and payment fees."],
    ["Max AI cost per paid user", money(result.maximumAiCostPerPaidUserFor80Margin, scenario.currency), "Monthly API budget that keeps paid-user margin near 80%."],
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Card title="Pricing answers">
        <div className="space-y-3">
          {rows.map(([label, value, helper]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{helper}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Founder readout">
        <div className="space-y-4 text-sm leading-6 text-slate-300">
          <p>
            At {money(scenario.averagePricePerMonth, scenario.currency)} per month, each paid user contributes about{" "}
            {money(result.contributionPerPaidUser, scenario.currency)} after direct costs.
          </p>
          <p>
            The model is most sensitive to paid conversion, churn, and AI calls per paid user. If those move in the wrong direction together, the economics can deteriorate quickly.
          </p>
          <p>
            A practical next experiment is to cap expensive AI usage, test a higher price point, and validate whether users will still convert before scaling free acquisition.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Comparison({
  scenarios,
  activeId,
  setActiveId,
  removeScenario,
}: {
  scenarios: Scenario[];
  activeId: string;
  setActiveId: (id: string) => void;
  removeScenario: (id: string) => void;
}) {
  const visible = scenarios.slice(0, 3);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">Compare up to 3 saved scenarios side by side. The first three are shown here to keep the view focused.</p>
      <div className="grid gap-4 xl:grid-cols-3">
        {visible.map((scenario) => {
          const result = calculateScenario(scenario);

          return (
            <Card key={scenario.id} title={scenario.name}>
              <p className="mb-4 text-sm text-slate-400">{scenario.description}</p>
              <HealthBadge status={result.healthStatus} />
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ["Price", money(scenario.averagePricePerMonth, scenario.currency)],
                  ["Paid users", number(scenario.paidUsers)],
                  ["MRR", money(result.mrr, scenario.currency)],
                  ["ARR", money(result.arr, scenario.currency)],
                  ["AI cost", money(result.aiMonthlyCost, scenario.currency)],
                  ["Total cost", money(result.totalMonthlyCosts, scenario.currency)],
                  ["Net profit", money(result.netProfit, scenario.currency)],
                  ["Gross margin", percent(result.grossMarginPercentage)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-white/10 pb-2">
                    <dt className="text-slate-400">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setActiveId(scenario.id)} className="rounded-lg bg-white px-3 py-2 text-sm text-slate-950">
                  {scenario.id === activeId ? "Active" : "Open"}
                </button>
                <button onClick={() => removeScenario(scenario.id)} className="rounded-lg border border-rose-400/30 px-3 py-2 text-sm text-rose-200">
                  Delete
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="What this studio does">
        <div className="space-y-3 text-sm leading-6 text-slate-300">
          <p>It helps founders pressure-test a Micro-SaaS or AI-SaaS idea before spending money on infrastructure or ads.</p>
          <p>All calculations run in your browser. Scenarios are saved in localStorage and can be exported or imported as JSON.</p>
          <p>v0.1 intentionally avoids authentication, paid APIs, Stripe, databases, and OpenAI integration so it can deploy cheaply on Vercel.</p>
        </div>
      </Card>
      <Card title="How to think with it">
        <div className="space-y-3 text-sm leading-6 text-slate-300">
          <p>Start with a realistic traffic source, then model conversion and churn conservatively.</p>
          <p>Use the AI/API Cost Guard to make expensive usage visible before it becomes part of your product promise.</p>
          <p>Compare a lean paid plan against a freemium plan. The best answer is often hiding in the gap between those two.</p>
        </div>
      </Card>
    </div>
  );
}

function Warnings({ warnings }: { warnings: ReturnType<typeof calculateScenario>["warnings"] }) {
  if (warnings.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">
        <CheckCircle2 size={20} />
        No major warning flags for the current assumptions.
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {warnings.map((warning) => (
        <div key={warning.id} className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 text-amber-300" size={18} />
            <div>
              <p className="font-medium text-amber-100">{warning.title}</p>
              <p className="mt-1 text-sm text-amber-100/75">{warning.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-rose-300" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/10">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Label({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <Label label={label}>
      <input className={inputClass} type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} />
    </Label>
  );
}

function IconButton({ label, icon: Icon, onClick }: { label: string; icon: typeof Plus; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 hover:bg-white/15">
      <Icon size={16} />
      {label}
    </button>
  );
}

function HealthBadge({ status, className = "" }: { status: string; className?: string }) {
  const styles: Record<string, string> = {
    Healthy: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    Watch: "border-amber-400/30 bg-amber-400/10 text-amber-100",
    Risky: "border-orange-400/30 bg-orange-400/10 text-orange-100",
    Broken: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${styles[status] ?? styles.Watch} ${className}`}>
      {status}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-slate-400">{text}</div>;
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-teal-300";

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  color: "#f8fafc",
};
