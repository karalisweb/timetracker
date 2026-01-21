# Specifica Generazione Task Asana Avanzata

> Documento di specifica per la generazione automatica di task Asana strutturati
> Basato su esempio reale: DTI – Sito web con pannello contenuti cliente

---

## 1. Problema Attuale

L'implementazione attuale crea task Asana con:
- ✅ Titolo base (nome checklist)
- ✅ Assegnatario (executor)
- ✅ Due date (se specificata)
- ✅ Custom fields (project ID, checklist ID)

**Manca:**
- ❌ Titolo strutturato con pattern `[Project] – [Azione deterministica]`
- ❌ Dipendenze tra task
- ❌ Etichette/Tag multipli
- ❌ Priorità, Importanza, Attrito
- ❌ Minuti previsti
- ❌ Descrizione strutturata con sezioni
- ❌ Checklist operativa nel task

---

## 2. Esempio Target

### Task Asana Generato

```
Titolo: DTI – Implementazione CPT Proposte Viaggio (ACF)

Incaricato: Matteo
Scadenza: +2 giorni lavorativi

Dipendenze:
- DTI – Struttura pagine approvata
- DTI – Ambiente WP pronto

Etichette: DTI, Backend, CMS, ACF
Progetto: DTI – Website
Blocco Attività: MSD
Priorità: 2 – Alta
Importanza: Importante 1
Attrito: Attrito 1
Minuti previsti: 180

Descrizione:
## Contesto
Il cliente DTI deve poter inserire e modificare in autonomia...

## Decisioni già prese
- NON usare il blog
- Usare CPT dedicato + campi ACF
- Backend semplice...

## Vincoli
- Nessun contenuto hardcoded
- Nessuna sezione inutile...

## Riferimenti
- Documento decisioni progetto DTI
- (link Figma)

## Checklist Operativa
- [ ] CPT "Proposte Viaggio" creato
- [ ] Campi ACF definiti
- [ ] Campi obbligatori marcati
- [ ] Ruolo cliente configurato
- [ ] Backend testato
- [ ] Nessun uso del blog
```

---

## 3. Modifiche Necessarie

### 3.1 Schema Database

#### Nuovi Campi su `ChecklistTemplate`

```prisma
model ChecklistTemplate {
  // Esistenti...

  // NUOVI: Per generazione task avanzata
  titlePattern        String?   // Es: "{project} – Implementazione {name}"
  defaultDueDays      Int?      // Giorni lavorativi dalla creazione
  defaultPriority     String?   // "1-Bassa", "2-Alta", "3-Critica"
  defaultImportance   String?   // "Importante 1", "Importante 2"
  defaultAttrito      String?   // "Attrito 1", "Attrito 2", "Attrito 3"
  defaultMinutes      Int?      // Minuti stimati
  tags                String[]  // Tag fissi da applicare
  descriptionTemplate String?   // Template descrizione con placeholder
  dependsOnTemplates  String[]  // ID altri template da cui dipende
}
```

#### Nuovi Campi su `ChecklistItemTemplate`

```prisma
model ChecklistItemTemplate {
  // Esistenti...

  // NUOVI: Per checklist operativa nel task
  isOperational    Boolean @default(true)  // Voce da includere in checklist Asana
  operationalText  String?                  // Testo alternativo per Asana
}
```

#### Nuovi Campi su `OrchProject`

```prisma
model OrchProject {
  // Esistenti...

  // NUOVI: Decisioni strutturate
  decisions     Json?    // Oggetto con decisioni chiave
  constraints   String[] // Vincoli progetto
  references    String[] // Link riferimenti (Figma, docs, ecc.)
  clientName    String?  // Nome cliente per titolo task
  projectTags   String[] // Tag specifici progetto
}
```

### 3.2 Nuova Entità: `TaskGenerationConfig`

Per gestire mapping ruoli → assegnatari e altre config globali:

```prisma
model TaskGenerationConfig {
  id          String   @id @default(uuid())
  key         String   @unique
  value       Json
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Esempi di config:
```json
{
  "role_mapping": {
    "sviluppatore_wp": "asana_user_id_matteo",
    "seo_specialist": "asana_user_id_marco"
  },
  "priority_mapping": {
    "1": "1208XXXXXXX",  // Custom field option ID
    "2": "1208XXXXXXX",
    "3": "1208XXXXXXX"
  },
  "tags": {
    "backend": "1234567890",
    "frontend": "1234567891",
    "cms": "1234567892"
  }
}
```

### 3.3 Logica Generazione Task

#### Input: Creazione Checklist Instance

```typescript
interface TaskGenerationInput {
  project: OrchProject;
  template: ChecklistTemplate;
  executor?: User;
  dueDate?: Date;
}
```

#### Output: Task Asana Strutturato

```typescript
interface AsanaTaskPayload {
  name: string;           // Titolo calcolato
  assignee?: string;      // GID utente
  due_on?: string;        // Data ISO
  projects: string[];     // Progetto Asana

  // Custom fields
  custom_fields: {
    [fieldGid: string]: string | number;
  };

  // Tags
  tags: string[];         // GID tags

  // Descrizione HTML
  html_notes: string;

  // Dipendenze (richiede API separata)
  dependencies?: string[]; // GID task da cui dipende
}
```

#### Algoritmo Generazione Titolo

```typescript
function generateTitle(project: OrchProject, template: ChecklistTemplate): string {
  const pattern = template.titlePattern || "{project} – {name}";

  return pattern
    .replace("{project}", project.clientName || project.name)
    .replace("{name}", template.name)
    .replace("{code}", project.code || "")
    .replace("{category}", template.category);
}
```

#### Algoritmo Generazione Descrizione

```typescript
function generateDescription(
  project: OrchProject,
  template: ChecklistTemplate,
  items: ChecklistItemTemplate[]
): string {
  const sections = [];

  // Contesto (da template)
  if (template.descriptionTemplate) {
    sections.push(`## Contesto\n${interpolate(template.descriptionTemplate, project)}`);
  }

  // Decisioni (da progetto)
  if (project.decisions && Object.keys(project.decisions).length > 0) {
    sections.push(`## Decisioni già prese\n${formatDecisions(project.decisions)}`);
  }

  // Vincoli
  if (project.constraints?.length > 0) {
    sections.push(`## Vincoli\n${project.constraints.map(c => `- ${c}`).join('\n')}`);
  }

  // Riferimenti
  if (project.references?.length > 0) {
    sections.push(`## Riferimenti\n${project.references.map(r => `- ${r}`).join('\n')}`);
  }

  // Checklist operativa
  const operationalItems = items.filter(i => i.isOperational);
  if (operationalItems.length > 0) {
    sections.push(`## Checklist Operativa\n${operationalItems.map(i =>
      `- [ ] ${i.operationalText || i.title}`
    ).join('\n')}`);
  }

  return sections.join('\n\n');
}
```

### 3.4 Custom Fields Asana Richiesti

Per supportare tutti i campi, servono custom fields nel workspace Asana:

| Campo | Tipo | Opzioni |
|-------|------|---------|
| Blocco Attività | Dropdown | MSD, Cliente, Altro |
| Priorità | Dropdown | 1-Bassa, 2-Alta, 3-Critica |
| Importanza | Dropdown | Importante 1, Importante 2, Importante 3 |
| Attrito | Dropdown | Attrito 1, Attrito 2, Attrito 3 |
| Minuti Previsti | Number | - |
| Project ID | Text | - |
| Checklist ID | Text | - |

---

## 4. Fasi Implementazione

### Fase A: Estensione Schema (Backend)

1. Aggiungere campi a `ChecklistTemplate`
2. Aggiungere campi a `OrchProject`
3. Creare tabella `TaskGenerationConfig`
4. Migrazione database
5. Aggiornare seed con template avanzati

### Fase B: Logica Generazione (Backend)

1. Creare `TaskGeneratorService`
2. Implementare generazione titolo
3. Implementare generazione descrizione
4. Implementare mapping custom fields
5. Implementare gestione dipendenze
6. Aggiornare `AsanaTaskService`

### Fase C: Configurazione (Backend + Frontend)

1. API per gestire `TaskGenerationConfig`
2. UI per mapping ruoli → assegnatari
3. UI per configurare custom fields Asana
4. UI per gestire tags

### Fase D: Form Creazione Progetto (Frontend)

1. Aggiungere campo `clientName`
2. Aggiungere sezione "Decisioni"
3. Aggiungere sezione "Vincoli"
4. Aggiungere sezione "Riferimenti"
5. Preview task che verrà generato

### Fase E: Template Editor (Frontend)

1. UI per editare `titlePattern`
2. UI per editare `descriptionTemplate`
3. UI per configurare dipendenze tra template
4. Preview con placeholder interpolati

---

## 5. Stima Effort

| Fase | Complessità | Note |
|------|-------------|------|
| A - Schema | Media | Migrazione + seed |
| B - Logica | Alta | Core della feature |
| C - Config | Media | CRUD + UI |
| D - Form progetto | Media | Estensione form esistente |
| E - Template editor | Alta | UI complessa |

**Ordine consigliato:** A → B → D → C → E

---

## 6. Decisioni Aperte

### 6.1 Dipendenze Task

**Opzioni:**
1. **API Asana `addDependencies`** - Crea dipendenze reali in Asana
2. **Solo descrizione** - Elenca dipendenze in descrizione, no link
3. **Ibrido** - Dipendenze in descrizione + link se task esiste

**Raccomandazione:** Opzione 3 (ibrido). Le dipendenze tra template sono note a priori, ma i task specifici potrebbero non esistere ancora.

### 6.2 Sincronizzazione Checklist

La checklist operativa in Asana deve sincronizzarsi con l'app?

**Opzioni:**
1. **One-way (App → Asana)** - Checklist creata, mai sincronizzata
2. **Webhook sync** - Completamento item Asana aggiorna app
3. **Solo descrizione** - Checklist come testo, no subtask Asana

**Raccomandazione:** Opzione 1 per MVP, Opzione 2 come evoluzione.

### 6.3 Template Descrizione

Come gestire i placeholder nel template descrizione?

**Opzioni:**
1. **Semplice** - Solo `{project}`, `{client}`, `{date}`
2. **Avanzato** - Supporto condizionali `{#if decisions}...{/if}`
3. **Handlebars** - Template engine completo

**Raccomandazione:** Opzione 1 per MVP, valutare Opzione 2 se necessario.

---

## 7. Esempio Seed Avanzato

```typescript
const seoBaseTemplate = {
  name: "SEO Base",
  category: "seo",
  titlePattern: "{project} – Setup SEO Base",
  defaultDueDays: 3,
  defaultPriority: "2-Alta",
  defaultImportance: "Importante 1",
  defaultAttrito: "Attrito 1",
  defaultMinutes: 120,
  tags: ["SEO", "Setup"],
  descriptionTemplate: `
Il progetto {project} richiede configurazione SEO di base per garantire
indicizzazione corretta e performance iniziali.

Questo task è propedeutico alla pubblicazione.
  `,
  items: [
    { title: "Meta title configurati", isOperational: true },
    { title: "Meta description configurate", isOperational: true },
    { title: "Sitemap.xml generata", isOperational: true },
    { title: "Robots.txt configurato", isOperational: true },
    { title: "Google Search Console collegato", isOperational: true },
  ]
};
```

---

## 8. Prossimi Passi

1. **Validare specifica** con stakeholder
2. **Decidere** sui punti aperti (6.1, 6.2, 6.3)
3. **Creare branch** `feature/advanced-task-generation`
4. **Implementare Fase A** (schema)
5. **Test con template reale** (DTI)

---

## Changelog

| Data | Note |
|------|------|
| 2026-01-17 | Prima stesura basata su esempio DTI |
