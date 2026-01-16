# Canvas Tecnico – Time Report MVP (Compliance-First)
Owner: Karalisweb
Stato: In progettazione

---

## Raison d’être (perché questa app esiste)
Questa applicazione esiste per rispondere in modo affidabile a una sola domanda chiave per il CEO:

> **Quante ore lavora la persona X sul progetto Y, con continuità e senza distorsioni?**

Il focus dell’MVP è esclusivamente la **compliance del dato** (progetto ↔ persona ↔ tempo).
Qualsiasi funzionalità che aumenti attrito cognitivo o non contribuisca direttamente a questo obiettivo viene esplicitamente esclusa.

---

## Contesto e problema reale
Il time report oggi è gestito tramite file Excel.
I collaboratori dimenticano di compilare il report o lo compilano in modo superficiale.
Il risultato è l’assenza di dati affidabili su cui il CEO possa ragionare per valutare l’andamento dei progetti e la qualità della vendita.

---

## Obiettivo dell’MVP
- Garantire la compilazione quotidiana del time report
- Rendere il progetto l’unità centrale del dato
- Ridurre l’attrito cognitivo durante l’inserimento
- Introdurre un concetto chiaro di chiusura della giornata

Output prioritario: **compliance del dato**, non analisi avanzata.

---

## Principi di prodotto
1. Compliance > feature
2. Progetto come unità di verità
3. Inserimento in meno di 30 secondi
4. Nessuna classificazione non necessaria
5. Reminder intelligenti, contestuali, non invasivi

---

## Scope MVP – Funzioni incluse

### Funzioni per collaboratore
- Login
- Inserimento manuale time entry con campi obbligatori:
  - Data (default: oggi)
  - Durata (minuti)
  - Progetto
- Vista “Oggi” con:
  - Totale minuti registrati
  - Target giornaliero personalizzato
  - Stato giornata (aperta / chiusa)
- Azione esplicita: **Chiudi giornata**
- Invio settimana (weekly submit)

### Funzioni per CEO / Admin
- Gestione utenti
- Gestione progetti
- Dashboard di compliance
- Export CSV timesheet

---

## Orari di lavoro e canali di comunicazione (per utente)
Ogni collaboratore deve avere un profilo configurabile con:
- Giorni lavorativi
- Orario di inizio lavoro
- Orario di fine lavoro
- Target giornaliero (minuti)
- Slack User ID
- Email primaria
- Preferenza canale reminder:
  - Slack only
  - Slack + Email
  - Email only

I reminder devono rispettare rigorosamente questi parametri.

---

## Chiusura della giornata
La giornata lavorativa deve essere esplicitamente chiusa dall’utente.

Stati possibili:
- Aperta
- Chiusa completa
- Chiusa incompleta

Una giornata non chiusa è considerata in sospeso e genera reminder.

---

## Reminder & Compliance Logic (Slack + Email)

### Regole generali
- Nessun reminder se la giornata è chiusa
- Nessun reminder fuori dall’orario di lavoro
- Reminder basati su eventi, non su orari fissi globali

### Tipologie di reminder

**Reminder in corso (soft)**
- Dentro orario di lavoro
- Giornata aperta
- Minuti < target
- Canale: Slack

**Reminder fine giornata (hard)**
- Fine lavoro + grace period (configurabile)
- Giornata non chiusa
- Canali: Slack + Email

**Reminder settimanale**
- Settimana precedente non inviata
- Canale: Email (Slack opzionale)

---

## Tassonomie di attività – architettura evolutiva (NON MVP)

Le attività non fanno parte del flusso core dell’MVP.

Architettura prevista:
- Tassonomie definite centralmente (CEO)
- Nessuna tassonomia globale obbligatoria
- Il PM assegna a ogni collaboratore un sottoinsieme di attività
- Il collaboratore vede solo le attività assegnate
- L’uso delle attività è opzionale e non blocca il time entry

Obiettivo futuro:
- Migliorare lettura dei progetti
- Supportare post-mortem e pricing

---

## Profilo collaboratore come hub operativo (NON MVP)

L’account del collaboratore può evolvere in un punto di accesso operativo che include:

- Link alle SOP rilevanti per il ruolo
- Documentazione operativa
- Checklist di lavoro
- Link agli strumenti e alle app autorizzate

Esempi:
- Commerciale: SOP vendita, preventivi, contratti, CRM
- Copy/PM: SOP editoriali, checklist contenuti
- Dev: SOP tecniche, checklist deploy, strumenti di sviluppo

Questi elementi NON interferiscono con il flusso di time tracking.

---

## Metriche di efficacia
- % giornate chiuse
- % settimane inviate
- Continuità di compilazione
- Riduzione dati mancanti

---

## Non-scope (esplicito)
- Timer start/stop
- Tassonomie obbligatorie
- Integrazione Asana per reminder
- Analisi di marginalità
- Workflow di approvazione

---

## Output atteso dell’MVP
- Dato affidabile progetto/persona/tempo
- Abitudine quotidiana consolidata
- Base solida per decisioni CEO e successive evoluzioni

Fine canvas.

