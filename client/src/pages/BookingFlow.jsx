import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";

const API = import.meta.env.VITE_API_URL;

export default function BookingFlow() {
  const { token } = useContext(AuthContext);

  // --- Stati ---
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // loading ed errori separati per servizi e slot
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");

  // Data di oggi in fuso Europe/Rome, formato YYYY-MM-DD
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Europe/Rome",
  });

  const loadServices = async () => {
    setServicesLoading(true);
    setServicesError(null);
    try {
      const res = await fetch(`${API}/services`);
      if (!res.ok) throw new Error("Errore caricamento servizi");
      const data = await res.json();
      setServices(data);
    } catch (err) {
      setServicesError(err.message);
    } finally {
      setServicesLoading(false);
    }
  };

  // --- Step 1: carica servizi all'avvio ---
  useEffect(() => {
    loadServices();
  }, []);

  // --- Step 2: carica slot quando cambia la data o il servizio ---
  const loadSlots = async () => {
    if (!date || !selectedService) return;
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots([]);
    try {
      const res = await fetch(
        `${API}/availability?serviceId=${selectedService._id}&date=${date}`
      );
      if (!res.ok) throw new Error("Errore caricamento slot");
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      setSlotsError(err.message);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (date && selectedService) {
      loadSlots();
    }
  }, [date, selectedService]);

  // --- Step 3: conferma prenotazione ---
  const handleConfirm = async () => {
    if (!selectedService || !selectedSlot) return;

    if (!token) {
      setMessage("Devi effettuare l'accesso per prenotare.");
      return;
    }

    setConfirming(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: selectedService._id,
          start: selectedSlot,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setMessage("Sessione scaduta, effettua di nuovo l'accesso.");
          return;
        }
        if (res.status === 409) {
          // Ricarica gli slot e torna allo step 2
          try {
            const slotRes = await fetch(
              `${API}/availability?serviceId=${selectedService._id}&date=${date}`
            );
            if (slotRes.ok) setSlots(await slotRes.json());
          } catch {
            // se il ricarico fallisce, l'utente può cambiare data per riprovare
          }
          setSelectedSlot(null);
          setStep(2);
          setMessage(
            "Orario appena occupato da un altro cliente, scegline un altro."
          );
          return;
        }
        throw new Error(data.error?.message || "Errore prenotazione");
      }

      setConfirmed(true);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const resetAll = () => {
    setConfirmed(false);
    setStep(1);
    setSelectedService(null);
    setDate("");
    setSelectedSlot(null);
    setSlots([]);
    setSlotsError(null);
    setMessage("");
  };

  // --- Formattazione ---
  const formatPrice = (v) =>
    v.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

  const formatSlot = (iso) =>
    new Date(iso).toLocaleString("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("it-IT", {
      timeZone: "Europe/Rome",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // --- Schermata di conferma ---
  if (confirmed) {
    return (
      <div className="text-center mt-5">
        <div className="alert alert-success">
          <h4>✅ Prenotazione confermata!</h4>
          <p>
            {selectedService.name} — {formatDate(selectedSlot)} alle{" "}
            {formatSlot(selectedSlot)}
          </p>
          <p className="fw-bold">{formatPrice(selectedService.price)}</p>
        </div>
        <button className="btn btn-primary" onClick={resetAll}>
          Nuova prenotazione
        </button>
      </div>
    );
  }

  // --- Step 1: scelta servizio ---
  if (step === 1) {
    if (servicesLoading)
      return <div className="text-center mt-5">Caricamento...</div>;
    if (servicesError) {
      return <ErrorAlert message={servicesError} onRetry={loadServices} />
    }
    return (
      <div>
        <h2 className="mb-4">Scegli un servizio</h2>
        <div className="row g-3">
          {services.map((s) => (
            <div className="col-md-4" key={s._id}>
              <div
                className="card h-100 clickable-card"
                onClick={() => {
                  setSelectedService(s);
                  setMessage("");
                  setStep(2);
                }}
              >
                <div className="card-body text-center">
                  <h5 className="card-title">{s.name}</h5>
                  <p className="card-text">Durata: {s.durationMinutes} min</p>
                  <p className="fw-bold">{formatPrice(s.price)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Step 2: scelta data e slot ---
  if (step === 2) {
    return (
      <div>
        <h2 className="mb-3">Scegli data e orario</h2>
        <p className="text-muted">
          Servizio: <strong>{selectedService.name}</strong> (
          {selectedService.durationMinutes} min)
        </p>

        {!token && (
          <div className="alert alert-warning">
            Devi effettuare l'accesso per completare la prenotazione.
          </div>
        )}

        {message && <div className="alert alert-warning">{message}</div>}
        <ErrorAlert message={slotsError} onRetry={loadSlots} />

        <div className="mb-3">
          <label className="form-label">Data</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot(null);
              setMessage("");
            }}
            min={today}
          />
        </div>

        {slotsLoading && <div className="text-center">Caricamento slot...</div>}

        {!slotsLoading && !slotsError && date && slots.length === 0 && (
          <div className="alert alert-info">
            Nessuno slot disponibile per questa data.
          </div>
        )}

        {!slotsLoading && slots.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {slots.map((slot) => (
              <button
                key={slot}
                className={`btn ${selectedSlot === slot ? "btn-primary" : "btn-outline-primary"
                  }`}
                onClick={() => {
                  setSelectedSlot(slot);
                  setMessage("");
                }}
              >
                {formatSlot(slot)}
              </button>
            ))}
          </div>
        )}

        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setStep(1);
              setSelectedService(null);
              setDate("");
              setSlots([]);
              setSelectedSlot(null);
              setSlotsError(null);
              setMessage("");
            }}
          >
            Indietro
          </button>
          <button
            className="btn btn-primary"
            disabled={!selectedSlot || !token}
            onClick={() => {
              setMessage("");
              setStep(3);
            }}
          >
            Avanti
          </button>
        </div>
      </div>
    );
  }

  // --- Step 3: riepilogo e conferma ---
  if (step === 3) {
    return (
      <div>
        <h2 className="mb-3">Conferma prenotazione</h2>

        <ErrorAlert message={message} />

        <div className="card mb-3">
          <div className="card-body">
            <p>
              <strong>Servizio:</strong> {selectedService.name}
            </p>
            <p>
              <strong>Durata:</strong> {selectedService.durationMinutes} min
            </p>
            <p>
              <strong>Data:</strong> {formatDate(selectedSlot)}
            </p>
            <p>
              <strong>Ora:</strong> {formatSlot(selectedSlot)}
            </p>
            <p className="fw-bold">
              <strong>Prezzo:</strong> {formatPrice(selectedService.price)}
            </p>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setMessage("");
              setStep(2);
            }}
            disabled={confirming}
          >
            Indietro
          </button>
          <button
            className="btn btn-success"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirming ? "Conferma in corso..." : "Conferma prenotazione"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}