#!/bin/bash
#
# ╔══════════════════════════════════════════════════════════════╗
# ║                   KW TIME REPORT - DEPLOY                   ║
# ║                                                              ║
# ║  Versione:     1.2.0                                        ║
# ║  Server:       vmi2996361.contaboserver.net                  ║
# ║  IP:           185.192.97.108                                ║
# ║  URL:          https://timereport.karalisdemo.it             ║
# ║  Backend:      /root/time-report/backend (NestJS + Prisma)  ║
# ║  Frontend:     /var/www/time-report (React + Vite)           ║
# ║  PM2 Process:  time-report                                  ║
# ║  Porta:        3004                                          ║
# ║  Database:     PostgreSQL (timereport)                       ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Uso:
#   ./deploy.sh "descrizione modifiche"
#   ./deploy.sh --bump patch "fix bug"
#   ./deploy.sh --bump minor "nuova funzionalita"
#   ./deploy.sh --bump major "breaking change"
#

set -e

# ─── CONFIGURAZIONE ─────────────────────────────────────────────
APP_NAME="KW Time Report"
APP_VERSION="1.2.0"
VPS_HOST="root@185.192.97.108"
VPS_PATH="/root/time-report"
FRONTEND_PATH="/var/www/time-report"
BRANCH="main"
PM2_PROCESS="time-report"
LOCAL_PORT=3004
SERVER_PORT=3004
PUBLIC_URL="https://timereport.karalisdemo.it"
NGINX_CONFIG="/etc/nginx/sites-available/timereport.karalisdemo.it"
# ─────────────────────────────────────────────────────────────────

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Funzioni di output
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step()    { echo -e "\n${CYAN}${BOLD}═══ STEP $1: $2 ═══${NC}"; }

# ─── PARSING ARGOMENTI ──────────────────────────────────────────
BUMP_TYPE=""
COMMIT_MSG=""

if [ "$1" = "--bump" ]; then
    BUMP_TYPE="$2"
    COMMIT_MSG="$3"
    if [ -z "$BUMP_TYPE" ] || [ -z "$COMMIT_MSG" ]; then
        error "Uso: ./deploy.sh --bump [patch|minor|major] \"messaggio commit\""
    fi
    if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
        error "Tipo bump non valido: $BUMP_TYPE (usa: patch, minor, major)"
    fi
else
    COMMIT_MSG="$1"
fi

if [ -z "$COMMIT_MSG" ]; then
    error "Uso: ./deploy.sh \"messaggio commit\" oppure ./deploy.sh --bump [patch|minor|major] \"messaggio\""
fi

# ─── HEADER ─────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║         ${APP_NAME} - Deploy v${APP_VERSION}         ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
info "URL: ${PUBLIC_URL}"
info "Server: ${VPS_HOST}"
info "Commit: ${COMMIT_MSG}"
[ -n "$BUMP_TYPE" ] && info "Version bump: ${BUMP_TYPE}"

# ─── STEP 1: VERIFICA GIT + PULL ──────────────────────────────────
step "1" "VERIFICA GIT + SINCRONIZZAZIONE"

# Verifica che siamo su un repo git
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    error "Non siamo in un repository Git!"
fi

# Verifica branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    warn "Branch corrente: $CURRENT_BRANCH (atteso: $BRANCH)"
fi

success "Repository Git verificato (branch: $CURRENT_BRANCH)"

# Pull ultime modifiche dal remoto (PRIMA di qualsiasi modifica locale)
info "Sincronizzazione con origin/$BRANCH..."
git stash --quiet 2>/dev/null || true
git pull origin "$BRANCH" --rebase || error "Conflitti durante git pull. Risolvili manualmente e riprova."
git stash pop --quiet 2>/dev/null || true
success "Sincronizzato con origin/$BRANCH"

# ─── STEP 2: VERSIONING (opzionale) ───────────────────────────────
if [ -n "$BUMP_TYPE" ]; then
    step "2" "AGGIORNAMENTO VERSIONE ($BUMP_TYPE)"

    # Parse versione corrente
    IFS='.' read -r MAJOR MINOR PATCH <<< "$APP_VERSION"

    case $BUMP_TYPE in
        major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
        minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
        patch) PATCH=$((PATCH + 1)) ;;
    esac

    NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
    info "Versione: ${APP_VERSION} -> ${NEW_VERSION}"

    # Aggiorna backend/package.json
    if [ -f "backend/package.json" ]; then
        sed -i '' "s/\"version\": \"${APP_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" backend/package.json
        success "backend/package.json aggiornato"
    fi

    # Aggiorna frontend/package.json
    if [ -f "frontend/package.json" ]; then
        FRONTEND_VERSION=$(grep -o '"version": "[^"]*"' frontend/package.json | head -1 | grep -o '[0-9][0-9.]*')
        sed -i '' "s/\"version\": \"${FRONTEND_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" frontend/package.json
        success "frontend/package.json aggiornato"
    fi

    # Aggiorna deploy.sh (questo file)
    sed -i '' "s/APP_VERSION=\"${APP_VERSION}\"/APP_VERSION=\"${NEW_VERSION}\"/" deploy.sh
    sed -i '' "s/Versione:     ${APP_VERSION}/Versione:     ${NEW_VERSION}/" deploy.sh
    success "deploy.sh aggiornato"

    # Aggiorna DEPLOY.md
    if [ -f "DEPLOY.md" ]; then
        sed -i '' "s/Versione attuale: \*\*${APP_VERSION}\*\*/Versione attuale: \*\*${NEW_VERSION}\*\*/" DEPLOY.md
        success "DEPLOY.md aggiornato"
    fi

    # Aggiorna Layout.tsx (versione UI sidebar + mobile menu)
    if [ -f "frontend/src/components/Layout.tsx" ]; then
        sed -i '' "s/v[0-9]*\.[0-9]*\.[0-9]*/v${NEW_VERSION}/g" frontend/src/components/Layout.tsx
        success "Layout.tsx aggiornato (versione UI)"
    fi

    # Aggiorna USER-GUIDE.md
    if [ -f "USER-GUIDE.md" ]; then
        sed -i '' "s/Versione: \*\*[0-9]*\.[0-9]*\.[0-9]*\*\*/Versione: \*\*${NEW_VERSION}\*\*/" USER-GUIDE.md
        success "USER-GUIDE.md aggiornato"
    fi

    # Aggiorna README.md
    if [ -f "README.md" ]; then
        sed -i '' "s/\*\*Versione attuale:\*\* [0-9]*\.[0-9]*\.[0-9]*/\*\*Versione attuale:\*\* ${NEW_VERSION}/" README.md
        success "README.md aggiornato"
    fi

    # Aggiorna CHANGELOG.md (inserisce nuova entry automatica)
    if [ -f "CHANGELOG.md" ]; then
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
        {print}' CHANGELOG.md > CHANGELOG.tmp && mv CHANGELOG.tmp CHANGELOG.md
        success "CHANGELOG.md aggiornato (nuova entry ${NEW_VERSION})"
    fi

    APP_VERSION="$NEW_VERSION"
    success "Versione aggiornata a ${NEW_VERSION}"
fi

# Verifica modifiche
CHANGES=$(git status --porcelain | grep -v '\.db' | grep -v '\.db-' || true)
if [ -z "$CHANGES" ]; then
    warn "Nessuna modifica da committare (esclusi file .db)"
    if [ -z "$BUMP_TYPE" ]; then
        info "Procedo con il deploy delle modifiche gia committate..."
    fi
fi

# ─── STEP 3: COMMIT ─────────────────────────────────────────────
step "3" "COMMIT"

if [ -n "$CHANGES" ] || [ -n "$BUMP_TYPE" ]; then
    git add .
    git commit -m "$COMMIT_MSG" || warn "Niente da committare"
    success "Commit creato: $COMMIT_MSG"
else
    info "Nessun commit necessario"
fi

# ─── STEP 4: PUSH ───────────────────────────────────────────────
step "4" "PUSH"

git push origin "$BRANCH"
success "Push completato su origin/$BRANCH"

# ─── STEP 5: BUILD FRONTEND ─────────────────────────────────────
step "5" "BUILD FRONTEND (React + Vite)"

cd frontend
npm run build
cd ..
success "Frontend buildato con successo"

# ─── STEP 6: SYNC BACKEND ───────────────────────────────────────
step "6" "SYNC BACKEND AL SERVER"

rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude 'dist' \
    --exclude '*.db' \
    --exclude '*.db-*' \
    backend/ "$VPS_HOST:$VPS_PATH/backend/"
success "Backend sincronizzato su $VPS_HOST:$VPS_PATH/backend/"

# ─── STEP 7: SYNC FRONTEND ──────────────────────────────────────
step "7" "SYNC FRONTEND AL SERVER"

rsync -avz --delete \
    frontend/dist/ "$VPS_HOST:$FRONTEND_PATH/"
success "Frontend sincronizzato su $VPS_HOST:$FRONTEND_PATH/"

# ─── STEP 8: SETUP REMOTO ───────────────────────────────────────
step "8" "SETUP REMOTO (install + build + migrate)"

ssh "$VPS_HOST" << ENDSSH
set -e
cd $VPS_PATH/backend

echo "[REMOTE] npm install..."
npm install

echo "[REMOTE] Prisma generate..."
npx prisma generate

echo "[REMOTE] Building NestJS..."
npm run build

echo "[REMOTE] Prisma migrate deploy..."
npx prisma migrate deploy

echo "[REMOTE] Setup remoto completato"
ENDSSH

success "Setup remoto completato"

# ─── STEP 9: RESTART PM2 ────────────────────────────────────────
step "9" "RESTART PM2"

ssh "$VPS_HOST" << ENDSSH
cd $VPS_PATH/backend

# Restart o crea processo
if pm2 describe $PM2_PROCESS > /dev/null 2>&1; then
    pm2 restart $PM2_PROCESS --update-env
    echo "[REMOTE] PM2 riavviato: $PM2_PROCESS"
else
    pm2 start dist/main.js --name $PM2_PROCESS
    echo "[REMOTE] PM2 creato: $PM2_PROCESS"
fi

pm2 save

# Mostra status
pm2 show $PM2_PROCESS | head -20
ENDSSH

success "PM2 riavviato"

# ─── RIEPILOGO ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║            DEPLOY COMPLETATO!                ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
info "App:      ${APP_NAME}"
info "Versione: v${APP_VERSION}"
info "Commit:   ${COMMIT_MSG}"
info "URL:      ${PUBLIC_URL}"
if [ -n "$BUMP_TYPE" ]; then
    echo ""
    info "File aggiornati con versione v${APP_VERSION}:"
    info "  - backend/package.json"
    info "  - frontend/package.json"
    info "  - deploy.sh"
    info "  - DEPLOY.md"
    info "  - Layout.tsx (UI sidebar + mobile)"
    info "  - USER-GUIDE.md"
    info "  - README.md"
    info "  - CHANGELOG.md (nuova entry)"
fi
echo ""
