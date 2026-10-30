export const BRAND = {
  name: "Thread & Co.",
  tagline: "Contemporary Indian fashion — casual but premium",
  locale: "en-IN",
  currency: "INR",
  currencySymbol: "₹",
  tone: "casual-but-premium",
} as const;

export type Brand = typeof BRAND;
