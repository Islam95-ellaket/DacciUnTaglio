// Azioni di un servizio nella lista admin: condivise tra le card (mobile)
// e la tabella (desktop) per non duplicare i bottoni.
export default function ServiceActions({ service, onEdit, onDelete }) {
  return (
    <>
      <button
        className="btn btn-sm btn-outline-secondary me-2"
        onClick={() => onEdit({ ...service })}
      >
        Modifica
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => onDelete(service._id)}
      >
        Disattiva
      </button>
    </>
  );
}
