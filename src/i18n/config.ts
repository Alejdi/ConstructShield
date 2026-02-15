export const locales = ["en", "it", "de", "fr", "sq", "ar", "sr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
  de: "Deutsch",
  fr: "Français",
  sq: "Shqip",
  ar: "العربية",
  sr: "Српски",
};

export const rtlLocales: Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
