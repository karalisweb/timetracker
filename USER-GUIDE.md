# KW Time Report - Guida Utente

> Guida completa per collaboratori e amministratori di **KW Time Report**.
> Versione: **1.1.0**

---

## Indice

1. [Accesso](#1-accesso)
2. [Dashboard Giornaliera](#2-dashboard-giornaliera)
3. [Inserimento Ore](#3-inserimento-ore)
4. [Chiusura Giornata](#4-chiusura-giornata)
5. [Vista Settimanale](#5-vista-settimanale)
6. [Invio Settimanale](#6-invio-settimanale)
7. [Impostazioni Profilo](#7-impostazioni-profilo)
8. [2FA - Autenticazione a Due Fattori](#8-2fa---autenticazione-a-due-fattori)
9. [Pannello Admin](#9-pannello-admin)
10. [Project Orchestration](#10-project-orchestration)
11. [Reminder Automatici](#11-reminder-automatici)

---

## 1. Accesso

### Login

1. Vai su **https://timereport.karalisdemo.it**
2. Inserisci **email** e **password**
3. Clicca **Accedi**

### Login con 2FA

Se hai attivato la verifica in due passaggi:

1. Dopo aver inserito email e password, riceverai un **codice OTP a 6 cifre** via email
2. Inserisci il codice nella schermata di verifica
3. Il codice scade dopo pochi minuti; puoi richiederne uno nuovo se necessario

### Password Dimenticata

1. Dalla pagina di login, clicca **Password dimenticata?**
2. Inserisci la tua email aziendale
3. Riceverai un link per reimpostare la password
4. Clicca il link e scegli una nuova password

---

## 2. Dashboard Giornaliera

La pagina **Oggi** e la vista principale dell'app. Mostra:

- **Data corrente** con possibilita di navigare tra i giorni
- **Ore registrate**: totale ore inserite per la giornata
- **Target giornaliero**: obiettivo di ore da raggiungere (configurato dall'admin)
- **Stato giornata**: Aperto / Chiuso Completo / Chiuso Incompleto
- **Lista time entry**: tutte le registrazioni della giornata

### Navigazione tra giorni

Usa le frecce **sinistra/destra** per spostarti tra i giorni e visualizzare lo storico.

---

## 3. Inserimento Ore

### Creare una Time Entry

1. Dalla Dashboard, clicca il pulsante **+ Aggiungi**
2. Compila i campi:
   - **Progetto**: seleziona il progetto dal menu a tendina (solo i progetti a te assegnati)
   - **Durata**: inserisci il tempo in ore e minuti
   - **Note** (opzionale): descrivi brevemente l'attivita svolta
3. Clicca **Salva**

### Modificare una Time Entry

1. Clicca sull'entry che vuoi modificare
2. Modifica i campi desiderati
3. Clicca **Salva**

### Eliminare una Time Entry

1. Clicca sull'icona **cestino** accanto all'entry
2. Conferma l'eliminazione

> **Nota**: Puoi modificare/eliminare le entry solo se la giornata e ancora **aperta**.

---

## 4. Chiusura Giornata

A fine giornata devi chiudere la giornata per confermare le ore inserite.

### Come chiudere

1. Dalla Dashboard, clicca il pulsante **Chiudi giornata**
2. Lo stato cambia automaticamente in base alle ore inserite:
   - **Chiuso Completo**: hai raggiunto il target giornaliero
   - **Chiuso Incompleto**: non hai raggiunto il target

### Cosa succede dopo la chiusura

- Non potrai piu aggiungere o modificare le time entry per quella giornata
- La giornata apparira nel riepilogo settimanale con il suo stato

---

## 5. Vista Settimanale

La pagina **Settimana** mostra il riepilogo dell'intera settimana lavorativa:

- **Riepilogo per giorno**: ore registrate, target e stato per ogni giorno
- **Totale settimanale**: somma delle ore della settimana
- **Target settimanale**: obiettivo calcolato in base ai giorni lavorativi configurati
- **Stato per giorno**: badge colorati (verde = completo, giallo = incompleto, blu = aperto)

### Navigazione tra settimane

Usa le frecce per spostarti tra le settimane e visualizzare lo storico.

---

## 6. Invio Settimanale

Alla fine della settimana lavorativa, devi inviare il riepilogo settimanale.

### Come inviare

1. Vai nella pagina **Settimana**
2. Verifica che tutte le giornate siano chiuse
3. Clicca il pulsante **Invia settimana**
4. Il riepilogo viene registrato e sara visibile nella dashboard compliance dell'admin

> **Nota**: L'invio settimanale e irreversibile. Assicurati che tutte le ore siano corrette prima di inviare.

---

## 7. Impostazioni Profilo

Dalla pagina **Profilo** (accessibile dalla sidebar o dal menu mobile) puoi:

- Visualizzare le tue informazioni personali (nome, email, ruolo)
- Modificare il tuo profilo
- Attivare/disattivare la **2FA** (vedi sezione dedicata)
- Visualizzare i tuoi giorni lavorativi e orari configurati

---

## 8. 2FA - Autenticazione a Due Fattori

La 2FA aggiunge un livello di sicurezza extra al tuo account.

### Attivare la 2FA

1. Vai in **Profilo / Impostazioni**
2. Nella sezione sicurezza, attiva il toggle **Verifica in due passaggi**
3. Da questo momento, ad ogni login riceverai un codice OTP via email

### Disattivare la 2FA

1. Vai in **Profilo / Impostazioni**
2. Disattiva il toggle **Verifica in due passaggi**
3. La 2FA viene disabilitata immediatamente

---

## 9. Pannello Admin

> Visibile solo agli utenti con ruolo **Admin**.

### Gestione Utenti

**Percorso**: Sidebar > Impostazioni > **Utenti**

- **Crea utente**: definisci nome, email, password, ruolo (admin/pm/senior/executor)
- **Configura orari**: imposta giorni lavorativi, orario inizio/fine, target giornaliero in minuti
- **Configura reminder**: scegli il canale di notifica (Slack, Email o entrambi)
- **Modifica/Elimina** utenti esistenti

### Gestione Progetti

**Percorso**: Sidebar > Impostazioni > **Progetti**

- **Crea progetto**: nome e descrizione
- **Assegna utenti**: seleziona quali utenti possono registrare ore su quel progetto
- **Modifica/Archivia** progetti

### Dashboard Compliance

**Percorso**: Sidebar > Orchestration > **Compliance**

La dashboard compliance mostra una panoramica della situazione di tutti i collaboratori:

- **Lista utenti** con stato compliance (giornate chiuse, settimane inviate)
- **Vista dettaglio**: clicca su un utente per vedere il suo time report dettagliato
- **Filtri**: per periodo, stato, utente
- **Export CSV**: esporta i dati timesheet per uso esterno

### Configurazione Asana

**Percorso**: Sidebar > Impostazioni > **Asana**

- Configura il token di accesso Asana
- Imposta workspace e progetto predefinito
- Configura i campi personalizzati per la sincronizzazione
- Testa la connessione

---

## 10. Project Orchestration

> Visibile a utenti con ruolo **Admin**, **PM** o **Senior**.

Il modulo Orchestration gestisce il ciclo di vita dei progetti web con checklist, gate e task.

### Creare un Progetto

**Percorso**: Sidebar > Orchestration > **Workflow**

1. Clicca **Nuovo Progetto**
2. Compila i dati del progetto
3. Scegli tra:
   - **Creazione manuale**: configura checklist e task manualmente
   - **Creazione con AI**: l'intelligenza artificiale genera automaticamente la struttura del progetto basandosi sulla descrizione

### Checklist

Ogni progetto puo avere piu checklist organizzate per categoria:
- **SEO**: ottimizzazione per i motori di ricerca
- **Technical**: aspetti tecnici
- **Privacy**: conformita privacy e GDPR
- **Performance**: ottimizzazione prestazioni
- **Backend**: configurazioni lato server
- **Other**: altro

### Gate

I progetti hanno 2 gate (checkpoint) principali:
1. **Published**: il progetto e online/pubblicato
2. **Delivered**: il progetto e consegnato al cliente

Ogni gate ha dei requisiti che devono essere soddisfatti prima di poter procedere.

### Integrazione Asana

I task di esecuzione possono essere sincronizzati con Asana:
- I task vengono creati automaticamente come task Asana
- I webhook mantengono sincronizzato lo stato tra le due piattaforme
- Le modifiche su Asana vengono riflesse automaticamente in Time Report

---

## 11. Reminder Automatici

Il sistema invia reminder automatici per aiutarti a tenere traccia delle ore:

### Tipi di Reminder

| Tipo | Quando | Messaggio |
|------|--------|-----------|
| **Soft** | Durante l'orario di lavoro | Hai registrato X ore su Y target. Ricordati di compilare il timesheet! |
| **Hard** | Fine giornata lavorativa | La giornata non e stata chiusa. Chiudi la giornata per completare il timesheet. |
| **Weekly** | Lunedi mattina | La settimana precedente non e stata inviata. Invia il riepilogo settimanale. |

### Canali di Notifica

In base alla configurazione del tuo profilo, i reminder vengono inviati via:
- **Slack**: messaggio diretto sul canale configurato
- **Email**: email all'indirizzo del tuo account
- **Entrambi**: sia Slack che Email

> **Nota**: I reminder rispettano un periodo di grazia configurato dall'admin (default: 30 minuti) per evitare notifiche troppo frequenti.

---

## Ruoli e Permessi

| Funzionalita | Executor | Senior | PM | Admin |
|--------------|----------|--------|-----|-------|
| Inserimento ore | Si | Si | Si | Si |
| Chiusura giornata | Si | Si | Si | Si |
| Invio settimanale | Si | Si | Si | Si |
| Vista Orchestration | No | Si | Si | Si |
| Gestione progetti Orch. | No | No | Si | Si |
| Dashboard Compliance | No | No | No | Si |
| Gestione utenti | No | No | No | Si |
| Gestione progetti | No | No | No | Si |
| Configurazione Asana | No | No | No | Si |

---

## Navigazione

### Desktop
- **Sidebar sinistra** con tutte le voci di navigazione organizzate per sezione
- Le voci visibili dipendono dal tuo ruolo

### Mobile
- **Bottom bar** con le voci principali (Oggi, Settimana, Workflow, Compliance)
- **Menu hamburger** per accedere a opzioni aggiuntive (Admin, Profilo, Logout)

---

## Supporto

Per problemi tecnici o richieste di supporto, contatta l'amministratore di sistema o il team Karalisweb.

---

*Ultimo aggiornamento: 2026-02-16*
