# Modulo Orchestration - Documentazione

> Documentazione tecnica per il modulo Project Orchestration & Guardrails

---

## Indice Documenti

### Documentazione Tecnica
| Documento | Descrizione | Stato |
|-----------|-------------|-------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architettura tecnica, stack, moduli | ✅ Completato |
| [DATA_MODEL.md](./DATA_MODEL.md) | Schema Prisma, entità, relazioni | ✅ Completato |
| [DECISIONS.md](./DECISIONS.md) | Decisioni architetturali (ADR) | ✅ Completato |
| [FLOWS.md](./FLOWS.md) | Flow operativi (creazione progetto, webhook, gates) | ✅ Completato |
| [MVP.md](./MVP.md) | Scope MVP, fasi, criteri accettazione | ✅ Completato |
| [EDGE_CASES.md](./EDGE_CASES.md) | Edge case, recovery, monitoring | ✅ Completato |
| [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) | Stato implementazione corrente | ✅ Completato |

### Guide Operative
| Documento | Descrizione |
|-----------|-------------|
| [QUICK_START.md](./QUICK_START.md) | Guida rapida attivazione modulo |
| [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) | Checklist completa per deployment |

---

## Principio Architetturale

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              ASANA ESEGUE. L'APP VALIDA.                    ║
║                                                              ║
║  • Asana = task, assegnazioni, completamenti                ║
║  • App = verità su stato progetto, checklist, gate          ║
║  • Asana NON decide mai se un progetto è consegnabile       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Progress Tracking

### Step Completati

- [x] **Step 1:** Architettura tecnica (backend, integrazione Asana)
- [x] **Step 2:** Modello dati implementativo (Prisma schema)
- [x] **Step 3:** Flow creazione progetto
- [x] **Step 4:** Flow eventi Asana → App (webhook)
- [x] **Step 5:** MVP scope
- [x] **Step 6:** Edge case tecnici

### Implementazione

- [x] **Fase 1:** Backend Core (schema, guards, servizi, seed)
- [x] **Fase 2:** Integrazione Asana (API client, creazione task)
- [x] **Fase 3:** Webhook + Pannello Config (webhook controller, config panel)
- [x] **Fase 4:** Frontend Orchestration (pagine, form)

✅ **Implementazione MVP completata!** Vedi [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) per dettagli.

---

## Quick Reference

### Ruoli e Permessi

| Ruolo | Time & Cost | Orchestration | Crea Progetti | Admin |
|-------|-------------|---------------|---------------|-------|
| `executor` | ✅ | ❌ | ❌ | ❌ |
| `senior` | ✅ | ✅ (view) | ❌ | ❌ |
| `pm` | ✅ | ✅ | ✅ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ |

### Stati Progetto

```
in_development → ready_for_publish → published → delivered
                                         ↑            ↑
                                    Gate 1        Gate 2
```

### Gate Requirements

**Gate: Pubblicato**
- SEO Base (obbligatoria)
- Tecnica Post-Pubblicazione (obbligatoria)
- Privacy Essenziale (obbligatoria)

**Gate: Consegnato**
- Stato Pubblicato raggiunto
- Performance Minima (se assegnata)

---

## Come Riprendere il Lavoro

Per riprendere lo sviluppo da qualsiasi punto:

1. Leggi `README.md` per overview e stato
2. Consulta `DECISIONS.md` per scelte già fatte
3. Consulta `ARCHITECTURE.md` per struttura tecnica
4. Consulta `DATA_MODEL.md` per schema database
5. Prosegui con lo step pendente indicato sopra

---

## Vincoli Non Negoziabili (da Specifica)

1. ❌ Non trasformare l'app in un PM tool
2. ❌ Non permettere override manuali dei Gate
3. ❌ Non esporre guardrail agli esecutori
4. ❌ Non accoppiare Time & Cost con Guardrail direttamente
5. ❌ Non "semplificare" eliminando entità
6. ✅ Executor lavora SOLO su Asana
7. ✅ Nessuna doppia compilazione
8. ✅ Regole guardrail valutate SOLO backend
