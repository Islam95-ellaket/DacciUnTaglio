import { STATUS_LABELS } from "../utils/constants.js";

/**
 * Trasforma gli appuntamenti dal formato backend al formato richiesto da FullCalendar.
 */
export const mapAppointmentsToFullCalendar = (appointments) => {
  return appointments.map((appointment) => {
    // Definiamo il colore in base allo stato
    let color = "#6c757d"; // default (secondary)
    if (appointment.status === "active") color = "#0d6efd"; // primary
    if (appointment.status === "completed") color = "#198754"; // success
    if (appointment.status === "cancelled") color = "#dc3545"; // danger

    // Usiamo STATUS_LABELS per rendere il titolo più chiaro
    const statusLabel = STATUS_LABELS[appointment.status] || appointment.status;
    const client = appointment.userId?.name || "Cliente";
    const service = appointment.serviceId?.name || "Servizio";

    return {
      id: appointment._id,
      title: `[${statusLabel}] ${client} - ${service}`,
      start: appointment.start,
      end: appointment.end,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        status: appointment.status,
        clientName: client,
        serviceName: service,
      },
    };
  });
};
