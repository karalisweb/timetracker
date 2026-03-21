# Changelog

Tutte le modifiche rilevanti al progetto **KW Time Report** sono documentate in questo file.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it-IT/1.1.0/) e il progetto aderisce al [Semantic Versioning](https://semver.org/lang/it/).

---

## [1.3.1] - 2026-03-21

### Aggiunto
- **Reminder giorno precedente**: cron job (9:30 lun-ven) che invia sollecito via Slack/Email se il giorno precedente non e stato chiuso
- **Notifiche admin**: cron job (10:00 lun-ven) che invia riepilogo compliance agli admin (giornate non chiuse, settimane non inviate)
- **Banner notifiche in-app**: all'apertura dell'app mostra avvisi se il giorno precedente non e stato chiuso o la settimana precedente non e stata inviata; per admin mostra anche gli utenti non in regola
- **Select progetto ricercabile**: il dropdown progetto nel form time entry e ora ricercabile con filtro testuale (SearchableSelect)
- **API `GET /notifications/pending`**: endpoint per ottenere le notifiche pendenti dell'utente corrente
- **Trigger admin per reminder**: endpoint `POST /admin/reminders/trigger/previous-day` e `trigger/admin-notifications`

---

## [1.3.0] - 2026-03-21

### Aggiunto
- **Modifica data entry**: il form di modifica ora include un campo data per spostare una registrazione da un giorno all'altro
- **Navigazione settimana → giorno**: cliccando una card giorno nella vista settimanale si apre la Dashboard di quel giorno
- **CLAUDE.md**: mappa del codice per orientarsi velocemente nel progetto
- **Test unitari**: 16 test per i calcoli date in WeeklyService (Jest + ts-jest)
- **Test E2E**: test di protezione auth per tutti gli endpoint API (supertest)
- **Feedback errori invio settimana**: il modal mostra un messaggio di errore in caso di fallimento

### Corretto
- **Bug calcolo settimane**: riscritto `getWeekStart` usando aritmetica millisecondi invece di `setDate` — risolve il bug al cambio mese (fine febbraio → marzo)
- **Bug timezone date**: `new Date("YYYY-MM-DD")` creava UTC midnight che in CET spostava la data di un giorno. Introdotto `parseLocalDate()` e `formatDateStr()` per evitare conversioni UTC
- **Bug invio settimane passate**: il parsing timezone causava mismatch tra weekStart di `getCurrentWeekStatus` e `submitWeek`, impedendo l'invio

### Migliorato
- **Vista settimanale**: titolo con numero settimana e range date (non piu "settimana passata"), giorni mostrano dd/MM, label in italiano
- **Calcolo `isCurrentWeek`**: usa `startOfISOWeek` di date-fns invece di calcolo manuale

### Rimosso
- **Modulo Orchestration** (backend + frontend): progetti, checklist, gate, template — spostato in app separata
- **Modulo Asana** (backend + frontend): client, webhook, task sync, pagina config
- **Modulo AI** (backend): generazione task OpenAI
- **Modulo Config Panel** (backend): configurazione Asana criptata
- **OrchestrationGuard** e relativi riferimenti in auth, routing, navigazione
- **Modelli Prisma**: OrchProject, ChecklistTemplate, ChecklistInstance, ChecklistItemTemplate, ExecutionTask, Gate, GateRequirement, AsanaWebhookEvent, AppConfig
- **Campo `asanaUserId`** da User (schema, DTO, service)
- **docs/orchestration/**: 12 file di documentazione tecnica
- **specifiche_tecniche_app_orchestratore_progetti_asana.md**

---

## [1.2.0] - 2026-02-23

### Aggiornato
- feat: migliorie UI/UX - Space Grotesk, componenti riutilizzabili, refactoring Tailwind, animazioni, accessibilita

## [1.1.0] - 2026-02-16

### Aggiornato
- Documentazione completa: CHANGELOG.md, README.md aggiornato, USER-GUIDE.md creato
- Versione allineata a 1.1.0 su frontend, backend, deploy.sh e DEPLOY.md
- `deploy.sh`: cambiato `npm install --production` in `npm install` per includere devDependencies necessarie a Prisma e build

---

## [1.0.0] - 2026-02-08

### Aggiunto
- **Design System Karalisweb v2.2**: redesign completo dell'interfaccia con dark theme, palette brand (oro/teal), tipografia Space Grotesk
- **DEPLOY.md**: guida completa al deploy con script automatizzato a 8 step
- **DESIGN-SYSTEM.md**: documentazione del design system con token, componenti e pattern
- **deploy.sh**: script di deploy automatizzato con versioning semantico integrato
- Allineamento Login e Sidebar al Design System Karalisweb
- Favicon SVG con icona Clock, titolo pagina "KW - Time Report"

### Migliorato
- **Sistema 2FA**: semplificato con toggle one-click (stile GADS Audit), senza richiesta password per disabilitare
- Rimozione import inutilizzati (AlertCircle) per pulizia codice

---

## [0.4.0] - 2026-01-22

### Aggiunto
- **Autenticazione 2FA via email OTP**: sistema completo di verifica in due passaggi
  - Modulo `otp/` backend con generazione e validazione codici OTP a 6 cifre
  - Invio OTP via email SMTP
  - Integrazione nel flusso di login (richiesta OTP dopo credenziali valide)
  - Pagina di verifica OTP nel frontend con input monospace
  - Toggle 2FA nelle impostazioni utente

### Migliorato
- Redesign UI con Karalisweb Design System v2.2 (prima iterazione)

---

## [0.3.0] - 2026-01-21

### Aggiunto
- **Dashboard Compliance Admin**: vista dettaglio time report per singolo utente
- **Endpoint reminder admin**: gestione reminder da pannello amministratore
- **Slack test endpoint**: invio messaggi di test reali su Slack
- Visibilita di tutti gli utenti (inclusi admin) nella dashboard compliance

### Corretto
- Errori TypeScript nel frontend
- Warning variabili inutilizzate
- `UpdateUserDto`: campo `role` cambiato in array `roles` per supporto ruoli multipli

---

## [0.2.0] - 2026-01-16

### Aggiunto
- **Favicon** personalizzato
- **Responsive mobile**: fix layout per dispositivi mobili
- **Password reset**: funzionalita di recupero password via email
- **Dark theme**: correzioni per tema scuro
- **Pagina Settings**: impostazioni utente
- URL repository GitHub nella configurazione server
- Configurazione deploy iniziale e documentazione server
- **README.md** con setup locale, variabili d'ambiente e istruzioni deploy

### Corretto
- Titolo pagina corretto in "Time Report"

---

## [0.1.0] - 2026-01-16

### Aggiunto
- **Initial commit**: Time Report MVP completo
- **Backend NestJS 11** con:
  - Autenticazione JWT (login, registrazione, guard)
  - Modulo `time-entries/`: CRUD time entry con durata, progetto e note
  - Modulo `day-status/`: gestione stato giornata (aperto/chiuso completo/incompleto)
  - Modulo `weekly/`: submission settimanale con riepilogo
  - Modulo `projects/`: CRUD progetti con assegnazioni utenti
  - Modulo `users/`: gestione utenti con configurazione orari e target
  - Modulo `admin/`: dashboard admin con CRUD utenti e assegnazioni
  - Modulo `reminder/`: reminder automatici (soft, hard, weekly) via Slack ed email
  - Prisma ORM con PostgreSQL
- **Frontend React 19 + Vite + Tailwind CSS** con:
  - Pagina Dashboard (vista giornaliera con totale/target/stato)
  - Pagina Week (vista settimanale con riepilogo)
  - Pagina Login
  - Pagine Admin: Compliance, Projects, Users
  - AuthContext con JWT
  - Servizio API centralizzato
  - Layout responsive con Sidebar (desktop) e BottomNav (mobile)
- **Database PostgreSQL** con 18 modelli Prisma e 8 enum

---

*Ultimo aggiornamento: 2026-03-21*
