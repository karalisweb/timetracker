# Quick Start - Modulo Orchestration

> Guida rapida per attivare il modulo Orchestration

---

## TL;DR - Comandi Essenziali

```bash
# 1. Backend - Migrazione e Seed
cd backend
npx prisma migrate deploy
npx prisma generate
npx ts-node prisma/seed-orchestration.ts

# 2. Aggiornare utente admin (via psql o tool DB)
UPDATE users SET roles = ARRAY['admin', 'pm', 'senior', 'executor']::user_role[] WHERE email = 'tua@email.com';

# 3. Build
cd backend && npm run build
cd frontend && npm run build

# 4. Riavviare servizi
```

---

## Variabili Ambiente Obbligatorie

Aggiungere a `.env`:

```env
# Chiave crittografia (DEVE essere 32 caratteri)
CONFIG_ENCRYPTION_KEY="your-32-character-encryption-key"
```

---

## Dopo il Deploy

1. **Login** come admin
2. **Admin > Asana** → Configurare credenziali (opzionale)
3. **Orchestration > Progetti** → Creare primo progetto

---

## Ruoli Disponibili

| Ruolo | Può vedere Orchestration | Può creare progetti |
|-------|-------------------------|---------------------|
| `executor` | ❌ | ❌ |
| `senior` | ✅ | ❌ |
| `pm` | ✅ | ✅ |
| `admin` | ✅ | ✅ |

---

## Troubleshooting Rapido

| Problema | Soluzione |
|----------|-----------|
| Menu Orchestration non visibile | Verificare che utente abbia ruolo `pm`, `senior` o `admin` |
| Errore 500 su API | Verificare migrazione database applicata |
| Config Asana non si salva | Verificare `CONFIG_ENCRYPTION_KEY` (32 caratteri) |
| Task Asana non creati | Configurare Asana da Admin > Asana |

---

## Link Utili

- [Checklist completa deployment](./DEPLOY_CHECKLIST.md)
- [Stato implementazione](./IMPLEMENTATION_STATUS.md)
- [Architettura](./ARCHITECTURE.md)
- [Decisioni tecniche](./DECISIONS.md)
