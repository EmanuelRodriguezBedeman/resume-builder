// Date formatting helpers for the PDF render.
// Dates in resume.json are "YYYY-MM" or "YYYY" strings.

const MONTHS = [
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
];

export function formatYearMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (match) {
    const year = match[1];
    const monthIndex = Number.parseInt(match[2] ?? "0", 10) - 1;
    const monthName = MONTHS[monthIndex];
    if (monthName) return `${monthName} ${year}`;
  }
  return value; // year-only or anything we don't recognize
}

export function formatDateRange(range: {
  start: string;
  end: string | null;
}): string {
  const start = formatYearMonth(range.start);
  const end = range.end === null ? "Present" : formatYearMonth(range.end);
  return `${start} – ${end}`;
}

export function formatFlexibleDate(date: {
  start: string;
  end?: string;
}): string {
  const start = formatYearMonth(date.start);
  if (date.end) {
    return `${start} – ${formatYearMonth(date.end)}`;
  }
  return start;
}
