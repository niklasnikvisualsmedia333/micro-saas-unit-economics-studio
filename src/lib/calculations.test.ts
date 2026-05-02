import { describe, expect, it } from "vitest";
import { calculateScenario, estimatePaidUsersFromConversion } from "./calculations";
import { getFounderRecommendations, getRiskRadar, scenarioToCsv } from "./insights";
import { demoScenarios } from "./scenarios";

describe("unit economics calculations", () => {
  it("estimates paid users from traffic and conversion rates", () => {
    expect(estimatePaidUsersFromConversion(10_000, 10, 5)).toBe(50);
  });

  it("calculates MRR, ARR, costs, and positive profit for the lean demo", () => {
    const result = calculateScenario(demoScenarios()[0]);

    expect(result.mrr).toBe(2808);
    expect(result.arr).toBe(33696);
    expect(result.totalMonthlyCosts).toBeGreaterThan(0);
    expect(result.netProfit).toBeGreaterThan(0);
  });

  it("flags the AI-heavy demo as economically risky", () => {
    const result = calculateScenario(demoScenarios()[1]);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(["Risky", "Broken", "Watch"]).toContain(result.healthStatus);
  });

  it("creates founder insights and CSV exports", () => {
    const scenarios = demoScenarios();

    expect(getRiskRadar(scenarios[0])).toHaveLength(5);
    expect(getFounderRecommendations(scenarios[1]).length).toBeGreaterThan(0);
    expect(scenarioToCsv(scenarios)).toContain("Lean B2B Micro-SaaS");
  });
});
