
import {
    useState,
    useEffect,
    useContext,
    useCallback,
} from "react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";

const API = import.meta.env.VITE_API_URL;

const STATUS_LABELS = {
    active: "Attiva",
    cancelled: "Annullata",
    completed: "Completata",
    "no-show": "Non presentato",
};

const STATUS_BADGES = {
    active: "bg-primary",
    cancelled: "bg-danger",
    completed: "bg-success",
    "no-show": "bg-warning text-dark",
};

const getRomeDate = (date) =>
    date.toLocaleDateString("sv-SE", {
        timeZone: "Europe/Rome",
    });

export default function AdminAppointments() {
    const { token } = useContext(AuthContext);

    // Stati
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [updating, setUpdating] = useState(null);

    // Intervallo date
    const [from, setFrom] = useState(() =>
        getRomeDate(new Date())
    );

    const [to, setTo] = useState(() =>
        getRomeDate(
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        )
    );

    const invalidRange = !from || !to || from > to;

    // Caricamento appuntamenti
    const loadAppointments = useCallback(async (signal) => {
        if (!token) {
            setAppointments([]);
            setLoading(false);
            setError("Devi effettuare l'accesso.");
            return;
        }

        if (!from || !to || from > to) {
            setAppointments([]);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ from, to });

            const res = await fetch(
                `${API}/appointments/admin?${params}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    signal,
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error(
                        "Sessione scaduta. Effettua nuovamente l'accesso."
                    );
                }

                throw new Error(
                    data.error?.message ||
                    "Errore caricamento appuntamenti"
                );
            }

            if (!Array.isArray(data)) {
                throw new Error("Risposta del server non valida.");
            }

            setAppointments(data);

        } catch (err) {
            if (err.name === "AbortError") return;

            setError(err.message);

        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [from, to, token]);

    // Caricamento automatico
    useEffect(() => {
        const controller = new AbortController();

        loadAppointments(controller.signal);

        return () => controller.abort();
    }, [loadAppointments]);

    // Aggiornamento stato appuntamento
    const handleStatusChange = async (id, newStatus) => {
        if (!token || updating !== null) return;

        if (!["active", "cancelled", "completed", "no-show"].includes(newStatus)) {
            return;
        }

        if (
            newStatus === "cancelled" &&
            !window.confirm(
                "Vuoi davvero annullare questo appuntamento?"
            )
        ) {
            return;
        }

        setUpdating(id);
        setMessage(null);

        try {
            const res = await fetch(
                `${API}/appointments/${id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status: newStatus,
                    }),
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error(
                        "Sessione scaduta. Effettua nuovamente l'accesso."
                    );
                }

                if (res.status === 409) {
                    throw new Error(
                        data.error?.message ||
                        "Orario non disponibile. Esiste un altro appuntamento."
                    );
                }

                throw new Error(
                    data.error?.message ||
                    "Errore aggiornamento appuntamento"
                );
            }

            // Aggiorna la tabella usando la risposta del server
            setAppointments((prev) =>
                prev.map((appointment) =>
                    appointment._id === id
                        ? {
                            ...appointment,
                            status: data.status || newStatus,
                        }
                        : appointment
                )
            );

            setMessage({
                type: "success",
                text: `Appuntamento ${STATUS_LABELS[newStatus].toLowerCase()} correttamente.`,
            });

        } catch (err) {
            setMessage({
                type: "danger",
                text: err.message,
            });

        } finally {
            setUpdating(null);
        }
    };

    // Formattazione prezzo
    const formatPrice = (value) =>
        typeof value === "number"
            ? value.toLocaleString("it-IT", {
                style: "currency",
                currency: "EUR",
            })
            : "—";

    // Formattazione orario
    const formatTime = (iso) =>
        new Date(iso).toLocaleTimeString("it-IT", {
            timeZone: "Europe/Rome",
            hour: "2-digit",
            minute: "2-digit",
        });

    // Formattazione data
    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("it-IT", {
            timeZone: "Europe/Rome",
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    // Un appuntamento è "passato" quando la sua fine è precedente ad ora
    const isPast = (iso) => new Date(iso) < new Date();

    // Render
    return (
        <div>
            <h2 className="mb-3">Appuntamenti</h2>

            {/* Messaggi */}
            {message && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Filtro date */}
            <div className="row g-2 mb-3">
                <div className="col-md-3">
                    <label className="form-label">Da</label>

                    <input
                        type="date"
                        className="form-control"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    />
                </div>

                <div className="col-md-3">
                    <label className="form-label">A</label>

                    <input
                        type="date"
                        className="form-control"
                        value={to}
                        min={from || undefined}
                        onChange={(e) => setTo(e.target.value)}
                    />
                </div>
            </div>

            {/* Intervallo non valido */}
            {invalidRange && (
                <div className="alert alert-warning">
                    Seleziona un intervallo valido.
                    La data iniziale non può essere successiva alla data finale.
                </div>
            )}

            {/* Caricamento */}
            {!invalidRange && loading && (
                <div className="text-center my-4">
                    Caricamento appuntamenti...
                </div>
            )}

            {/* Errore */}
            <ErrorAlert
                message={error}
                onRetry={() => loadAppointments()}
            />

            {/* Nessun appuntamento */}
            {!loading &&
                !error &&
                !invalidRange &&
                appointments.length === 0 && (
                    <div className="alert alert-info">
                        Nessun appuntamento in questo intervallo.
                    </div>
                )}

            {/* Tabella */}
            {!loading &&
                !error &&
                !invalidRange &&
                appointments.length > 0 && (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Ora</th>
                                    <th>Cliente</th>
                                    <th>Contatto</th>
                                    <th>Servizio</th>
                                    <th>Prezzo</th>
                                    <th>Stato</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>

                            <tbody>
                                {appointments.map((a) => (
                                    <tr key={a._id}>
                                        <td>{formatDate(a.start)}</td>

                                        <td>
                                            {formatTime(a.start)} - {formatTime(a.end)}
                                        </td>

                                        <td>
                                            {a.userId?.name || "—"}
                                        </td>

                                        <td>
                                            {a.userId?.phone ? (
                                                <a href={`tel:${a.userId.phone}`}>
                                                    {a.userId.phone}
                                                </a>
                                            ) : (
                                                <a href={`mailto:${a.userId?.email}`}>
                                                    {a.userId?.email || "—"}
                                                </a>
                                            )}
                                        </td>

                                        <td>
                                            {a.serviceId?.name || "—"}
                                        </td>

                                        <td>
                                            {formatPrice(a.serviceId?.price)}
                                        </td>

                                        <td>
                                            <span
                                                className={`badge ${STATUS_BADGES[a.status] ||
                                                    "bg-secondary"
                                                    }`}
                                            >
                                                {STATUS_LABELS[a.status] || a.status}
                                            </span>
                                        </td>

                                        <td>
                                            {isPast(a.end) ? (
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={a.status}
                                                    onChange={(e) =>
                                                        handleStatusChange(
                                                            a._id,
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={updating !== null}
                                                >
                                                    <option value="completed">
                                                        Completato
                                                    </option>

                                                    <option value="cancelled">
                                                        Annullato
                                                    </option>

                                                    <option value="no-show">
                                                        Non presentato
                                                    </option>
                                                </select>
                                            ) : (
                                                <>
                                                    {a.status === "active" && (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger mb-1"
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    a._id,
                                                                    "cancelled"
                                                                )
                                                            }
                                                            disabled={updating !== null}
                                                        >
                                                            {updating === a._id
                                                                ? "..."
                                                                : "Annulla"}
                                                        </button>
                                                    )}

                                                    {a.status === "cancelled" && (
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    a._id,
                                                                    "active"
                                                                )
                                                            }
                                                            disabled={updating !== null}
                                                        >
                                                            {updating === a._id
                                                                ? "..."
                                                                : "Riattiva"}
                                                        </button>
                                                    )}

                                                    {(a.status === "completed" ||
                                                        a.status === "no-show") && (
                                                        <span className="text-muted">
                                                            Nessuna azione
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
        </div>
    );
}
