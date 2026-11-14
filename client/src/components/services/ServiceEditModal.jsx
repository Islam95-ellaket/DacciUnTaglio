/**
 * Modal Bootstrap (aperto/chiuso via stato del genitore) per modificare
 * nome, prezzo e durata di un servizio. `editing` è il servizio in modifica
 * o null: qui null non dovrebbe arrivare (il genitore renderizza il modal
 * condizionalmente), ma il guard rende il componente robusto.
 */
export default function ServiceEditModal({ editing, onChange, onClose, onSubmit }) {
  if (!editing) return null;

  return (
    <div className="modal d-block modal-overlay-dark" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={onSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Modifica servizio</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Nome</label>
                <input
                  className="form-control"
                  value={editing.name}
                  onChange={(e) => onChange({ ...editing, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Prezzo (€)</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.price}
                  onChange={(e) => onChange({ ...editing, price: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Durata (min)</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={editing.durationMinutes}
                  onChange={(e) =>
                    onChange({ ...editing, durationMinutes: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Annulla
              </button>
              <button type="submit" className="btn btn-primary">
                Salva
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
