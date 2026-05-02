import { demoScenarios, scenarioSchema, scenariosSchema } from "./scenarios";
import { Scenario } from "./types";

const STORAGE_KEY = "micro-saas-unit-economics-studio:scenarios";

export function loadScenarios(): Scenario[] {
  if (typeof window === "undefined") return demoScenarios();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const demos = demoScenarios();
    saveScenarios(demos);
    return demos;
  }

  try {
    return scenariosSchema.parse(JSON.parse(raw));
  } catch {
    const demos = demoScenarios();
    saveScenarios(demos);
    return demos;
  }
}

export function saveScenarios(scenarios: Scenario[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function parseScenarioImport(json: string): Scenario[] {
  const parsed = JSON.parse(json);
  return scenariosSchema.parse(parsed);
}

export function parseSharedScenario(encoded: string): Scenario {
  const json = decodeURIComponent(atob(encoded));
  return scenarioSchema.parse(JSON.parse(json));
}
