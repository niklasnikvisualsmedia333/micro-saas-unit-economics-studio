import { z } from "zod";
import { editableModelPricing } from "./models";
import { Scenario } from "./types";

const now = () => new Date().toISOString();

export const scenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  currency: z.enum(["EUR", "USD", "GBP"]).default("EUR"),
  monthlyVisitors: z.number().nonnegative(),
  signupConversionRate: z.number().nonnegative(),
  freeToPaidConversionRate: z.number().nonnegative(),
  paidUsers: z.number().nonnegative(),
  freeUsers: z.number().nonnegative(),
  monthlyChurnRate: z.number().nonnegative(),
  averagePricePerMonth: z.number().nonnegative(),
  targetMRR: z.number().nonnegative(),
  targetARR: z.number().nonnegative(),
  fixedMonthlyCosts: z.number().nonnegative(),
  variableCostPerPaidUser: z.number().nonnegative(),
  variableCostPerFreeUser: z.number().nonnegative(),
  paymentFeePercent: z.number().nonnegative(),
  paymentFeeFixed: z.number().nonnegative(),
  aiFeatures: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      enabled: z.boolean(),
      modelName: z.string(),
      inputTokensPerCall: z.number().nonnegative(),
      outputTokensPerCall: z.number().nonnegative(),
      callsPerFreeUserPerMonth: z.number().nonnegative(),
      callsPerPaidUserPerMonth: z.number().nonnegative(),
      inputCostPerMillionTokens: z.number().nonnegative(),
      outputCostPerMillionTokens: z.number().nonnegative(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const scenariosSchema = z.array(scenarioSchema);

export function scenarioTemplates(): Scenario[] {
  const cheap = editableModelPricing[3];
  const premium = editableModelPricing[4];
  const date = now();

  return [
    {
      id: "template-solo-bootstrapped",
      name: "Solo Bootstrapped B2B",
      description: "A small paid-first SaaS with simple infrastructure and no freemium burden.",
      currency: "EUR",
      monthlyVisitors: 2500,
      signupConversionRate: 5,
      freeToPaidConversionRate: 18,
      paidUsers: 35,
      freeUsers: 120,
      monthlyChurnRate: 2.5,
      averagePricePerMonth: 49,
      targetMRR: 4000,
      targetARR: 75000,
      fixedMonthlyCosts: 220,
      variableCostPerPaidUser: 1.8,
      variableCostPerFreeUser: 0.05,
      paymentFeePercent: 2.9,
      paymentFeeFixed: 0.3,
      aiFeatures: [],
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "template-ai-prosumer",
      name: "AI Prosumer Tool",
      description: "Usage-heavy AI product with a low monthly price and tighter margin pressure.",
      currency: "EUR",
      monthlyVisitors: 12000,
      signupConversionRate: 9,
      freeToPaidConversionRate: 6,
      paidUsers: 70,
      freeUsers: 950,
      monthlyChurnRate: 6,
      averagePricePerMonth: 24,
      targetMRR: 8000,
      targetARR: 150000,
      fixedMonthlyCosts: 640,
      variableCostPerPaidUser: 1.2,
      variableCostPerFreeUser: 0.12,
      paymentFeePercent: 2.9,
      paymentFeeFixed: 0.3,
      aiFeatures: [
        {
          id: "template-ai-prosumer-feature",
          name: "AI workspace assistant",
          enabled: true,
          modelName: premium.name,
          inputTokensPerCall: 1800,
          outputTokensPerCall: 1100,
          callsPerFreeUserPerMonth: 6,
          callsPerPaidUserPerMonth: 90,
          inputCostPerMillionTokens: premium.inputCostPerMillionTokens,
          outputCostPerMillionTokens: premium.outputCostPerMillionTokens,
        },
      ],
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "template-productized-service",
      name: "Productized Service SaaS",
      description: "Higher-touch B2B product with stronger pricing and moderate operating costs.",
      currency: "EUR",
      monthlyVisitors: 1800,
      signupConversionRate: 4,
      freeToPaidConversionRate: 22,
      paidUsers: 24,
      freeUsers: 80,
      monthlyChurnRate: 2,
      averagePricePerMonth: 149,
      targetMRR: 10000,
      targetARR: 180000,
      fixedMonthlyCosts: 900,
      variableCostPerPaidUser: 9,
      variableCostPerFreeUser: 0.25,
      paymentFeePercent: 2.9,
      paymentFeeFixed: 0.3,
      aiFeatures: [
        {
          id: "template-service-feature",
          name: "Internal delivery automation",
          enabled: true,
          modelName: cheap.name,
          inputTokensPerCall: 1400,
          outputTokensPerCall: 650,
          callsPerFreeUserPerMonth: 0,
          callsPerPaidUserPerMonth: 45,
          inputCostPerMillionTokens: cheap.inputCostPerMillionTokens,
          outputCostPerMillionTokens: cheap.outputCostPerMillionTokens,
        },
      ],
      createdAt: date,
      updatedAt: date,
    },
  ];
}

export function demoScenarios(): Scenario[] {
  const cheap = editableModelPricing[3];
  const premium = editableModelPricing[4];
  const date = now();

  return [
    {
      id: "demo-lean-b2b",
      name: "Lean B2B Micro-SaaS",
      description: "Focused paid product with modest traffic, high intent, and controlled costs.",
      currency: "EUR",
      monthlyVisitors: 6000,
      signupConversionRate: 7,
      freeToPaidConversionRate: 14,
      paidUsers: 72,
      freeUsers: 360,
      monthlyChurnRate: 3,
      averagePricePerMonth: 39,
      targetMRR: 5000,
      targetARR: 100000,
      fixedMonthlyCosts: 420,
      variableCostPerPaidUser: 2.2,
      variableCostPerFreeUser: 0.15,
      paymentFeePercent: 2.9,
      paymentFeeFixed: 0.3,
      aiFeatures: [
        {
          id: "demo-b2b-ai",
          name: "AI onboarding helper",
          enabled: true,
          modelName: cheap.name,
          inputTokensPerCall: 900,
          outputTokensPerCall: 500,
          callsPerFreeUserPerMonth: 3,
          callsPerPaidUserPerMonth: 25,
          inputCostPerMillionTokens: cheap.inputCostPerMillionTokens,
          outputCostPerMillionTokens: cheap.outputCostPerMillionTokens,
        },
      ],
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "demo-ai-heavy",
      name: "AI-heavy Freemium SaaS",
      description: "Large free audience, premium model usage, and pricing pressure.",
      currency: "EUR",
      monthlyVisitors: 25000,
      signupConversionRate: 11,
      freeToPaidConversionRate: 3.5,
      paidUsers: 96,
      freeUsers: 2600,
      monthlyChurnRate: 8,
      averagePricePerMonth: 19,
      targetMRR: 10000,
      targetARR: 250000,
      fixedMonthlyCosts: 1150,
      variableCostPerPaidUser: 1.7,
      variableCostPerFreeUser: 0.22,
      paymentFeePercent: 2.9,
      paymentFeeFixed: 0.3,
      aiFeatures: [
        {
          id: "demo-heavy-ai",
          name: "Long-form AI generation",
          enabled: true,
          modelName: premium.name,
          inputTokensPerCall: 2400,
          outputTokensPerCall: 1800,
          callsPerFreeUserPerMonth: 8,
          callsPerPaidUserPerMonth: 140,
          inputCostPerMillionTokens: premium.inputCostPerMillionTokens,
          outputCostPerMillionTokens: premium.outputCostPerMillionTokens,
        },
      ],
      createdAt: date,
      updatedAt: date,
    },
  ];
}

export function duplicateScenario(scenario: Scenario): Scenario {
  const date = now();

  return {
    ...scenario,
    id: crypto.randomUUID(),
    name: `${scenario.name} copy`,
    createdAt: date,
    updatedAt: date,
    aiFeatures: scenario.aiFeatures.map((feature) => ({
      ...feature,
      id: crypto.randomUUID(),
    })),
  };
}

export function scenarioFromTemplate(template: Scenario): Scenario {
  const date = now();

  return {
    ...template,
    id: crypto.randomUUID(),
    createdAt: date,
    updatedAt: date,
    aiFeatures: template.aiFeatures.map((feature) => ({
      ...feature,
      id: crypto.randomUUID(),
    })),
  };
}
