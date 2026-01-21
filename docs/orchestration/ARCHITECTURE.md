# Architettura Tecnica - Modulo Orchestration

> Documento generato durante la sessione di progettazione.
> Ultima modifica: 2026-01-17

---

## 1. Panoramica

Questo documento definisce l'architettura del **Modulo Project Orchestration & Guardrails**, che si integra con l'app Time Tracker esistente.

### Principio Architetturale

```
ASANA ESEGUE. L'APP VALIDA.
```

- **Asana** = UI operativa, task, assegnazioni
- **App** = cervello, regole, guardrail, stati reali del progetto

---

## 2. Stack Tecnologico

| Layer | Tecnologia | Note |
|-------|-----------|------|
| Backend | NestJS + TypeScript | Già in uso |
| Database | PostgreSQL + Prisma | Già in uso |
| Auth | JWT + Passport | Già in uso, esteso con ruoli multipli |
| Integrazione Asana | Asana REST API + Webhook | Nuovo |
| Queue (eventi) | BullMQ + Redis | Nuovo - per webhook idempotenti |

---

## 3. Struttura Moduli Backend

```
/backend/src
├── /auth                      # ESISTENTE - Esteso con nuovi ruoli
├── /users                     # ESISTENTE
├── /time-entries              # ESISTENTE (Time & Cost)
├── /projects                  # ESISTENTE
│
├── /orchestration             # NUOVO MODULO
│   ├── orchestration.module.ts
│   ├── /projects              # Project Orchestration
│   │   ├── orch-projects.controller.ts
│   │   ├── orch-projects.service.ts
│   │   └── /dto
│   ├── /checklists            # Checklist Repository + Instances
│   │   ├── checklist-templates.controller.ts
│   │   ├── checklist-templates.service.ts
│   │   ├── checklist-instances.service.ts
│   │   └── /dto
│   ├── /gates                 # Gate & GateRequirement
│   │   ├── gates.service.ts
│   │   └── gate-evaluator.service.ts
│   └── /guardrails            # Logica Guardrail
│       └── guardrail.service.ts
│
├── /asana                     # NUOVO MODULO
│   ├── asana.module.ts
│   ├── asana-client.service.ts      # Client API Asana
│   ├── asana-task.service.ts        # Creazione/Update task
│   ├── asana-webhook.controller.ts  # Webhook receiver
│   ├── asana-webhook.service.ts     # Handler eventi
│   └── /dto
│
├── /queue                     # NUOVO MODULO
│   ├── queue.module.ts
│   ├── asana-event.processor.ts     # Processor BullMQ
│   └── asana-event.producer.ts
│
└── /common
    └── /guards
        ├── jwt-auth.guard.ts        # ESISTENTE
        ├── admin.guard.ts           # ESISTENTE
        └── orchestration.guard.ts   # NUOVO - PM/Senior/Admin
```

---

## 4. Sistema Ruoli

### 4.1 Ruoli Disponibili

| Ruolo | Descrizione |
|-------|-------------|
| `admin` | Accesso completo, gestione sistema |
| `pm` | Project Manager - crea progetti, assegna checklist |
| `senior` | Senior - può vedere Orchestration, supervisiona |
| `executor` | Esecutore - solo Time & Cost, lavora su Asana |

### 4.2 Assegnazione Ruoli

Ogni utente può avere **più ruoli contemporaneamente**.

**Esempi:**
| Utente | Ruoli | Accesso |
|--------|-------|---------|
| Alessio | `[admin, pm, senior]` | Tutto |
| Daniela | `[pm, senior, executor]` | Orchestration + Time & Cost + Asana |
| Stefano | `[senior, executor]` | Orchestration (view) + Time & Cost + Asana |

### 4.3 Matrice Permessi

| Ruolo | Time & Cost | Orchestration View | Crea Progetti | Assegna Checklist | Admin Panel |
|-------|-------------|-------------------|---------------|-------------------|-------------|
| `executor` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `senior` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `pm` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ |

### 4.4 Guards

```typescript
// Accesso Orchestration (view) - senior, pm, admin
@Injectable()
export class OrchestrationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    const allowedRoles = ['admin', 'pm', 'senior'];
    return user.roles.some(role => allowedRoles.includes(role));
  }
}

// Può creare/modificare progetti - pm, admin
@Injectable()
export class ProjectManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    return user.roles.some(role => ['admin', 'pm'].includes(role));
  }
}

// Admin panel - solo admin
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    return user.roles.includes('admin');
  }
}
```

---

## 5. Integrazione Asana

### 5.1 Flusso App → Asana

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Orchestration  │────▶│   Asana Module  │────▶│   ASANA API     │
│     Module      │     │  (REST Client)  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Operazioni:**
- Creazione task per ogni ChecklistInstance
- Aggiornamento task (assegnazione, scadenza, etc.)
- Chiusura task (quando Gate raggiunto)

### 5.2 Flusso Asana → App (Webhook)

```
┌────────────┐     ┌─────────────────┐     ┌─────────────┐     ┌────────────┐
│   ASANA    │────▶│ Webhook         │────▶│   Redis     │────▶│  Processor │
│  (evento)  │     │ Controller      │     │   Queue     │     │  (BullMQ)  │
└────────────┘     └─────────────────┘     └─────────────┘     └─────┬──────┘
                          │                                          │
                          │ 200 OK immediato                         │
                          │ (Asana timeout 10s)                      ▼
                                                            ┌────────────────┐
                                                            │ Guardrail      │
                                                            │ Service        │
                                                            │ (ricalcola)    │
                                                            └────────────────┘
```

**Eventi gestiti:**
- `task.completed` → ChecklistInstance → completed
- `task.reopened` → ChecklistInstance → pending

**Perché Queue:**
- Asana richiede risposta < 10 secondi
- Eventi devono essere idempotenti
- Retry automatico in caso di fallimento
- Deduplicazione eventi (Asana può re-inviare)

### 5.3 Configurazione Ambiente

```env
# Asana API
ASANA_ACCESS_TOKEN=           # Personal Access Token o OAuth
ASANA_WORKSPACE_ID=           # Workspace GID
ASANA_DEFAULT_PROJECT_ID=     # Project Asana per i task

# Asana Custom Fields (GID)
ASANA_FIELD_PROJECT_ID=       # Custom field per ProjectID app
ASANA_FIELD_CHECKLIST_ID=     # Custom field per ChecklistInstanceID

# Webhook
ASANA_WEBHOOK_SECRET=         # Per validare firma webhook

# Redis (per BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 6. Sicurezza e Visibilità

### Principio Critico

> Le regole di guardrail **non devono mai essere valutate lato client**.
> La UI mostra solo ciò che il backend autorizza.

### Implementazione

```typescript
// Controller Time Entries (esistente) - Tutti possono accedere
@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeEntriesController { ... }

// Controller Orchestration - Solo PM/Senior/Admin
@Controller('orchestration')
@UseGuards(JwtAuthGuard, OrchestrationGuard)
export class OrchProjectsController { ... }

@Controller('orchestration/checklists')
@UseGuards(JwtAuthGuard, OrchestrationGuard)
export class ChecklistTemplatesController { ... }
```

---

## 7. Dipendenze Nuove

```json
{
  "dependencies": {
    "asana": "^3.0.0",
    "@nestjs/bullmq": "^10.0.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.0.0"
  }
}
```

---

## 8. Diagramma Architettura Completa

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────┐              ┌─────────────────────────────┐     │
│   │   Time & Cost UI    │              │   Project Orchestration UI  │     │
│   │   (Tutti i ruoli)   │              │   (Solo PM/Senior/Admin)    │     │
│   └──────────┬──────────┘              └──────────────┬──────────────┘     │
│              │                                        │                     │
│              │ Visibilità basata su role              │                     │
└──────────────┼────────────────────────────────────────┼─────────────────────┘
               │                                        │
               ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (NestJS)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │   Auth Module   │    │  Time & Cost    │    │  Orchestration  │        │
│   │   (JWT+Roles)   │    │    Module       │    │     Module      │        │
│   └────────┬────────┘    └─────────────────┘    └────────┬────────┘        │
│            │                                             │                  │
│            │              ┌─────────────────┐            │                  │
│            └─────────────▶│   Guards        │◀───────────┘                  │
│                           │ - JwtAuthGuard  │                               │
│                           │ - AdminGuard    │                               │
│                           │ - OrchGuard     │                               │
│                           │ - PMGuard       │                               │
│                           └─────────────────┘                               │
│                                                                             │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │  Asana Module   │◀──▶│  Queue Module   │◀──▶│  Redis          │        │
│   │  (API Client)   │    │  (BullMQ)       │    │                 │        │
│   └────────┬────────┘    └─────────────────┘    └─────────────────┘        │
│            │                                                                │
│            │ Webhook                                                        │
└────────────┼────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ASANA                                          │
│   - Task per ChecklistInstance                                              │
│   - Custom Fields (ProjectID, ChecklistInstanceID)                          │
│   - Webhook su task.completed / task.reopened                               │
└─────────────────────────────────────────────────────────────────────────────┘
```
