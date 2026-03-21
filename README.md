# KW Time Report

Sistema di **time tracking** compliance-first per Karalisweb.

**Versione attuale:** 1.3.0 | **URL:** https://timereport.karalisdemo.it

---

## Funzionalita Principali

### Time Tracking (Collaboratore)
- Login con autenticazione JWT
- **2FA via email OTP** (attivabile/disattivabile)
- Inserimento time entry (data, durata, progetto, note)
- **Modifica data entry** — sposta una registrazione da un giorno all'altro
- Vista giornaliera con totale/target/stato
- Chiusura giornata (completa/incompleta)
- Vista settimanale con numero settimana e date
- **Navigazione settimana → giorno** — clicca un giorno per vedere il dettaglio
- Invio settimanale

### Admin
- Gestione utenti (CRUD + configurazione orari/target/ruoli)
- Gestione progetti (CRUD + assegnazioni utenti)
- **Dashboard compliance** con vista dettaglio per utente
- Export CSV timesheet

### Reminder Automatici
- **Soft reminder**: durante orario lavoro se target non raggiunto
- **Hard reminder**: fine giornata se giornata non chiusa
- **Weekly reminder**: lunedi se settimana precedente non inviata
- Canali: Slack, Email o entrambi

### Sicurezza
- Autenticazione JWT con scadenza configurabile
- **2FA email OTP** con toggle semplificato
- Password reset via email
- Guard basati su ruoli: Admin, PM, Senior, Executor

---

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| **Backend** | NestJS 11, TypeScript |
| **ORM** | Prisma 5, PostgreSQL 14+ |
| **Frontend** | React 19, TypeScript, Vite 7 |
| **UI** | Tailwind CSS 3.4, Lucide Icons, Karalisweb Design System v2.2 |
| **Auth** | JWT, bcrypt, 2FA email OTP |
| **Notifiche** | Slack API, Nodemailer SMTP |
| **Test** | Jest, ts-jest, supertest |
| **Deploy** | PM2, Nginx, rsync |

---

## Requisiti

- Node.js 18+
- PostgreSQL 14+
- npm

---

## Setup Locale

### 1. Database PostgreSQL

```bash
sudo -u postgres psql
CREATE USER timereport WITH PASSWORD 'TimeReport2026';
CREATE DATABASE timereport OWNER timereport;
GRANT ALL PRIVILEGES ON DATABASE timereport TO timereport;
\q
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Modifica .env con i tuoi valori
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'app sara disponibile su:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3002

---

## Variabili d'Ambiente

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://timereport:TimeReport2026@localhost:5432/timereport"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3002
NODE_ENV=development

# Slack
SLACK_BOT_TOKEN=""
SLACK_CHANNEL_DEFAULT="#time-report"

# Email (SMTP)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Time Report <noreply@karalisdemo.it>"

# Reminder
REMINDER_GRACE_PERIOD_MINUTES=30
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3002/api
```

---

## Test

```bash
# Unit test (calcoli date, logica business)
cd backend && npm test

# E2E test API (richiede database attivo)
cd backend && npm run test:e2e
```

---

## Deploy

Il deploy e gestito tramite **script automatizzato** (`deploy.sh`). Per la guida completa vedi [DEPLOY.md](DEPLOY.md).

```bash
# Deploy standard
./deploy.sh "descrizione delle modifiche"

# Deploy con bump versione (aggiorna automaticamente tutti i file)
./deploy.sh --bump patch "fix bug"
./deploy.sh --bump minor "nuova feature"
./deploy.sh --bump major "breaking change"
```

### Infrastruttura Produzione

| Parametro | Valore |
|-----------|--------|
| **Host** | vmi2996361.contaboserver.net |
| **Backend** | PM2 su porta 3004 |
| **Frontend** | Nginx static files |
| **URL** | https://timereport.karalisdemo.it |
| **Database** | PostgreSQL locale |

---

## Struttura Progetto

```
Time Tracker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # 9 modelli, 4 enum
│   ├── src/
│   │   ├── admin/                 # Gestione admin (utenti, progetti, compliance, export)
│   │   ├── auth/                  # JWT, login, guard, password reset, 2FA
│   │   ├── common/                # DTO e guard condivisi
│   │   ├── day-status/            # Stato giornaliero (aperto/chiuso)
│   │   ├── email/                 # Servizio invio email SMTP
│   │   ├── otp/                   # 2FA: generazione/validazione OTP
│   │   ├── prisma/                # PrismaService (database)
│   │   ├── projects/              # Progetti assegnati
│   │   ├── reminder/              # Reminder automatici (Slack + Email)
│   │   ├── time-entries/          # CRUD time entry
│   │   ├── users/                 # Gestione utenti
│   │   ├── weekly/                # Submission settimanali
│   │   ├── app.module.ts          # Root module
│   │   └── main.ts                # Entry point
│   ├── test/                      # Test E2E
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx         # Header mobile
│   │   │   ├── BottomNav.tsx      # Navigazione bottom mobile
│   │   │   └── Layout.tsx         # Layout con sidebar/header
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Context autenticazione JWT
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # Vista giornaliera + form edit con data
│   │   │   ├── Week.tsx           # Vista settimanale con click-to-day
│   │   │   ├── Login.tsx          # Login + 2FA OTP
│   │   │   ├── Settings.tsx       # Impostazioni utente
│   │   │   ├── ForgotPassword.tsx # Recupero password
│   │   │   ├── ResetPassword.tsx  # Reset password
│   │   │   └── admin/
│   │   │       ├── Compliance.tsx # Dashboard compliance
│   │   │       ├── Projects.tsx   # Gestione progetti
│   │   │       └── Users.tsx      # Gestione utenti
│   │   ├── services/
│   │   │   └── api.ts             # Client API centralizzato
│   │   └── types/
│   │       └── index.ts           # Definizioni TypeScript
│   └── package.json
├── CLAUDE.md                      # Mappa del codice (per sviluppatori)
├── CHANGELOG.md                   # Storico modifiche
├── DEPLOY.md                      # Guida deploy e infrastruttura
├── DESIGN-SYSTEM.md               # Design system Karalisweb v2.2
├── USER-GUIDE.md                  # Guida utente
├── SERVER-CONFIG.md               # Configurazione server
├── deploy.sh                      # Script deploy automatizzato
└── README.md                      # Questo file
```

---

## Ruoli Utente

| Ruolo | Permessi |
|-------|----------|
| **Admin** | Gestione completa: utenti, progetti, compliance, export |
| **PM** | Time tracking (stessi permessi executor) |
| **Senior** | Time tracking (stessi permessi executor) |
| **Executor** | Time tracking base: inserimento ore, vista giornaliera/settimanale |

---

## Documentazione

| Documento | Descrizione |
|-----------|------------|
| [CLAUDE.md](CLAUDE.md) | Mappa del codice per orientarsi velocemente |
| [CHANGELOG.md](CHANGELOG.md) | Storico completo delle modifiche |
| [DEPLOY.md](DEPLOY.md) | Guida deploy, infrastruttura e troubleshooting |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Design system Karalisweb v2.2 |
| [USER-GUIDE.md](USER-GUIDE.md) | Guida utente per collaboratori e admin |

---

## Database

9 modelli Prisma:

- **User** — utente con ruoli, config orari, reminder
- **Project** — progetto con codice univoco
- **ProjectAssignment** — assegnazione utente-progetto
- **TimeEntry** — registrazione ore
- **DayStatus** — stato giornata
- **WeeklySubmission** — invio settimanale
- **ReminderLog** — log reminder inviati
- **PasswordResetToken** — token reset password
- **OtpToken** — codici OTP per 2FA

4 ruoli: `admin`, `pm`, `senior`, `executor`

---

## Licenza

Proprietario: **Karalisweb**

---

*Ultimo aggiornamento: 2026-03-21*
