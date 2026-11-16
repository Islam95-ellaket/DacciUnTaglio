# DacciUnTaglio — Frontend (React + Vite)

Frontend dell'app di prenotazione per barbieri. La documentazione completa
del progetto (monorepo client + server) vive nella [README della root](../README.md);
qui solo le istruzioni rapide per questo livello.

## Avvio

```bash
npm install
npm run dev      # sviluppo su http://localhost:5173
```

## Configurazione

Copia `.env.example` in `.env` e imposta `VITE_API_URL`
(es. `http://localhost:7007/api`).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Server di sviluppo Vite |
| `npm run build` | Build di produzione in `dist/` |
| `npm run preview` | Anteprima della build |
| `npm run lint` | Controllo qualità codice (ESLint) |

## Struttura di `src/`

- `api/` — `apiFetch` condiviso (HTTP + JWT + gestione errori)
- `components/` — componenti riutilizzabili, divisi per feature
  (`booking/`, `services/`, `admin-shop-hours/`, `admin/`)
- `context/` — `AuthContext` (sessione utente)
- `hooks/` — `useFetch` (GET con loading/error/refetch)
- `pages/` — pagine collegate alle route
- `styles/` — `dacciuntaglio-theme.css` (design system) + `global.css` + `components.css`
- `utils/` — formatter (date/prezzi) e costanti condivise

Convenzioni dettagliate in [`docs/DEVELOPMENT.md`](../docs/DEVELOPMENT.md).
