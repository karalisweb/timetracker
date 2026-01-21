# Specifiche Tecniche
## App Orchestratore Progetti + Asana

Documento tecnico da fornire a Claude Code per la progettazione e sviluppo dell’app.

---

## 1. Scopo dell’app

L’app ha lo scopo di:
- orchestrare la creazione e l’esecuzione dei progetti web
- ridurre l’effort operativo e l’attrito degli esecutori
- impedire errori di implementazione e di consegna
- certificare in modo oggettivo quando un progetto è realmente consegnabile

L’app **non sostituisce Asana**, ma lo utilizza come interfaccia operativa.

---

## 2. Principio architetturale

**Asana esegue. L’app valida.**

- Asana = UI operativa, task, assegnazioni
- App = cervello, regole, guardrail, stati reali del progetto

L’integrazione è **bidirezionale**:
- App → Asana: creazione e aggiornamento task
- Asana → App: eventi (webhook) su completamento/riapertura task

---

## 3. Entità principali (modello dati)

### Project
- id
- name
- status (In sviluppo | Pronto per pubblicazione | Pubblicato | Consegnato)
- created_at

### ChecklistTemplate (Repository)
- id
- name
- category (SEO | Tecnica | Privacy | Performance | Backend | Altro)
- version
- active

### ChecklistItemTemplate
- id
- checklist_template_id
- label
- required

### ChecklistInstance
- id
- project_id
- checklist_template_id
- status (pending | completed | awaiting_approval)
- assigned_executor_user_id
- accountable_owner_user_id

### Gate
- id
- name (Pubblicato | Consegnato)

### GateRequirement
- gate_id
- checklist_template_id

### ExecutionTask (Asana mapping)
- id
- checklist_instance_id
- asana_task_id
- asana_project_id

---

## 4. Repository checklist (canoniche v1)

### SEO Base (Bulldog)
- noindex disattivato
- sitemap generata
- homepage indicizzabile
- title e meta description presenti

### Tecnica Post-Pubblicazione (Bulldog)
- sito accessibile
- cache attiva
- backup attivo
- errori bloccanti assenti

### Privacy Essenziale (Bulldog)
- privacy policy collegata
- cookie banner attivo
- form conformi

### Performance Minima (Bulldog)
- sito utilizzabile da mobile
- caricamento accettabile

### Backend CMS – Proposte Viaggio (DTI)
- CPT dedicato creato
- campi ACF configurati
- ruolo cliente configurato
- backend testato con utente cliente
- nessun uso del blog

---

## 5. Creazione progetto (DTI come scenario base)

Quando viene creato un Project:
1. il senior definisce le decisioni bloccanti (es. CPT+ACF, backend cliente)
2. assegna le checklist rilevanti dal repository
3. il sistema associa automaticamente i Gate (Pubblicato / Consegnato)

---

## 6. Generazione task Asana

Per ogni ChecklistInstance l’app deve:
- creare un task Asana
- assegnarlo all’esecutore
- compilare automaticamente i campi standard Asana:
  - Titolo
  - Incaricato
  - Scadenza
  - Dipendenze
  - Etichette
  - Progetto
  - Blocco Attività
  - Priorità
  - Importanza
  - Attrito
  - Minuti previsti
  - Descrizione strutturata
  - Checklist operativa

Ogni task deve contenere riferimenti persistenti:
- ProjectID
- ChecklistInstanceID

---

## 7. Forma standard del task Asana

Ogni task Asana deve includere:
- titolo deterministico
- descrizione con:
  - contesto
  - decisioni già prese
  - vincoli
- checklist operativa (come guida di esecuzione)

La checklist del task **non è la verità finale**, ma guida l’esecuzione.

---

## 8. Eventi Asana (webhook)

### Task completato
- aggiornare ChecklistInstance → completed
- ricalcolare Gate
- aggiornare Project.status se possibile

### Task riaperto
- ChecklistInstance → pending
- bloccare o far regredire lo stato del Project

Eventi devono essere idempotenti.

---

## 9. Guardrail di stato

### Stato Pubblicato
Richiede:
- SEO Base
- Tecnica Post-Pubblicazione
- Privacy Essenziale

### Stato Consegnato
Richiede:
- Stato Pubblicato
- Performance Minima (se assegnata)

Se una checklist richiesta non è completa, lo stato è bloccato.

---

## 10. Ruoli

- Esecutore: lavora sui task Asana
- Responsabile: certifica (opzionale)

Nel MVP possono coincidere, ma il modello deve consentire separazione.

---

## 11. UX operativa (vincolo)

- l’esecutore lavora solo su Asana
- nessuna doppia compilazione
- feedback automatici su Asana se un Gate è bloccato

---

## 12. Accesso, ruoli e visibilità moduli

### Principio
Il **login determina quali moduli e funzionalità sono visibili**.

L’app è unica, ma **i moduli sono segregati per ruolo**.

---

### Ruoli applicativi minimi

**Collaboratore / Esecutore**
- accesso solo al Modulo Time & Cost
- può:
  - tracciare tempo
  - vedere i task assegnati (link Asana)
- non può:
  - vedere progetti come entità
  - vedere checklist
  - vedere guardrail o stati di consegna

**PM / Senior / Admin**
- accesso a:
  - Modulo Time & Cost
  - Modulo Project Orchestration & Guardrails
- può:
  - creare progetti
  - assegnare checklist
  - vedere stati reali (Gate)
  - vedere errori bloccanti

---

### Regola di sicurezza

Le regole di guardrail **non devono mai essere valutate lato client**.
La UI mostra solo ciò che il backend autorizza.

---

## 13. Cosa l’app NON fa

- non è un project management tool
- non sostituisce Asana
- non espone i guardrail agli esecutori
- non permette di forzare stati di consegna

---

## 14. Principio finale

Il sistema deve rendere **ovvio cosa fare**,
**impossibile consegnare male**,
e **misurabile l’effort**.

**Asana esegue. L’app valida.****

