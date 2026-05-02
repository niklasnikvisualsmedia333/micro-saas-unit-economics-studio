import { AiFeature } from "./types";

export const editableModelPricing = [
  {
    name: "GPT-5.3-Codex",
    inputCostPerMillionTokens: 4,
    outputCostPerMillionTokens: 16,
  },
  {
    name: "GPT-5.5",
    inputCostPerMillionTokens: 5,
    outputCostPerMillionTokens: 20,
  },
  {
    name: "GPT-5.4 mini",
    inputCostPerMillionTokens: 0.4,
    outputCostPerMillionTokens: 1.6,
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
