export const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
export const dateLabel = (
  date: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
) =>
  new Date(date.slice(0, 10) + "T12:00:00Z").toLocaleDateString("en-CA", {
    ...options,
    timeZone: "America/Toronto",
  });
export const initials = (name: string) =>
  name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
export const number = (value: number) =>
  new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 }).format(value);
