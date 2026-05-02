import { AiFeature, HealthStatus, Scenario, WarningFlag } from "./types";

const pct = (value: number) => value / 100;
const safeDiv = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : numerator / denominator;

export function estimateSignups(monthlyVisitors: number, signupConversionRate: number) {
  return monthlyVisitors * pct(signupConversionRate);
}

export function estimatePaidUsersFromConversion(
  monthlyVisitors: number,
  signupConversionRate: number,
  freeToPaidConversionRate: number,
) {
  return estimateSignups(monthlyVisitors, signupConversionRate) * pct(freeToPaidConversionRate);
}

export function calculateMrr(paidUsers: number, averagePricePerMonth: number) {
  return paidUsers * averagePricePerMonth;
}

export function calculateArr(mrr: number) {
  return mrr * 12;
}

export function calculateMonthlyChurnedUsers(paidUsers: number, monthlyChurnRate: number) {
  return paidUsers * pct(monthlyChurnRate);
}

export function calculatePaymentProcessingCosts(
  grossRevenue: number,
  paidUsers: number,
  paymentFeePercent: number,
  paymentFeeFixed: number,
) {
  return grossRevenue * pct(paymentFeePercent) + paidUsers * paymentFeeFixed;
}

export function aiCostPerUser(feature: AiFeature, userType: "free" | "paid") {
  if (!feature.enabled) return 0;

  const calls =
    userType === "free"
      ? feature.callsPerFreeUserPerMonth
      : feature.callsPerPaidUserPerMonth;
  const inputCost =
    (feature.inputTokensPerCall * calls * feature.inputCostPerMillionTokens) / 1_000_000;
  const outputCost =
    (feature.outputTokensPerCall * calls * feature.outputCostPerMillionTokens) / 1_000_000;

  return inputCost + outputCost;
}

export function calculateScenario(scenario: Scenario) {
  const estimatedSignups = estimateSignups(
    scenario.monthlyVisitors,
    scenario.signupConversionRate,
  );
  const estimatedPaidUsers = estimatePaidUsersFromConversion(
    scenario.monthlyVisitors,
    scenario.signupConversionRate,
    scenario.freeToPaidConversionRate,
  );
  const mrr = calculateMrr(scenario.paidUsers, scenario.averagePricePerMonth);
  const arr = calculateArr(mrr);
  const monthlyChurnedUsers = calculateMonthlyChurnedUsers(
    scenario.paidUsers,
    scenario.monthlyChurnRate,
  );
  const paymentProcessingCosts = calculatePaymentProcessingCosts(
    mrr,
    scenario.paidUsers,
    scenario.paymentFeePercent,
    scenario.paymentFeeFixed,
  );
  const nonAiVariableCosts =
    scenario.paidUsers * scenario.variableCostPerPaidUser +
    scenario.freeUsers * scenario.variableCostPerFreeUser;
  const aiCostFreeUsers = scenario.aiFeatures.reduce(
    (sum, feature) => sum + aiCostPerUser(feature, "free") * scenario.freeUsers,
    0,
  );
  const aiCostPaidUsers = scenario.aiFeatures.reduce(
    (sum, feature) => sum + aiCostPerUser(feature, "paid") * scenario.paidUsers,
    0,
  );
  const aiMonthlyCost = aiCostFreeUsers + aiCostPaidUsers;
  const totalMonthlyCosts =
    scenario.fixedMonthlyCosts +
    paymentProcessingCosts +
    nonAiVariableCosts +
    aiMonthlyCost;
  const variableCosts =
    paymentProcessingCosts + nonAiVariableCosts + aiMonthlyCost;
  const grossProfit = mrr - variableCosts;
  const netProfit = mrr - totalMonthlyCosts;
  const grossMarginPercentage = safeDiv(grossProfit, mrr) * 100;
  const netMarginPercentage = safeDiv(netProfit, mrr) * 100;
  const aiCostPerPaidUser = scenario.aiFeatures.reduce(
    (sum, feature) => sum + aiCostPerUser(feature, "paid"),
    0,
  );
  const aiCostPerFreeUser = scenario.aiFeatures.reduce(
    (sum, feature) => sum + aiCostPerUser(feature, "free"),
    0,
  );
  const contributionPerPaidUser =
    scenario.averagePricePerMonth -
    scenario.variableCostPerPaidUser -
    aiCostPerPaidUser -
    scenario.averagePricePerMonth * pct(scenario.paymentFeePercent) -
    scenario.paymentFeeFixed;
  const breakEvenPaidUsers =
    contributionPerPaidUser <= 0
      ? Number.POSITIVE_INFINITY
      : Math.ceil(
          (scenario.fixedMonthlyCosts + scenario.freeUsers * (scenario.variableCostPerFreeUser + aiCostPerFreeUser)) /
            contributionPerPaidUser,
        );
  const requiredPaidUsersForTargetMRR =
    scenario.averagePricePerMonth <= 0
      ? Number.POSITIVE_INFINITY
      : Math.ceil(scenario.targetMRR / scenario.averagePricePerMonth);
  const requiredPaidUsersForTargetARR =
    scenario.averagePricePerMonth <= 0
      ? Number.POSITIVE_INFINITY
      : Math.ceil(scenario.targetARR / 12 / scenario.averagePricePerMonth);
  const variableCostPerPaidUserAtCurrentMix =
    scenario.variableCostPerPaidUser +
    aiCostPerPaidUser +
    scenario.averagePricePerMonth * pct(scenario.paymentFeePercent) +
    scenario.paymentFeeFixed;
  const requiredPriceForTargetGrossMargin =
    scenario.paymentFeePercent >= 100
      ? Number.POSITIVE_INFINITY
      : (scenario.variableCostPerPaidUser + aiCostPerPaidUser + scenario.paymentFeeFixed) /
        (1 - pct(80) - pct(scenario.paymentFeePercent));
  const maximumAiCostPerPaidUserFor80Margin = Math.max(
    0,
    scenario.averagePricePerMonth * 0.2 -
      scenario.variableCostPerPaidUser -
      scenario.averagePricePerMonth * pct(scenario.paymentFeePercent) -
      scenario.paymentFeeFixed,
  );
  const warnings = getWarningFlags({
    scenario,
    mrr,
    grossMarginPercentage,
    netMarginPercentage,
    aiMonthlyCost,
    aiCostFreeUsers,
    estimatedPaidUsers,
    requiredPaidUsersForTargetARR,
    variableCostPerPaidUserAtCurrentMix,
  });
  const healthStatus = getHealthStatus(warnings, netMarginPercentage, grossMarginPercentage);

  return {
    estimatedSignups,
    estimatedPaidUsers,
    mrr,
    arr,
    monthlyChurnedUsers,
    grossRevenue: mrr,
    paymentProcessingCosts,
    fixedCosts: scenario.fixedMonthlyCosts,
    nonAiVariableCosts,
    aiCostFreeUsers,
    aiCostPaidUsers,
    aiMonthlyCost,
    totalMonthlyCosts,
    grossProfit,
    netProfit,
    grossMarginPercentage,
    netMarginPercentage,
    breakEvenPaidUsers,
    requiredPaidUsersForTargetMRR,
    requiredPaidUsersForTargetARR,
    requiredPriceForTargetGrossMargin,
    maximumAiCostPerPaidUserFor80Margin,
    aiCostPerPaidUser,
    aiCostPerFreeUser,
    contributionPerPaidUser,
    warnings,
    healthStatus,
  };
}

function getWarningFlags(input: {
  scenario: Scenario;
  mrr: number;
  grossMarginPercentage: number;
  netMarginPercentage: number;
  aiMonthlyCost: number;
  aiCostFreeUsers: number;
  estimatedPaidUsers: number;
  requiredPaidUsersForTargetARR: number;
  variableCostPerPaidUserAtCurrentMix: number;
}): WarningFlag[] {
  const {
    scenario,
    mrr,
    grossMarginPercentage,
    netMarginPercentage,
    aiMonthlyCost,
    aiCostFreeUsers,
    estimatedPaidUsers,
    requiredPaidUsersForTargetARR,
    variableCostPerPaidUserAtCurrentMix,
  } = input;
  const warnings: WarningFlag[] = [];

  if (safeDiv(aiMonthlyCost, mrr) > 0.2) {
    warnings.push({
      id: "ai-cost-ratio",
      severity: "risk",
      title: "AI/API costs are above 20% of revenue",
      detail: "Your model may struggle to scale unless usage is capped, priced, or moved to cheaper infrastructure.",
    });
  }
  if (grossMarginPercentage < 70 && mrr > 0) {
    warnings.push({
      id: "low-gross-margin",
      severity: "risk",
      title: "Gross margin is below 70%",
      detail: "Healthy SaaS usually needs strong gross margins to survive acquisition costs and churn.",
    });
  }
  if (netMarginPercentage < 0) {
    warnings.push({
      id: "negative-net-margin",
      severity: "broken",
      title: "Net profit is negative",
      detail: "The current scenario loses money after fixed and variable costs.",
    });
  }
  if (aiCostFreeUsers > mrr * 0.08 && scenario.freeUsers > scenario.paidUsers) {
    warnings.push({
      id: "free-ai-costs",
      severity: "watch",
      title: "Free users create meaningful AI costs",
      detail: "Freemium can work, but only when usage limits and upgrade paths are very deliberate.",
    });
  }
  if (scenario.paidUsers > estimatedPaidUsers * 2 && scenario.monthlyVisitors > 0) {
    warnings.push({
      id: "traffic-gap",
      severity: "watch",
      title: "Paid user count looks high for current traffic",
      detail: "Traffic or conversion needs to improve to make the current paid user assumption repeatable.",
    });
  }
  if (requiredPaidUsersForTargetARR > estimatedPaidUsers * 3 && scenario.targetARR > 0) {
    warnings.push({
      id: "target-arr-gap",
      severity: "watch",
      title: "Target ARR requires many more users",
      detail: "The ARR target needs more traffic, stronger conversion, higher pricing, or expansion revenue.",
    });
  }
  if (scenario.averagePricePerMonth < variableCostPerPaidUserAtCurrentMix * 3) {
    warnings.push({
      id: "price-too-low",
      severity: "risk",
      title: "Price is low relative to per-user costs",
      detail: "A low price gives you little room for support, churn, acquisition, and product iteration.",
    });
  }
  if (scenario.monthlyChurnRate >= 7) {
    warnings.push({
      id: "high-churn",
      severity: "risk",
      title: "Monthly churn is high",
      detail: "High churn forces the business to replace too many customers before it can compound.",
    });
  }
  if (mrr > 0 && scenario.fixedMonthlyCosts / mrr > 0.45) {
    warnings.push({
      id: "fixed-cost-load",
      severity: "watch",
      title: "Fixed costs are high relative to MRR",
      detail: "Keep recurring tools and contractors lean until revenue catches up.",
    });
  }

  return warnings;
}

function getHealthStatus(
  warnings: WarningFlag[],
  netMarginPercentage: number,
  grossMarginPercentage: number,
): HealthStatus {
  if (warnings.some((warning) => warning.severity === "broken")) return "Broken";
  if (netMarginPercentage < 5 || grossMarginPercentage < 60) return "Risky";
  if (warnings.some((warning) => warning.severity === "risk")) return "Risky";
  if (warnings.length > 0 || grossMarginPercentage < 80) return "Watch";
  return "Healthy";
}
