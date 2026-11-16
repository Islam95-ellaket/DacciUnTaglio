// Indicatori dei passi: ✓ = completato, cerchio ocra = attivo,
// bordo grigio = futuro.
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
