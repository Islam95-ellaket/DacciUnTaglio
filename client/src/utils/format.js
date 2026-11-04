// Formatter condivisi, nel fuso orario del negozio
const timeZone = "Europe/Rome";

export const formatPrice = (value) =>
  typeof value === "number"
    ? value.toLocaleString("it-IT", { style: "currency", currency: "EUR" })
    : "—";

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("it-IT", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Versione compatta per le tabelle (mer 4 nov 2026)
export const formatDateShort = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// Data in formato YYYY-MM-DD (per gli input type="date") nel fuso del negozio
export const getRomeDate = (date = new Date()) =>
  date.toLocaleDateString("sv-SE", { timeZone });
