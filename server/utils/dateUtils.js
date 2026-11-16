// Valida una data YYYY-MM-DD, rifiutando anche le date impossibili (2026-02-30)
export function isValidDateString(date) {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const [year, month, day] = date.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    return (
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day
    );
}

export function nextDate(date) {
    const [year, month, day] = date.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, day + 1));

    return [
        next.getUTCFullYear(),
        String(next.getUTCMonth() + 1).padStart(2, "0"),
        String(next.getUTCDate()).padStart(2, "0"),
    ].join("-");
}

// Date UTC → "YYYY-MM-DD" nel fuso del negozio: la disponibilità si calcola
// sulla data giusta.
export function getLocalDateString(utcDate, timeZone = "Europe/Rome") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(utcDate);

  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;

  return `${year}-${month}-${day}`;
}

