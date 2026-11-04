# Mappa dei File — Capstone Booking App MERN

> Breve descrizione di ogni file del progetto. Aggiornato al 28/10/2026.

---

## Root (documentazione)

| File | Descrizione |
|------|-------------|
| `.clinerules` | Regole di lavoro per l'Agent AI (Cline) |
| `Regole_lavoro_Agent_AI.md` | Regole di lavoro (copia) |
| `Analisi_tecnica_booking_app_MERN.md` | Riferimento architetturale (schema DB, endpoint, struttura cartelle) |
| `Piano_3_settimane_Agent_AI.md` | Piano operativo 3 settimane con task giornaliere |
| `Stato_lavoro_ultima_sessione.md` | Stato del lavoro aggiornato a fine sessione |
| `Valutazione_Competenze.md` | Scheda di valutazione competenze dell'utente |

---

## client/ (Frontend React + Vite)

### Configurazione
| File | Descrizione |
|------|-------------|
| `client/.env` | Variabili d'ambiente (VITE_API_URL) |
| `client/.gitignore` | File ignorati da Git (.env, node_modules) |
| `client/package.json` | Dipendenze e script del frontend |
| `client/vite.config.js` | Configurazione Vite (bundler) |
| `client/eslint.config.js` | Configurazione ESLint (linting) |
| `client/index.html` | Entry point HTML dell'app React |

### Codice sorgente (client/src/)
| File | Descrizione |
|------|-------------|
| `client/src/main.jsx` | Entry point React: monta App con BrowserRouter e AuthProvider |
| `client/src/App.jsx` | Routing principale (Routes + Route + ProtectedRoute) |
| `client/src/App.css` | Stili CSS custom dell'app |
| `client/src/index.css` | Stili globali (reset, font, ecc.) |

---

## client/src/components/

| File | Descrizione |
|------|-------------|
| `client/src/components/Navbar.jsx` | Barra di navigazione (responsive, hamburger, link condizionali per ruolo) |
| `client/src/components/ProtectedRoute.jsx` | Guard per route protette (blocca non loggati e non-admin) |

## client/src/context/

| File | Descrizione |
|------|-------------|
| `client/src/context/AuthContext.jsx` | Contesto autenticazione (user, token, login, register, logout, localStorage) |

## client/src/pages/

| File | Descrizione |
|------|-------------|
| `client/src/pages/Home.jsx` | Pagina home (benvenuto) |
| `client/src/pages/Login.jsx` | Pagina login (form email/password) |
| `client/src/pages/Register.jsx` | Pagina registrazione (form nome/email/password) |
| `client/src/pages/services.jsx` | Pagina admin gestione servizi (CRUD: tabella + form + modal + delete) |
| `client/src/pages/servicesList.jsx` | Pagina pubblica lista servizi (card con nome, prezzo, durata) |
| `client/src/pages/BookingFlow.jsx` | Flusso prenotazione 3 step (servizio → data/slot → conferma) |
| `client/src/pages/MyBookings.jsx` | Pagina "Le mie prenotazioni" (lista attive + passate, annullamento) |

## client/src/utils/

| File | Descrizione |
|------|-------------|
| `client/src/utils/formatPrice.js` | Formattazione prezzo in euro (virgola + 2 decimali) |

---


---

## server/ (Backend Node + Express)

### Configurazione
| File | Descrizione |
|------|-------------|
| `server/.env` | Variabili d'ambiente (MONGODB_URI, JWT_SECRET, PORT, FRONTEND_URL) |
| `server/.gitignore` | File ignorati da Git (.env, node_modules) |
| `server/package.json` | Dipendenze e script del backend (start, dev) |
| `server/server.js` | Entry point Express: middleware, route, avvio server |
| `server/seed.js` | Script seed: crea shop (lun-sab 09:00-19:00) + admin |

### Configurazione DB (server/config/)
| File | Descrizione |
|------|-------------|
| `server/config/db.js` | Connessione a MongoDB Atlas (Mongoose) |

### Controller (server/controllers/)
| File | Descrizione |
|------|-------------|
| `server/controllers/authController.js` | Controller auth (register, login, generateToken JWT) |
| `server/controllers/serviceController.js` | Controller servizi (getServices, createService, updateService, deleteService) |
| `server/controllers/appointmentController.js` | Controller appuntamenti (create, getMy, cancel) |
| `server/controllers/availabilityController.js` | Controller disponibilità (getAvailability) |

### Middleware (server/middleware/)
| File | Descrizione |
|------|-------------|
| `server/middleware/auth.js` | Middleware JWT: verifica token, popola req.user |
| `server/middleware/authorize.js` | Middleware autorizzazione ruoli (admin) |
| `server/middleware/errorHandler.js` | Gestore errori centralizzato + 404 notFound |
| `server/middleware/validators/authValidators.js` | Validatori auth (register, login) |
| `server/middleware/validators/serviceValidators.js` | Validatori servizi (create, update) |
| `server/middleware/validators/appointmentValidators.js` | Validatori appuntamenti (create) |

### Modelli (server/models/)
| File | Descrizione |
|------|-------------|
| `server/models/User.js` | Modello utente (name, email, passwordHash, role) |
| `server/models/Shop.js` | Modello negozio (name, address, phone, timezone, workingHours, blockedSlots, recurringBlocks) |
| `server/models/Service.js` | Modello servizio (shopId, name, price, durationMinutes, isActive) |
| `server/models/Appointment.js` | Modello appuntamento (shopId, serviceId, userId, start, end, status) + indice unico parziale |

### Route (server/routes/)
| File | Descrizione |
|------|-------------|
| `server/routes/authRoutes.js` | Route auth (POST register, POST login) |
| `server/routes/serviceRoutes.js` | Route servizi (GET pubblico, POST/PATCH/DELETE admin) |
| `server/routes/appointmentRoutes.js` | Route appuntamenti (POST, GET /mine, DELETE /:id — protette da auth) |
| `server/routes/availabilityRoutes.js` | Route disponibilità (GET / pubblico) |

### Servizi (server/services/)
| File | Descrizione |
|------|-------------|
| `server/services/availabilityService.js` | Logica critica: calcolo slot disponibili (griglia fissa, sovrapposizioni, fuso orario, recurringBlocks) |

### Utility (server/utils/)
| File | Descrizione |
|------|-------------|
| `server/utils/ApiError.js` | Classe ApiError (statusCode + message) per errori uniformi |

---

## File generati (non versionati)

| File/Cartella | Descrizione |
|---------------|-------------|
| `client/dist/` | Build di produzione del frontend (generato da npm run build) |
| `client/node_modules/` | Dipendenze frontend (generato da npm install) |
| `server/node_modules/` | Dipendenze backend (generato da npm install) |
| `client/package-lock.json` | Lock file delle dipendenze frontend |
| `server/package-lock.json` | Lock file delle dipendenze backend |

---

*Ultimo aggiornamento: 28/10/2026*
