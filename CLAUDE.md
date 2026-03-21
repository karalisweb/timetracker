# CLAUDE.md — Mappa del Codice

> Questo file serve per orientarsi nel progetto senza leggere tutto il codice.
> Aggiornato alla versione **1.3.0**.

---

## Cos'e questo progetto

**KW Time Report** — App di time tracking per Karalisweb. I collaboratori registrano le ore lavorate giornalmente, chiudono le giornate, e inviano il riepilogo settimanale. L'admin monitora la compliance.

**URL produzione**: https://timereport.karalisdemo.it

---

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Backend | NestJS 11, TypeScript, Prisma 5, PostgreSQL |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 3.4 |
| Auth | JWT + 2FA email OTP |
| Notifiche | Slack API, Nodemailer SMTP |
| Deploy | PM2, Nginx, rsync su Contabo VPS |

---

## Struttura Backend (`backend/src/`)

| Modulo | Cosa fa | File chiave |
|--------|---------|-------------|
| `auth/` | Login JWT, password reset, 2FA OTP | `auth.service.ts`, `guards/` |
| `users/` | CRUD utenti, profili, ruoli | `users.service.ts` |
| `projects/` | Progetti assegnati all'utente loggato | `projects.service.ts` |
| `time-entries/` | CRUD registrazioni ore | `time-entries.service.ts` |
| `day-status/` | Apri/chiudi giornata, summary | `day-status.service.ts` |
| `weekly/` | Riepilogo e invio settimanale | `weekly.service.ts` |
| `admin/` | Gestione utenti/progetti/compliance/export | `admin.controller.ts` |
| `reminder/` | Reminder automatici Slack+Email (soft/hard/weekly) | `reminder.service.ts` |
| `otp/` | Generazione e validazione OTP per 2FA | `otp.service.ts` |
| `email/` | Invio email SMTP | `email.service.ts` |
| `prisma/` | PrismaService singleton | `prisma.service.ts` |

### Database (Prisma)

Schema in `backend/prisma/schema.prisma`. Modelli principali:

- **User** — utente con ruoli (`admin|pm|senior|executor`), config orari, reminder
- **Project** — progetto con codice univoco
- **ProjectAssignment** — assegnazione utente-progetto
- **TimeEntry** — registrazione ore (userId, projectId, date, durationMinutes, notes)
- **DayStatus** — stato giornata (open/closed_complete/closed_incomplete)
- **WeeklySubmission** — invio settimanale (userId, weekStart, weekEnd)
- **ReminderLog** — log reminder inviati
- **PasswordResetToken** — token reset password
- **OtpToken** — codici OTP per 2FA

### Guardie (Auth Guards)

- `JwtAuthGuard` — richiede autenticazione JWT (usato ovunque)
- `AdminGuard` — solo ruolo admin
- `ProjectManagerGuard` — ruolo pm o admin

---

## Struttura Frontend (`frontend/src/`)

| File/Cartella | Cosa fa |
|---------------|---------|
| `App.tsx` | Routes: `/` Dashboard, `/week`, `/settings`, `/admin/*` |
| `context/AuthContext.tsx` | Context JWT, login/logout, ruoli, 2FA state |
| `services/api.ts` | Client API centralizzato (axios) con interceptor auth |
| `types/index.ts` | Tutti i tipi TypeScript |
| `components/Layout.tsx` | Sidebar desktop + mobile slide-over menu |
| `components/BottomNav.tsx` | Navigazione bottom mobile |
| `components/Header.tsx` | Header mobile |
| `pages/Dashboard.tsx` | Vista giornaliera — form inline add/edit, lista entries |
| `pages/Week.tsx` | Vista settimanale — griglia 7 giorni, invio, navigazione |
| `pages/Settings.tsx` | Profilo utente, toggle 2FA |
| `pages/Login.tsx` | Login + flusso 2FA OTP |
| `pages/admin/Compliance.tsx` | Dashboard compliance admin |
| `pages/admin/Users.tsx` | CRUD utenti admin |
| `pages/admin/Projects.tsx` | CRUD progetti admin |

### Navigazione

- **Desktop**: sidebar fissa a sinistra (260px) con sezioni TIME TRACKING e AMMINISTRAZIONE
- **Mobile**: bottom nav (Oggi, Settimana, Menu) + slide-over per admin
- Dalla **Week** cliccando un giorno si naviga al **Dashboard** con `?date=YYYY-MM-DD`

---

## API Endpoints principali

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/auth/login` | Login (ritorna JWT o richiede 2FA) |
| GET | `/auth/me` | Utente corrente |
| GET | `/time-entries?date=` | Entries per data |
| POST | `/time-entries` | Crea entry |
| PUT | `/time-entries/:id` | Modifica entry (anche data) |
| DELETE | `/time-entries/:id` | Elimina entry |
| GET | `/day-status?date=` | Stato giornata |
| POST | `/day-status/close` | Chiudi giornata |
| POST | `/day-status/reopen` | Riapri giornata |
| GET | `/weekly/current?weekStart=` | Riepilogo settimana |
| POST | `/weekly/submit` | Invia settimana |
| GET | `/admin/compliance` | Dashboard compliance |
| GET | `/admin/export?from=&to=` | Export CSV |

---

## Come funziona il flusso utente

1. **Login** → JWT token salvato in localStorage
2. **Dashboard** (pagina `/`) → mostra il giorno corrente, entries, progress bar
3. L'utente **aggiunge ore** (progetto + durata + note opzionali)
4. A fine giornata **chiude la giornata** (completa/incompleta in base al target)
5. Dalla **Settimana** vede il riepilogo e **invia la settimana**
6. L'admin vede tutto nella **Compliance** e puo esportare CSV

---

## Cose da sapere (gotcha)

### Date e timezone
Le date vengono passate come stringhe `YYYY-MM-DD`. Il backend le parsa come date locali (NON UTC) usando `parseLocalDate()` in `weekly.service.ts`. Questo e critico: `new Date("2026-02-16")` in JS e UTC midnight, che in CET diventa il giorno prima. Usa sempre `parseLocalDate()` o `new Date(year, month-1, day)`.

### Edit entry con cambio data
Il form di modifica include un campo data (visibile solo in edit mode). L'update API accetta `date` come campo opzionale. Questo permette di spostare un'entry da un giorno all'altro.

### Giornata chiusa = read-only (solo UI)
Quando una giornata e chiusa, i bottoni edit/delete spariscono nel frontend. Ma il backend NON ha un check server-side sullo stato giornata per update/delete. L'enforcement e solo UI.

### Invio settimanale irreversibile
Una volta inviata, la settimana non puo essere "deinviata". Non c'e check backend che impedisca di modificare entries dopo l'invio.

### Ruoli
- `executor` — solo time tracking
- `senior` / `pm` — time tracking (stessi permessi di executor per ora)
- `admin` — tutto: gestione utenti, progetti, compliance, export

---

## Comandi utili

```bash
# Backend dev
cd backend && npm run start:dev

# Frontend dev
cd frontend && npm run dev

# Prisma
cd backend && npx prisma studio          # GUI database
cd backend && npx prisma migrate dev     # Nuova migration
cd backend && npx prisma generate        # Rigenera client

# Deploy
./deploy.sh "descrizione"               # Deploy senza bump
./deploy.sh --bump patch "fix bug"       # Deploy con bump versione

# Test
cd backend && npm test                   # Unit test
cd backend && npm run test:e2e           # Integration test API
```

---

## File di documentazione

| File | Contenuto |
|------|-----------|
| `README.md` | Setup, stack, variabili ambiente, struttura progetto |
| `CHANGELOG.md` | Storico versioni con dettaglio modifiche |
| `USER-GUIDE.md` | Guida utente per collaboratori e admin |
| `DEPLOY.md` | Guida deploy e infrastruttura server |
| `DESIGN-SYSTEM.md` | Design system Karalisweb v2.2 (colori, tipografia, componenti) |
| `SERVER-CONFIG.md` | Configurazione server Contabo |
| `CLAUDE.md` | Questo file — mappa del codice |

---

*Ultimo aggiornamento: 2026-03-21*
