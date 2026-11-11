import { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";
import { apiFetch } from "../api/http.js";
import { formatPrice, formatDate, formatTime, getRomeDate } from "../utils/format.js";

export default function BookingFlow() {
  const { token } = useContext(AuthContext);
  const location = useLocation(); 
  const preset = location.state?.service;

  const {
    data: services,
    loading: servicesLoading,
    error: servicesError,
    refetch: loadServices,
  } = useFetch("/services");

  const [step, setStep] = useState(preset ? 2 : 1);
  const [selectedService, setSelectedService] = useState(preset ?? null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");

  const today = getRomeDate();

  const goToStep1 = () => {
    setStep(1);
    setSelectedService(null);
    setDate("");
    setSlots([]);
    setSelectedSlot(null);
    setSlotsError(null);
    setMessage("");
  };

  const loadSlots = async () => {
    if (!date || !selectedService) return;
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots([]);
    try {
      const data = await apiFetch(
        `/availability?serviceId=${selectedService._id}&date=${date}`
      );
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

  const handleConfirm = async () => {
    if (!selectedService || !selectedSlot) return;

    if (!token) {
      setMessage("Devi effettuare l'accesso per prenotare.");
      return;
    }

    setConfirming(true);
    setMessage("");
    try {
      await apiFetch("/appointments", {
        method: "POST",
        token,
        body: { serviceId: selectedService._id, start: selectedSlot },
      });
      setConfirmed(true);
    } catch (err) {
      if (err.status === 401) {
        setMessage("Sessione scaduta, effettua di nuovo l'accesso.");
        return;
      }

      if (err.status === 409) {
        try {
          const fresh = await apiFetch(
            `/availability?serviceId=${selectedService._id}&date=${date}`
          );
          setSlots(fresh);
        } catch {}
        setSelectedSlot(null);
        setStep(2);
        setMessage(
          "Orario appena occupato da un altro cliente, scegline un altro."
        );
        return;
      }

      setMessage(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const resetAll = () => {
    setConfirmed(false);
    goToStep1();
  };

  // --- Schermata di conferma ---
  if (confirmed) {
    return (
      <div className="text-center mt-5">
        <div className="alert alert-success">
          <h4>✅ Prenotazione confermata!</h4>
          <p>
            {selectedService.name} — {formatDate(selectedSlot)} alle{" "}
            {formatTime(selectedSlot)}
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
      return <ErrorAlert message={servicesError} onRetry={loadServices} />;
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
                {formatTime(slot)}
              </button>
            ))}
          </div>
        )}

        <div className="d-flex gap-2">
          <button className="btn btn-secondary" onClick={goToStep1}>
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
              <strong>Ora:</strong> {formatTime(selectedSlot)}
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
