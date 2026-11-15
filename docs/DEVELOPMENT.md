# Guida per lo sviluppo — DacciUnTaglio

Come muoversi nel progetto: creare pagine, componenti, hook, endpoint e stili
seguendo le convenzioni esistenti. Leggi prima [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Convenzioni generali

- Testi dell'interfaccia **in italiano**; codice, nomi e commenti in inglese
  semplice o italiano — come già usato nel file in cui lavori.
- Nessuno stile inline nei JSX: solo classi Bootstrap + classi CSS dai file
  in `client/src/styles/`.
- Date: il backend salva sempre UTC; il frontend formatta sempre nel fuso del
  negozio tramite le utility in `client/src/utils/format.js`.
- Stati appuntamento: usa le costanti in `client/src/utils/constants.js`
  (`APPOINTMENT_STATUSES`, `STATUS_LABELS`, `STATUS_BADGES`), non stringhe
  ripetute.

## Creare una pagina

1. Crea `client/src/pages/NomePagina.jsx` con un componente di default.
2. Aggiungi la route in `client/src/App.jsx`:

```jsx
<Route path="/nome-percorso" element={<NomePagina />} />
```

3. Se la pagina è riservata, avvolgila in `ProtectedRoute`
   (`role="admin"` per le pagine admin).
4. Per i dati: `useFetch` per le GET, `apiFetch` per le mutazioni.

```jsx
const { data, loading, error, refetch } = useFetch("/appointments/mine", { token });
```

## Creare un componente

1. Un componente = un file in `client/src/components/` (o in una sottocartella
   per feature, es. `components/booking/`).
2. Un solo componente per file, esportato come `default`.
3. Nome descrittivo: cosa **è**, non come è fatto (`ServiceEditModal`, non
   `Modal2`).
4. Se serve stato, usa `useState`; passa dati e callback via **props** dal
   genitore. Componenti grandi = segnale da suddividere (target 100–200 righe).
5. Ricorda: niente `style={{ ... }}`, mai.

## Creare un hook

1. Un file in `client/src/hooks/`, nome `useQualcosa.js`.
2. Lo hook incapsula stato + logica riutilizzabile (esempio esistente:
   `useFetch` gestisce loading/error/refetch di una GET).
3. Se dentro un `useEffect` fai chiamate API, ricorda la regola lint
   `react-hooks/set-state-in-effect`: niente setState sincroni nel corpo
   dell'effect — usa callback `.then(...)` e traccia lo stato "caricamento"
   in modo derivato (vedi lo step 2 del booking, `StepSchedule.jsx`, e la
   griglia slot in `BookingFlow.jsx`).

## Creare un endpoint (backend)

Flusso completo, nell'ordine:

1. **Validazione** — aggiungi le regole in `server/middleware/validators/`
   (o riusa quelle esistenti).
2. **Route** — `server/routes/nomeRoutes.js`:

```js
router.post("/", auth, authorize("admin"), validatorRules, checkValidation, handler);
```

3. **Controller** — funzione `(req, res, next)` in `server/controllers/`:
   valida gli input minimi, chiama il service, risponde o passa l'errore a
   `next(new ApiError(status, "messaggio"))`.
4. **Service** — se c'è logica di business (calcoli, regole, query composte),
   mettila in `server/services/`. I controller restano sottili.
5. **Model** — se serve un nuovo schema, `server/models/` con indici e
   validatori dichiarativi.
6. Registra la route in `server/server.js` con `app.use("/api/nome", nomeRoutes)`.

Rispondi sempre con `res.status(...).json(...)`; gli errori vanno a `next`.

## Effettuare una chiamata API (frontend)

```js
import { apiFetch } from "../api/http.js";

// GET pubblica
const slots = await apiFetch(`/availability?serviceId=${id}&date=${date}`);

// Mutazione protetta
await apiFetch("/appointments", {
  method: "POST",
  token,                 // dal AuthContext
  body: { serviceId, start },
});
```

- Errori: `catch (err)` con `err.status` (HTTP) e `err.message`.
- GET in lettura semplice: preferisci `useFetch`.

## Aggiungere uno stile CSS

1. Il **design system completo** vive in `src/styles/dacciuntaglio-theme.css`
   (importato in `main.jsx` subito dopo Bootstrap): palette `--dut-*`, override
   dei componenti Bootstrap e classi dei componenti (`.stepper`, `.slot`,
   `.admin-sidebar`, `.badge-status`, `.auth-card`…). Per cambiare l'aspetto
   dell'app modifica lì.
2. Stili specifici dell'app in `src/styles/global.css` e `components.css`
   (caricati dopo il tema via `index.css`): footer, card servizio, CTA navbar.
3. Se ripeti un valore (colore, spaziatura) più di una volta, aggiungilo alle
   variabili `--dut-*` del tema e usalo: `var(--dut-brand)`.

## Eseguire i test

```bash
cd server && npm test
```

- Suite Vitest su MongoDB **in memoria** (non tocca Atlas).
- Prima esecuzione: scarica il binario di Mongo (~800 MB, una volta sola,
  poi resta in cache e i test partono in pochi secondi).
- I test seguono la struttura `server/tests/`: `setup.js` (database in
  memoria + pulizia tra i test), `helpers.js` (date future dinamiche,
  controller chiamati con req/res/next "finti"), un file per area
  (`availability.test.js`, `appointments.test.js`).

Dopo modifiche al backend, aggiungi o aggiorna i test della zona toccata.

## Checklist prima di consegnare una modifica

- [ ] `npm test` (server) verde
- [ ] `npm run build` (client) ok
- [ ] `npm run lint` (client) senza nuovi errori
- [ ] Nessuno stile inline aggiunto
- [ ] Endpoint nuovi documentati in questa guida o in ARCHITECTURE.md
