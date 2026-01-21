# MVP Scope - Modulo Orchestration

> Documento generato durante la sessione di progettazione.
> Ultima modifica: 2026-01-17

---

## 1. Obiettivo MVP

L'MVP deve permettere di:
1. Creare un progetto con checklist assegnate
2. Generare task Asana automaticamente
3. Ricevere eventi webhook da Asana
4. Valutare Gate automaticamente
5. Visualizzare stato progetti (solo PM/Senior/Admin)

---

## 2. Scope MVP vs Post-MVP

### Backend

| Funzionalità | MVP | Post-MVP |
|--------------|:---:|:--------:|
| Sistema ruoli multipli | ✅ | |
| CRUD OrchProject | ✅ | |
| CRUD ChecklistTemplate | ✅ | |
| Creazione ChecklistInstance | ✅ | |
| Generazione task Asana | ✅ | |
| Webhook Asana (completed/reopened) | ✅ | |
| Valutazione Gate automatica | ✅ | |
| Queue BullMQ + Redis | ✅ | |
| Retry sync Asana | ✅ | |
| Versionamento checklist avanzato | | ✅ |
| Audit log completo | | ✅ |
| Notifiche Slack/Email | | ✅ |
| Metriche/Monitoring | | ✅ |

### Frontend

| Funzionalità | MVP | Post-MVP |
|--------------|:---:|:--------:|
| Lista progetti | ✅ | |
| Dettaglio progetto + stato gates | ✅ | |
| Form creazione progetto | ✅ | |
| Lista checklist templates | ✅ | |
| Routing condizionale per ruoli | ✅ | |
| Dashboard compliance | | ✅ |
| Grafici avanzamento | | ✅ |
| Gestione templates (CRUD) | | ✅ |

### Asana

| Funzionalità | MVP | Post-MVP |
|--------------|:---:|:--------:|
| Creazione task | ✅ | |
| Custom fields (ProjectID, ChecklistID) | ✅ | |
| Webhook task completed/reopened | ✅ | |
| Commenti automatici | | ✅ |
| Dipendenze tra task | | ✅ |
| Etichette automatiche | | ✅ |

---

## 3. Entità Database

### MVP (Obbligatorie)

| Entità | Descrizione |
|--------|-------------|
| User (esteso) | Aggiunta `roles[]`, `asanaUserId` |
| OrchProject | Progetto orchestrato |
| ChecklistTemplate | Template checklist (repository) |
| ChecklistItemTemplate | Items del template |
| ChecklistInstance | Istanza checklist per progetto |
| ExecutionTask | Mapping con task Asana |
| Gate | Gate (published, delivered) |
| GateRequirement | Requisiti per gate |
| AsanaWebhookEvent | Eventi webhook (idempotenza) |

### Post-MVP

| Entità | Motivo Postponement |
|--------|---------------------|
| AuditLog | Non critico per funzionamento base |
| Notification | Feedback manuale inizialmente |
| ProjectMetrics | Analytics avanzate |

---

## 4. API Endpoints

### Orchestration

| Method | Endpoint | Descrizione | Guard |
|--------|----------|-------------|-------|
| `GET` | `/orchestration/projects` | Lista progetti | Orch |
| `GET` | `/orchestration/projects/:id` | Dettaglio + gates | Orch |
| `POST` | `/orchestration/projects` | Crea progetto | PM |
| `POST` | `/orchestration/projects/:id/checklists` | Aggiungi checklist | PM |
| `POST` | `/orchestration/projects/:id/retry-sync` | Retry sync Asana | PM |
| `GET` | `/orchestration/templates` | Lista templates | Orch |
| `GET` | `/orchestration/templates/:id` | Dettaglio template | Orch |

### Asana

| Method | Endpoint | Descrizione | Guard |
|--------|----------|-------------|-------|
| `POST` | `/asana/webhook` | Receiver webhook | Public* |

*Validato tramite signature Asana

### Admin (Estensione)

| Method | Endpoint | Descrizione | Guard |
|--------|----------|-------------|-------|
| `PATCH` | `/admin/users/:id/roles` | Modifica ruoli | Admin |
| `PATCH` | `/admin/users/:id/asana` | Imposta asanaUserId | Admin |

---

## 5. Frontend Pages

| Page | Route | Ruoli Accesso |
|------|-------|---------------|
| Lista Progetti | `/orchestration/projects` | pm, senior, admin |
| Dettaglio Progetto | `/orchestration/projects/:id` | pm, senior, admin |
| Nuovo Progetto | `/orchestration/projects/new` | pm, admin |
| Checklist Templates | `/orchestration/templates` | pm, senior, admin |

### Navigazione

```
Sidebar (visibile solo se roles include pm/senior/admin):
├── Time & Cost (esistente)
└── Orchestration (nuovo)
    ├── Progetti
    └── Templates
```

---

## 6. Fasi Implementazione

### Fase 1: Backend Core

**Obiettivo:** Entità, servizi, guards

**Tasks:**
1. Migrazione Prisma schema
   - Aggiunta `roles[]` a User
   - Aggiunta `asanaUserId` a User
   - Creazione nuove entità
2. Seed data
   - ChecklistTemplates (5 canonici)
   - Gates (published, delivered)
   - GateRequirements
3. Guards
   - `OrchestrationGuard` (pm, senior, admin)
   - `ProjectManagerGuard` (pm, admin)
4. Servizi
   - `OrchProjectsService`
   - `ChecklistTemplatesService`
   - `ChecklistInstancesService`
   - `GateService`

**Output:** API funzionanti (senza Asana)

---

### Fase 2: Integrazione Asana

**Obiettivo:** Creazione task su Asana

**Tasks:**
1. Configurazione
   - Variabili ambiente
   - Custom fields su Asana
2. Servizi
   - `AsanaClientService` (wrapper SDK)
   - `AsanaTaskService` (creazione task)
3. Integrazione
   - Modifica `OrchProjectsService.create()`
   - Test creazione task

**Output:** Creazione progetto genera task Asana

---

### Fase 3: Webhook

**Obiettivo:** Ricezione eventi da Asana

**Tasks:**
1. Infrastruttura
   - Setup Redis
   - Setup BullMQ
2. Controller
   - `AsanaWebhookController`
   - Handshake Asana
   - Validazione signature
3. Processor
   - `AsanaEventProcessor`
   - Update ChecklistInstance
   - Trigger GateService
4. Registrazione
   - Registrare webhook su Asana
5. Test end-to-end

**Output:** Task completato su Asana → stato aggiornato in app

---

### Fase 4: Frontend

**Obiettivo:** UI per PM/Senior/Admin

**Tasks:**
1. Routing
   - Guardia ruoli
   - Nuove routes
2. Componenti
   - `ProjectsList`
   - `ProjectDetail`
   - `ProjectForm`
   - `GateStatus`
   - `TemplatesList`
3. Integrazione API
   - Servizio orchestration
   - Query hooks

**Output:** UI completa MVP

---

## 7. Criteri di Accettazione

### Must Have (Bloccanti)

- [ ] PM può creare progetto con checklist assegnate
- [ ] Task Asana creati automaticamente
- [ ] Custom fields ProjectID e ChecklistID presenti
- [ ] Executor completa task → ChecklistInstance.status = completed
- [ ] Gate calcolato correttamente (tutte checklist required → canPass)
- [ ] Stato progetto aggiornato (in_development → published → delivered)
- [ ] Executor NON vede modulo Orchestration (403)
- [ ] Gate NON può essere forzato (nessuna API/UI)
- [ ] Webhook idempotenti (stesso evento = no-op)

### Should Have (Importanti)

- [ ] Warning se checklist obbligatoria per gate non assegnata
- [ ] Retry sync per task Asana falliti
- [ ] Visualizzazione errori sync in UI
- [ ] Filtro progetti per stato

### Nice to Have (Opzionali)

- [ ] Commento automatico su task Asana quando gate raggiunto
- [ ] Paginazione lista progetti
- [ ] Ricerca progetti per nome/code

---

## 8. Dipendenze Esterne

### Infrastruttura

| Componente | Necessità | Note |
|------------|-----------|------|
| Redis | MVP | Per BullMQ queue |
| Asana Account | MVP | Con permessi admin workspace |
| Custom Fields Asana | MVP | Creazione manuale iniziale |

### Variabili Ambiente

```env
# Asana
ASANA_ACCESS_TOKEN=
ASANA_WORKSPACE_ID=
ASANA_DEFAULT_PROJECT_ID=
ASANA_FIELD_PROJECT_ID=
ASANA_FIELD_CHECKLIST_ID=
ASANA_WEBHOOK_SECRET=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 9. Rischi e Mitigazioni

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| Rate limit Asana | Medio | Backoff esponenziale, queue |
| Webhook non ricevuti | Alto | Retry manuale, sync periodico |
| Redis down | Alto | Fallback sync (degraded mode) |
| Custom fields non configurati | Bloccante | Documentazione setup, validazione startup |

---

## 10. Definition of Done

L'MVP è considerato completo quando:

1. ✅ Tutti i "Must Have" sono implementati e testati
2. ✅ Documentazione API disponibile
3. ✅ Seed data caricato (templates, gates)
4. ✅ Almeno 1 progetto creato end-to-end in staging
5. ✅ Webhook testato con task reale Asana
6. ✅ Gate transition testata (pending → completed → gate pass)
