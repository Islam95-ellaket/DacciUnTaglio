import { useState, useEffect, useRef } from "react";

const OPTIONS = [
  { value: "completed", label: "Completato", hoverClass: "status-select-option-completed" },
  { value: "cancelled", label: "Annullato", hoverClass: "status-select-option-cancelled" },
  { value: "no-show", label: "Non presentato", hoverClass: "status-select-option-no-show" },
];

// Dropdown custom per lo stato degli appuntamenti passati: un <select>
// nativo non permette di colorare l'hover delle singole voci.
export default function StatusSelect({ value, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const closeOnEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selected = OPTIONS.find((o) => o.value === value);

  return (
    <div className="status-select" ref={rootRef}>
      <button
        type="button"
        className="form-select form-select-sm text-start status-select-toggle"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected?.label || value}
      </button>
      {open && (
        <ul className="status-select-menu" role="listbox">
          {OPTIONS.map((o) => (
            <li key={o.value} className="status-select-item">
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={`status-select-option ${o.hoverClass}`}
                onClick={() => {
                  setOpen(false);
                  onChange(o.value);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
