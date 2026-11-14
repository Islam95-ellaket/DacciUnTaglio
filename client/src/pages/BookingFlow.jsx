import { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { apiFetch } from "../api/http.js";
import StepServices from "../components/booking/StepServices.jsx";
import StepSchedule from "../components/booking/StepSchedule.jsx";
import StepConfirm from "../components/booking/StepConfirm.jsx";
import ConfirmationScreen from "../components/booking/ConfirmationScreen.jsx";

/**
 * Orchestratore del flusso di prenotazione (3 step + schermata di conferma).
 * Le schermate sono componenti separati in components/booking/;
 * qui vivono solo lo stato condiviso, gli handler e le chiamate API.
 */
export default function BookingFlow() {
  const { token } = useContext(AuthContext);
  const location = useLocation();
  const preset = location.state?.service; // pre-selezione dal bottone "Prenota" delle card

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
        // Slot appena occupato da un altro cliente: ricarico gli slot aggiornati
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
      <ConfirmationScreen
        service={selectedService}
        slot={selectedSlot}
        onReset={resetAll}
      />
    );
  }

  // --- Step 1: scelta servizio ---
  if (step === 1) {
    return (
      <StepServices
        services={services}
        loading={servicesLoading}
        error={servicesError}
        onRetry={loadServices}
        onSelect={(service) => {
          setSelectedService(service);
          setMessage("");
          setStep(2);
        }}
      />
    );
  }

  // --- Step 2: scelta data e orario ---
  if (step === 2) {
    return (
      <StepSchedule
        service={selectedService}
        token={token}
        date={date}
        slots={slots}
        slotsLoading={slotsLoading}
        slotsError={slotsError}
        selectedSlot={selectedSlot}
        message={message}
        onSelectDate={(newDate) => {
          setDate(newDate);
          setSelectedSlot(null);
          setMessage("");
        }}
        onSelectSlot={(slot) => {
          setSelectedSlot(slot);
          setMessage("");
        }}
        onRetrySlots={loadSlots}
        onBack={goToStep1}
        onNext={() => {
          setMessage("");
          setStep(3);
        }}
      />
    );
  }

  // --- Step 3: riepilogo e conferma ---
  if (step === 3) {
    return (
      <StepConfirm
        service={selectedService}
        slot={selectedSlot}
        message={message}
        confirming={confirming}
        onBack={() => {
          setMessage("");
          setStep(2);
        }}
        onConfirm={handleConfirm}
      />
    );
  }

  return null;
}
