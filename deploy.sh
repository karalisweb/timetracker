#!/bin/bash
#
# ╔══════════════════════════════════════════════════════════════╗
# ║                   KW TIME REPORT - DEPLOY                   ║
# ╠══════════════════════════════════════════════════════════════╣
# ║  App:           KW Time Report                              ║
# ║  Versione:      (da backend/package.json)                   ║
# ║  Ultimo update: 2026-02-23                                  ║
# ║                                                              ║
# ║  Cartella locale: ~/Desktop/Sviluppo App Claude Code/       ║
# ║                   Time Tracker                               ║
# ║  Repo GitHub:   github.com/karalisweb/timetracker           ║
# ║  Cartella server: /root/time-report                         ║
# ║                                                              ║
# ║  Server:        185.192.97.108 (Contabo VPS)                ║
# ║  URL:           https://timereport.karalisdemo.it            ║
# ║  Porta:         3004 (proxy Nginx su 80/443)                ║
# ║  PM2:           time-report                                  ║
# ║  Database:      PostgreSQL (timereport)                      ║
# ║  Backend:       /root/time-report/backend (NestJS + Prisma) ║
# ║  Frontend:      /var/www/time-report (React + Vite)          ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Uso:
#   ./deploy.sh "descrizione modifiche"
#   ./deploy.sh --bump patch "fix bug"
#   ./deploy.sh --bump minor "nuova funzionalita"
#   ./deploy.sh --bump major "breaking change"
#
# Il deploy esegue in ordine:
#   1. Verifica Git + pull remoto
#   2. Versioning automatico (se --bump)
#   3. Verifiche pre-deploy (coerenza versioni, CHANGELOG, build)
#   4. Commit
#   5. Push a GitHub
#   6. Sync backend al server (rsync)
#   7. Sync frontend al server (rsync)
#   8. Setup remoto (npm install, Prisma, NestJS build)
#   9. Restart PM2

set -e

# ═══════════════════════════════════════════
# CONFIGURAZIONE
# ═══════════════════════════════════════════
APP_NAME="KW Time Report"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Versione letta dinamicamente da backend/package.json
APP_VERSION=$(grep '"version"' "${SCRIPT_DIR}/backend/package.json" | head -1 | sed 's/.*"version"[^"]*"\([^"]*\)".*/\1/')

VPS_HOST="root@185.192.97.108"
VPS_PATH="/root/time-report"
FRONTEND_PATH="/var/www/time-report"
BRANCH="main"
PM2_PROCESS="time-report"
PUBLIC_URL="https://timereport.karalisdemo.it"
TOTAL_STEPS=9

# ═══════════════════════════════════════════
# FUNZIONI
# ═══════════════════════════════════════════
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
fail()    { echo -e "${RED}[X]${NC} $1"; exit 1; }
step()    { echo -e "\n${CYAN}${BOLD}==> Step $1/${TOTAL_STEPS} - $2${NC}"; }

# ═══════════════════════════════════════════
# PARSING ARGOMENTI
# ═══════════════════════════════════════════
BUMP_TYPE=""
COMMIT_MSG=""

if [ "$1" = "--bump" ]; then
    BUMP_TYPE="$2"
    COMMIT_MSG="$3"
    if [ -z "$BUMP_TYPE" ] || [ -z "$COMMIT_MSG" ]; then
        fail "Uso: ./deploy.sh --bump [patch|minor|major] \"messaggio commit\""
    fi
    if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
        fail "Tipo bump non valido: $BUMP_TYPE (usa: patch, minor, major)"
    fi
else
    COMMIT_MSG="$1"
fi

if [ -z "$COMMIT_MSG" ]; then
    fail "Uso: ./deploy.sh \"messaggio commit\" oppure ./deploy.sh --bump [patch|minor|major] \"messaggio\""
fi

# ═══════════════════════════════════════════
# HEADER
# ═══════════════════════════════════════════
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║       ${APP_NAME} - Deploy v${APP_VERSION}        ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
info "URL:    ${PUBLIC_URL}"
info "Server: ${VPS_HOST}"
info "Commit: ${COMMIT_MSG}"
[ -n "$BUMP_TYPE" ] && info "Bump:   ${BUMP_TYPE}"

# ═══════════════════════════════════════════════════════════════════
# STEP 1: VERIFICA GIT + PULL
# ═══════════════════════════════════════════════════════════════════
step "1" "Verifica Git + sincronizzazione remoto..."

# Verifica repo git
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    fail "Non siamo in un repository Git!"
fi

# Verifica branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    warn "Branch corrente: $CURRENT_BRANCH (atteso: $BRANCH)"
fi
success "Repository Git verificato (branch: $CURRENT_BRANCH)"

# Pull remoto (PRIMA di qualsiasi modifica locale)
info "Pull da origin/$BRANCH..."
git stash --quiet 2>/dev/null || true
git pull origin "$BRANCH" --rebase || fail "Conflitti durante git pull. Risolvili manualmente e riprova."
git stash pop --quiet 2>/dev/null || true
success "Sincronizzato con origin/$BRANCH"

# ═══════════════════════════════════════════════════════════════════
# STEP 2: VERSIONING (opzionale, solo con --bump)
# ═══════════════════════════════════════════════════════════════════
step "2" "Versioning..."

if [ -n "$BUMP_TYPE" ]; then
    # Parse versione corrente
    IFS='.' read -r MAJOR MINOR PATCH <<< "$APP_VERSION"

    case $BUMP_TYPE in
        major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
        minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
        patch) PATCH=$((PATCH + 1)) ;;
    esac

    NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
    info "Versione: ${APP_VERSION} -> ${NEW_VERSION}"

    # --- Aggiornamento file ---

    # backend/package.json
    if [ -f "${SCRIPT_DIR}/backend/package.json" ]; then
        sed -i '' "s/\"version\": \"${APP_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" "${SCRIPT_DIR}/backend/package.json"
        success "backend/package.json"
    fi

    # frontend/package.json
    if [ -f "${SCRIPT_DIR}/frontend/package.json" ]; then
        FRONTEND_VERSION=$(grep -o '"version": "[^"]*"' "${SCRIPT_DIR}/frontend/package.json" | head -1 | grep -o '[0-9][0-9.]*')
        sed -i '' "s/\"version\": \"${FRONTEND_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" "${SCRIPT_DIR}/frontend/package.json"
        success "frontend/package.json"
    fi

    # DEPLOY.md
    if [ -f "${SCRIPT_DIR}/DEPLOY.md" ]; then
        sed -i '' "s/Versione attuale: \*\*${APP_VERSION}\*\*/Versione attuale: \*\*${NEW_VERSION}\*\*/" "${SCRIPT_DIR}/DEPLOY.md"
        success "DEPLOY.md"
    fi

    # Layout.tsx (versione UI sidebar + mobile menu)
    if [ -f "${SCRIPT_DIR}/frontend/src/components/Layout.tsx" ]; then
        sed -i '' "s/v[0-9]*\.[0-9]*\.[0-9]*/v${NEW_VERSION}/g" "${SCRIPT_DIR}/frontend/src/components/Layout.tsx"
        success "Layout.tsx (versione UI)"
    fi

    # USER-GUIDE.md
    if [ -f "${SCRIPT_DIR}/USER-GUIDE.md" ]; then
        sed -i '' "s/Versione: \*\*[0-9]*\.[0-9]*\.[0-9]*\*\*/Versione: \*\*${NEW_VERSION}\*\*/" "${SCRIPT_DIR}/USER-GUIDE.md"
        success "USER-GUIDE.md"
    fi

    # README.md
    if [ -f "${SCRIPT_DIR}/README.md" ]; then
        sed -i '' "s/\*\*Versione attuale:\*\* [0-9]*\.[0-9]*\.[0-9]*/\*\*Versione attuale:\*\* ${NEW_VERSION}/" "${SCRIPT_DIR}/README.md"
        success "README.md"
    fi

    # CLAUDE.md (versione + data)
    if [ -f "${SCRIPT_DIR}/CLAUDE.md" ]; then
        sed -i '' "s/Aggiornato alla versione \*\*[0-9]*\.[0-9]*\.[0-9]*\*\*/Aggiornato alla versione \*\*${NEW_VERSION}\*\*/" "${SCRIPT_DIR}/CLAUDE.md"
        success "CLAUDE.md"
    fi

    # CHANGELOG.md (inserisce nuova entry automatica)
    if [ -f "${SCRIPT_DIR}/CHANGELOG.md" ]; then
        TODAY=$(date +%Y-%m-%d)
        awk -v ver="$NEW_VERSION" -v dt="$TODAY" -v msg="$COMMIT_MSG" '
        /^---$/ && !done {
            print; print "";
            print "## [" ver "] - " dt;
            print "";
            print "### Aggiornato";
            print "- " msg;
            done=1; next
        }
        {print}' "${SCRIPT_DIR}/CHANGELOG.md" > "${SCRIPT_DIR}/CHANGELOG.tmp" && mv "${SCRIPT_DIR}/CHANGELOG.tmp" "${SCRIPT_DIR}/CHANGELOG.md"
        success "CHANGELOG.md (nuova entry)"
    fi

    # Aggiorna data "Ultimo aggiornamento" in tutti i doc
    TODAY=$(date +%Y-%m-%d)
    for DOC in README.md CHANGELOG.md USER-GUIDE.md CLAUDE.md; do
        if [ -f "${SCRIPT_DIR}/${DOC}" ]; then
            sed -i '' "s/Ultimo aggiornamento: [0-9-]*/Ultimo aggiornamento: ${TODAY}/" "${SCRIPT_DIR}/${DOC}"
        fi
    done
    success "Date aggiornate in tutti i documenti"

    APP_VERSION="$NEW_VERSION"
    success "Versione aggiornata a ${NEW_VERSION}"
else
    info "Nessun bump richiesto, versione corrente: ${APP_VERSION}"
fi

# ═══════════════════════════════════════════════════════════════════
# STEP 3: VERIFICHE PRE-DEPLOY
# ═══════════════════════════════════════════════════════════════════
step "3" "Verifiche pre-deploy..."

# 3a: Coerenza versione tra backend e frontend package.json
BACKEND_V=$(grep -o '"version": "[^"]*"' "${SCRIPT_DIR}/backend/package.json" | head -1 | grep -o '[0-9][0-9.]*')
FRONTEND_V=$(grep -o '"version": "[^"]*"' "${SCRIPT_DIR}/frontend/package.json" | head -1 | grep -o '[0-9][0-9.]*')
if [ "$BACKEND_V" != "$FRONTEND_V" ]; then
    fail "Versione non allineata! backend=$BACKEND_V, frontend=$FRONTEND_V"
fi
success "Versioni package.json coerenti ($BACKEND_V)"

# 3b: Verifica che CHANGELOG contenga la versione corrente
if [ -f "${SCRIPT_DIR}/CHANGELOG.md" ]; then
    if ! grep -q "\[$APP_VERSION\]" "${SCRIPT_DIR}/CHANGELOG.md"; then
        fail "CHANGELOG.md non contiene la versione $APP_VERSION! Aggiorna il CHANGELOG prima del deploy."
    fi
    success "CHANGELOG contiene [$APP_VERSION]"
else
    warn "CHANGELOG.md non trovato, skip verifica"
fi

# 3c: Coerenza versione UI in Layout.tsx
LAYOUT_V=$(grep -o 'v[0-9]*\.[0-9]*\.[0-9]*' "${SCRIPT_DIR}/frontend/src/components/Layout.tsx" | head -1 | sed 's/^v//')
if [ -n "$LAYOUT_V" ] && [ "$LAYOUT_V" != "$APP_VERSION" ]; then
    warn "Layout.tsx mostra v$LAYOUT_V ma la versione e $APP_VERSION"
    sed -i '' "s/v${LAYOUT_V}/v${APP_VERSION}/g" "${SCRIPT_DIR}/frontend/src/components/Layout.tsx"
    success "Layout.tsx aggiornato a v$APP_VERSION"
else
    success "Layout.tsx versione coerente (v$LAYOUT_V)"
fi

# 3d: Verifica stato Git
CHANGES=$(git status --porcelain | grep -v '\.db' | grep -v '\.db-' || true)
if [ -n "$CHANGES" ]; then
    info "File modificati:"
    git status --short | grep -v '\.db'
else
    warn "Nessuna modifica da committare (esclusi file .db)"
    if [ -z "$BUMP_TYPE" ]; then
        read -p "  Continuare comunque con il deploy? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
fi

# 3e: Build frontend come test pre-deploy
info "Build frontend di verifica..."
cd "${SCRIPT_DIR}/frontend"
npm run build
cd "${SCRIPT_DIR}"
success "Build frontend OK"

# ═══════════════════════════════════════════════════════════════════
# STEP 4: COMMIT
# ═══════════════════════════════════════════════════════════════════
step "4" "Commit..."

# Ri-verifica dopo il build (potrebbe aver generato dist/)
CHANGES=$(git status --porcelain | grep -v '\.db' | grep -v '\.db-' || true)
if [ -n "$CHANGES" ] || [ -n "$BUMP_TYPE" ]; then
    git add .
    git commit -m "$COMMIT_MSG" || warn "Niente da committare"
    success "Commit: $COMMIT_MSG"
else
    info "Nessun commit necessario"
fi

# ═══════════════════════════════════════════════════════════════════
# STEP 5: PUSH
# ═══════════════════════════════════════════════════════════════════
step "5" "Push a GitHub ($BRANCH)..."

git push origin "$BRANCH"
success "Push completato"

# ═══════════════════════════════════════════════════════════════════
# STEP 6: SYNC BACKEND AL SERVER
# ═══════════════════════════════════════════════════════════════════
step "6" "Sync backend al server..."

rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude 'dist' \
    --exclude '*.db' \
    --exclude '*.db-*' \
    "${SCRIPT_DIR}/backend/" "$VPS_HOST:$VPS_PATH/backend/"
success "Backend sincronizzato"

# ═══════════════════════════════════════════════════════════════════
# STEP 7: SYNC FRONTEND AL SERVER
# ═══════════════════════════════════════════════════════════════════
step "7" "Sync frontend al server..."

rsync -avz --delete \
    "${SCRIPT_DIR}/frontend/dist/" "$VPS_HOST:$FRONTEND_PATH/"
success "Frontend sincronizzato"

# ═══════════════════════════════════════════════════════════════════
# STEP 8: SETUP REMOTO (install + build + migrate)
# ═══════════════════════════════════════════════════════════════════
step "8" "Setup remoto..."

# npm install condizionale: solo se package.json o package-lock.json sono cambiati
PACKAGE_CHANGED=$(git diff HEAD~1 --name-only 2>/dev/null | grep -E 'backend/package(-lock)?\.json' || echo "")

ssh "$VPS_HOST" << ENDSSH
set -e
cd $VPS_PATH/backend

$(if [ -n "$PACKAGE_CHANGED" ]; then
    echo 'echo "[REMOTE] npm install (package.json cambiato)..."'
    echo 'npm install'
else
    echo 'echo "[REMOTE] npm install skippato (package.json invariato)"'
fi)

echo "[REMOTE] Prisma generate..."
npx prisma generate

echo "[REMOTE] Building NestJS..."
npm run build

echo "[REMOTE] Prisma migrate deploy..."
npx prisma migrate deploy

echo "[REMOTE] Setup remoto completato"
ENDSSH

success "Setup remoto completato"

# ═══════════════════════════════════════════════════════════════════
# STEP 9: RESTART PM2
# ═══════════════════════════════════════════════════════════════════
step "9" "Restart PM2..."

ssh "$VPS_HOST" << ENDSSH
cd $VPS_PATH/backend

if pm2 describe $PM2_PROCESS > /dev/null 2>&1; then
    pm2 restart $PM2_PROCESS --update-env
    echo "[REMOTE] PM2 riavviato: $PM2_PROCESS"
else
    pm2 start dist/main.js --name $PM2_PROCESS
    echo "[REMOTE] PM2 creato: $PM2_PROCESS"
fi

pm2 save
pm2 show $PM2_PROCESS | head -20
ENDSSH

success "PM2 riavviato"

# ═══════════════════════════════════════════════════════════════════
# RIEPILOGO
# ═══════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║            DEPLOY COMPLETATO!                ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  App:      ${APP_NAME}"
echo -e "  Versione: v${APP_VERSION}"
echo -e "  Commit:   ${COMMIT_MSG}"
echo -e "  Branch:   ${BRANCH}"
echo -e "  Server:   ${VPS_HOST}"
echo -e "  URL:      ${PUBLIC_URL}"
echo -e "  PM2:      ${PM2_PROCESS}"
echo -e "  Data:     $(date '+%Y-%m-%d %H:%M:%S')"
if [ -n "$BUMP_TYPE" ]; then
    echo ""
    echo -e "  ${CYAN}File aggiornati a v${APP_VERSION}:${NC}"
    echo -e "    - backend/package.json"
    echo -e "    - frontend/package.json"
    echo -e "    - DEPLOY.md"
    echo -e "    - Layout.tsx (UI)"
    echo -e "    - USER-GUIDE.md"
    echo -e "    - README.md"
    echo -e "    - CLAUDE.md"
    echo -e "    - CHANGELOG.md"
fi
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
