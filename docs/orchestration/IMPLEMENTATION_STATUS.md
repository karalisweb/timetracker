# Stato Implementazione - Modulo Orchestration

> Ultima modifica: 2026-01-17

---

## Fase 1: Backend Core ✅ COMPLETATA

### 1.1 Schema Prisma ✅

**File modificati:**
- `backend/prisma/schema.prisma`

**Modifiche:**
- Enum `UserRole`: aggiunto `pm`, `senior`, `executor` (rimosso `collaborator`)
- Model `User`: `role` → `roles[]`, aggiunto `asanaUserId`
- Nuovi enum: `OrchProjectStatus`, `ChecklistCategory`, `ChecklistInstanceStatus`, `GateName`
- Nuovi model: `OrchProject`, `ChecklistTemplate`, `ChecklistItemTemplate`, `ChecklistInstance`, `ExecutionTask`, `Gate`, `GateRequirement`, `AsanaWebhookEvent`

**Migrazione SQL:**
- `backend/prisma/migrations/20260117_add_orchestration/migration.sql`

### 1.2 Guards ✅

**File creati:**
- `backend/src/auth/guards/orchestration.guard.ts` - Accesso modulo Orchestration (pm, senior, admin)
- `backend/src/auth/guards/project-manager.guard.ts` - Creazione progetti (pm, admin)
- `backend/src/auth/guards/index.ts` - Barrel export

**File modificati:**
- `backend/src/auth/guards/admin.guard.ts` - Usa `roles[]` invece di `role`

### 1.3 Modulo Orchestration ✅

**Struttura creata:**
```
backend/src/orchestration/
├── orchestration.module.ts
├── projects/
│   ├── orch-projects.controller.ts
│   ├── orch-projects.service.ts
│   └── dto/
│       ├── create-orch-project.dto.ts
│       └── index.ts
├── checklists/
│   ├── checklist-templates.controller.ts
│   └── checklist-templates.service.ts
└── gates/
    └── gate.service.ts
```

### 1.4 Servizi Implementati ✅

**OrchProjectsService:**
- `findAll()` - Lista progetti
- `findOne()` - Dettaglio con gates
- `create()` - Crea progetto con checklist (+ task Asana)
- `addChecklist()` - Aggiungi checklist a progetto esistente (+ task Asana)
- `retrySyncAsana()` - Retry task Asana falliti
- `createAsanaTasks()` - Creazione manuale task Asana

**ChecklistTemplatesService:**
- `findAll()` - Lista templates (con filtro activeOnly)
- `findOne()` - Dettaglio template
- `findByCategory()` - Filtro per categoria

**GateService:**
- `evaluateGates()` - Valuta e aggiorna stato progetto
- `recalculateGates()` - Ricalcolo forzato
- `getGatesForProject()` - Solo lettura gates

### 1.5 Seed Data ✅

**File creato:**
- `backend/prisma/seed-orchestration.ts`

**Dati:**
- 5 ChecklistTemplate (SEO Base, Tecnica Post-Pubblicazione, Privacy Essenziale, Performance Minima, Backend CMS)
- 2 Gates (published, delivered)
- 4 GateRequirements

### 1.6 File Esistenti Aggiornati ✅

Per compatibilità con `roles[]`:
- `backend/src/admin/admin.service.ts` - `role` → `roles: { has: 'executor' }`
- `backend/src/auth/auth.service.ts` - JWT payload con `roles`
- `backend/src/users/users.service.ts` - CRUD con `roles` e `asanaUserId`
- `backend/src/users/dto/create-user.dto.ts` - `roles[]` e `asanaUserId`
- `backend/src/reminder/reminder.service.ts` - Filtro utenti con `roles`

---

## API Endpoints Implementati

### Orchestration Projects

| Method | Endpoint | Guard | Descrizione |
|--------|----------|-------|-------------|
| GET | `/orchestration/projects` | Orch | Lista progetti |
| GET | `/orchestration/projects/:id` | Orch | Dettaglio + gates |
| POST | `/orchestration/projects` | PM | Crea progetto |
| POST | `/orchestration/projects/:id/checklists` | PM | Aggiungi checklist |
| POST | `/orchestration/projects/:id/retry-sync` | PM | Retry sync Asana |
| POST | `/orchestration/projects/:id/create-asana-tasks` | PM | Crea task Asana manualmente |
| POST | `/orchestration/projects/:id/recalculate-gates` | PM | Ricalcola gates |
| GET | `/orchestration/projects/:id/gates` | Orch | Solo gates |

### Orchestration Templates

| Method | Endpoint | Guard | Descrizione |
|--------|----------|-------|-------------|
| GET | `/orchestration/templates` | Orch | Lista templates |
| GET | `/orchestration/templates/category/:category` | Orch | Filtro categoria |
| GET | `/orchestration/templates/:id` | Orch | Dettaglio template |

---

## Fase 2: Integrazione Asana ✅ COMPLETATA

### 2.1 Modulo Asana ✅

**Struttura creata:**
```
backend/src/asana/
├── asana.module.ts
├── asana-client.service.ts    # Client REST API Asana
├── asana-task.service.ts      # Creazione/gestione task
└── index.ts                   # Barrel export
```

### 2.2 AsanaClientService ✅

**Funzionalità:**
- `createTask()` - Crea task su Asana
- `updateTask()` - Aggiorna task esistente
- `getTask()` - Recupera dettagli task
- `completeTask()` / `reopenTask()` - Gestione completamento
- `testConnection()` - Test connessione API
- Supporto custom fields per ProjectID e ChecklistID

### 2.3 AsanaTaskService ✅

**Funzionalità:**
- `createTaskForChecklist()` - Crea task per singola checklist
- `createTasksForProject()` - Crea task per tutte le checklist di un progetto
- `syncTaskStatus()` - Sincronizza stato da Asana
- `retryFailedTasks()` - Retry task falliti

### 2.4 Integrazione nel Flow ✅

**Modifiche a OrchProjectsService:**
- Alla creazione progetto, crea automaticamente task Asana
- Alla aggiunta checklist, crea task Asana
- Endpoint `POST /projects/:id/create-asana-tasks` per creazione manuale
- Endpoint `POST /projects/:id/retry-sync` per retry task falliti

### 2.5 Configurazione Ambiente ✅

**Variabili aggiunte a `.env.example`:**
```env
ASANA_ACCESS_TOKEN=""
ASANA_WORKSPACE_ID=""
ASANA_DEFAULT_PROJECT_ID=""
ASANA_FIELD_PROJECT_ID=""
ASANA_FIELD_CHECKLIST_ID=""
ASANA_WEBHOOK_SECRET=""
```

---

## Fase 3: Webhook e Pannello Config ✅ COMPLETATA

### 3.1 Webhook Controller ✅

**File creati:**
```
backend/src/asana/
├── asana-webhook.controller.ts  # Endpoint webhook
└── asana-webhook.service.ts     # Processamento eventi
```

**Funzionalità:**
- Handshake iniziale con Asana
- Verifica firma HMAC
- Processamento eventi `task.completed` / `task.reopened`
- Aggiornamento ChecklistInstance e ricalcolo Gates

### 3.2 Pannello Configurazione Asana ✅

**Backend:**
```
backend/src/config-panel/
├── config-panel.module.ts
├── config-panel.controller.ts
├── config-panel.service.ts
└── dto/update-asana-config.dto.ts
```

**API Endpoints:**
| Method | Endpoint | Guard | Descrizione |
|--------|----------|-------|-------------|
| GET | `/admin/config/asana` | Admin | Leggi configurazione |
| POST | `/admin/config/asana` | Admin | Aggiorna configurazione |
| POST | `/admin/config/asana/test` | Admin | Test connessione |
| GET | `/admin/config/asana/status` | Admin | Stato connessione |

**Frontend:**
- Pagina `/admin/asana` per configurare credenziali
- Indicatori stato connessione
- Test connessione in-app
- Salvataggio criptato dei token sensibili

### 3.3 Schema Database ✅

**Nuovo model:**
```prisma
model AppConfig {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  encrypted Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Fase 4: Frontend Orchestration ✅ COMPLETATA

### 4.1 Tipi TypeScript ✅

**File modificato:**
- `frontend/src/types/index.ts`

**Tipi aggiunti:**
- `OrchProjectStatus`, `ChecklistCategory`, `ChecklistInstanceStatus`, `GateName`
- `ChecklistItemTemplate`, `ChecklistTemplate`, `ExecutionTask`
- `ChecklistInstance`, `Gate`, `GateRequirement`, `OrchProject`

### 4.2 Pagine Orchestration ✅

**File creati:**
```
frontend/src/pages/orchestration/
├── OrchProjects.tsx        # Lista progetti
├── OrchProjectDetail.tsx   # Dettaglio con gates e checklist
└── OrchProjectCreate.tsx   # Form creazione progetto
```

**Funzionalità:**
- Lista progetti con stato, progress checklist, e gates
- Dettaglio progetto con visualizzazione gates (passed/missing)
- Gestione checklist: aggiunta, visualizzazione task, progress bar
- Form creazione con selezione multipla checklist e assegnazione esecutori
- Retry sync Asana per task falliti
- Ricalcolo gates manuale

### 4.3 Routing e Navigazione ✅

**File modificati:**
- `frontend/src/App.tsx`
  - Nuovo guard `OrchestrationRoute` (pm, senior, admin)
  - Routes: `/orchestration`, `/orchestration/new`, `/orchestration/:id`

- `frontend/src/components/Layout.tsx`
  - Sezione "Orchestration" nel menu (desktop e mobile)
  - Visibile solo per utenti con `canAccessOrchestration`

### 4.4 API Frontend ✅

**File già presente:**
- `frontend/src/services/api.ts` - `orchestrationApi` già implementato in Fase 3

---

## Implementazione Completata

Tutte le 4 fasi sono state completate:
- ✅ Fase 1: Backend Core
- ✅ Fase 2: Integrazione Asana
- ✅ Fase 3: Webhook e Pannello Config
- ✅ Fase 4: Frontend Orchestration

---

## Come Testare

### 1. Applicare Migrazione

```bash
cd backend
npx prisma migrate deploy
# Oppure in dev:
npx prisma db push
```

### 2. Eseguire Seed

```bash
npx ts-node prisma/seed-orchestration.ts
```

### 3. Aggiornare Ruoli Utente Esistente

```sql
UPDATE users SET roles = ARRAY['admin', 'pm', 'senior', 'executor']::UserRole[] WHERE email = 'alessio@example.com';
```

### 4. Test API

```bash
# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alessio@example.com","password":"password"}'

# Lista templates
curl http://localhost:3002/api/orchestration/templates \
  -H "Authorization: Bearer {token}"

# Crea progetto
curl -X POST http://localhost:3002/api/orchestration/projects \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "checklists": [
      {"checklistTemplateId": "uuid-seo-base"}
    ]
  }'
```
