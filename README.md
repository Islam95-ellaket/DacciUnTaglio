# DacciUnTaglio — App di prenotazione per barbieri (MERN)

Applicazione full-stack che permette ai clienti di prenotare un appuntamento
(taglio, tinta, ecc.) scegliendo giorno e orario da un calendario, e all'admin
di gestire appuntamenti, servizi e orari del negozio.

## Tecnologie

| Livello   | Stack                                                        |
| --------- | ------------------------------------------------------------ |
| Frontend  | React 19 + Vite 8 + Bootstrap 5 + React Router 7             |
| Backend   | Node.js + Express 5 + Mongoose (MongoDB) + JWT + bcryptjs    |
| Email     | Nodemailer (SMTP: Gmail o Mailtrap per i test)               |
| Test      | Vitest + mongodb-memory-server (MongoDB in memoria)          |
| Database  | MongoDB Atlas (o qualsiasi istanza MongoDB compatibile)      |

## Prerequisiti

- Node.js 20 (o superiore) e npm
- Un database MongoDB (consigliato: cluster gratuito Atlas M0)
- (Facoltativo) Account Mailtrap per intercettare le email di test

## Installazione

```bash
# 1. Clona il repository e entra nella cartella

# 2. Installa le dipendenze di backend e frontend
cd server && npm install
cd ../client && npm install
```

## Configurazione

Ogni cartella (`server/`, `client/`) ha un file `.env.example`: copialo in `.env`
e compila i valori. Riferimenti: `server/.env.example` e `client/.env.example`.

Valori minimi per partire:

- **server/.env**: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`
  (le variabili `SMTP_*` sono facoltative: senza di esse le email vengono
  stampate in console, l'app funziona comunque)
- **client/.env**: `VITE_API_URL` (es. `http://localhost:7007/api`)

## Avvio in sviluppo

Due terminali, uno per ciascun livello:

```bash
cd server && npm run dev     # backend su http://localhost:7007 (nodemon)
cd client && npm run dev     # frontend su http://localhost:5173
```

## Seed iniziale

Crea il negozio (orari lun–sab 09:00–19:00, pausa pranzo 13:00–14:00) e
l'utente admin. Le credenziali admin si impostano via env (`ADMIN_EMAIL`,
`ADMIN_PASSWORD`) o vengono stampate a console:

```bash
cd server && node seed.js
```

## Comandi disponibili

| Comando                 | Dove       | Cosa fa                                   |
| ----------------------- | ---------- | ----------------------------------------- |
| `npm run dev`           | entrambi   | Avvio in sviluppo (nodemon / Vite)        |
| `npm run build`         | `client/`  | Build di produzione in `client/dist/`     |
| `npm run preview`       | `client/`  | Anteprima della build di produzione       |
| `npm run lint`          | `client/`  | Controllo qualità codice (ESLint)         |
| `npm test`              | `server/`  | Suite di test (Vitest, 22 test)           |
| `node seed.js`          | `server/`  | Crea negozio + admin se assenti           |

## Struttura delle cartelle

```
├── client/                 # Frontend React
│   └── src/
│       ├── api/            # apiFetch: chiamate HTTP condivise
│       ├── components/     # Componenti riutilizzabili
│       │   ├── booking/    #   Step 1-3 + conferma del booking flow
│       │   ├── services/   #   Azioni e modal della gestione servizi
│       │   └── admin-shop-hours/ # Form orari e pause del negozio
│       ├── context/        # AuthContext (utente loggato)
│       ├── hooks/          # useFetch (GET con loading/error/refetch)
│       ├── pages/          # Pagine collegate alle route
│       ├── styles/         # CSS organizzati (variables/global/components/calendar)
│       └── utils/          # format.js (date/prezzi), constants.js (stati)
├── server/                 # Backend Express
│   ├── config/             # Connessione MongoDB
│   ├── controllers/        # Gestione HTTP: req → service → res
│   ├── middleware/         # auth, authorize, validators, errorHandler
│   ├── models/             # Schemi Mongoose (User, Service, Shop, Appointment)
│   ├── routes/             # Definizione endpoint (pubblici / protetti / admin)
│   ├── services/           # Logica di business (disponibilità, email)
│   ├── tests/              # Suite Vitest su Mongo in memoria
│   └── utils/              # ApiError, dateUtils, validate
└── docs/                   # Documentazione tecnica
```

## Funzionalità principali

- **Cliente**: registrazione/login, scelta servizio → calendario mensile con
  giorni disponibili → griglia di slot → riepilogo e conferma; email di
  conferma; "Le mie prenotazioni" con annullamento (entro 24h prima).
- **Admin**: tabella appuntamenti (filtro per date, cambio stato anche
  retroattivo: completato/annullato/non presentato), CRUD servizi,
  gestione orari di apertura e pause settimanali.
- **Regole automatiche**: conflitti impossibili (indice unico + ricontrollo
  server-side), limite di prenotazioni per cliente al giorno (configurabile
  su `shops.maxBookingsPerDay`), auto-completamento degli appuntamenti passati.

## Deploy

- **Backend**: Render (Web Service Node). Health check su `/api/test`.
  Ricorda di impostare tutte le variabili d'ambiente, incluse le `SMTP_*`
  per le email reali.
- **Frontend**: Vercel o Netlify. Build command `npm run build`, output
  `dist/`, variabile `VITE_API_URL` puntante al backend deployato.
- **Database**: Atlas M0 con Network Access `0.0.0.0/0` e utente dedicato.

Documentazione tecnica dettagliata in [`docs/`](docs/):
[ARCHITECTURE.md](docs/ARCHITECTURE.md) · [DEVELOPMENT.md](docs/DEVELOPMENT.md)
