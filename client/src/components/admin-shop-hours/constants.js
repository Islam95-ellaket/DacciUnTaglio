// Costanti condivise dai form di gestione orari del negozio.

// Giorni della settimana in ordine di visualizzazione (lunedì → domenica).
export const DAYS = [
  { dayOfWeek: 1, label: "Lunedì" },
  { dayOfWeek: 2, label: "Martedì" },
  { dayOfWeek: 3, label: "Mercoledì" },
  { dayOfWeek: 4, label: "Giovedì" },
  { dayOfWeek: 5, label: "Venerdì" },
  { dayOfWeek: 6, label: "Sabato" },
  { dayOfWeek: 0, label: "Domenica" },
];

// Il form deve partire DAVVERO vuoto: se è precompilato, il salvataggio
// (che include il form valido) re-inserisce la pausa appena eliminata.
export const EMPTY_BLOCK = { dayOfWeek: 1, open: "", close: "", reason: "" };

export const dayLabel = (dayOfWeek) =>
  DAYS.find((d) => d.dayOfWeek === dayOfWeek)?.label ?? "";

// Stato iniziale del form orari: un item per giorno, valorizzato con gli
// orari attuali del negozio (giorno assente = chiuso).
export const buildInitialHours = (shop) => {
  const initial = {};
  for (const d of DAYS) {
    const found = shop.workingHours?.find((w) => w.dayOfWeek === d.dayOfWeek);
    initial[d.dayOfWeek] = found
      ? { isOpen: true, open: found.open, close: found.close }
      : { isOpen: false, open: "09:00", close: "19:00" };
  }
  return initial;
};
