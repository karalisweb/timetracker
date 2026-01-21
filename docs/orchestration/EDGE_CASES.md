# Edge Case Tecnici - Modulo Orchestration

> Documento generato durante la sessione di progettazione.
> Ultima modifica: 2026-01-17

---

## 1. Edge Case - Creazione Progetto

| Scenario | Comportamento | Soluzione |
|----------|---------------|-----------|
| Executor senza `asanaUserId` | Warning, task creato senza assignee | Validazione soft, alert PM |
| Template disattivato durante creazione | Errore 400 | Check `active: true` in validazione |
| Asana API down | Progetto creato, task falliti | `ExecutionTask.syncStatus = 'error'`, retry endpoint |
| Rate limit Asana (429) | Retry con backoff | Queue con delay crescente (5s, 10s, 20s) |
| Stesso `code` progetto | Errore 409 Conflict | Unique constraint DB |
| Nessuna checklist assegnata | Permesso con warning | Progetto valido ma gate mai raggiungibili |
| `asanaProjectId` non valido | Errore 400 | Validazione esistenza progetto Asana |

### Dettaglio: Executor senza asanaUserId

```typescript
// Durante creazione progetto
if (!executor.asanaUserId) {
  warnings.push({
    code: 'EXECUTOR_NO_ASANA_MAPPING',
    message: `Executor "${executor.name}" non ha asanaUserId configurato`,
    checklistId: instance.id
  });

  // Task creato senza assignee
  asanaPayload.assignee = null;
}
```

---

## 2. Edge Case - Webhook Asana

| Scenario | Comportamento | Soluzione |
|----------|---------------|-----------|
| Webhook duplicato | Ignorato | Dedup su `asanaEventId` unique |
| Task non nostro (no custom field match) | Ignorato | Lookup fallisce → marca "ignored" |
| Evento fuori ordine | Ultimo stato vince | `created_at` per ordinamento |
| Webhook durante deploy | Potenzialmente perso | Asana retry automatico (fino 24h) |
| Signature invalida | 401 Rejected | Log per security audit |
| Task completato poi cancellato su Asana | ChecklistInstance orphan | Gestire evento "deleted" (post-MVP) |
| Evento su task già completed | No-op | Idempotenza garantita |
| Payload malformato | 400 Bad Request | Validation + log |

### Dettaglio: Deduplicazione

```typescript
// Generazione eventId deterministico
const eventId = `${event.resource.gid}-${event.created_at}`;

// Check esistenza
const existing = await prisma.asanaWebhookEvent.findUnique({
  where: { asanaEventId: eventId }
});

if (existing) {
  // Già processato o in processing
  return { status: 'duplicate', ignored: true };
}
```

### Dettaglio: Task Non Nostro

```typescript
// Lookup ChecklistInstance
const instance = await prisma.checklistInstance.findFirst({
  where: { asanaTaskId: resourceGid }
});

if (!instance) {
  // Task non gestito dalla nostra app
  await prisma.asanaWebhookEvent.update({
    where: { asanaEventId: eventId },
    data: { status: 'ignored', processedAt: new Date() }
  });
  return;
}
```

---

## 3. Edge Case - Gate Evaluation

| Scenario | Comportamento | Soluzione |
|----------|---------------|-----------|
| Checklist richiesta non assegnata | Gate bloccato permanente | Warning in creazione progetto |
| Tutte checklist complete ma gate non passa | Bug | Log dettagliato + alert |
| Task riaperto dopo gate passato | Gate regredisce | Stato torna a precedente |
| Progetto `delivered`, task riaperto | Regredisce a `published` | Stato mai forzato |
| Performance non assegnata | Gate `delivered` passa senza | `requiredIfAssigned: true` |
| Checklist aggiunta dopo gate passato | Gate ricalcolato | Se nuova required, gate regredisce |

### Dettaglio: Regressione Gate

```typescript
// Quando task viene riaperto
async function handleTaskReopened(instance: ChecklistInstance) {
  await prisma.checklistInstance.update({
    where: { id: instance.id },
    data: {
      status: 'pending',
      completedAt: null
    }
  });

  // Ricalcola gates
  const gateResult = await evaluateGates(instance.orchProjectId);

  // Se gate non passa più, regredisce stato progetto
  if (!gateResult.published.canPass) {
    await prisma.orchProject.update({
      where: { id: instance.orchProjectId },
      data: { status: 'in_development' }
    });
  } else if (!gateResult.delivered.canPass) {
    await prisma.orchProject.update({
      where: { id: instance.orchProjectId },
      data: { status: 'published' }
    });
  }
}
```

### Dettaglio: requiredIfAssigned

```typescript
// Gate delivered richiede Performance solo se assegnata
const performanceReq = gate.requirements.find(
  r => r.checklistTemplate.name === 'Performance Minima'
);

if (performanceReq.requiredIfAssigned) {
  const isAssigned = instances.some(
    i => i.checklistTemplateId === performanceReq.checklistTemplateId
  );

  if (!isAssigned) {
    // Non è assegnata, quindi non è required
    return { required: false, satisfied: true };
  }
}
```

---

## 4. Edge Case - Concorrenza

| Scenario | Comportamento | Soluzione |
|----------|---------------|-----------|
| Due webhook stesso task simultanei | Race condition potenziale | Queue serializza per task GID |
| PM modifica mentre webhook processa | Conflitto | Optimistic locking (post-MVP) |
| Creazione progetto durante rate limit | Partial failure | Transazione DB + retry Asana separato |

### Dettaglio: Serializzazione Queue

```typescript
// BullMQ job options
await queue.add('process-asana-event', payload, {
  // Jobs con stesso jobId vengono serializzati
  jobId: `task-${resourceGid}`,

  // Oppure usa groupId per serializzazione
  group: { id: resourceGid }
});
```

---

## 5. Edge Case - Utenti e Ruoli

| Scenario | Comportamento | Soluzione |
|----------|---------------|-----------|
| Utente perde ruolo `executor` | Task Asana rimangono assegnati | Nessuna azione automatica |
| Utente eliminato | Relazioni orfane | Soft delete, relazioni mantenute |
| `asanaUserId` duplicato | Errore 400 | Unique constraint |
| Cambio `asanaUserId` | Task vecchi con vecchio assignee | Warning, riassegnazione manuale |
| Admin rimuove se stesso da admin | Blocco | Impedire auto-rimozione ultimo admin |

### Dettaglio: Soft Delete Utente

```typescript
// Non eliminare fisicamente, solo disattiva
model User {
  // ... altri campi
  deletedAt DateTime?  // Soft delete
}

// Query sempre filtrate
const users = await prisma.user.findMany({
  where: { deletedAt: null }
});
```

---

## 6. Edge Case - Asana

| Scenario | Comportamento | Soluzione |
|----------|---------------|-----------|
| Progetto Asana eliminato | Task creation fail | Validazione `asanaProjectId` all'uso |
| Custom field eliminato | Task senza mapping | Validazione startup + alert |
| Task spostato altro progetto | Webhook ancora ricevuto | OK, lookup per GID task |
| Task duplicato manualmente | Doppio in Asana | Ignora (no custom field nostro) |
| Workspace cambiato | Tutto invalido | Documentare, migrazione manuale |
| Token scaduto | 401 su tutte le chiamate | Alert immediato, retry dopo rinnovo |

### Dettaglio: Validazione Startup

```typescript
// In main.ts o modulo Asana
async function validateAsanaConfig() {
  const requiredFields = [
    process.env.ASANA_FIELD_PROJECT_ID,
    process.env.ASANA_FIELD_CHECKLIST_ID,
  ];

  for (const fieldGid of requiredFields) {
    try {
      await asanaClient.customFields.findById(fieldGid);
    } catch (error) {
      throw new Error(
        `Custom field ${fieldGid} non trovato in Asana. ` +
        `Verificare configurazione.`
      );
    }
  }
}
```

---

## 7. Matrice Rischio/Impatto

| Edge Case | Probabilità | Impatto | Gestione |
|-----------|:-----------:|:-------:|:--------:|
| Webhook duplicato | Alta | Basso | ✅ MVP |
| Asana API down | Media | Alto | ✅ MVP |
| Task riaperto dopo gate | Media | Medio | ✅ MVP |
| Executor senza asanaUserId | Alta | Medio | ✅ MVP |
| Rate limit | Media | Medio | ✅ MVP |
| Signature invalida | Bassa | Basso | ✅ MVP |
| Utente eliminato | Bassa | Alto | ⚠️ Post-MVP |
| Custom field eliminato | Bassa | Alto | ⚠️ Post-MVP |
| Webhook perso durante deploy | Bassa | Medio | ⚠️ Post-MVP |
| Concorrenza race condition | Bassa | Medio | ⚠️ Post-MVP |

**Legenda:**
- ✅ MVP: Gestito nella prima release
- ⚠️ Post-MVP: Pianificato per release successive

---

## 8. Endpoint di Recovery

### 8.1 Sync Manuale

```
POST /api/orchestration/projects/:id/sync
Authorization: Bearer {token}
```

Forza ri-lettura stato da Asana per tutte le checklist del progetto.

**Use case:** Sospetto di desync, dopo problemi di rete.

### 8.2 Retry Failed Tasks

```
POST /api/orchestration/projects/:id/retry-sync
Authorization: Bearer {token}
```

Ritenta creazione task Asana per tutti i task con `syncStatus = 'error'`.

**Use case:** Dopo ripristino Asana API.

### 8.3 Recalculate Gates

```
POST /api/orchestration/projects/:id/recalculate-gates
Authorization: Bearer {token}
```

Forza ricalcolo di tutti i gates del progetto.

**Use case:** Dopo fix bug nella logica gate.

**Response:**
```json
{
  "projectId": "uuid",
  "previousStatus": "in_development",
  "newStatus": "published",
  "gates": [
    {
      "name": "published",
      "canPass": true,
      "changedFrom": false
    },
    {
      "name": "delivered",
      "canPass": false,
      "changedFrom": false
    }
  ]
}
```

---

## 9. Logging e Monitoring

### Eventi da Loggare

| Evento | Livello | Dettagli |
|--------|---------|----------|
| Webhook ricevuto | INFO | eventId, resourceGid |
| Webhook duplicato | DEBUG | eventId |
| Webhook ignorato | INFO | eventId, motivo |
| Webhook processato | INFO | eventId, duration |
| Webhook fallito | ERROR | eventId, error, stack |
| Gate cambiato | INFO | projectId, gate, oldValue, newValue |
| Asana API error | WARN | endpoint, statusCode, message |
| Asana rate limit | WARN | retryAfter |
| Sync fallito | ERROR | projectId, checklistId, error |

### Metriche (Post-MVP)

```typescript
// Prometheus-style metrics
orchestration_webhooks_total{status="processed"}
orchestration_webhooks_total{status="ignored"}
orchestration_webhooks_total{status="failed"}
orchestration_gate_changes_total{gate="published",direction="pass"}
orchestration_gate_changes_total{gate="delivered",direction="regress"}
orchestration_asana_api_duration_seconds
orchestration_asana_api_errors_total{status_code="429"}
```

---

## 10. Checklist Pre-Deploy

Prima di ogni deploy, verificare:

- [ ] Redis raggiungibile
- [ ] Asana API raggiungibile
- [ ] Custom fields esistono e sono validi
- [ ] Webhook registrato e attivo
- [ ] Token Asana non scaduto
- [ ] Queue vuota o gestibile
