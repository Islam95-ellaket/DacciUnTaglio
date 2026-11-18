import nodemailer from "nodemailer";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

// Evita che caratteri speciali HTML (es. nel nome utente) "rompano" la grafica della mail
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );

// Transporter lazy (creato alla prima email e poi riusato): dotenv gira
// DOPO gli import, quindi process.env non è pronto a livello di modulo.
let transporter = null;
let transporterReady = false;

const getTransporter = () => {
  if (transporterReady) return transporter;
  transporterReady = true;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST) {
    console.log("📧 Email in modalità sviluppo: nessun SMTP configurato, stampo in console.");
    return null;
  }

  const port = Number(SMTP_PORT) || 587;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // SSL diretto solo sulla 465; con la 587 Nodemailer usa STARTTLS da solo
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    // Timeout corti: alcune piattaforme (es. Render free) bloccano l'SMTP in
    // uscita: meglio fallire in 5 secondi che far attendere i 2 minuti di
    // timeout di default di Nodemailer.
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  return transporter;
};

// Divide "DacciUnTaglio <noreply@…>" in nome + email: SendGrid li vuole separati.
const parseFrom = (from) => {
  const match = from.match(/^(.*?)\s*<([^<>]+)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, "").trim() || undefined, email: match[2].trim() };
  }
  return { email: from.trim() };
};

// Invio via API HTTP di SendGrid (porta 443: raggiungibile anche da Render,
// dove l'SMTP in uscita è bloccato). Zero dipendenze: usa fetch di Node.
const sendViaSendGrid = async (mail) => {
  const { name, email } = parseFrom(mail.from);

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: mail.to }] }],
      from: name ? { email, name } : { email },
      subject: mail.subject,
      content: [
        { type: "text/plain", value: mail.text },
        { type: "text/html", value: mail.html },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`SendGrid ha risposto ${res.status}: ${detail.slice(0, 200)}`);
  }
};

/**
 * Invia l'email di conferma di una prenotazione.
 * Chi la chiama deve gestire gli errori: una email mancata NON deve mai
 * annullare la prenotazione.
 *
 * Tre modalità, in ordine di preferenza:
 * 1. SendGrid API HTTP (SENDGRID_API_KEY) — funziona anche su Render;
 * 2. SMTP (SMTP_HOST, es. Mailtrap) — solo in locale, Render lo blocca;
 * 3. nessuna configurazione → stampa in console.
 */
export const sendBookingConfirmationEmail = async ({ user, service, appointment, shop }) => {
  const timeZone = shop.timezone || "Europe/Rome";

  // appointment.start/end sono UTC: le converto nell'orologio del negozio
  const startLocal = toZonedTime(appointment.start, timeZone);
  const endLocal = toZonedTime(appointment.end, timeZone);

  const day = format(startLocal, "EEEE d MMMM yyyy", { locale: it }); // "martedì 18 novembre 2026"
  const startTime = format(startLocal, "HH:mm");
  const endTime = format(endLocal, "HH:mm");
  const price = `€${Number(service.price).toFixed(2)}`;

  const subject = `Prenotazione confermata — ${shop.name}`;

  // Versione "testo semplice": la leggono anche i client di posta più vecchi
  const text = [
    `Ciao ${user.name},`,
    ``,
    `la tua prenotazione da ${shop.name} è confermata.`,
    ``,
    `Servizio: ${service.name}`,
    `Data: ${day}`,
    `Orario: ${startTime} - ${endTime}`,
    `Prezzo: ${price}`,
    ...(shop.address ? [``, `Ci troviamo in: ${shop.address}`] : []),
    ``,
    `Puoi annullare la prenotazione da "Le mie prenotazioni" fino a 24 ore prima dell'appuntamento.`,
    ``,
    `A presto!`,
    shop.name,
  ].join("\n");

  // Versione HTML: CSS nel <style> del <head>, zero stili inline (scelta
  // voluta). Alcuni client (Outlook desktop) ignorano il <style>: la mail
  // arriva non formattata ma con il contenuto integro.
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    .email-container {
      font-family: Arial, sans-serif;
      max-width: 480px;
      margin: 0 auto;
      padding: 24px;
      color: #212529;
      line-height: 1.5;
      background-color: #ffffff;
    }
    .title {
      font-size: 20px;
      color: #0d6efd;
      border-bottom: 2px solid #0d6efd;
      padding-bottom: 8px;
    }
    .details {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    .details td {
      padding: 6px 0;
      vertical-align: top;
    }
    .label {
      color: #6c757d;
      width: 90px;
    }
    .note {
      color: #6c757d;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <h1 class="title">Prenotazione confermata</h1>
    <p>Ciao <strong>${escapeHtml(user.name)}</strong>,</p>
    <p>la tua prenotazione da <strong>${escapeHtml(shop.name)}</strong> è confermata:</p>
    <table class="details">
      <tr>
        <td class="label">Servizio</td>
        <td><strong>${escapeHtml(service.name)}</strong></td>
      </tr>
      <tr>
        <td class="label">Data</td>
        <td><strong>${day}</strong></td>
      </tr>
      <tr>
        <td class="label">Orario</td>
        <td><strong>${startTime} – ${endTime}</strong></td>
      </tr>
      <tr>
        <td class="label">Prezzo</td>
        <td><strong>${price}</strong></td>
      </tr>
    </table>
    ${shop.address ? `<p>📍 ${escapeHtml(shop.address)}</p>` : ""}
    <p class="note">Puoi annullare la prenotazione da "Le mie prenotazioni" fino a 24 ore prima dell'appuntamento.</p>
    <p>A presto!<br /><strong>${escapeHtml(shop.name)}</strong></p>
  </div>
</body>
</html>`;

  const mail = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@dacciuntaglio.it",
    to: user.email,
    subject,
    text,
    html,
  };

  // Modalità 1: SendGrid via API HTTP (funziona anche su Render).
  if (process.env.SENDGRID_API_KEY) {
    await sendViaSendGrid(mail);
    return;
  }

  const transport = getTransporter();

  // Modalità sviluppo: stampo l'email in console invece di inviarla
  if (!transport) {
    console.log("📧 ─── EMAIL (sviluppo) ─────────────────────");
    console.log(`A: ${mail.to}`);
    console.log(`Oggetto: ${mail.subject}`);
    console.log("─────────────────────────────────────────────");
    console.log(text);
    console.log("📧 ───────────────────────────────────────────");
    return;
  }

  await transport.sendMail(mail);
};
