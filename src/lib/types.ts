export type CurrencyCode = "EUR" | "USD" | "GBP";

export type AiFeature = {
  id: string;
  name: string;
  enabled: boolean;
  modelName: string;
  inputTokensPerCall: number;
  outputTokensPerCall: number;
  callsPerFreeUserPerMonth: number;
  callsPerPaidUserPerMonth: number;
  inputCostPerMillionTokens: number;
  outputCostPerMillionTokens: number;
};

export type Scenario = {
  id: string;
  name: string;
  description: string;
  currency: CurrencyCode;
  monthlyVisitors: number;
  signupConversionRate: number;
  freeToPaidConversionRate: number;
  paidUsers: number;
  freeUsers: number;
  monthlyChurnRate: number;
  averagePricePerMonth: number;
  targetMRR: number;
  targetARR: number;
  fixedMonthlyCosts: number;
  variableCostPerPaidUser: number;
  variableCostPerFreeUser: number;
  paymentFeePercent: number;
  paymentFeeFixed: number;
  aiFeatures: AiFeature[];
  createdAt: string;
  updatedAt: string;
};

export type WarningFlag = {
  id: string;
  severity: "info" | "watch" | "risk" | "broken";
  title: string;
  detail: string;
};

export type HealthStatus = "Healthy" | "Watch" | "Risky" | "Broken";
