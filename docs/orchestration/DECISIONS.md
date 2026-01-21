# Decisioni Architetturali - Modulo Orchestration

> Registro delle decisioni prese durante la progettazione.
> Ultima modifica: 2026-01-17

---

## Formato

Ogni decisione segue il formato ADR (Architecture Decision Record):

- **Contesto**: Perché questa decisione è necessaria
- **Opzioni**: Alternative considerate
- **Decisione**: Scelta effettuata
- **Conseguenze**: Impatto della scelta

---

## ADR-001: Sistema Ruoli Multipli

**Data:** 2026-01-17
**Stato:** ✅ Approvato

### Contesto

Gli utenti possono avere più responsabilità contemporaneamente:
- Alessio: admin + pm + senior
- Daniela: pm + senior + executor
- Stefano: senior + executor

### Opzioni

1. **Ruolo singolo gerarchico** (admin > pm > senior > executor)
   - Pro: Semplice
   - Contro: Non modella la realtà

2. **Ruoli multipli array**
   - Pro: Flessibile, modella la realtà
   - Contro: Query leggermente più complesse

### Decisione

**Opzione 2: Ruoli multipli array**

```prisma
roles UserRole[]  // Es: ['pm', 'senior', 'executor']
```

### Conseguenze

- Guards devono usare `.some()` invece di `===`
- UI deve gestire permessi combinati
- Migrazione necessaria da `role` singolo a `roles` array

---

## ADR-002: Separazione Project vs OrchProject

**Data:** 2026-01-17
**Stato:** ✅ Approvato

### Contesto

Esiste già `Project` per Time & Cost. Serve decidere se riutilizzarlo o creare entità separata.

### Opzioni

1. **Riutilizzare Project** con flag `isOrchestrated`
   - Pro: Meno entità
   - Contro: Accoppia Time & Cost con Orchestration

2. **Entità separate** (Project + OrchProject)
   - Pro: Separazione domini, principio da specifica
   - Contro: Possibile duplicazione dati (nome, code)

### Decisione

**Opzione 2: Entità separate**

```prisma
model Project { ... }       // Time & Cost
model OrchProject { ... }   // Orchestration
```

### Conseguenze

- Separazione netta dei moduli
- Relazione opzionale futura: `OrchProject.timeTrackingProjectId`
- Nessun impatto su Time & Cost esistente

---

## ADR-003: Storage Decisioni Progetto

**Data:** 2026-01-17
**Stato:** ✅ Approvato

### Contesto

Quando si crea un progetto, il PM definisce "decisioni bloccanti" (es. CPT+ACF, backend cliente). Serve decidere come memorizzarle.

### Opzioni

1. **JSON flessibile**
   - Pro: Nessuna migrazione per nuove decisioni
   - Contro: No validazione schema, no relazioni

2. **Modello relazionale** (ProjectDecision)
   - Pro: Tipizzato, relazioni esplicite
   - Contro: Migrazione per ogni nuova decisione

### Decisione

**Opzione 1: JSON flessibile**

```prisma
decisions Json?  // { "cptAcf": true, "backendCliente": true }
```

### Conseguenze

- Validazione a runtime nel service
- Facile aggiungere nuove decisioni
- Migrazione a relazionale possibile in futuro se necessario

---

## ADR-004: AsanaUserId Opzionale

**Data:** 2026-01-17
**Stato:** ✅ Approvato

### Contesto

Gli executor lavorano su Asana. Serve mappare User app → User Asana.

### Opzioni

1. **Obbligatorio per executor**
   - Pro: Garantisce sync
   - Contro: Blocca onboarding

2. **Opzionale con validazione runtime**
   - Pro: Onboarding graduale
   - Contro: Possibili errori al momento assegnazione

### Decisione

**Opzione 2: Opzionale con validazione runtime**

```prisma
asanaUserId String? @unique
```

### Conseguenze

- Onboarding non bloccato
- Errore esplicito quando si assegna executor senza asanaUserId
- Admin deve completare mapping prima di usare Orchestration

---

## ADR-005: Queue per Webhook Asana

**Data:** 2026-01-17
**Stato:** ✅ Approvato

### Contesto

Asana invia webhook con timeout 10 secondi. Eventi devono essere idempotenti.

### Opzioni

1. **Processing sincrono**
   - Pro: Semplice
   - Contro: Rischio timeout, no retry

2. **Queue asincrona (BullMQ + Redis)**
   - Pro: Risposta immediata, retry, deduplicazione
   - Contro: Dipendenza Redis

### Decisione

**Opzione 2: Queue asincrona**

### Conseguenze

- Aggiunta dipendenza Redis
- Tabella `AsanaWebhookEvent` per idempotenza
- Processor BullMQ per elaborazione asincrona

---

## ADR-006: Versionamento Checklist

**Data:** 2026-01-17
**Stato:** ✅ Approvato

### Contesto

Le checklist template possono evolvere. Le istanze assegnate devono mantenere la versione originale.

### Opzioni

1. **Snapshot completo** in ChecklistInstance
   - Pro: Completamente immutabile
   - Contro: Duplicazione dati

2. **Riferimento + versione**
   - Pro: Meno storage
   - Contro: Template non può essere cancellato

### Decisione

**Opzione 2: Riferimento + versione**

```prisma
model ChecklistInstance {
  checklistTemplateId String
  templateVersion     Int      // Versione congelata
}
```

### Conseguenze

- Template marcati `active: false` invece di cancellati
- Query deve filtrare per versione quando serve dettaglio
- Unique constraint su `[name, version]`

---

## ADR-007: Gate Non Forzabili

**Data:** 2026-01-17
**Stato:** ✅ Approvato (da specifica, non negoziabile)

### Contesto

Da specifica: "Se una checklist richiesta è incompleta, lo stato è bloccato. NON può essere forzato."

### Decisione

**Nessun override manuale dei Gate**

### Conseguenze

- Nessuna UI per "forza pubblicazione"
- Nessuna API per bypassare Gate
- Stato calcolato deterministicamente da ChecklistInstance
- Log audit per ogni cambio stato (futuro)

---

## ADR-008: Executor Lavora Solo su Asana

**Data:** 2026-01-17
**Stato:** ✅ Approvato (da specifica, non negoziabile)

### Contesto

Da specifica: "L'esecutore lavora solo su Asana. Nessuna doppia compilazione."

### Decisione

**Executor non vede modulo Orchestration**

### Conseguenze

- Guard `OrchestrationGuard` blocca accesso
- Nessuna API Orchestration accessibile a executor
- Feedback su Asana tramite commenti automatici se Gate bloccato

---

## Decisioni Pendenti

### P-001: Relazione OrchProject → Project (Time & Cost)

**Stato:** 🔄 Da decidere

**Domanda:** Serve collegare OrchProject al Project di Time & Cost per tracciare ore?

**Opzioni:**
1. Nessuna relazione (separazione totale)
2. `OrchProject.timeTrackingProjectId` opzionale
3. Stesso `code` come chiave di join

**Impatto:** Reportistica integrata ore/avanzamento

---

### P-002: Notifiche Gate Bloccato

**Stato:** 🔄 Da decidere

**Domanda:** Come notificare gli stakeholder quando un Gate è bloccato?

**Opzioni:**
1. Commento automatico su task Asana
2. Notifica Slack
3. Email
4. Dashboard alert

**Impatto:** UX operativa

---

### P-003: Audit Log

**Stato:** 🔄 Da decidere

**Domanda:** Serve tracciare chi ha fatto cosa e quando?

**Opzioni:**
1. Tabella dedicata `AuditLog`
2. Event sourcing completo
3. Solo `createdAt`/`updatedAt` + `createdById`

**Impatto:** Compliance, debug, analytics
