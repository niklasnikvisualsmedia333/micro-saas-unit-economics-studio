import { calculateScenario } from "./calculations";
import { Scenario } from "./types";

export type SimulationSettings = {
  months: number;
  startingPaidUsers: number;
  startingFreeUsers: number;
  monthlyVisitorGrowthRate: number;
  monthlyNewPaidUsers: number;
  monthlyFreeUserGrowthRate: number;
  priceGrowthRate: number;
  aiUsageGrowthRate: number;
  fixedCostGrowthRate: number;
};

export function defaultSimulationSettings(scenario: Scenario): SimulationSettings {
  return {
    months: 12,
    startingPaidUsers: scenario.paidUsers,
    startingFreeUsers: scenario.freeUsers,
    monthlyVisitorGrowthRate: 8,
    monthlyNewPaidUsers: Math.max(2, Math.round(scenario.paidUsers * 0.08)),
    monthlyFreeUserGrowthRate: 7,
    priceGrowthRate: 0,
    aiUsageGrowthRate: 3,
    fixedCostGrowthRate: 1.5,
  };
}

export function simulateGrowth(scenario: Scenario, settings: SimulationSettings) {
  let paidUsers = settings.startingPaidUsers;
  let freeUsers = settings.startingFreeUsers;
  let monthlyVisitors = scenario.monthlyVisitors;
  let averagePricePerMonth = scenario.averagePricePerMonth;
  let fixedMonthlyCosts = scenario.fixedMonthlyCosts;

  return Array.from({ length: Math.max(1, Math.round(settings.months)) }, (_, index) => {
    const month = index + 1;
    const simulatedScenario: Scenario = {
      ...scenario,
      paidUsers: Math.max(0, Math.round(paidUsers)),
      freeUsers: Math.max(0, Math.round(freeUsers)),
      monthlyVisitors: Math.max(0, Math.round(monthlyVisitors)),
      averagePricePerMonth,
      fixedMonthlyCosts,
      aiFeatures: scenario.aiFeatures.map((feature) => ({
        ...feature,
        callsPerFreeUserPerMonth:
          feature.callsPerFreeUserPerMonth *
          (1 + (settings.aiUsageGrowthRate / 100) * index),
        callsPerPaidUserPerMonth:
          feature.callsPerPaidUserPerMonth *
          (1 + (settings.aiUsageGrowthRate / 100) * index),
      })),
    };
    const result = calculateScenario(simulatedScenario);

    paidUsers =
      paidUsers * (1 - scenario.monthlyChurnRate / 100) + settings.monthlyNewPaidUsers;
    freeUsers *= 1 + settings.monthlyFreeUserGrowthRate / 100;
    monthlyVisitors *= 1 + settings.monthlyVisitorGrowthRate / 100;
    averagePricePerMonth *= 1 + settings.priceGrowthRate / 100;
    fixedMonthlyCosts *= 1 + settings.fixedCostGrowthRate / 100;

    return {
      month,
      paidUsers: simulatedScenario.paidUsers,
      freeUsers: simulatedScenario.freeUsers,
      visitors: simulatedScenario.monthlyVisitors,
      mrr: Math.round(result.mrr),
      arr: Math.round(result.arr),
      totalCosts: Math.round(result.totalMonthlyCosts),
      variableCosts: Math.round(
        result.paymentProcessingCosts + result.nonAiVariableCosts + result.aiMonthlyCost,
      ),
      aiCosts: Math.round(result.aiMonthlyCost),
      netProfit: Math.round(result.netProfit),
      grossMargin: Math.round(result.grossMarginPercentage),
      health: result.healthStatus,
    };
  });
}

export function getIdeaScore(scenario: Scenario) {
  const result = calculateScenario(scenario);
  const marginScore = Math.min(30, Math.max(0, result.grossMarginPercentage * 0.3));
  const profitScore = result.netProfit > 0 ? 20 : Math.max(0, 20 + result.netMarginPercentage * 0.4);
  const churnScore = Math.max(0, 18 - scenario.monthlyChurnRate * 2);
  const aiScore =
    result.mrr === 0 ? 6 : Math.max(0, 16 - (result.aiMonthlyCost / result.mrr) * 55);
  const trafficScore =
    result.estimatedPaidUsers >= scenario.paidUsers * 0.75 ? 16 : Math.max(0, result.estimatedPaidUsers);
  const score = Math.round(Math.min(100, marginScore + profitScore + churnScore + aiScore + trafficScore));

  return {
    score,
    verdict: score >= 75 ? "Build" : score >= 55 ? "Validate first" : "Avoid for now",
    reasons: [
      result.grossMarginPercentage >= 75
        ? "Gross margin can support a SaaS business."
        : "Gross margin needs improvement before scaling.",
      result.netProfit >= 0
        ? "The current base case is profitable."
        : "The current base case loses money.",
      scenario.monthlyChurnRate <= 4
        ? "Churn assumption is manageable."
        : "Churn could block compounding growth.",
      result.aiMonthlyCost <= result.mrr * 0.15
        ? "AI/API spend is under control."
        : "AI/API spend needs caps, routing, or higher pricing.",
    ],
  };
}

export function getExperimentPlan(scenario: Scenario) {
  const result = calculateScenario(scenario);
  const experiments = [
    {
      title: "Willingness-to-pay test",
      action: `Pitch ${Math.round(scenario.averagePricePerMonth * 1.25)} ${scenario.currency}/mo to 10 target customers and track objections.`,
    },
    {
      title: "Usage-cap test",
      action: `Limit paid users to ${Math.max(10, Math.round(result.maximumAiCostPerPaidUserFor80Margin / Math.max(result.aiCostPerPaidUser, 0.01) * 100))}% of current AI usage and see whether the core value still holds.`,
    },
    {
      title: "Conversion test",
      action: `Build one landing page variant aimed at raising free-to-paid conversion from ${scenario.freeToPaidConversionRate}% to ${(scenario.freeToPaidConversionRate + 2).toFixed(1)}%.`,
    },
  ];

  if (result.netProfit < 0) {
    experiments.unshift({
      title: "Profitability rescue",
      action: "Create a no-free-plan version of this scenario and compare whether paid-first economics work.",
    });
  }

  return experiments.slice(0, 4);
}

export function estimateAssetValue(scenario: Scenario) {
  const result = calculateScenario(scenario);
  const profitMultiple = result.netProfit > 0 ? 24 : 6;
  const revenueMultiple =
    result.healthStatus === "Healthy" ? 3.5 : result.healthStatus === "Watch" ? 2.3 : 1.1;
  const revenueValue = result.mrr * 12 * revenueMultiple;
  const profitValue = Math.max(0, result.netProfit * profitMultiple);
  const estimatedValue = Math.round(Math.max(revenueValue * 0.55, profitValue));

  return {
    estimatedValue,
    revenueMultiple,
    profitMultiple,
    sellerDiscretionaryEarnings: Math.max(0, Math.round(result.netProfit * 12)),
  };
}
