import { useState, useEffect, useContext, useCallback } from "react";
import { useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { apiFetch } from "../api/http.js";
import Stepper from "../components/booking/Stepper.jsx";
import StepServices from "../components/booking/StepServices.jsx";
import StepSchedule from "../components/booking/StepSchedule.jsx";
import StepConfirm from "../components/booking/StepConfirm.jsx";
import ConfirmationScreen from "../components/booking/ConfirmationScreen.jsx";

const BOOKING_STEPS = ["Servizio", "Data e orario", "Conferma"];

// Orchestratore del booking: qui vivono stato, handler e chiamate API,
// le schermate sono in components/booking/.
export default function BookingFlow() {
  const { token } = useContext(AuthContext);
  const location = useLocation();
  const preset = location.state?.service; // pre-selezione dalla card "Prenota"

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
  // (servizio, data) a cui si riferiscono gli slot in stato: serve a
  // riconoscere quelli vecchi mentre la risposta nuova viaggia.
  const [slotsFor, setSlotsFor] = useState(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");

  const goToStep1 = () => {
    setStep(1);
    setSelectedService(null);
    setDate("");
    setSlots([]);
    setSlotsFor(null);
    setSelectedSlot(null);
    setSlotsError(null);
    setMessage("");
  };

  // Solo la chiamata API: la usano l'effect e il bottone "Riprova".
  // Avvolge la risposta con (servizio, data) così chi applica lo stato sa
  // a cosa si riferiscono gli slot.
  const fetchSlots = useCallback(() => {
    if (!date || !selectedService) return Promise.resolve(null);
    return apiFetch(
      `/availability?serviceId=${selectedService._id}&date=${date}`
    ).then((data) => ({ data, serviceId: selectedService._id, date }));
  }, [date, selectedService]);

  const applySlots = useCallback((result) => {
    setSlots(result.data);
    setSlotsFor({ serviceId: result.serviceId, date: result.date });
    setSlotsError(null);
    setSlotsLoading(false);
  }, []);

  const applySlotsError = useCallback((err) => {
    setSlotsError(err.message);
    setSlotsLoading(false);
  }, []);

  // Carica gli slot quando cambiano data o servizio. Catena di promesse +
  // flag cancelled: nessun setState sincrono nell'effect e le risposte
  // "fuori tempo" (data già cambiata) vengono ignorate.
  useEffect(() => {
    let cancelled = false;

    // fetchSlots risolve null quando manca data o servizio: nessuna chiamata.
    fetchSlots()
      .then((data) => {
        if (!cancelled && data) applySlots(data);
      })
      .catch((err) => {
        if (!cancelled) applySlotsError(err);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchSlots, applySlots, applySlotsError]);

  // Ricarica manuale dal bottone "Riprova": parte da un evento, i setState
  // sincroni qui vanno bene.
  const loadSlots = () => {
    if (!date || !selectedService) return;
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots([]);
    fetchSlots().then(applySlots).catch(applySlotsError);
  };

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
        // Slot appena occupato da un altro cliente: ricarico gli slot
        try {
          const fresh = await apiFetch(
            `/availability?serviceId=${selectedService._id}&date=${date}`
          );
          setSlots(fresh);
          setSlotsFor({ serviceId: selectedService._id, date });
        } catch {
          // Il refresh è un bonus: se fallisce, il messaggio sotto guida
          // comunque l'utente a scegliere un altro orario
        }
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

  // Gli slot in stato sono affidabili solo per la coppia attuale: finché
  // non arriva la risposta nuova mostriamo "caricamento" invece di un falso
  // "nessuno slot disponibile".
  const slotsStale =
    Boolean(date && selectedService) &&
    (slotsFor?.serviceId !== selectedService._id || slotsFor?.date !== date);
  const slotsBusy = slotsLoading || slotsStale;

  // --- Schermata di conferma: tutti i passi completati ---
  if (confirmed) {
    return (
      <>
        <Stepper steps={BOOKING_STEPS} current={BOOKING_STEPS.length} />
        <ConfirmationScreen
          service={selectedService}
          slot={selectedSlot}
        />
      </>
    );
  }

  // --- Step 1: scelta servizio ---
  if (step === 1) {
    return (
      <>
        <Stepper steps={BOOKING_STEPS} current={0} />
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
      </>
    );
  }

  // --- Step 2: scelta data e orario ---
  if (step === 2) {
    return (
      <>
        <Stepper steps={BOOKING_STEPS} current={1} />
        <StepSchedule
          service={selectedService}
          token={token}
          date={date}
          slots={slots}
          slotsLoading={slotsBusy}
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
      </>
    );
  }

  // --- Step 3: riepilogo e conferma ---
  if (step === 3) {
    return (
      <>
        <Stepper steps={BOOKING_STEPS} current={2} />
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
      </>
    );
  }

  return null;
}
