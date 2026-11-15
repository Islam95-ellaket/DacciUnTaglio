// Indicatore visivo dei passi del booking: completato = ✓ su ocra chiaro,
// attivo = numero su cerchio pieno ocra, futuro = solo bordo grigio.
// Presentazionale: riceve l'elenco dei passi e l'indice di quello corrente.
export default function Stepper({ steps, current }) {
  return (
    <ol className="stepper">
      {steps.map((label, i) => {
        const state = i < current ? "is-done" : i === current ? "is-active" : "";
        return (
          <li
            key={label}
            className={`step ${state}`}
            aria-current={i === current ? "step" : undefined}
          >
            <span className="step-circle">{i < current ? "✓" : i + 1}</span>
            <span className="stepper-label">{label}</span>
            {i < steps.length - 1 && (
              <span
                className={`step-line ${i < current ? "is-done" : ""}`}
                aria-hidden="true"
              ></span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
