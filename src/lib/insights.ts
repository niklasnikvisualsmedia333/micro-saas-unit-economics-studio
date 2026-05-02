import { calculateScenario } from "./calculations";
import { Scenario } from "./types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function getRiskRadar(scenario: Scenario) {
  const result = calculateScenario(scenario);
  const trafficRatio = result.estimatedPaidUsers === 0 ? 0 : scenario.paidUsers / result.estimatedPaidUsers;
  const aiRatio = result.mrr === 0 ? 1 : result.aiMonthlyCost / result.mrr;
  const fixedRatio = result.mrr === 0 ? 1 : scenario.fixedMonthlyCosts / result.mrr;

  return [
    {
      factor: "Margin",
      score: Math.round(clamp(result.grossMarginPercentage)),
    },
    {
      factor: "Traffic",
      score: Math.round(clamp(100 - Math.max(0, trafficRatio - 1) * 45)),
    },
    {
      factor: "AI control",
      score: Math.round(clamp(100 - aiRatio * 260)),
    },
    {
      factor: "Churn",
      score: Math.round(clamp(100 - scenario.monthlyChurnRate * 8)),
    },
    {
      factor: "Fixed costs",
      score: Math.round(clamp(100 - fixedRatio * 150)),
    },
  ];
}

export function getFounderRecommendations(scenario: Scenario) {
  const result = calculateScenario(scenario);
  const recommendations: string[] = [];

  if (result.netProfit < 0) {
    recommendations.push("First priority: make the base case profitable before scaling traffic.");
  }
  if (result.grossMarginPercentage < 75) {
    recommendations.push("Test a higher price or lower per-user costs until gross margin clears 75%.");
  }
  if (result.aiMonthlyCost > result.mrr * 0.15) {
    recommendations.push("Add usage caps or model routing before promising unlimited AI usage.");
  }
  if (scenario.monthlyChurnRate >= 5) {
    recommendations.push("Reduce churn assumptions before trusting ARR targets; retention is the compounding engine.");
  }
  if (result.requiredPaidUsersForTargetARR > result.estimatedPaidUsers * 2 && scenario.monthlyVisitors > 0) {
    recommendations.push("ARR target likely needs a traffic, conversion, or pricing upgrade.");
  }
  if (recommendations.length === 0) {
    recommendations.push("This scenario is directionally healthy. Next, validate willingness to pay with real prospects.");
    recommendations.push("Keep the cost model updated as soon as real usage data arrives.");
  }

  return recommendations.slice(0, 4);
}

export function getSensitivityTable(scenario: Scenario) {
  const priceMoves = [-20, 0, 20];
  const churnMoves = [-2, 0, 2];

  return priceMoves.flatMap((priceMove) =>
    churnMoves.map((churnMove) => {
      const simulated = calculateScenario({
        ...scenario,
        averagePricePerMonth: scenario.averagePricePerMonth * (1 + priceMove / 100),
        monthlyChurnRate: Math.max(0, scenario.monthlyChurnRate + churnMove),
      });

      return {
        case: `${priceMove > 0 ? "+" : ""}${priceMove}% price, ${churnMove > 0 ? "+" : ""}${churnMove}pt churn`,
        priceMove,
        churnMove,
        netProfit: Math.round(simulated.netProfit),
        margin: Math.round(simulated.grossMarginPercentage),
        health: simulated.healthStatus,
      };
    }),
  );
}

export function scenarioToCsv(scenarios: Scenario[]) {
  const headers = [
    "name",
    "price",
    "paidUsers",
    "freeUsers",
    "mrr",
    "arr",
    "aiMonthlyCost",
    "totalMonthlyCosts",
    "netProfit",
    "grossMarginPercentage",
    "healthStatus",
  ];
  const rows = scenarios.map((scenario) => {
    const result = calculateScenario(scenario);
    return [
      scenario.name,
      scenario.averagePricePerMonth,
      scenario.paidUsers,
      scenario.freeUsers,
      result.mrr,
      result.arr,
      result.aiMonthlyCost,
      result.totalMonthlyCosts,
      result.netProfit,
      result.grossMarginPercentage,
      result.healthStatus,
    ];
  });

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}
