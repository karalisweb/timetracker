# KW Time Report - Guida Utente

> Guida completa per collaboratori e amministratori di **KW Time Report**.
> Versione: **1.3.0**

---

## Indice

1. [Accesso](#1-accesso)
2. [Dashboard Giornaliera](#2-dashboard-giornaliera)
3. [Inserimento Ore](#3-inserimento-ore)
4. [Correzione Errori](#4-correzione-errori)
5. [Chiusura Giornata](#5-chiusura-giornata)
6. [Vista Settimanale](#6-vista-settimanale)
7. [Invio Settimanale](#7-invio-settimanale)
8. [Impostazioni Profilo](#8-impostazioni-profilo)
9. [2FA - Autenticazione a Due Fattori](#9-2fa---autenticazione-a-due-fattori)
10. [Pannello Admin](#10-pannello-admin)
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

- **Data corrente** con possibilita di navigare tra i giorni tramite il selettore data
- **Ore registrate**: totale ore inserite per la giornata
- **Target giornaliero**: obiettivo di ore da raggiungere (configurato dall'admin)
- **Barra di progresso**: indica visivamente quanto manca al target
- **Stato giornata**: Aperto / Chiuso Completo / Chiuso Incompleto
- **Lista registrazioni**: tutte le time entry della giornata

### Navigazione tra giorni

Usa il **selettore data** in alto a destra per spostarti a qualsiasi giorno passato.

---

## 3. Inserimento Ore

### Creare una Registrazione

1. Dalla Dashboard, clicca il pulsante **+ Aggiungi**
2. Compila i campi:
   - **Progetto**: seleziona il progetto dal menu a tendina (solo i progetti a te assegnati)
   - **Durata (minuti)**: inserisci il tempo in minuti (es. 60 per 1 ora)
   - **Note** (opzionale): descrivi brevemente l'attivita svolta
3. Clicca **Salva**

### Modificare una Registrazione

1. Clicca l'icona **matita** accanto alla registrazione da modificare
2. Modifica i campi desiderati (progetto, durata, note)
3. Clicca **Salva**

### Eliminare una Registrazione

1. Clicca l'icona **cestino** accanto alla registrazione
2. Conferma l'eliminazione

> **Nota**: Puoi modificare/eliminare le registrazioni solo se la giornata e ancora **aperta**. Se la giornata e chiusa, usa il pulsante **Riapri giornata**.

---

## 4. Correzione Errori

### Ho inserito una registrazione nel giorno sbagliato

Se hai inserito ore nel giorno sbagliato (es. 1 marzo invece di 19 marzo):

1. Vai al giorno dove hai inserito la registrazione per errore
2. Se la giornata e chiusa, clicca **Riapri giornata**
3. Clicca l'icona **matita** sulla registrazione da correggere
4. Nel form di modifica apparira il campo **Data**: cambiala alla data corretta
5. Clicca **Salva**

La registrazione verra spostata automaticamente al giorno corretto.

### Ho sbagliato progetto, durata o note

1. Clicca la **matita** sulla registrazione
2. Modifica il campo errato
3. Clicca **Salva**

---

## 5. Chiusura Giornata

A fine giornata devi chiudere la giornata per confermare le ore inserite.

### Come chiudere

1. Dalla Dashboard, clicca il pulsante **Chiudi giornata**
2. Lo stato cambia automaticamente in base alle ore inserite:
   - **Chiuso Completo**: hai raggiunto il target giornaliero
   - **Chiuso Incompleto**: non hai raggiunto il target

### Cosa succede dopo la chiusura

- Non potrai piu aggiungere o modificare le registrazioni per quella giornata
- Puoi **riaprire** la giornata con il pulsante **Riapri giornata** se necessario
- La giornata apparira nel riepilogo settimanale con il suo stato

---

## 6. Vista Settimanale

La pagina **Settimana** mostra il riepilogo dell'intera settimana lavorativa:

- **Numero settimana** e range di date (es. "Settimana 12 — 16 mar – 22 mar 2026")
- **Riepilogo per giorno**: ogni giorno mostra data (dd/MM), ore registrate e stato
- **Totale settimanale**: somma delle ore della settimana
- **Giornate chiuse**: quante giornate lavorative sono state chiuse
- **Registrazioni**: numero totale di time entry nella settimana

### Navigazione tra settimane

Usa le **frecce sinistra/destra** per spostarti tra le settimane.

### Vai al dettaglio di un giorno

Clicca su una **card giorno** nella griglia settimanale per aprire la Dashboard di quel giorno. Da li puoi vedere le registrazioni e modificarle.

---

## 7. Invio Settimanale

Alla fine della settimana lavorativa, devi inviare il riepilogo settimanale.

### Come inviare

1. Vai nella pagina **Settimana**
2. Naviga alla settimana da inviare
3. Verifica che tutte le giornate siano chiuse
4. Clicca il pulsante **Invia settimana**
5. Controlla il riepilogo nel modal e clicca **Conferma invio**

> **Nota**: L'invio settimanale e irreversibile. Assicurati che tutte le ore siano corrette prima di inviare.

---

## 8. Impostazioni Profilo

Dalla pagina **Profilo** (accessibile dalla sidebar o dal menu mobile) puoi:

- Visualizzare le tue informazioni personali (nome, email, ruolo)
- Modificare il tuo profilo
- Attivare/disattivare la **2FA** (vedi sezione dedicata)
- Visualizzare i tuoi giorni lavorativi e orari configurati

---

## 9. 2FA - Autenticazione a Due Fattori

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

## 10. Pannello Admin

> Visibile solo agli utenti con ruolo **Admin**.

### Gestione Utenti

**Percorso**: Sidebar > Amministrazione > **Utenti**

- **Crea utente**: definisci nome, email, password, ruolo (admin/pm/senior/executor)
- **Configura orari**: imposta giorni lavorativi, orario inizio/fine, target giornaliero in minuti
- **Configura reminder**: scegli il canale di notifica (Slack, Email o entrambi)
- **Modifica/Elimina** utenti esistenti

### Gestione Progetti

**Percorso**: Sidebar > Amministrazione > **Progetti**

- **Crea progetto**: nome e codice
- **Assegna utenti**: seleziona quali utenti possono registrare ore su quel progetto
- **Modifica/Archivia** progetti

### Dashboard Compliance

**Percorso**: Sidebar > Amministrazione > **Compliance**

La dashboard compliance mostra una panoramica della situazione di tutti i collaboratori:

- **Lista utenti** con stato compliance (giornate chiuse, settimane inviate)
- **Vista dettaglio**: clicca su un utente per vedere il suo time report dettagliato
- **Export CSV**: esporta i dati timesheet per uso esterno

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
| Dashboard Compliance | No | No | No | Si |
| Gestione utenti | No | No | No | Si |
| Gestione progetti | No | No | No | Si |
| Export CSV | No | No | No | Si |

---

## Navigazione

### Desktop
- **Sidebar sinistra** con sezioni TIME TRACKING e AMMINISTRAZIONE (solo admin)
- Le voci visibili dipendono dal tuo ruolo

### Mobile
- **Bottom bar** con le voci principali (Oggi, Settimana, Menu)
- **Menu hamburger** per accedere a opzioni aggiuntive (Admin, Profilo, Logout)

---

## Supporto

Per problemi tecnici o richieste di supporto, contatta l'amministratore di sistema o il team Karalisweb.

---

*Ultimo aggiornamento: 2026-03-21*
