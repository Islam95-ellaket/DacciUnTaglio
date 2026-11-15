// Stati appuntamento condivisi tra frontend e viste admin/cliente.

export const APPOINTMENT_STATUSES = ["active", "cancelled", "completed", "no-show"];

export const STATUS_LABELS = {
  active: "Attiva",
  cancelled: "Annullata",
  completed: "Completata",
  "no-show": "Non presentato",
};

// Classi CSS dei badge di stato (colori in styles/admin.css).
export const STATUS_BADGES = {
  active: "badge-status badge-status-active",
  cancelled: "badge-status badge-status-cancelled",
  completed: "badge-status badge-status-completed",
  "no-show": "badge-status badge-status-no-show",
};
