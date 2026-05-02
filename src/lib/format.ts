import { CurrencyCode } from "./types";

export function money(value: number, currency: CurrencyCode) {
  if (!Number.isFinite(value)) return "No limit";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function number(value: number) {
  if (!Number.isFinite(value)) return "No limit";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);
}

export function percent(value: number) {
  if (!Number.isFinite(value)) return "No limit";
  return `${number(value)}%`;
}
