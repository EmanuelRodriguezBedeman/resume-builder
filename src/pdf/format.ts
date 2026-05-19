// Date formatting helpers for the PDF render.
// Dates in resume.json are "YYYY-MM" or "YYYY" strings.

import type { Locale } from "../save.ts";

// Month names are a small, fixed bilingual table — translating these via
// DeepL would be overkill and risk capitalization drift ("marzo" vs "Marzo").
const MONTHS: Record<Locale, readonly string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  es: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
};

const PRESENT: Record<Locale, string> = {
  en: "Present",
  es: "Presente",
};

export function formatYearMonth(value: string, locale: Locale): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (match) {
    const year = match[1];
    const monthIndex = Number.parseInt(match[2] ?? "0", 10) - 1;
    const monthName = MONTHS[locale][monthIndex];
    if (monthName) return `${monthName} ${year}`;
  }
  return value; // year-only or anything we don't recognize
}

export function formatDateRange(
  range: { start: string; end: string | null },
  locale: Locale,
): string {
  const start = formatYearMonth(range.start, locale);
  const end =
    range.end === null ? PRESENT[locale] : formatYearMonth(range.end, locale);
  return `${start} – ${end}`;
}

export function formatFlexibleDate(
  date: { start: string; end?: string },
  locale: Locale,
): string {
  const start = formatYearMonth(date.start, locale);
  if (date.end) {
    return `${start} – ${formatYearMonth(date.end, locale)}`;
  }
  return start;
}
