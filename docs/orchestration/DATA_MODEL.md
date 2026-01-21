# Modello Dati - Modulo Orchestration

> Documento generato durante la sessione di progettazione.
> Ultima modifica: 2026-01-17

---

## 1. Panoramica Entità

```
┌─────────────────┐
│      User       │
│  (roles[])      │
└────────┬────────┘
         │
         │ executor / owner
         ▼
┌─────────────────┐       ┌─────────────────────┐
│  OrchProject    │──────▶│  ChecklistInstance  │
│                 │ 1:N   │                     │
└─────────────────┘       └──────────┬──────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                          ▼                     ▼
              ┌─────────────────┐    ┌─────────────────┐
              │ChecklistTemplate│    │  ExecutionTask  │
              │  (Repository)   │    │  (Asana sync)   │
              └────────┬────────┘    └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ChecklistItem    │
              │    Template     │
              └─────────────────┘


┌─────────────────┐       ┌─────────────────────┐
│      Gate       │──────▶│   GateRequirement   │
│ (published/     │ 1:N   │                     │
│  delivered)     │       └──────────┬──────────┘
└─────────────────┘                  │
                                     │ references
                                     ▼
                          ┌─────────────────────┐
                          │  ChecklistTemplate  │
                          └─────────────────────┘
```

---

## 2. Schema Prisma Completo

### 2.1 Enums

```prisma
enum UserRole {
  admin
  pm
  senior
  executor
}

enum OrchProjectStatus {
  in_development        // In sviluppo
  ready_for_publish     // Pronto per pubblicazione
  published             // Pubblicato
  delivered             // Consegnato
}

enum ChecklistCategory {
  seo
  technical
  privacy
  performance
  backend
  other
}

enum ChecklistInstanceStatus {
  pending
  completed
  awaiting_approval
}

enum GateName {
  published             // Pubblicato
  delivered             // Consegnato
}
```

### 2.2 User (Esteso)

```prisma
model User {
  id                    String   @id @default(uuid())
  email                 String   @unique
  passwordHash          String
  name                  String
  roles                 UserRole[]  // Array di ruoli multipli

  // Campi esistenti Time & Cost
  workingDays           Int[]    @default([1, 2, 3, 4, 5])
  workStartTime         String   @default("09:00")
  workEndTime           String   @default("18:00")
  dailyTargetMinutes    Int      @default(480)
  slackUserId           String?
  reminderChannel       ReminderChannelPreference @default(slack_only)

  // Asana mapping
  asanaUserId           String?  @unique  // GID utente Asana

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relazioni esistenti
  projectAssignments    ProjectAssignment[]
  timeEntries           TimeEntry[]
  dayStatuses           DayStatus[]
  weeklySubmissions     WeeklySubmission[]
  reminderLogs          ReminderLog[]
  passwordResetTokens   PasswordResetToken[]

  // Nuove relazioni Orchestration
  executorInstances     ChecklistInstance[] @relation("ExecutorRelation")
  ownerInstances        ChecklistInstance[] @relation("OwnerRelation")
  createdOrchProjects   OrchProject[]       @relation("CreatedByRelation")
}
```

### 2.3 OrchProject

```prisma
model OrchProject {
  id                    String              @id @default(uuid())
  name                  String
  code                  String?             @unique
  status                OrchProjectStatus   @default(in_development)

  // Decisioni bloccanti (JSON strutturato)
  // Es: { "cptAcf": true, "backendCliente": true }
  decisions             Json?

  // Asana mapping
  asanaProjectId        String?             // GID progetto Asana (se dedicato)

  // Audit
  createdById           String
  createdBy             User                @relation("CreatedByRelation", fields: [createdById], references: [id])
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  // Relazioni
  checklistInstances    ChecklistInstance[]

  @@index([status])
  @@index([createdById])
}
```

### 2.4 ChecklistTemplate (Repository)

```prisma
model ChecklistTemplate {
  id                    String              @id @default(uuid())
  name                  String
  category              ChecklistCategory
  version               Int                 @default(1)
  active                Boolean             @default(true)

  // Metadata per Asana task
  defaultMinutes        Int?                // Minuti previsti default
  defaultPriority       String?             // Priorità default
  defaultImportance     String?             // Importanza default
  defaultFriction       String?             // Attrito default

  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  // Relazioni
  items                 ChecklistItemTemplate[]
  instances             ChecklistInstance[]
  gateRequirements      GateRequirement[]

  @@unique([name, version])
  @@index([category])
  @@index([active])
}
```

### 2.5 ChecklistItemTemplate

```prisma
model ChecklistItemTemplate {
  id                    String              @id @default(uuid())
  checklistTemplateId   String
  checklistTemplate     ChecklistTemplate   @relation(fields: [checklistTemplateId], references: [id], onDelete: Cascade)

  label                 String
  description           String?             // Descrizione dettagliata per task Asana
  required              Boolean             @default(true)
  sortOrder             Int                 @default(0)

  createdAt             DateTime            @default(now())

  @@index([checklistTemplateId])
}
```

### 2.6 ChecklistInstance

```prisma
model ChecklistInstance {
  id                    String                   @id @default(uuid())

  // Riferimenti
  orchProjectId         String
  orchProject           OrchProject              @relation(fields: [orchProjectId], references: [id], onDelete: Cascade)

  checklistTemplateId   String
  checklistTemplate     ChecklistTemplate        @relation(fields: [checklistTemplateId], references: [id])

  // Snapshot versione al momento dell'assegnazione
  templateVersion       Int

  // Stato
  status                ChecklistInstanceStatus  @default(pending)
  completedAt           DateTime?

  // Assegnazioni
  executorUserId        String?
  executor              User?                    @relation("ExecutorRelation", fields: [executorUserId], references: [id])

  ownerUserId           String?                  // Responsabile/Certificatore
  owner                 User?                    @relation("OwnerRelation", fields: [ownerUserId], references: [id])

  // Scheduling
  dueDate               DateTime?

  // Asana mapping
  asanaTaskId           String?                  @unique  // GID task Asana

  createdAt             DateTime                 @default(now())
  updatedAt             DateTime                 @updatedAt

  // Relazione con ExecutionTask (storico)
  executionTasks        ExecutionTask[]

  @@index([orchProjectId])
  @@index([checklistTemplateId])
  @@index([status])
  @@index([executorUserId])
}
```

### 2.7 ExecutionTask

```prisma
model ExecutionTask {
  id                    String              @id @default(uuid())

  checklistInstanceId   String
  checklistInstance     ChecklistInstance   @relation(fields: [checklistInstanceId], references: [id], onDelete: Cascade)

  // Asana references
  asanaTaskId           String              @unique
  asanaProjectId        String

  // Snapshot dati inviati ad Asana
  asanaPayloadSnapshot  Json                // Payload completo inviato

  // Stato sync
  lastSyncAt            DateTime            @default(now())
  syncStatus            String              @default("synced")  // synced | pending | error

  createdAt             DateTime            @default(now())

  @@index([checklistInstanceId])
  @@index([asanaTaskId])
}
```

### 2.8 Gate

```prisma
model Gate {
  id                    String              @id @default(uuid())
  name                  GateName            @unique
  displayName           String
  description           String?
  sortOrder             Int                 @default(0)

  // Relazioni
  requirements          GateRequirement[]

  @@index([sortOrder])
}
```

### 2.9 GateRequirement

```prisma
model GateRequirement {
  id                    String              @id @default(uuid())

  gateId                String
  gate                  Gate                @relation(fields: [gateId], references: [id], onDelete: Cascade)

  checklistTemplateId   String
  checklistTemplate     ChecklistTemplate   @relation(fields: [checklistTemplateId], references: [id])

  // Se true, la checklist è richiesta solo se assegnata al progetto
  requiredIfAssigned    Boolean             @default(false)

  @@unique([gateId, checklistTemplateId])
  @@index([gateId])
}
```

### 2.10 AsanaWebhookEvent

```prisma
model AsanaWebhookEvent {
  id                    String              @id @default(uuid())

  // Identificazione evento Asana
  asanaEventId          String              @unique  // X-Hook-Secret o event GID
  eventType             String                       // task.completed, task.reopened, etc.
  resourceGid           String                       // GID risorsa (task)

  // Payload
  payload               Json

  // Stato processing
  processedAt           DateTime?
  status                String              @default("pending")  // pending | processed | failed
  errorMessage          String?
  retryCount            Int                 @default(0)

  createdAt             DateTime            @default(now())

  @@index([asanaEventId])
  @@index([status])
  @@index([resourceGid])
}
```

---

## 3. Seed Data

### 3.1 Gates

```typescript
const gates = [
  {
    name: 'published',
    displayName: 'Pubblicato',
    description: 'Il sito è online e accessibile',
    sortOrder: 1,
  },
  {
    name: 'delivered',
    displayName: 'Consegnato',
    description: 'Il progetto è completo e consegnato al cliente',
    sortOrder: 2,
  },
];
```

### 3.2 Gate Requirements

```typescript
const gateRequirements = [
  // Gate: Pubblicato
  { gate: 'published', template: 'SEO Base', requiredIfAssigned: false },
  { gate: 'published', template: 'Tecnica Post-Pubblicazione', requiredIfAssigned: false },
  { gate: 'published', template: 'Privacy Essenziale', requiredIfAssigned: false },

  // Gate: Consegnato (richiede Pubblicato + Performance se assegnata)
  { gate: 'delivered', template: 'Performance Minima', requiredIfAssigned: true },
];
```

### 3.3 Checklist Templates (Repository v1)

```typescript
const checklistTemplates = [
  {
    name: 'SEO Base',
    category: 'seo',
    version: 1,
    defaultMinutes: 60,
    items: [
      { label: 'noindex disattivato', required: true, sortOrder: 1 },
      { label: 'sitemap generata', required: true, sortOrder: 2 },
      { label: 'homepage indicizzabile', required: true, sortOrder: 3 },
      { label: 'title e meta description presenti', required: true, sortOrder: 4 },
    ],
  },
  {
    name: 'Tecnica Post-Pubblicazione',
    category: 'technical',
    version: 1,
    defaultMinutes: 45,
    items: [
      { label: 'sito accessibile', required: true, sortOrder: 1 },
      { label: 'cache attiva', required: true, sortOrder: 2 },
      { label: 'backup attivo', required: true, sortOrder: 3 },
      { label: 'errori bloccanti assenti', required: true, sortOrder: 4 },
    ],
  },
  {
    name: 'Privacy Essenziale',
    category: 'privacy',
    version: 1,
    defaultMinutes: 30,
    items: [
      { label: 'privacy policy collegata', required: true, sortOrder: 1 },
      { label: 'cookie banner attivo', required: true, sortOrder: 2 },
      { label: 'form conformi', required: true, sortOrder: 3 },
    ],
  },
  {
    name: 'Performance Minima',
    category: 'performance',
    version: 1,
    defaultMinutes: 60,
    items: [
      { label: 'sito utilizzabile da mobile', required: true, sortOrder: 1 },
      { label: 'caricamento accettabile', required: true, sortOrder: 2 },
    ],
  },
  {
    name: 'Backend CMS - Proposte Viaggio',
    category: 'backend',
    version: 1,
    defaultMinutes: 120,
    items: [
      { label: 'CPT dedicato creato', required: true, sortOrder: 1 },
      { label: 'campi ACF configurati', required: true, sortOrder: 2 },
      { label: 'ruolo cliente configurato', required: true, sortOrder: 3 },
      { label: 'backend testato con utente cliente', required: true, sortOrder: 4 },
      { label: 'nessun uso del blog', required: true, sortOrder: 5 },
    ],
  },
];
```

---

## 4. Migrazione da Schema Esistente

### 4.1 Modifica Ruoli User

**Prima (attuale):**
```prisma
model User {
  role UserRole @default(collaborator)
}

enum UserRole {
  admin
  collaborator
}
```

**Dopo:**
```prisma
model User {
  roles UserRole[]
  asanaUserId String? @unique
}

enum UserRole {
  admin
  pm
  senior
  executor
}
```

### 4.2 Script Migrazione SQL

```sql
-- Step 1: Aggiungi nuove colonne
ALTER TABLE "User" ADD COLUMN "roles" "UserRole"[];
ALTER TABLE "User" ADD COLUMN "asanaUserId" TEXT;

-- Step 2: Migra ruoli esistenti
UPDATE "User"
SET roles = CASE
  WHEN role = 'admin' THEN ARRAY['admin']::"UserRole"[]
  ELSE ARRAY['executor']::"UserRole"[]
END;

-- Step 3: Rimuovi colonna vecchia (dopo verifica)
ALTER TABLE "User" DROP COLUMN "role";

-- Step 4: Aggiungi constraint unique su asanaUserId
ALTER TABLE "User" ADD CONSTRAINT "User_asanaUserId_key" UNIQUE ("asanaUserId");
```

---

## 5. Decisioni Architetturali Aperte

### 5.1 Campo `decisions` in OrchProject

**Opzione scelta:** JSON flessibile

```prisma
decisions Json?  // Es: { "cptAcf": true, "backendCliente": true }
```

**Alternativa considerata:** Modello relazionale separato `ProjectDecision`

**Motivazione:** JSON più flessibile per decisioni progetto-specifiche che possono variare. Se necessario in futuro, migrazione possibile.

---

### 5.2 Separazione Project vs OrchProject

**Opzione scelta:** Entità separate

- `Project` → Time & Cost (esistente)
- `OrchProject` → Orchestration (nuovo)

**Alternativa considerata:** Unificare con flag `isOrchestrated`

**Motivazione:** Separazione netta dei domini. Time & Cost non deve conoscere Orchestration. Relazione opzionale futura possibile via `timeTrackingProjectId` in OrchProject.

---

### 5.3 AsanaUserId per Executor

**Opzione scelta:** Opzionale

```prisma
asanaUserId String? @unique
```

**Motivazione:** Permette onboarding graduale. Validazione a runtime: se executor assegnato a ChecklistInstance non ha asanaUserId, warning/errore al momento dell'assegnazione (non al login).

---

## 6. Indici e Performance

| Tabella | Indice | Motivazione |
|---------|--------|-------------|
| OrchProject | `status` | Filtro progetti per stato |
| OrchProject | `createdById` | Progetti creati da utente |
| ChecklistTemplate | `category` | Filtro per categoria |
| ChecklistTemplate | `active` | Solo template attivi |
| ChecklistInstance | `orchProjectId` | Checklist per progetto |
| ChecklistInstance | `status` | Filtro per stato |
| ChecklistInstance | `executorUserId` | Task per esecutore |
| ExecutionTask | `asanaTaskId` | Lookup da webhook |
| AsanaWebhookEvent | `status` | Eventi da processare |
| AsanaWebhookEvent | `resourceGid` | Deduplicazione |
