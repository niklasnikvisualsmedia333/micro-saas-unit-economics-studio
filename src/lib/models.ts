import { AiFeature } from "./types";

export const editableModelPricing = [
  {
    name: "GPT-5.5",
    inputCostPerMillionTokens: 5,
    outputCostPerMillionTokens: 30,
  },
  {
    name: "GPT-5.4",
    inputCostPerMillionTokens: 2.5,
    outputCostPerMillionTokens: 15,
  },
  {
    name: "GPT-5.4 mini",
    inputCostPerMillionTokens: 0.75,
    outputCostPerMillionTokens: 4.5,
  },
  {
    name: "GPT-5.4 nano",
    inputCostPerMillionTokens: 0.2,
    outputCostPerMillionTokens: 1.25,
  },
  {
    name: "Generic cheap model",
    inputCostPerMillionTokens: 0.15,
    outputCostPerMillionTokens: 0.6,
  },
  {
    name: "Generic premium model",
    inputCostPerMillionTokens: 8,
    outputCostPerMillionTokens: 32,
  },
] as const;

export function createAiFeature(name = "AI feature"): AiFeature {
  const model = editableModelPricing[3];

  return {
    id: crypto.randomUUID(),
    name,
    enabled: true,
    modelName: model.name,
    inputTokensPerCall: 1200,
    outputTokensPerCall: 700,
    callsPerFreeUserPerMonth: 5,
    callsPerPaidUserPerMonth: 60,
    inputCostPerMillionTokens: model.inputCostPerMillionTokens,
    outputCostPerMillionTokens: model.outputCostPerMillionTokens,
  };
}
