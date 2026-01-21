# Checklist Deployment - Modulo Orchestration

> Documento di riferimento per testare, verificare e pubblicare il modulo Orchestration
> Ultima modifica: 2026-01-17

---

## 1. Riepilogo Modifiche

### Nuove Funzionalità
- **Modulo Orchestration**: Gestione progetti con checklist e gates
- **Integrazione Asana**: Creazione automatica task, webhook per sincronizzazione
- **Pannello Configurazione**: Gestione credenziali Asana da UI admin
- **Sistema Ruoli Multipli**: Utenti con più ruoli (`roles[]` invece di `role`)

### File Principali Modificati

#### Backend
| File | Tipo | Descrizione |
|------|------|-------------|
| `prisma/schema.prisma` | Modificato | Nuovo schema con orchestration + roles[] |
| `src/auth/auth.service.ts` | Modificato | JWT con roles[] |
| `src/auth/guards/admin.guard.ts` | Modificato | Usa roles.includes() |
| `src/users/users.service.ts` | Modificato | CRUD con roles[] e asanaUserId |
| `src/users/dto/create-user.dto.ts` | Modificato | DTO con roles[] |
| `src/admin/admin.service.ts` | Modificato | Query con roles[] |
| `src/reminder/reminder.service.ts` | Modificato | Filtro con roles[] |
| `src/app.module.ts` | Modificato | Import nuovi moduli |

#### Backend - Nuovi File
| Cartella | Contenuto |
|----------|-----------|
| `src/orchestration/` | Modulo completo (projects, checklists, gates) |
| `src/asana/` | Client API, task service, webhook |
| `src/config-panel/` | Gestione configurazione Asana |
| `prisma/migrations/` | Migrazione database |
| `prisma/seed-orchestration.ts` | Seed dati iniziali |

#### Frontend
| File | Tipo | Descrizione |
|------|------|-------------|
| `src/types/index.ts` | Modificato | Tipi Orchestration + UserRole |
| `src/context/AuthContext.tsx` | Modificato | Helpers per roles[] |
| `src/services/api.ts` | Modificato | API orchestration e config |
| `src/App.tsx` | Modificato | Route orchestration |
| `src/components/Layout.tsx` | Modificato | Menu orchestration |

#### Frontend - Nuovi File
| File | Descrizione |
|------|-------------|
| `src/pages/orchestration/OrchProjects.tsx` | Lista progetti |
| `src/pages/orchestration/OrchProjectDetail.tsx` | Dettaglio con gates |
| `src/pages/orchestration/OrchProjectCreate.tsx` | Form creazione |
| `src/pages/admin/AsanaConfig.tsx` | Config Asana |

---

## 2. Pre-Requisiti Deployment

### 2.1 Variabili Ambiente Richieste

Aggiungere al file `.env` di produzione:

```env
# Chiave per crittografia configurazioni (generare una nuova per produzione!)
CONFIG_ENCRYPTION_KEY="chiave-32-caratteri-per-aes-256"

# Asana (opzionale - configurabile da UI admin)
ASANA_ACCESS_TOKEN=""
ASANA_WORKSPACE_ID=""
ASANA_DEFAULT_PROJECT_ID=""
ASANA_FIELD_PROJECT_ID=""
ASANA_FIELD_CHECKLIST_ID=""
ASANA_WEBHOOK_SECRET=""
```

**IMPORTANTE**: La `CONFIG_ENCRYPTION_KEY` deve essere:
- Esattamente 32 caratteri
- Diversa tra ambienti (dev/staging/prod)
- Salvata in modo sicuro (non nel repository)

### 2.2 Requisiti Asana (se si vuole usare integrazione)

1. **Personal Access Token** o **OAuth App** Asana
2. **Workspace ID** Asana
3. **Project ID** dove creare i task
4. **Custom Fields** (opzionali):
   - Campo per ProjectID
   - Campo per ChecklistID

---

## 3. Procedura Deployment

### Step 1: Backup Database
```bash
# Esempio per PostgreSQL
pg_dump -U username -d database_name > backup_pre_orchestration.sql
```

### Step 2: Applicare Migrazione Database
```bash
cd backend

# In produzione usare migrate deploy
npx prisma migrate deploy

# Verificare che la migrazione sia stata applicata
npx prisma migrate status
```

### Step 3: Rigenerare Prisma Client
```bash
npx prisma generate
```

### Step 4: Eseguire Seed Dati Orchestration
```bash
# Questo crea: templates, gates, requirements
npx ts-node prisma/seed-orchestration.ts
```

### Step 5: Aggiornare Ruoli Utenti Esistenti

Gli utenti esistenti hanno `role` (singolo), devono passare a `roles[]`:

```sql
-- Convertire admin esistenti
UPDATE users
SET roles = ARRAY['admin', 'pm', 'senior', 'executor']::user_role[]
WHERE role = 'admin';

-- Convertire collaborator esistenti in executor
UPDATE users
SET roles = ARRAY['executor']::user_role[]
WHERE role = 'collaborator';

-- Verificare conversione
SELECT email, role, roles FROM users;
```

### Step 6: Build e Deploy

```bash
# Backend
cd backend
npm run build
# Riavviare il servizio

# Frontend
cd frontend
npm run build
# Deploy della cartella dist/
```

### Step 7: Configurare Asana (Post-Deploy)

1. Accedere come admin all'app
2. Andare su **Admin > Asana**
3. Inserire credenziali Asana
4. Testare connessione
5. Salvare

---

## 4. Test da Eseguire

### 4.1 Test Backend (Manuali)

#### Autenticazione e Ruoli
- [ ] Login utente con ruoli multipli
- [ ] JWT contiene `roles[]` correttamente
- [ ] Guard AdminGuard blocca non-admin
- [ ] Guard OrchestrationGuard permette pm/senior/admin
- [ ] Guard ProjectManagerGuard permette solo pm/admin

#### API Orchestration
```bash
# Ottenere token
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' | jq -r '.accessToken')

# Lista templates
curl http://localhost:3002/api/orchestration/templates \
  -H "Authorization: Bearer $TOKEN"

# Creare progetto
curl -X POST http://localhost:3002/api/orchestration/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","checklists":[{"checklistTemplateId":"<UUID>"}]}'

# Dettaglio progetto
curl http://localhost:3002/api/orchestration/projects/<PROJECT_ID> \
  -H "Authorization: Bearer $TOKEN"
```

#### API Config Panel
```bash
# Leggere config (solo admin)
curl http://localhost:3002/api/admin/config/asana \
  -H "Authorization: Bearer $TOKEN"

# Testare connessione Asana
curl -X POST http://localhost:3002/api/admin/config/asana/test \
  -H "Authorization: Bearer $TOKEN"
```

### 4.2 Test Frontend (Manuali)

#### Navigazione
- [ ] Menu "Orchestration" visibile solo per pm/senior/admin
- [ ] Menu "Amministrazione" visibile solo per admin
- [ ] Route `/orchestration` accessibile
- [ ] Route `/orchestration/new` accessibile
- [ ] Route `/admin/asana` accessibile solo per admin

#### Pagine Orchestration
- [ ] Lista progetti mostra progetti esistenti
- [ ] Creazione progetto funziona
- [ ] Checklist obbligatorie pre-selezionate
- [ ] Dettaglio progetto mostra gates
- [ ] Gates mostrano checklist mancanti
- [ ] Aggiunta checklist a progetto esistente

#### Pagina Config Asana
- [ ] Form carica valori esistenti
- [ ] Salvataggio funziona
- [ ] Test connessione mostra risultato
- [ ] Indicatore stato (configurato/non configurato)

### 4.3 Test Integrazione Asana

**Prerequisito**: Asana configurato correttamente

- [ ] Creazione progetto crea task su Asana
- [ ] Task contiene titolo checklist
- [ ] Task assegnato all'executor (se specificato)
- [ ] Custom fields popolati (se configurati)
- [ ] Completamento task su Asana aggiorna app (webhook)
- [ ] Retry sync recupera task falliti

### 4.4 Test Regressione

Verificare che le funzionalità esistenti funzionino ancora:

- [ ] Login/Logout
- [ ] Dashboard time tracking
- [ ] Inserimento ore
- [ ] Vista settimanale
- [ ] Admin: lista utenti
- [ ] Admin: gestione progetti (time tracking)
- [ ] Admin: compliance
- [ ] Impostazioni utente

---

## 5. Problemi Noti e Soluzioni

### 5.1 Errore "roles" non esiste

**Problema**: Query falliscono perché `roles` non esiste nel database

**Soluzione**: Eseguire migrazione
```bash
npx prisma migrate deploy
```

### 5.2 Utenti non possono accedere a Orchestration

**Problema**: Utenti esistenti non hanno ruoli corretti

**Soluzione**: Aggiornare ruoli via SQL (vedi Step 5)

### 5.3 Errore crittografia config

**Problema**: `CONFIG_ENCRYPTION_KEY` mancante o errata

**Soluzione**:
- Verificare che sia esattamente 32 caratteri
- Verificare che sia impostata nell'ambiente

### 5.4 Task Asana non creati

**Problema**: Creazione progetto non crea task

**Possibili cause**:
1. Asana non configurato → Configurare da Admin > Asana
2. Token scaduto → Rigenerare token Asana
3. Project ID errato → Verificare ID progetto Asana

### 5.5 Webhook Asana non funziona

**Problema**: Completamento task non sincronizza

**Verifiche**:
1. Webhook registrato su Asana?
2. URL webhook raggiungibile pubblicamente?
3. Secret configurato correttamente?
4. Log errori nel backend?

---

## 6. Rollback

In caso di problemi gravi, procedura di rollback:

### 6.1 Rollback Database
```bash
# Ripristinare backup
psql -U username -d database_name < backup_pre_orchestration.sql
```

### 6.2 Rollback Codice
```bash
# Tornare al commit precedente
git checkout <commit-hash-precedente>
git push -f origin main  # ATTENZIONE: force push
```

### 6.3 Rollback Parziale (solo disabilitare Orchestration)

Se si vuole mantenere gli altri cambiamenti:
1. Rimuovere link dal menu (Layout.tsx)
2. Rimuovere routes (App.tsx)
3. Mantenere dati nel database per futuro ripristino

---

## 7. Monitoraggio Post-Deploy

### Log da Monitorare
```bash
# Errori backend
grep -i "error" /var/log/app/backend.log

# Errori specifici Asana
grep -i "asana" /var/log/app/backend.log

# Errori webhook
grep -i "webhook" /var/log/app/backend.log
```

### Metriche da Verificare
- [ ] Tempo risposta API orchestration < 500ms
- [ ] Nessun errore 500 nelle prime 24h
- [ ] Task Asana creati correttamente
- [ ] Webhook processati senza errori

---

## 8. Contatti e Supporto

Per problemi durante il deployment:
1. Consultare questo documento
2. Verificare log applicazione
3. Controllare stato database
4. Verificare configurazione Asana

---

## Changelog

| Data | Versione | Note |
|------|----------|------|
| 2026-01-17 | 1.0.0 | Prima release modulo Orchestration |
