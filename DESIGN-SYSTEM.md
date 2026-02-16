# Karalisweb Design System - Time Report

> Guida di riferimento per la grafica di **KW Time Report**.
> Basato sul **Karalisweb Design System v2.2**.

---

## 1. Tema Generale

**Dark theme** con sfondo navy/blu scuro, accenti oro/arancione e tipografia moderna.

L'interfaccia trasmette un senso di **professionalita**, **pulizia** e **modernita**, con ampio uso di whitespace e contrasto elevato tra sfondi scuri e testo chiaro.

**Stack tecnologico UI**: React 19 + Tailwind CSS 3.4 + Lucide React.

---

## 2. Palette Colori

### 2.1 Sfondi

| Token                | Hex / Tailwind       | Uso                                      |
|----------------------|----------------------|------------------------------------------|
| `--bg-primary`       | `#0d1521` / `dark-950` | Sfondo principale dell'app              |
| `--bg-secondary`     | `#132032` / `dark-900` | Card, sidebar, header, modali           |
| `--bg-tertiary`      | `#1a2d44` / `dark-800` | Input, elementi annidati, item di lista |
| `--bg-hover`         | `#234058` / `dark-700` | Stato hover su elementi interattivi     |

### 2.2 Accenti (Brand Karalisweb)

| Token                      | Hex         | Tailwind           | Uso                                    |
|----------------------------|-------------|--------------------|-----------------------------------------|
| `--accent-primary`         | `#d4a726`   | `brand-orange`     | Colore brand principale (oro/giallo)   |
| `--accent-primary-hover`   | `#e6b82e`   | --                 | Hover sull'accento primario            |
| `--accent-secondary`       | `#2d7d9a`   | `brand-teal`       | Badge, accenti secondari (blu/teal)    |
| `--accent-tertiary`        | `#1e5c7a`   | `brand-teal-dark`  | Accenti blu scuro                      |

### 2.3 Testo

| Token              | Hex         | Tailwind       | Uso                                        |
|--------------------|-------------|----------------|--------------------------------------------|
| `--text-primary`   | `#f5f5f7`   | `dark-50`      | Testo principale (titoli, contenuti)       |
| `--text-secondary` | `#a1a1aa`   | `dark-400`     | Testo secondario (meta info, descrizioni)  |
| `--text-muted`     | `#71717a`   | `dark-500`     | Testo meno importante (hint, placeholder)  |

### 2.4 Bordi

| Token              | Hex         | Tailwind       | Uso                       |
|--------------------|-------------|----------------|---------------------------|
| `--border-color`   | `#2a2a35`   | `dark-700`     | Bordo standard            |
| `--border-hover`   | `#3a3a45`   | `dark-600`     | Bordo hover (piu chiaro)  |

### 2.5 Colori di Stato

| Token         | Hex         | Tailwind       | Uso           |
|---------------|-------------|----------------|---------------|
| `--success`   | `#22c55e`   | `green-500`    | Successo      |
| `--warning`   | `#eab308`   | `yellow-500`   | Attenzione    |
| `--error`     | `#ef4444`   | `red-500`      | Errore        |
| `--info`      | `#3b82f6`   | `blue-500`     | Informativo   |

### 2.6 Colori Specifici Time Report

| Elemento                     | Colore      | Uso                              |
|------------------------------|-------------|----------------------------------|
| Icona Oggi (Clock)           | `#60a5fa`   | Navigazione - time tracking      |
| Icona Settimana (Calendar)   | `#4ade80`   | Navigazione - vista settimanale  |
| Icona Workflow               | `#34d399`   | Navigazione - orchestrazione     |
| Icona Compliance             | `#a78bfa`   | Navigazione - compliance         |
| Icona Progetti               | `#22d3ee`   | Navigazione - gestione progetti  |
| Icona Utenti                 | `#fb923c`   | Navigazione - gestione utenti    |
| Icona Asana                  | `#f472b6`   | Navigazione - integrazione Asana |

---

## 3. Tipografia

### 3.1 Font

| Ruolo         | Font             | Pesi disponibili     | Importazione |
|---------------|------------------|----------------------|--------------|
| **UI/Testo**  | Space Grotesk    | 300, 400, 500, 600, 700 | Google Fonts |
| **Codice/Dati** | JetBrains Mono | 400, 500             | Google Fonts |

```
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

### 3.2 Font Stack

```css
font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
```

> **Nota**: L'app attualmente usa `Inter`. Va migrata a `Space Grotesk` per uniformita con il Design System Karalisweb.

### 3.3 Impostazioni Base

| Proprieta                 | Valore   |
|---------------------------|----------|
| Font size base            | `16px`   |
| Line height               | `1.6`    |
| -webkit-font-smoothing    | `antialiased` |
| -moz-osx-font-smoothing   | `grayscale`   |

### 3.4 Scala Tipografica Standard

La scala di riferimento e basata su quella di Tailwind CSS.

#### Scala Base

| Nome token     | Dimensione  | Equivalente Tailwind | Line Height |
|----------------|-------------|----------------------|-------------|
| `--text-xs`    | `0.75rem` (12px)  | `text-xs`      | 1rem (16px) |
| `--text-sm`    | `0.875rem` (14px) | `text-sm`      | 1.25rem (20px) |
| `--text-base`  | `1rem` (16px)     | `text-base`    | 1.5rem (24px) |
| `--text-lg`    | `1.125rem` (18px) | `text-lg`      | 1.75rem (28px) |
| `--text-xl`    | `1.25rem` (20px)  | `text-xl`      | 1.75rem (28px) |
| `--text-2xl`   | `1.5rem` (24px)   | `text-2xl`     | 2rem (32px) |
| `--text-3xl`   | `1.875rem` (30px) | `text-3xl`     | 2.25rem (36px) |
| `--text-4xl`   | `2.25rem` (36px)  | `text-4xl`     | 2.5rem (40px) |

#### Mappatura sui Componenti

| Elemento             | Scala      | Dimensione  | Font Weight | Note                               |
|----------------------|------------|-------------|-------------|-------------------------------------|
| h1 / Titolo pagina   | `text-2xl` | 24px        | 600         | --                                  |
| h1 Login             | `text-3xl` | 30px        | 600         | Colore brand-teal                   |
| Card title / h2-h3   | `text-lg`  | 18px        | 600         | --                                  |
| h4 / Sezione         | `text-base`| 16px        | 500-600     | --                                  |
| Body text             | `text-sm`  | 14px        | 400         | Colore `text-dark-50`               |
| Testo secondario      | `text-sm`  | 14px        | 400         | Colore `text-dark-400`              |
| Label form            | `text-sm`  | 14px        | 500         | Colore `text-dark-400`              |
| Tab button            | `text-sm`  | 14px        | 500         | --                                  |
| Nav item              | `text-sm`  | 14px        | 400-500     | --                                  |
| Badge                 | `text-xs`  | 12px        | 500         | --                                  |
| Section title nav     | `text-xs`  | 12px        | 600         | UPPERCASE, letter-spacing 0.05em    |
| Hint / Meta           | `text-xs`  | 12px        | 400         | Colore `text-dark-500`              |
| Stat value (grande)   | `text-3xl` | 30px        | 600         | Colore `brand-orange`               |

---

## 4. Spacing & Layout

### 4.1 Design Tokens

| Token               | Valore   | Tailwind       |
|----------------------|----------|----------------|
| `--sidebar-width`    | `224px`  | `w-56`         |
| `--header-height`    | `64px`   | `h-16`         |
| `--radius-sm`        | `6px`    | `rounded-md`   |
| `--radius-md`        | `8px`    | `rounded-lg`   |
| `--radius-lg`        | `12px`   | `rounded-xl`   |

### 4.2 Ombre

| Token           | Valore                             | Tailwind        |
|-----------------|------------------------------------|-----------------|
| `--shadow-sm`   | `0 2px 4px rgba(0, 0, 0, 0.3)`    | `shadow-sm`     |
| `--shadow-md`   | `0 4px 12px rgba(0, 0, 0, 0.4)`   | `shadow-md`     |
| `--shadow-lg`   | `0 8px 24px rgba(0, 0, 0, 0.5)`   | `shadow-lg`     |

### 4.3 Layout Principale

```
+------------------+---------------------------------------------+
|                  |              HEADER (64px, solo mobile)      |
|    SIDEBAR       +---------------------------------------------+
|    (w-56)        |                                             |
|                  |           MAIN CONTENT                      |
|   - Logo TR      |           padding: 2rem                     |
|   - Navigazione  |                                             |
|   - Footer       |                                             |
+------------------+---------------------------------------------+
```

**Desktop**:
- **Sidebar**: fissa a sinistra, larghezza `w-56` (224px), altezza 100vh, background `bg-dark-850`
- **Header**: nascosto su desktop
- **Contenuto**: margin-left `ml-56`, padding `p-6`

**Mobile**:
- **Sidebar**: nascosta, sostituita da header + bottom nav
- **Header**: fisso in alto, altezza `h-16`, background `bg-dark-850`
- **Bottom Nav**: fisso in basso, 4-5 item con icone
- **Slide-over menu**: scorre da destra per opzioni aggiuntive

---

## 5. Componenti

### 5.1 Bottoni

#### Variante Primary (Gradient)

```html
<button class="bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end
               hover:from-brand-gradient-hover-start hover:to-brand-gradient-hover-end
               text-white font-medium py-2.5 px-6 rounded-full
               transition-all duration-200 shadow-lg hover:shadow-xl">
    Azione Primaria
</button>
```

| Proprieta | Valore |
|-----------|--------|
| Gradient start | `#fb923c` (orange-400) |
| Gradient end | `#f97316` (orange-500) |
| Hover start | `#f97316` |
| Hover end | `#ea580c` |
| Border radius | `rounded-full` |
| Font weight | 500 |

#### Variante Secondary

```html
<button class="bg-dark-700 border border-dark-600 text-dark-50
               hover:bg-dark-600 hover:border-dark-500
               font-medium py-2 px-4 rounded-lg transition-all duration-200">
    Azione Secondaria
</button>
```

#### Variante Danger

```html
<button class="bg-red-500/10 text-red-400 hover:bg-red-500/20
               font-medium py-2 px-4 rounded-lg transition-all duration-200">
    Elimina
</button>
```

#### Variante Link

```html
<button class="text-brand-orange hover:text-brand-orange-dark
               font-medium transition-colors">
    Link Azione
</button>
```

#### Stato Disabled

```html
<button class="opacity-50 cursor-not-allowed" disabled>
    Disabilitato
</button>
```

### 5.2 Card

```html
<div class="bg-dark-900 border border-dark-700 rounded-xl p-6
            hover:border-dark-600 transition-colors">
    <!-- Contenuto -->
</div>
```

#### Struttura

```
+------------------------------------------+
|  CARD HEADER (flex, justify-between)     |
|  [Titolo text-lg font-semibold]  [Badge] |
+------------------------------------------+
|  CARD BODY                               |
|  Contenuto (text-dark-400)               |
+------------------------------------------+
|  CARD FOOTER (border-t border-dark-700)  |
|  [Info]  [Info]  [Azioni]                |
+------------------------------------------+
```

### 5.3 Stat Card

```html
<div class="bg-dark-900 border border-dark-700 rounded-xl p-5">
    <p class="text-dark-400 text-sm">Label</p>
    <p class="text-3xl font-semibold text-brand-orange mt-1">42</p>
</div>
```

### 5.4 Form

#### Input

```html
<input class="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg
              text-white placeholder-dark-500
              focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange
              transition-all duration-200" />
```

#### Label

```html
<label class="block text-sm font-medium text-dark-400 mb-2">
    Nome campo
</label>
```

#### Select

```html
<select class="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg
               text-white appearance-none
               focus:outline-none focus:ring-2 focus:ring-brand-orange/50">
    <option>Opzione</option>
</select>
```

### 5.5 Badge

```html
<!-- Stato attivo -->
<span class="px-2.5 py-1 rounded-md text-xs font-medium
             bg-green-500/15 text-green-400">
    Attivo
</span>

<!-- Stato pending -->
<span class="px-2.5 py-1 rounded-md text-xs font-medium
             bg-yellow-500/15 text-yellow-400">
    In attesa
</span>

<!-- Stato errore -->
<span class="px-2.5 py-1 rounded-md text-xs font-medium
             bg-red-500/15 text-red-400">
    Errore
</span>
```

**Principio**: background al 15% di opacita del colore del testo.

#### Badge Ruoli Time Report

| Ruolo     | Background              | Testo          |
|-----------|-------------------------|----------------|
| Admin     | `bg-red-500/15`         | `text-red-400` |
| PM        | `bg-blue-500/15`        | `text-blue-400` |
| Senior    | `bg-purple-500/15`      | `text-purple-400` |
| Executor  | `bg-green-500/15`       | `text-green-400` |

#### Badge Status Giorno

| Stato              | Background              | Testo            |
|--------------------|-------------------------|------------------|
| Aperto             | `bg-blue-500/15`        | `text-blue-400`  |
| Chiuso completo    | `bg-green-500/15`       | `text-green-400` |
| Chiuso incompleto  | `bg-yellow-500/15`      | `text-yellow-400`|

### 5.6 Modal

#### Overlay

```html
<div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
```

#### Modal Box

```html
<div class="bg-dark-900 border border-dark-700 rounded-xl
            w-full max-w-lg max-h-[90vh] overflow-y-auto">
    <!-- Header -->
    <div class="flex items-center justify-between p-5 border-b border-dark-700">
        <h3 class="text-lg font-semibold text-white">Titolo</h3>
        <button><X size={20} /></button>
    </div>
    <!-- Body -->
    <div class="p-5">
        <!-- Contenuto -->
    </div>
    <!-- Footer -->
    <div class="flex justify-end gap-3 p-5 border-t border-dark-700">
        <button>Annulla</button>
        <button>Conferma</button>
    </div>
</div>
```

### 5.7 Toast / Notifiche

```html
<div class="fixed bottom-6 right-6 z-[2000]">
    <div class="bg-dark-800 border border-dark-700 rounded-lg p-4
                min-w-[300px] shadow-lg border-l-[3px]
                animate-slideIn">
        <!-- Contenuto toast -->
    </div>
</div>
```

| Tipo        | Border-left            |
|-------------|------------------------|
| Successo    | `border-l-green-500`   |
| Errore      | `border-l-red-500`     |
| Warning     | `border-l-yellow-500`  |
| Info        | `border-l-blue-500`    |

### 5.8 Loading / Spinner

```html
<div class="flex items-center justify-center">
    <Loader2 class="w-8 h-8 text-brand-orange animate-spin" />
</div>
```

---

## 6. Pagine Standard

### 6.1 Login

La pagina di login segue lo standard Karalisweb, adattata per Time Report.

```
+------------------------------------------+
|                                          |
|          [Logo KW negativo]              |
|                                          |
|          Time Report                     |
|          Gestione ore e presenze         |
|                                          |
|   Email                                 |
|   [________________________]             |
|                                          |
|   Password                              |
|   [________________________]             |
|                                          |
|   [====== Accedi ========]              |
|                                          |
|       Password dimenticata?              |
|                                          |
|     Karalisweb - Time Report vX.Y.Z     |
+------------------------------------------+
```

**Container pagina**:
```html
<div class="min-h-screen flex items-center justify-center bg-dark-950 p-8">
```

**Box login**:
```html
<div class="bg-dark-900 border border-dark-700 rounded-xl p-8
            w-full max-w-md shadow-lg">
```

**Logo**: Logo negativo KW, max-width 180px, centrato, mb-8

**Titolo app**:
```html
<h1 class="text-2xl font-semibold text-brand-teal text-center">
    Time Report
</h1>
```

**Sottotitolo**:
```html
<p class="text-dark-400 text-sm text-center mt-2">
    Gestione ore e presenze
</p>
```

**Bottone Accedi**: gradiente `gradient-brand`, `w-full`, `rounded-full`

**Link "Password dimenticata?"**:
```html
<a class="text-brand-orange text-sm hover:text-brand-orange-dark">
    Password dimenticata?
</a>
```

### 6.2 Verifica 2FA (OTP)

Stessa struttura della login, con:
- Icona Shield al posto del logo
- Titolo "Verifica in due passaggi"
- Input OTP a 6 cifre (font monospace, tracking wide)
- Info box con sfondo `bg-brand-orange/10`
- Link "Torna al login" con ArrowLeft

---

## 7. Navigazione

### 7.1 Sidebar (Desktop)

```html
<aside class="fixed left-0 top-0 w-56 h-screen bg-dark-850
              border-r border-dark-700 flex flex-col z-30">
```

La sidebar e divisa in **3 zone verticali**:

```
+------------------------------------------+
|  ZONA 1 - HEADER APP                    |
|  [TR] Time Report          v1.0.0       |
+------------------------------------------+
|  ZONA 2 - NAVIGAZIONE PRINCIPALE        |
|  TIME TRACKING                           |
|    Oggi | Settimana                      |
|  ORCHESTRATION (se abilitato)            |
|    Workflow | Compliance                 |
|  IMPOSTAZIONI (solo admin)               |
|    Progetti | Utenti | Asana            |
+------------------------------------------+
|  ZONA 3 - FOOTER FISSO                  |
|  Profilo | Esci                          |
+------------------------------------------+
```

#### Zona 1 - Header App

```html
<div class="p-5 border-b border-dark-700 flex items-center gap-3">
    <!-- Icona app -->
    <div class="w-10 h-10 bg-dark-950 rounded-lg flex items-center justify-center">
        <Clock class="w-5 h-5 text-brand-orange" />
    </div>
    <!-- Testo -->
    <div>
        <span class="text-sm font-semibold text-dark-50">KW Time Report</span>
        <span class="text-xs text-dark-500 block">v1.1.0</span>
    </div>
</div>
```

**Icona header Time Report**: `Clock` (Lucide) - coerente col dominio time tracking.

#### Zona 2 - Navigazione Principale

```html
<!-- Titolo sezione -->
<p class="text-[0.7rem] font-semibold uppercase tracking-wider
          text-dark-500 px-5 mb-2 mt-4">
    Time Tracking
</p>
```

**Sezioni navigazione Time Report**:

| Sezione | Voci | Visibilita |
|---------|------|------------|
| **Time Tracking** | Oggi, Settimana | Tutti |
| **Orchestration** | Workflow, Compliance | Utenti con permesso orchestrazione |
| **Impostazioni** | Progetti, Utenti, Asana | Solo admin |

#### Item Navigazione

```html
<!-- Inattivo -->
<a class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg
          text-dark-400 hover:bg-dark-800 hover:text-dark-50
          transition-all duration-200">
    <Clock size={20} class="text-blue-400" />
    <span class="text-sm">Oggi</span>
</a>

<!-- Attivo -->
<a class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg
          bg-gradient-brand text-white shadow-md
          transition-all duration-200">
    <Clock size={20} />
    <span class="text-sm font-medium">Oggi</span>
</a>
```

#### Zona 3 - Footer Sidebar

```html
<div class="py-3 border-t border-dark-700 mt-auto">
    <!-- Profilo -->
    <a class="nav-item">
        <UserCircle size={20} class="text-gray-400" />
        <span>Profilo</span>
    </a>
    <!-- Esci -->
    <button class="nav-item text-red-400 hover:bg-red-500/10">
        <LogOut size={20} />
        <span>Esci</span>
    </button>
</div>
```

**Voci fisse (in ordine)**:

| Voce            | Icona Lucide     | Note                               |
|-----------------|------------------|-------------------------------------|
| **Profilo**     | `UserCircle`     | Vai a impostazioni profilo         |
| **Esci**        | `LogOut`         | Logout, colore rosso               |

> **Nota**: rispetto allo standard Karalisweb (4 voci fisse), Time Report usa 2 voci nel footer. Impostazioni e Guida sono integrate nella navigazione principale.

### 7.2 Header (Mobile)

```html
<header class="fixed top-0 left-0 right-0 h-16 bg-dark-850
               border-b border-dark-700 z-20 md:hidden
               flex items-center justify-between px-4">
    <!-- Logo -->
    <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">TR</span>
        </div>
        <span class="text-white font-semibold hidden sm:block">Time Report</span>
    </div>
    <!-- Azioni -->
    <div class="flex items-center gap-2">
        <button><Bell size={20} /></button>
        <button><!-- Avatar utente --></button>
    </div>
</header>
```

### 7.3 Bottom Navigation (Mobile)

```html
<nav class="fixed bottom-0 left-0 right-0 bg-dark-850
            border-t border-dark-700 z-20 md:hidden">
    <div class="flex justify-around py-2">
        <!-- Item -->
        <a class="flex flex-col items-center gap-1 py-1 px-3">
            <Clock size={20} />
            <span class="text-[10px]">Oggi</span>
        </a>
        <!-- ... altri item ... -->
        <button>
            <Menu size={20} />
            <span class="text-[10px]">Menu</span>
        </button>
    </div>
</nav>
```

**Voci bottom nav**:

| Voce | Icona | Sempre visibile |
|------|-------|-----------------|
| Oggi | `Clock` | Si |
| Settimana | `Calendar` | Si |
| Workflow | `ClipboardCheck` | Solo se abilitato |
| Compliance | `BarChart3` | Solo se abilitato |
| Menu | `Menu` | Si (apre slide-over) |

---

## 8. Icone

### 8.1 Libreria Standard

**Libreria UNICA: [Lucide Icons](https://lucide.dev/)** tramite pacchetto `lucide-react`.

```bash
npm install lucide-react
```

```tsx
import { Clock, Calendar, Users } from 'lucide-react';
```

### 8.2 Dimensioni per Contesto

| Contesto          | Prop `size` |
|-------------------|-------------|
| Icone navigazione | `size={20}` |
| Icone bottone     | `size={16}` |
| Icone header      | `size={20}` |
| Icone mobile nav  | `size={20}` |
| Icone azioni card | `size={16}` |

### 8.3 Icone Navigazione Time Report

| Funzione            | Icona Lucide       | Colore inattivo    |
|---------------------|--------------------|--------------------|
| Oggi                | `Clock`            | `text-blue-400`    |
| Settimana           | `Calendar`         | `text-green-400`   |
| Workflow            | `ClipboardCheck`   | `text-emerald-400` |
| Compliance          | `BarChart3`        | `text-purple-400`  |
| Progetti            | `FolderKanban`     | `text-cyan-400`    |
| Utenti              | `Users`            | `text-orange-400`  |
| Asana               | `Link2`            | `text-pink-400`    |
| Profilo             | `UserCircle`       | `text-gray-400`    |
| Esci                | `LogOut`           | `text-red-400`     |

### 8.4 Icone UI Comuni

| Funzione         | Icona Lucide       |
|------------------|--------------------|
| Chiudi / X       | `X`                |
| Cerca            | `Search`           |
| Aggiungi         | `Plus`             |
| Modifica         | `Edit2`            |
| Elimina          | `Trash2`           |
| Conferma         | `Check`            |
| Caricamento      | `Loader2`          |
| Errore/Alert     | `AlertCircle`      |
| Successo         | `CheckCircle2`     |
| Indietro         | `ArrowLeft`        |
| Freccia sinistra | `ChevronLeft`      |
| Freccia destra   | `ChevronRight`     |
| Espandi          | `ChevronDown`      |
| Comprimi         | `ChevronUp`        |
| Invia            | `Send`             |
| Download         | `Download`         |
| Aggiorna         | `RefreshCw`        |
| Link esterno     | `ExternalLink`     |
| AI/Sparkles      | `Sparkles`         |
| Drag handle      | `GripVertical`     |
| Sicurezza        | `Shield`           |
| Email            | `Mail`             |
| Target           | `Target`           |
| Impostazioni     | `Settings`         |
| Notifiche        | `Bell`             |
| Lock             | `Lock`             |

### 8.5 Regole Colore Icone

Le icone ereditano il colore dal genitore tramite `currentColor`, tranne quando rappresentano uno stato o hanno un colore specifico nella navigazione.

| Contesto                 | Colore                            |
|--------------------------|-----------------------------------|
| Icona in nav inattivo    | Colore specifico per voce (vedi 8.3) |
| Icona in nav attivo      | `white` (su sfondo gradient)      |
| Icona in bottone         | `white` o colore del bottone      |
| Icona successo           | `text-green-500`                  |
| Icona errore             | `text-red-500`                    |
| Icona warning            | `text-yellow-500`                 |
| Icona info               | `text-blue-500`                   |

---

## 9. Animazioni & Transizioni

### 9.1 Transizioni Standard

| Contesto     | Classe Tailwind            |
|--------------|----------------------------|
| Default      | `transition-all duration-200` |
| Colori       | `transition-colors duration-200` |
| Modali       | `transition-all duration-300` |

### 9.2 Keyframes Personalizzati

```css
/* Toast slide da destra */
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

/* Fade in */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Mobile menu slide da sotto */
@keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
}
```

### 9.3 Effetti Hover

| Componente        | Effetto Hover                                      |
|-------------------|-----------------------------------------------------|
| Bottone primario  | Gradient shift + shadow-xl                          |
| Card              | Border-color `dark-600`                             |
| Nav item          | Background `dark-800` + testo `dark-50`             |

---

## 10. Responsive Design

### 10.1 Breakpoint

Time Report usa il breakpoint `md` (768px) come soglia principale.

| Breakpoint    | Larghezza       | Layout                     |
|---------------|-----------------|----------------------------|
| Desktop       | >= 768px (md)   | Sidebar fissa + contenuto  |
| Mobile        | < 768px         | Header + bottom nav        |

### 10.2 Desktop (>= 768px)

- **Sidebar**: visibile, fissa a sinistra, `w-56`
- **Header**: nascosto
- **Bottom Nav**: nascosta
- **Contenuto**: `ml-56`, padding `p-6`

### 10.3 Mobile (< 768px)

- **Sidebar**: nascosta
- **Header**: visibile, fisso in alto, `h-16`
- **Bottom Nav**: visibile, fisso in basso
- **Contenuto**: `mt-16 mb-16`, padding `p-4`
- **Slide-over menu**: scorre da destra per opzioni aggiuntive (admin, profilo, logout)
- **Card grid**: 1 colonna
- **Stats grid**: 2 colonne, poi 1 su schermi stretti

---

## 11. Pattern Ricorrenti

### 11.1 Principi di Design

1. **Bordi sottili**: sempre `border` (1px), mai piu spessi (tranne toast: `border-l-[3px]`)
2. **Background + bordo**: card/container hanno sempre sia background che bordo
3. **Gerarchie con opacita**: badge usano il colore al 15% di opacita come sfondo (`bg-color/15`)
4. **Whitespace generoso**: padding e gap ampi
5. **Interattivita sottile**: hover leggeri, transizioni rapide (200ms)
6. **Gradiente brand**: `from-brand-gradient-start to-brand-gradient-end` solo per l'azione primaria
7. **Icone colorate nella nav**: ogni voce di navigazione ha un colore icona specifico

### 11.2 Regole per Nuovi Componenti

- Background: usa i livelli `dark-950` > `dark-900` > `dark-850` > `dark-800` > `dark-700`
- Bordi: sempre `border border-dark-700`
- Border-radius: `rounded-md` (6px), `rounded-lg` (8px) o `rounded-xl` (12px)
- Testo: gerarchia `text-dark-50` > `text-dark-400` > `text-dark-500`
- Interattivita: `transition-all duration-200`, hover con cambio border o background
- CTA: gradiente brand solo per l'azione primaria

---

## 12. Tailwind Config Completo

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          850: '#18202e',
          900: '#111827',
          950: '#0a0f1a',
        },
        brand: {
          teal: '#0d9488',
          'teal-dark': '#0f766e',
          orange: '#f97316',
          'orange-dark': '#ea580c',
          'gradient-start': '#fb923c',
          'gradient-end': '#f97316',
          'gradient-hover-start': '#f97316',
          'gradient-hover-end': '#ea580c',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(to right, #fb923c, #f97316)',
        'gradient-brand-hover': 'linear-gradient(to right, #f97316, #ea580c)',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

---

## 13. Gestione Versioni

### 13.1 Formato Versione

**Semantic Versioning**: `vMAJOR.MINOR.PATCH` (es. `v1.0.0`)

- **MAJOR**: breaking changes, redesign completo
- **MINOR**: nuove funzionalita
- **PATCH**: bug fix, correzioni minori

### 13.2 Dove Aggiornare la Versione

| Punto                        | File                       | Esempio                        |
|------------------------------|----------------------------|--------------------------------|
| Backend package.json         | `backend/package.json`     | `"version": "1.0.0"`          |
| Frontend package.json        | `frontend/package.json`    | `"version": "1.0.0"`          |
| Deploy script                | `deploy.sh`                | `APP_VERSION="1.0.0"`         |
| Deploy docs                  | `DEPLOY.md`                | `Versione attuale: **1.0.0**` |
| **Sidebar UI**               | `Layout.tsx`               | `v1.0.0`                      |
| **Login footer**             | `Login.tsx`                | `Time Report v1.0.0`          |

### 13.3 Dove Mostrare la Versione nell'UI

1. **Header sidebar** - sotto "KW Time Report" (text-xs, text-dark-500)
2. **Footer login** - "Karalisweb - Time Report vX.Y.Z"

---

> **Note**: Questo design system e specifico per KW Time Report. Per il design system generale Karalisweb, fare riferimento al documento principale nel repo CashFlow. Ogni nuova feature deve rispettare queste linee guida per mantenere coerenza visiva.

---

*Ultimo aggiornamento: 2026-02-08*
