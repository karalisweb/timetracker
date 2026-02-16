# KW Time Report - Guida Deploy

Versione attuale: **1.1.1**

---

## Informazioni Server

| Parametro | Valore |
|-----------|--------|
| **Host** | vmi2996361.contaboserver.net |
| **IP** | 185.192.97.108 |
| **User** | root |
| **Path backend** | `/root/time-report/backend` |
| **Path frontend** | `/var/www/time-report` |
| **PM2 process name** | `time-report` |
| **Porta backend locale** | 3004 |
| **Porta backend server** | 3004 |
| **URL pubblico** | https://timereport.karalisdemo.it |
| **Nginx config** | `/etc/nginx/sites-available/timereport.karalisdemo.it` |
| **GitHub repo** | github.com/karalisweb/time-tracker |
| **Branch** | main |
| **Database** | PostgreSQL (`timereport` su porta 5432) |
| **Framework backend** | NestJS 11 |
| **Framework frontend** | React 19 + Vite 7 + Tailwind CSS |
| **ORM** | Prisma 5 |

---

## Deploy con Script

### Deploy standard (commit + push + build + restart)

```bash
./deploy.sh "descrizione delle modifiche"
```

### Deploy con aggiornamento versione

```bash
# Bug fix (1.1.0 > 1.0.1)
./deploy.sh --bump patch "fix calcolo ore giornaliere"

# Nuova funzionalita (1.1.0 > 1.1.0)
./deploy.sh --bump minor "aggiunto report settimanale PDF"

# Breaking change (1.1.0 > 2.0.0)
./deploy.sh --bump major "redesign dashboard completo"
```

Il flag `--bump` aggiorna automaticamente la versione in:
- `backend/package.json`
- `frontend/package.json`
- `deploy.sh` (header + variabile APP_VERSION)
- `DEPLOY.md` (questo file)

---

## Cosa fa deploy.sh (8 step)

| Step | Azione | Dettaglio |
|------|--------|-----------|
| 0 | **Versioning** (opzionale) | Se `--bump`, aggiorna versione in tutti i file |
| 1 | **Verifica Git** | Controlla modifiche locali |
| 2 | **Commit** | `git add .` + `git commit -m "messaggio"` |
| 3 | **Push** | `git push origin main` |
| 4 | **Build Frontend** | `cd frontend && npm run build` (React + Vite) |
| 5 | **Sync Backend** | rsync backend al VPS (esclusi node_modules, .env, dist) |
| 6 | **Sync Frontend** | rsync frontend/dist al VPS in `/var/www/time-report/` |
| 7 | **Setup Remoto** | Sul VPS: `npm install` + `prisma generate` + `nest build` + `prisma migrate deploy` |
| 8 | **Restart** | `pm2 restart time-report --update-env` |

---

## Comandi Manuali

### Deploy manuale (senza script)

```bash
# 1. Push locale
git add . && git commit -m "messaggio" && git push origin main

# 2. Build frontend
cd frontend && npm run build && cd ..

# 3. Sync al server
rsync -avz --exclude 'node_modules' --exclude '.env' --exclude 'dist' backend/ root@185.192.97.108:/root/time-report/backend/
rsync -avz frontend/dist/ root@185.192.97.108:/var/www/time-report/

# 4. Sul server
ssh root@185.192.97.108
cd /root/time-report/backend
npm install
npx prisma generate
npm run build
npx prisma migrate deploy
pm2 restart time-report --update-env
```

### Solo Restart

```bash
ssh root@185.192.97.108 'pm2 restart time-report'
```

### Verifica Logs

```bash
ssh root@185.192.97.108 'pm2 logs time-report --lines 20 --nostream'
```

### Verifica Status

```bash
ssh root@185.192.97.108 'pm2 show time-report'
```

### Verifica Nginx

```bash
ssh root@185.192.97.108 'nginx -t && systemctl reload nginx'
```

---

## Regole per deploy.sh

Lo script `deploy.sh` deve sempre contenere nella sezione CONFIGURAZIONE:

```bash
APP_NAME="KW Time Report"                # Nome app
APP_VERSION="X.Y.Z"                      # Versione corrente (semantic versioning)
VPS_HOST="root@185.192.97.108"           # Accesso VPS
VPS_PATH="/root/time-report"             # Path backend sul server
FRONTEND_PATH="/var/www/time-report"     # Path frontend sul server
BRANCH="main"                            # Branch Git
PM2_PROCESS="time-report"               # Nome processo PM2
LOCAL_PORT=3004                           # Porta backend in sviluppo locale
SERVER_PORT=3004                          # Porta backend sul server
PUBLIC_URL="https://timereport.karalisdemo.it"  # URL pubblico
NGINX_CONFIG="/etc/nginx/sites-available/timereport.karalisdemo.it"  # Config Nginx
```

L'header ASCII dello script deve riportare tutte queste informazioni come riferimento rapido.

---

## Versioning

Formato: **Semantic Versioning** `vMAJOR.MINOR.PATCH`

- **MAJOR**: breaking changes, redesign completo
- **MINOR**: nuove funzionalita
- **PATCH**: bug fix, correzioni minori

La versione va tenuta sincronizzata in:

| File | Campo | Esempio |
|------|-------|---------|
| `backend/package.json` | `"version"` | `"1.1.0"` |
| `frontend/package.json` | `"version"` | `"1.1.0"` |
| `deploy.sh` | `APP_VERSION` + header | `APP_VERSION="1.1.0"` |
| `DEPLOY.md` | Intestazione | `Versione attuale: **1.1.1**` |
| **Sidebar UI** | Sotto il nome app | `v1.1.0` |

Per aggiornare tutto in automatico usare `--bump`:
```bash
./deploy.sh --bump patch "fix bug"
```

---

## Architettura Deploy

Time Report usa un'architettura **decoupled**:

```
+-------------------+          +-------------------+
|    Frontend       |          |     Backend       |
|    (React/Vite)   |          |     (NestJS)      |
|                   |          |                   |
|  /var/www/        |  API     |  /root/           |
|  time-report/     | -------> |  time-report/     |
|                   |  :3004   |  backend/         |
|  Servito da Nginx |          |  PM2 process      |
+-------------------+          +-------------------+
         |                              |
         |        Nginx Proxy           |
         +------------------------------+
         |  timereport.karalisdemo.it   |
         |  / -> frontend statico      |
         |  /api -> localhost:3004     |
         +------------------------------+
```

- **Frontend**: file statici serviti direttamente da Nginx
- **Backend**: API NestJS in esecuzione su PM2, proxied da Nginx su `/api`
- **Database**: PostgreSQL locale sulla stessa macchina

---

## File esclusi dal deploy

| File/Cartella | Motivo |
|---------------|--------|
| `.env` | Configurazioni ambiente (credenziali, JWT secret) |
| `node_modules/` | Installate sul server con `npm install` |
| `dist/` | Rigenerata con `npm run build` |
| `*.db`, `*.db-*` | Eventuali file SQLite temporanei |

---

## Note Importanti

1. **Build frontend obbligatoria**: Il frontend React/Vite deve essere buildato localmente (`cd frontend && npm run build`) prima del deploy. I file statici risultanti vanno sincronizzati sul server.

2. **Build backend obbligatoria**: Il backend NestJS richiede `npm run build` sul server dopo ogni sync per compilare TypeScript.

3. **Prisma Migrations**: Se ci sono modifiche allo schema del database, le migrazioni vengono eseguite automaticamente dallo script con `npx prisma migrate deploy`. Per migrazioni manuali:
   ```bash
   ssh root@185.192.97.108 'cd /root/time-report/backend && npx prisma migrate deploy'
   ```

4. **Prisma Generate**: Dopo modifiche allo schema, serve `npx prisma generate` per rigenerare il client. Lo script lo fa automaticamente.

5. **Rate Limiting SSH**: Il server ha un rate limiter sulle connessioni SSH. Se ricevi errori "Connection closed", aspetta 30-60 secondi prima di riprovare.

6. **PM2 fallback**: Se il processo non esiste ancora, lo script lo crea automaticamente con `pm2 start dist/main.js --name 'time-report'`.

7. **PostgreSQL**: Il database vive sul server. Non viene toccato dal deploy. Le migrazioni Prisma gestiscono le modifiche allo schema in modo sicuro e incrementale.

---

## Troubleshooting

### L'app non si avvia
```bash
ssh root@185.192.97.108 'pm2 logs time-report --lines 50 --nostream'
```

### Errore durante la build backend
```bash
ssh root@185.192.97.108 'cd /root/time-report/backend && npm run build 2>&1 | tail -30'
```

### Errore build frontend (locale)
```bash
cd frontend && npm run build 2>&1 | tail -30
```

### Verifica file frontend deployati
```bash
ssh root@185.192.97.108 'ls -la /var/www/time-report/'
```

### Verifica file backend deployati
```bash
ssh root@185.192.97.108 'ls -la /root/time-report/backend/dist/'
```

### Reinstalla dipendenze da zero
```bash
ssh root@185.192.97.108 'cd /root/time-report/backend && rm -rf node_modules && npm install && npx prisma generate && npm run build && pm2 restart time-report'
```

### Verifica porta in uso
```bash
ssh root@185.192.97.108 'lsof -i :3004'
```

### Verifica stato database
```bash
ssh root@185.192.97.108 'systemctl status postgresql'
```

### Verifica connessione database
```bash
ssh root@185.192.97.108 'cd /root/time-report/backend && npx prisma db pull --print'
```

### Riavvia Nginx (se problemi di routing)
```bash
ssh root@185.192.97.108 'nginx -t && systemctl reload nginx'
```

### Rollback Prisma migration
```bash
ssh root@185.192.97.108 'cd /root/time-report/backend && npx prisma migrate resolve --rolled-back MIGRATION_NAME'
```

---

## Setup Iniziale (solo prima volta)

Per il primo deploy su un nuovo server:

```bash
# 1. Crea directory
ssh root@185.192.97.108 'mkdir -p /root/time-report/backend /var/www/time-report'

# 2. Setup PostgreSQL
ssh root@185.192.97.108 << 'EOF'
sudo -u postgres psql -c "CREATE USER timereport WITH PASSWORD 'TimeReport2026';"
sudo -u postgres psql -c "CREATE DATABASE timereport OWNER timereport;"
EOF

# 3. Copia .env sul server
scp backend/.env.production root@185.192.97.108:/root/time-report/backend/.env

# 4. Deploy standard
./deploy.sh "initial deploy"

# 5. Configura Nginx
ssh root@185.192.97.108 'certbot --nginx -d timereport.karalisdemo.it'
```

---

*Ultimo aggiornamento: 2026-02-16*
