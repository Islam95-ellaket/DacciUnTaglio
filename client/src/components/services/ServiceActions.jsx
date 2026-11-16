// Bottoni condivisi tra card (mobile) e tabella (desktop).
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
