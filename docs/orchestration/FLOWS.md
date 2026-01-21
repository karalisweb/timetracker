# Flow Operativi - Modulo Orchestration

> Documento generato durante la sessione di progettazione.
> Ultima modifica: 2026-01-17

---

## 1. Flow Creazione Progetto

### 1.1 Panoramica

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│   PM    │────▶│ Crea        │────▶│ Assegna     │────▶│ Sistema │
│         │     │ Progetto    │     │ Checklist   │     │ genera  │
└─────────┘     └─────────────┘     └─────────────┘     └────┬────┘
                                                              │
                     ┌────────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────────────────────┐
    │                                                            │
    │  1. Crea ChecklistInstance per ogni checklist assegnata   │
    │  2. Associa Gate automaticamente                           │
    │  3. Genera task Asana per ogni ChecklistInstance          │
    │                                                            │
    └────────────────────────────────────────────────────────────┘
```

### 1.2 Attori

| Attore | Ruolo Richiesto | Azione |
|--------|-----------------|--------|
| PM | `pm` o `admin` | Crea progetto, assegna checklist |
| Sistema | - | Genera instances, task Asana, calcola gates |
| Executor | `executor` | Riceve task su Asana |

### 1.3 Input

```typescript
interface CreateOrchProjectDto {
  // Obbligatori
  name: string;                    // "Sito DTI Viaggi"

  // Opzionali
  code?: string;                   // "DTI-2026-001"
  asanaProjectId?: string;         // GID progetto Asana esistente

  // Decisioni bloccanti
  decisions?: {
    cptAcf?: boolean;              // Usa CPT + ACF
    backendCliente?: boolean;      // Backend per cliente
    [key: string]: boolean;        // Altre decisioni future
  };

  // Checklist da assegnare
  checklists: ChecklistAssignmentDto[];
}

interface ChecklistAssignmentDto {
  checklistTemplateId: string;     // UUID template
  executorUserId?: string;         // UUID esecutore
  ownerUserId?: string;            // UUID responsabile
  dueDate?: string;                // ISO date
}
```

### 1.4 Sequence Diagram

```
PM                  API                 Service              Asana
│                    │                    │                    │
│ POST /orchestration/projects           │                    │
│ ──────────────────▶│                    │                    │
│                    │                    │                    │
│                    │ createProject()    │                    │
│                    │───────────────────▶│                    │
│                    │                    │                    │
│                    │                    │ 1. Valida input    │
│                    │                    │    - PM/Admin?     │
│                    │                    │    - Templates     │
│                    │                    │      esistono?     │
│                    │                    │    - Executor ha   │
│                    │                    │      asanaUserId?  │
│                    │                    │                    │
│                    │                    │ 2. Transaction:    │
│                    │                    │                    │
│                    │                    │ 2a. INSERT         │
│                    │                    │     OrchProject    │
│                    │                    │                    │
│                    │                    │ 2b. Per ogni       │
│                    │                    │     checklist:     │
│                    │                    │     INSERT         │
│                    │                    │     ChecklistInst  │
│                    │                    │                    │
│                    │                    │ 3. Per ogni        │
│                    │                    │    ChecklistInst:  │
│                    │                    │                    │
│                    │                    │ createAsanaTask()  │
│                    │                    │───────────────────▶│
│                    │                    │                    │
│                    │                    │◀───────────────────│
│                    │                    │    task GID        │
│                    │                    │                    │
│                    │                    │ 4. UPDATE          │
│                    │                    │    ChecklistInst   │
│                    │                    │    .asanaTaskId    │
│                    │                    │                    │
│                    │                    │ 5. INSERT          │
│                    │                    │    ExecutionTask   │
│                    │                    │                    │
│                    │◀───────────────────│                    │
│                    │   project + tasks  │                    │
│◀───────────────────│                    │                    │
│   201 Created      │                    │                    │
```

### 1.5 Validazioni

#### Pre-creazione (Bloccanti)

| Check | Errore | HTTP |
|-------|--------|------|
| User ha ruolo `pm` o `admin` | `FORBIDDEN` | 403 |
| `name` non vuoto | `VALIDATION_ERROR` | 400 |
| `code` unico (se fornito) | `CODE_ALREADY_EXISTS` | 409 |
| Ogni `checklistTemplateId` esiste e `active: true` | `TEMPLATE_NOT_FOUND` | 404 |
| Ogni `executorUserId` esiste | `USER_NOT_FOUND` | 404 |
| Ogni `executorUserId` ha ruolo `executor` | `USER_NOT_EXECUTOR` | 400 |

#### Warning (Non Bloccanti)

| Check | Warning Code |
|-------|--------------|
| `executorUserId` senza `asanaUserId` | `EXECUTOR_NO_ASANA_MAPPING` |
| Checklist obbligatoria per Gate non assegnata | `MISSING_REQUIRED_CHECKLIST` |

### 1.6 Task Asana - Payload Standard

```typescript
interface AsanaTaskPayload {
  // Identificazione
  name: string;                    // "[PRJ-CODE] Checklist Name"

  // Assegnazione
  assignee: string;                // GID utente Asana

  // Scheduling
  due_on: string;                  // "2026-02-15"

  // Progetto
  projects: string[];              // [GID progetto Asana]

  // Descrizione strutturata
  notes: string;                   // Vedi template sotto

  // Custom Fields
  custom_fields: {
    [ASANA_FIELD_PROJECT_ID]: string;      // UUID OrchProject
    [ASANA_FIELD_CHECKLIST_ID]: string;    // UUID ChecklistInstance
  };
}
```

### 1.7 Template Descrizione Task

```markdown
## Contesto
Progetto: {project.name}
Checklist: {template.name}
Categoria: {template.category}

## Decisioni già prese
{foreach decision in project.decisions}
- {decision.key}: {decision.value}
{/foreach}

## Cosa fare
{foreach item in template.items}
- [ ] {item.label}
{/foreach}

## Vincoli
- Questa checklist è richiesta per il Gate: {gate.name}
- Non completare se anche un solo item è incompleto

---
⚠️ NON modificare i custom fields ProjectID e ChecklistID
```

### 1.8 Associazione Automatica Gate

Il sistema calcola automaticamente quali Gate sono applicabili al progetto basandosi sulle checklist assegnate:

```typescript
interface GateStatus {
  gateId: string;
  gateName: 'published' | 'delivered';
  canPass: boolean;
  requirements: {
    templateId: string;
    templateName: string;
    required: boolean;      // true se obbligatoria per questo gate
    assigned: boolean;      // true se assegnata al progetto
    completed: boolean;     // true se status = completed
  }[];
}
```

**Logica:**
- Gate `published`: richiede SEO Base + Tecnica + Privacy (tutte obbligatorie)
- Gate `delivered`: richiede Gate published + Performance Minima (se assegnata)

### 1.9 Gestione Errori Asana

| Errore Asana | Azione |
|--------------|--------|
| 401 Unauthorized | Fail immediato, notifica admin |
| 403 Forbidden | Fail, executor non ha accesso a progetto Asana |
| 404 Project not found | Fail, `asanaProjectId` non valido |
| 429 Rate limit | Retry con backoff esponenziale |
| 500+ Server error | Retry (max 3), poi fail con rollback parziale |

**Rollback parziale:**
- OrchProject e ChecklistInstance rimangono (transazione completata)
- ExecutionTask con `syncStatus: 'error'`
- Retry manuale: `POST /orchestration/projects/{id}/retry-sync`

### 1.10 API Endpoint

```
POST /api/orchestration/projects
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Sito DTI Viaggi",
  "code": "DTI-2026-001",
  "decisions": {
    "cptAcf": true,
    "backendCliente": true
  },
  "checklists": [
    {
      "checklistTemplateId": "uuid-seo-base",
      "executorUserId": "uuid-stefano",
      "dueDate": "2026-02-15"
    },
    {
      "checklistTemplateId": "uuid-privacy",
      "executorUserId": "uuid-daniela",
      "dueDate": "2026-02-10"
    }
  ]
}
```

**Response 201:**
```json
{
  "id": "uuid-project",
  "name": "Sito DTI Viaggi",
  "code": "DTI-2026-001",
  "status": "in_development",
  "decisions": {
    "cptAcf": true,
    "backendCliente": true
  },
  "checklists": [
    {
      "id": "uuid-instance-1",
      "templateName": "SEO Base",
      "status": "pending",
      "executorName": "Stefano",
      "dueDate": "2026-02-15",
      "asanaTaskId": "1234567890",
      "asanaTaskUrl": "https://app.asana.com/0/0/1234567890"
    }
  ],
  "gates": [
    {
      "name": "published",
      "displayName": "Pubblicato",
      "canPass": false,
      "requirements": [
        { "name": "SEO Base", "assigned": true, "completed": false },
        { "name": "Tecnica Post-Pubblicazione", "assigned": false, "completed": false },
        { "name": "Privacy Essenziale", "assigned": true, "completed": false }
      ]
    }
  ],
  "warnings": [
    {
      "code": "MISSING_REQUIRED_CHECKLIST",
      "message": "Checklist 'Tecnica Post-Pubblicazione' richiesta per Gate 'Pubblicato' non assegnata"
    }
  ],
  "createdAt": "2026-01-17T10:00:00Z"
}
```

---

## 2. Flow Eventi Asana → App (Webhook)

### 2.1 Panoramica

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ASANA     │────▶│  Webhook    │────▶│   Redis     │────▶│  Processor  │
│   Event     │     │  Endpoint   │     │   Queue     │     │  (BullMQ)   │
└─────────────┘     └──────┬──────┘     └─────────────┘     └──────┬──────┘
                           │                                       │
                           │ 200 OK                                │
                           │ (< 10s)                               ▼
                                                          ┌─────────────────┐
                                                          │  1. Find Inst.  │
                                                          │  2. Update      │
                                                          │  3. Eval Gates  │
                                                          │  4. Update Prj  │
                                                          └─────────────────┘
```

### 2.2 Setup Webhook Asana

**Registrazione:**
```typescript
POST https://app.asana.com/api/1.0/webhooks
{
  "data": {
    "resource": "{ASANA_PROJECT_GID}",
    "target": "https://app.example.com/api/asana/webhook",
    "filters": [
      {
        "resource_type": "task",
        "action": "changed",
        "fields": ["completed"]
      }
    ]
  }
}
```

**Handshake:** Asana invia `X-Hook-Secret`, rispondere con stesso header.

### 2.3 Eventi Gestiti

| Evento | Trigger Asana | Azione App |
|--------|---------------|------------|
| Task completato | `completed: true` | ChecklistInstance → `completed` |
| Task riaperto | `completed: false` | ChecklistInstance → `pending` |

### 2.4 Payload Webhook

```json
{
  "events": [
    {
      "created_at": "2026-01-17T10:30:00.000Z",
      "action": "changed",
      "resource": {
        "gid": "987654321",
        "resource_type": "task"
      },
      "change": {
        "field": "completed",
        "new_value": true
      }
    }
  ]
}
```

### 2.5 Sequence Diagram

```
Asana              Controller           Queue           Processor           DB
  │                    │                  │                 │                │
  │ POST /webhook      │                  │                 │                │
  │ ──────────────────▶│                  │                 │                │
  │                    │                  │                 │                │
  │                    │ 1. Valida firma  │                 │                │
  │                    │ 2. Dedup check ──────────────────────────────────▶ │
  │                    │ 3. INSERT event ─────────────────────────────────▶ │
  │                    │ 4. Enqueue ─────▶│                 │                │
  │                    │                  │                 │                │
  │ ◀──────────────────│                  │                 │                │
  │      200 OK        │                  │                 │                │
  │                    │                  │                 │                │
  │                    │                  │ 5. Dequeue ────▶│                │
  │                    │                  │                 │ 6. Find task ─▶│
  │                    │                  │                 │ 7. UPDATE ────▶│
  │                    │                  │                 │ 8. Eval gates ▶│
  │                    │                  │                 │ 9. UPDATE prj ▶│
```

### 2.6 Controller Implementation

```typescript
@Controller('asana')
export class AsanaWebhookController {

  @Post('webhook')
  async handleWebhook(
    @Headers('x-hook-secret') hookSecret: string,
    @Headers('x-hook-signature') signature: string,
    @Body() body: AsanaWebhookPayload,
    @Res() res: Response
  ) {
    // Handshake
    if (hookSecret) {
      res.setHeader('X-Hook-Secret', hookSecret);
      return res.status(200).send();
    }

    // Valida signature
    if (!this.validateSignature(signature, body)) {
      throw new UnauthorizedException();
    }

    // Processa eventi
    for (const event of body.events) {
      const eventId = `${event.resource.gid}-${event.created_at}`;

      // Dedup
      const existing = await this.prisma.asanaWebhookEvent.findUnique({
        where: { asanaEventId: eventId }
      });
      if (existing) continue;

      // Salva e enqueue
      await this.prisma.asanaWebhookEvent.create({
        data: {
          asanaEventId: eventId,
          eventType: `${event.action}.${event.change?.field}`,
          resourceGid: event.resource.gid,
          payload: event,
          status: 'pending'
        }
      });

      await this.queue.add('process-asana-event', { eventId, ...event });
    }

    return res.status(200).send();
  }
}
```

### 2.7 Processor Implementation

```typescript
@Processor('asana-events')
export class AsanaEventProcessor {

  @Process('process-asana-event')
  async process(job: Job<AsanaEventJob>) {
    const { eventId, resourceGid, change } = job.data;

    // Trova ChecklistInstance
    const instance = await this.prisma.checklistInstance.findFirst({
      where: { asanaTaskId: resourceGid }
    });

    if (!instance) {
      await this.markEventProcessed(eventId, 'ignored');
      return;
    }

    // Aggiorna status
    if (change.field === 'completed') {
      await this.prisma.checklistInstance.update({
        where: { id: instance.id },
        data: {
          status: change.new_value ? 'completed' : 'pending',
          completedAt: change.new_value ? new Date() : null
        }
      });
    }

    // Ricalcola gates
    await this.gateService.evaluateGates(instance.orchProjectId);

    await this.markEventProcessed(eventId, 'processed');
  }
}
```

### 2.8 Idempotenza

| Meccanismo | Implementazione |
|------------|-----------------|
| Deduplicazione | `asanaEventId` unique (GID + timestamp) |
| Retry sicuro | UPDATE idempotenti |
| Ordine eventi | `created_at` per ordinamento |

### 2.9 Gestione Errori

| Errore | Azione |
|--------|--------|
| Signature non valida | 401, scartato |
| Task non trovato | Marcato "ignored" |
| Errore DB | Retry con backoff (5s, 10s, 20s) |

**Retry config:**
```typescript
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 }
}
```

### 2.10 Feedback su Asana (Opzionale)

Commento automatico quando Gate raggiunto:

```typescript
await asanaClient.createComment(taskGid, {
  text: `✅ Gate "Pubblicato" raggiunto!`
});
```

---

## 3. Flow Valutazione Gate

### 3.1 Trigger

La valutazione Gate viene ricalcolata quando:
1. Webhook Asana: task completato
2. Webhook Asana: task riaperto
3. Richiesta esplicita: `GET /orchestration/projects/{id}/gates`

### 3.2 Algoritmo

```typescript
async function evaluateGates(projectId: string): Promise<GateEvaluation> {

  // 1. Recupera tutte le checklist del progetto
  const instances = await prisma.checklistInstance.findMany({
    where: { orchProjectId: projectId },
    include: { checklistTemplate: true }
  });

  // 2. Recupera tutti i gate con requisiti
  const gates = await prisma.gate.findMany({
    include: { requirements: true },
    orderBy: { sortOrder: 'asc' }
  });

  // 3. Valuta ogni gate
  const results = [];
  let previousGatePassed = true;

  for (const gate of gates) {
    // Gate dipende dal precedente (delivered dipende da published)
    if (!previousGatePassed) {
      results.push({
        gate: gate.name,
        canPass: false,
        blockedBy: 'PREVIOUS_GATE_NOT_PASSED'
      });
      continue;
    }

    const evaluation = evaluateSingleGate(gate, instances);
    results.push(evaluation);
    previousGatePassed = evaluation.canPass;
  }

  // 4. Determina stato progetto
  const newStatus = determineProjectStatus(results);

  // 5. Aggiorna se cambiato
  if (project.status !== newStatus) {
    await prisma.orchProject.update({
      where: { id: projectId },
      data: { status: newStatus }
    });
  }

  return { gates: results, status: newStatus };
}
```

### 3.3 Determinazione Stato Progetto

| Condizione | Stato |
|------------|-------|
| Nessun gate passato | `in_development` |
| Tutti i requisiti published soddisfatti (non ancora verificato) | `ready_for_publish` |
| Gate published passato | `published` |
| Gate delivered passato | `delivered` |

---

## 4. Flow Aggiunta Checklist a Progetto Esistente

### 4.1 Quando

PM può aggiungere checklist a un progetto già creato.

### 4.2 Endpoint

```
POST /api/orchestration/projects/{projectId}/checklists
```

### 4.3 Vincoli

- Solo se progetto non è `delivered`
- Stesse validazioni della creazione
- Ricalcolo gate dopo aggiunta

### 4.4 Sequence

1. Valida progetto esiste e non delivered
2. Valida template e executor
3. Crea ChecklistInstance
4. Crea task Asana
5. Ricalcola gates
6. Ritorna progetto aggiornato

---

## 5. Flow Riassegnazione Executor

### 5.1 Quando

PM può riassegnare una checklist a un diverso executor.

### 5.2 Endpoint

```
PATCH /api/orchestration/checklists/{instanceId}/reassign
```

**Body:**
```json
{
  "executorUserId": "uuid-new-executor"
}
```

### 5.3 Azioni

1. Valida nuovo executor (esiste, ha ruolo, ha asanaUserId)
2. Aggiorna ChecklistInstance
3. Aggiorna task Asana (riassegna)
4. Notifica (opzionale) vecchio/nuovo executor

---

## 6. Flow Retry Sync Asana

### 6.1 Quando

Se la creazione task Asana è fallita, PM può ritentare.

### 6.2 Endpoint

```
POST /api/orchestration/projects/{projectId}/retry-sync
```

### 6.3 Azioni

1. Trova tutti ExecutionTask con `syncStatus: 'error'`
2. Per ognuno, ritenta creazione task Asana
3. Aggiorna syncStatus
4. Ritorna report sync
