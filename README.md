# Time Report MVP

Sistema di time tracking compliance-first per Karalisweb.

## Requisiti

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## Stack Tecnologico

**Backend:**
- NestJS 11
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Slack API (per reminder)
- Nodemailer (per email)

**Frontend:**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router

## Setup Locale

### 1. Database PostgreSQL

```bash
# Crea utente e database
sudo -u postgres psql
CREATE USER timereport WITH PASSWORD 'TimeReport2026';
CREATE DATABASE timereport OWNER timereport;
GRANT ALL PRIVILEGES ON DATABASE timereport TO timereport;
\q
```

### 2. Backend

```bash
cd backend

# Installa dipendenze
npm install

# Copia e configura variabili d'ambiente
cp .env.example .env
# Modifica .env con i tuoi valori

# Genera client Prisma e applica migrazioni
npx prisma generate
npx prisma migrate dev

# Avvia in sviluppo
npm run start:dev
```

### 3. Frontend

```bash
cd frontend

# Installa dipendenze
npm install

# Avvia in sviluppo
npm run dev
```

L'app sarà disponibile su:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3002

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

# Slack (opzionale)
SLACK_BOT_TOKEN=""
SLACK_CHANNEL_DEFAULT="#time-report"

# Email SMTP (opzionale)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Time Report <noreply@example.com>"

# Reminder
REMINDER_GRACE_PERIOD_MINUTES=30
```

### Frontend

Crea `frontend/.env` se necessario:

```env
VITE_API_URL=http://localhost:3002/api
```

## Deploy Produzione

### 1. Build Backend

```bash
cd backend
npm install
npm run build
npm run prisma:deploy
```

### 2. Build Frontend

```bash
cd frontend
npm install
npm run build
# Output in dist/
```

### 3. PM2 (raccomandato)

```bash
# Avvia backend
cd backend
pm2 start dist/main.js --name time-report

# Salva configurazione
pm2 save
```

### 4. Nginx (esempio)

```nginx
server {
    listen 443 ssl;
    server_name timereport.karalisdemo.it;

    ssl_certificate /etc/letsencrypt/live/timereport.karalisdemo.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/timereport.karalisdemo.it/privkey.pem;

    # Frontend (static)
    location / {
        root /var/www/time-report;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Primo Utente Admin

Al primo avvio, crea un utente admin via Prisma Studio o SQL:

```bash
cd backend
npx prisma studio
```

Oppure via SQL:

```sql
INSERT INTO "User" (id, email, password, name, role, "workingDays", "workStartTime", "workEndTime", "dailyTargetMinutes", "reminderChannel", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2b$10$...', -- bcrypt hash della password
  'Admin',
  'admin',
  ARRAY[1,2,3,4,5],
  '09:00',
  '18:00',
  480,
  'slack',
  NOW(),
  NOW()
);
```

## Funzionalità

### Collaboratore
- Login
- Inserimento time entry (data, durata, progetto, note)
- Vista giornata con totale/target/stato
- Chiusura giornata (completa/incompleta)
- Vista settimana con riepilogo
- Invio settimanale

### Admin
- Gestione utenti (CRUD + configurazione orari/target)
- Gestione progetti (CRUD + assegnazioni)
- Dashboard compliance
- Export CSV timesheet

### Reminder Automatici
- **Soft reminder**: Durante orario lavoro se target non raggiunto
- **Hard reminder**: Fine giornata se giornata non chiusa
- **Weekly reminder**: Lunedì se settimana precedente non inviata

## Struttura Progetto

```
Time Tracker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── day-status/
│   │   ├── projects/
│   │   ├── reminder/
│   │   ├── time-entries/
│   │   ├── users/
│   │   ├── weekly/
│   │   └── main.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
└── README.md
```

## Licenza

Proprietario: Karalisweb
