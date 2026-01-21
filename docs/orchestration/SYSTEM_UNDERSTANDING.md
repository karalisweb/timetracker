# Comprensione Definitiva del Sistema Orchestration

> Documento di riferimento per la comprensione condivisa del sistema
> Ultima modifica: 2026-01-17

---

## Principio Fondamentale

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║                 ASANA ESEGUE. L'APP VALIDA.                      ║
║                                                                   ║
║  • Asana = dove l'executor lavora (unico punto di contatto)      ║
║  • App = genera task, monitora stato, valida gates               ║
║  • PM = osserva in modo "ghost", non interviene manualmente      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## Architettura a Layer

### Layer 0: Decisioni Strategiche (Fuori App)

**Input:**
- Intervista con il cliente
- Documento strategico
- Wireframe (Stefano)
- Contenuti (Daniela)

**Output:**
- Decisioni congelate e non negoziabili
- Esempio: "CMS: WordPress + ACF", "SEO: base", "Contenuti: cliente inserisce"

**Chi le gestisce:** Alessio, dopo confronto con team e cliente

**Stato attuale:** Esterne all'app, spesso mal comunicate. Da ingegnerizzare in futuro.

---

### Layer 1: App - Generazione Task

L'app prende le decisioni e genera **task Asana completi e actionable**.

#### Struttura Task Generato

```
┌─────────────────────────────────────────────────────────────────┐
│ TITOLO: [Progetto] – [Azione Deterministica]                    │
│ Es: "DTI – Implementazione CPT Proposte Viaggio (ACF)"          │
├─────────────────────────────────────────────────────────────────┤
│ ASSEGNATARIO: Derivato da competenze (modificabile su Asana)    │
│ SCADENZA: Calcolata (+N giorni lavorativi)                      │
│ PROGETTO ASANA: [Nome progetto]                                 │
├─────────────────────────────────────────────────────────────────┤
│ DIPENDENZE:                                                     │
│ - Task che devono essere completati prima                       │
│ - Es: "DTI – Struttura pagine approvata"                        │
├─────────────────────────────────────────────────────────────────┤
│ CUSTOM FIELDS:                                                  │
│ - Priorità: 1-Bassa, 2-Alta, 3-Critica                         │
│ - Importanza: Importante 1, 2, 3                                │
│ - Attrito: Attrito 1, 2, 3                                      │
│ - Minuti Previsti: stima effort                                 │
│ - Blocco Attività: MSD, Cliente, Altro                          │
│ - Tags: Backend, Frontend, SEO, CMS, ecc.                       │
├─────────────────────────────────────────────────────────────────┤
│ DESCRIZIONE STRUTTURATA:                                        │
│                                                                 │
│ ## Contesto                                                     │
│ Perché questo task esiste, cosa deve ottenere                   │
│                                                                 │
│ ## Decisioni Già Prese                                          │
│ - Decisione 1 (non negoziabile)                                 │
│ - Decisione 2 (non negoziabile)                                 │
│                                                                 │
│ ## Vincoli                                                      │
│ - Cosa NON fare                                                 │
│ - Limitazioni tecniche                                          │
│                                                                 │
│ ## Riferimenti                                                  │
│ - Link Figma                                                    │
│ - Link documento                                                │
├─────────────────────────────────────────────────────────────────┤
│ CHECKLIST OPERATIVA (subtask):                                  │
│ □ Item 1 - Condizione di completamento                          │
│ □ Item 2 - Condizione di completamento                          │
│ □ Item 3 - Condizione di completamento                          │
│                                                                 │
│ 👉 Se una voce manca → il task non è fatto bene                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Layer 2: Asana - Esecuzione

**Chi lavora qui:** Solo gli executor

**Cosa vedono:** Task completi con tutto il contesto necessario

**Cosa fanno:**
1. Leggono il task
2. Eseguono il lavoro
3. Spuntano la checklist operativa
4. Completano il task

**Modifiche permesse:**
- Assegnatario (l'app cattura via webhook)
- Note/commenti
- Subtask aggiuntivi

---

### Layer 3: App - Monitoraggio e Gates

**Chi usa questa vista:** PM, Senior, Admin

**Modalità:** "Ghost" / Osservazione
- Il PM vede lo stato di tutti i task
- Il PM vede il progresso delle checklist
- Il PM NON interviene manualmente sui completamenti

**Gates:**
- Validano automaticamente che task + checklist siano completati
- Se gate passa → progetto può avanzare di stato
- Nessun override manuale permesso

---

## Sincronizzazione Asana ↔ App

### Eventi Catturati (Webhook)

| Evento Asana | Azione App |
|--------------|------------|
| `task.completed` | Marca task completato, ricalcola gate |
| `task.uncompleted` | Riapre task, ricalcola gate |
| `subtask.completed` | Aggiorna progresso checklist |
| `task.assignee_changed` | Aggiorna assegnatario in app |
| `task.due_date_changed` | (Opzionale) Cattura modifica |

### Direzione Sync

```
APP ──────────────────→ ASANA
    Crea task iniziale
    (one-way al momento creazione)

APP ←────────────────── ASANA
    Webhook eventi
    (continuous sync)
```

---

## Assegnazione Automatica

### Logica

```
Tipo Task → Competenza Richiesta → Persona con quella competenza
```

**Esempio:**
- Task "Backend + ACF" → Competenza "Sviluppatore WP" → Matteo
- Task "SEO Base" → Competenza "SEO Specialist" → Marco

### Configurazione

Tabella mapping:
```
competenza          → asana_user_id
────────────────────────────────────
sviluppatore_wp     → 12345678
seo_specialist      → 12345679
frontend_developer  → 12345680
```

### Override

L'assegnatario può essere modificato su Asana. L'app cattura la modifica e aggiorna il suo stato.

---

## Differenza Task vs Checklist

### Task (su Asana)

= **Azione complessa da eseguire**

- Ha un titolo descrittivo
- Ha contesto, decisioni, vincoli
- Ha una checklist operativa interna
- È assegnato a una persona
- Ha scadenza e priorità

### Checklist (nell'App)

= **Raggruppamento logico per i Gates**

- Categoria di verifiche (SEO, Tech, Privacy, ecc.)
- Contiene N item da completare
- Il gate verifica che tutti gli item obbligatori siano completati
- Il PM vede il progresso senza intervenire

### Relazione

```
1 Checklist (App) → N Task (Asana) → Ogni Task ha M Subtask (checklist operativa)
```

O in alternativa:

```
1 Checklist (App) → 1 Task (Asana) con N Subtask
```

Da definire in base alla granularità desiderata.

---

## Gates

### Definizione

Checkpoint che il progetto deve superare per avanzare di stato.

### Cosa Validano

1. **Task completati**: I task Asana associati sono marcati come "done"
2. **Checklist completate**: I subtask (checklist operativa) sono spuntati

### Nessun Override

I gates sono **automatici**. Il PM non può forzare il passaggio.

Se il gate non passa, significa che qualcosa non è stato fatto.

---

## Stati Progetto

```
in_development ──→ ready_for_publish ──→ published ──→ delivered
                          ↑                  ↑
                      Gate 1              Gate 2
                   "Pubblicato"         "Consegnato"
```

---

## Ruoli e Permessi

| Ruolo | Vede Orchestration | Crea Progetti | Interviene su Task |
|-------|-------------------|---------------|-------------------|
| `executor` | ❌ | ❌ | Solo su Asana |
| `senior` | ✅ (view) | ❌ | ❌ |
| `pm` | ✅ | ✅ | ❌ (osserva) |
| `admin` | ✅ | ✅ | ❌ (osserva) |

---

## Prossimi Step Implementativi

### Priorità Alta

1. **Task Generation Service**: Generare task Asana strutturati
2. **Schema esteso**: Campi per titolo pattern, descrizione template, dipendenze
3. **Custom fields Asana**: Priorità, Importanza, Attrito, Minuti
4. **Subtask come checklist**: Creare subtask nel task Asana

### Priorità Media

5. **Auto-assegnazione**: Mapping competenze → persona
6. **Sync assegnatario**: Catturare modifiche da Asana
7. **Vista ghost PM**: Dashboard monitoraggio pervasivo

### Priorità Bassa (Futuro)

8. **Modulo Decisioni**: Ingegnerizzare Layer 0 nell'app
9. **Dipendenze task**: Gestione sequenze obbligate

---

## Vincoli Non Negoziabili

1. ❌ L'app NON è un PM tool (non gestisce il "come fare")
2. ❌ I gates NON sono bypassabili manualmente
3. ❌ Gli executor NON vedono l'app Orchestration
4. ❌ Il PM NON completa task al posto degli executor
5. ✅ L'executor lavora SOLO su Asana
6. ✅ L'app è la fonte di verità sullo stato progetto
7. ✅ Tutto è tracciato e verificabile

---

## Changelog

| Data | Note |
|------|------|
| 2026-01-17 | Prima stesura dopo chiarimento con Alessio |
