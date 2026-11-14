# Architettura — DacciUnTaglio

Questo documento descrive come è organizzata l'applicazione e perché.
È pensato per uno sviluppatore junior: niente di ciò che leggi qui richiede
conoscenze avanzate.

## 1. Architettura generale

Applicazione **MERN monorepo**: un unico repository con due applicazioni
indipendenti che comunicano via HTTP/JSON.

```
┌─────────────────┐         HTTPS/JSON          ┌──────────────────┐
│   React (client)│  ──────────────────────────▶ │  Express (server)│
│   Vite + Bootstrap                            │                  │
└─────────────────┘                             └────────┬─────────┘
                                                         │ Mongoose
                                                         ▼
                                              ┌──────────────────┐
                                              │   MongoDB (Atlas)│
                                              └──────────────────┘
```

Principi guida:

- **Logica di business solo nel backend** (`server/services/`): il frontend
  mostra dati e raccoglie input, non decide mai sulla disponibilità.
- **Date sempre in UTC nel database**; le conversioni nel fuso del negozio
  (`shops.timezone`, default `Europe/Rome`) avvengono ai bordi (API e UI).
- **Mai cancellare appuntamenti**: cambio di `status`
  (`active` → `cancelled` / `completed` / `no-show`). Soft delete anche per
  i servizi (`isActive: false`).

## 2. Comunicazione frontend/backend

- Il client chiama il backend con `apiFetch` (`client/src/api/http.js`):
  gestisce base URL, header `Authorization: Bearer <token>` e JSON.
  Errori HTTP → oggetto `Error` con `.status` e `.message`.
- Le GET semplici usano l'hook `useFetch` (loading/error/refetch automatici).
  Le mutazioni (POST/PATCH/DELETE) chiamano `apiFetch` direttamente.
- CORS configurato su `FRONTEND_URL` (solo l'origine del frontend).

## 3. Autenticazione

1. `POST /api/auth/register|login` → bcrypt verifica/crea l'hash, il server
   risponde con **JWT (7 giorni)** contenente `{ id, role }` e i dati pubblici
   dell'utente (mai la password).
2. Il frontend salva token+utente in `localStorage` (`AuthContext`).
3. A ogni richiesta protetta, il middleware `auth` verifica il token e
   popola `req.user`; `authorize("admin")` blocca i non-admin con 403.

## 4. Flusso prenotazioni (il cuore dell'app)

```
Cliente                Backend (availabilityService / appointmentController)
   │                    │
   │─ GET /availability/month ─▶ giorni del mese con ≥1 slot libero
   │◀─ ["2026-11-17", ...] ──    (alimenta il calendario)
   │
   │─ GET /availability?serviceId&date ─▶ griglia di slot ISO (UTC)
   │◀─ ["2026-11-17T08:00:00.000Z", ...]
   │
   │─ POST /api/appointments {serviceId, start}
   │                        1. validazione input
   │                        2. limite prenotazioni/giorno (403 se superato)
   │                        3. slot ancora in disponibilità (409)
   │                        4. nessun sovrapposizione con appuntamenti attivi (409)
   │                        5. indice unico parziale (shopId+start, status:"active")
   │                           come rete di sicurezza anti race condition
   │                        6. salva (UTC) → email di conferma (non bloccante)
   │◀─ 201 appointment
```

**Griglia slot** (`getAvailableSlots`): slot fissi dall'orario di apertura con
passo `shops.slotInterval` (default 10 min; lo step deve dividere le durate dei
servizi). Uno slot vale solo se il servizio ci sta interamente prima della
chiusura e non si sovrappone (finestre semi-aperte `[start, end)`) ad
appuntamenti attivi, blocchi una tantum e pause ricorrenti. Gli slot nel
passato non vengono mai restituiti.

## 5. Gestione appuntamenti

- **Cliente**: `GET /appointments/mine` (proprie), `DELETE /appointments/:id`
  → `status: "cancelled"`, solo se mancano **più di 24 ore** (calcolo su
  timestamp assoluti in ms).
- **Admin**: `GET /appointments/admin?from&to` (populate di cliente e
  servizio), `PATCH /appointments/:id/status` → cambio stato esente dalla
  regola 24h; riattivare un appuntamento controlla i conflitti (409).
- Al caricamento delle liste, gli appuntamenti passati e ancora `active`
  passano automaticamente a `completed` (`completePastAppointments`).

## 6. Gestione servizi e negozio

- **Servizi**: CRUD in `serviceController`; la "disattivazione" è un flag
  (`isActive`), la lista pubblica mostra solo quelli attivi.
- **Negozio** (documento unico in `shops`): orari settimanali
  (`workingHours[{dayOfWeek, open, close}]`), blocchi una tantum
  (`blockedSlots[{start, end, reason}]`), pause ricorrenti
  (`recurringBlocks`), `slotInterval`, `maxBookingsPerDay`, `timezone`.
  Modificabile dall'admin da interfaccia (form orari + pause).

## 7. Ruolo dei controller

I controller (`server/controllers/`) fanno **solo da traduttori HTTP**:

1. leggono/validano `req` (con `express-validator` nei middleware),
2. chiamano la logica nei `services/`,
3. rispondono `res.json(...)` con lo status corretto.

Non contengono logica di business né query complesse: se serve decidere
qualcosa, la decisione vive in `services/`.

## 8. Ruolo dei middleware

| Middleware      | Compito                                                        |
| --------------- | -------------------------------------------------------------- |
| `auth`          | Verifica JWT → popola `req.user`                               |
| `authorize`     | Consente solo ai ruoli indicati (es. `"admin"`)                |
| `validators/*`  | Regole `express-validator` per body/query                      |
| `checkValidation` | Traduce gli errori di validazione in 400 (ApiError)          |
| `errorHandler`  | Formato errori uniforme `{ error: { message } }` + status      |
| `notFound`      | 404 per le route inesistenti                                   |

Ordine in `server.js`: route → `notFound` → `errorHandler` (sempre ultimo).

## 9. Gestione errori

- `ApiError(statusCode, message)` è l'unico tipo di errore "di dominio":
  si lancia da qualunque punto e l'`errorHandler` lo converte in risposta.
- Il frontend distingue gli errori tramite `.status`: 409 → "slot appena
  occupato, ricarica gli slot"; 401 → "sessione scaduta"; 403 → regole di
  business legate all'utente; altro → messaggio generico.
- Email di conferma: se l'invio fallisce, l'errore viene solo loggato —
  la prenotazione resta valida (effetto collaterale mai bloccante).

## 10. Gestione date (riassunto)

- Nel DB: sempre UTC.
- "Giorno del negozio": stringhe `YYYY-MM-DD` nel fuso `shops.timezone`.
- Utility: `fromZonedTime`/`toZonedTime` (date-fns-tz), `getLocalDateString`,
  `nextDate`, `isValidDateString` (`server/utils/dateUtils.js`).
- Attenzione ai `default` di Mongoose: si applicano solo ai documenti nuovi
  (Schema ≠ dati): il codice che legge un campo opzionale usa un fallback
  (`shop.campo ?? default`).
