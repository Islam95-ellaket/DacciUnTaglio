// Validazione di una data in formato YYYY-MM-DD (rifiuta anche date impossibili come 2026-02-30)
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

// Giorno successivo in formato YYYY-MM-DD
export function nextDate(date) {
    const [year, month, day] = date.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, day + 1));

    return [
        next.getUTCFullYear(),
        String(next.getUTCMonth() + 1).padStart(2, "0"),
        String(next.getUTCDate()).padStart(2, "0"),
    ].join("-");
}
