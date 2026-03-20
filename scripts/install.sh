#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker compose)
elif docker-compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker-compose)
else
  DOCKER_COMPOSE=()
fi

print_header() {
  echo "===================================="
  echo " Martin POS - Instalador de Entorno"
  echo "===================================="
  echo
}

error_exit() {
  echo "[ERROR] $1"
  exit 1
}

is_yes() {
  case "$1" in
    [sS]|[sS][iI]) return 0 ;;
    *) return 1 ;;
  esac
}

create_jwt_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32
  else
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  fi
}

ensure_prerequisites() {
  if ! command -v node >/dev/null 2>&1; then
    error_exit "Node.js no esta instalado. Requiere Node.js 18 o superior."
  fi

  if ! command -v pnpm >/dev/null 2>&1; then
    echo "[INFO] pnpm no encontrado. Instalando pnpm..."
    npm install -g pnpm
  fi

  echo "[OK] Prerequisitos verificados."
}

ask_module() {
  echo
  echo "Selecciona el modulo principal para INSTALLED_MODULE:"
  echo "1) Restaurante"
  echo "2) Minimarket"
  echo "3) Botilleria"
  echo "4) Libreria/Bazar"
  echo "5) Todos los modulos"
  read -r -p "Opcion (1-5): " module_choice

  case "$module_choice" in
    1) MODULE_TYPE="RESTAURANT" ;;
    2) MODULE_TYPE="MINIMARKET" ;;
    3) MODULE_TYPE="BOTILLERIA" ;;
    4) MODULE_TYPE="BOOKSTORE" ;;
    5) MODULE_TYPE="ALL" ;;
    *) error_exit "Opcion invalida." ;;
  esac
}

create_or_update_env() {
  local jwt_secret
  jwt_secret="$(create_jwt_secret)"

  if [[ -f ".env" ]]; then
    echo
    read -r -p ".env ya existe. Quieres sobrescribirlo? (s/N): " overwrite_env
    if ! is_yes "${overwrite_env:-}"; then
      if grep -q '^INSTALLED_MODULE=' .env; then
        sed -i.bak "s/^INSTALLED_MODULE=.*/INSTALLED_MODULE=\"$MODULE_TYPE\"/" .env && rm -f .env.bak
      else
        printf "\nINSTALLED_MODULE=\"%s\"\n" "$MODULE_TYPE" >> .env
      fi
      echo "[OK] .env conservado y INSTALLED_MODULE actualizado."
      return
    fi
  fi

  cat > .env <<EOL
# Database Configuration
DATABASE_URL="postgresql://martinpos:martinpos123@localhost:5436/martin_pos?schema=public"
POSTGRES_USER=martinpos
POSTGRES_PASSWORD=martinpos123
POSTGRES_DB=martin_pos
POSTGRES_PORT=5436

# Redis Configuration
REDIS_URL="redis://localhost:6380"
REDIS_PORT=6380

# JWT
JWT_SECRET="$jwt_secret"
JWT_EXPIRES_IN="7d"

# AI APIs
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""

# App Config
APP_PORT=3001
WEB_PORT=3008
NODE_ENV=development
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"

# Instalacion - modulo principal
INSTALLED_MODULE="$MODULE_TYPE"

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Impresora
PRINTER_PORT="/dev/usb/lp0"
PRINTER_WIDTH=48
EOL

  echo "[OK] Archivo .env generado."
}

wait_for_postgres() {
  local tries=0
  local max_tries=30

  echo "[INFO] Esperando PostgreSQL..."
  until "${DOCKER_COMPOSE[@]}" -f docker-compose.yml exec -T postgres \
    pg_isready -U "${POSTGRES_USER:-martinpos}" -d "${POSTGRES_DB:-martin_pos}" >/dev/null 2>&1; do
    tries=$((tries + 1))
    if (( tries >= max_tries )); then
      error_exit "PostgreSQL no respondio a tiempo en Docker."
    fi
    sleep 2
  done
  echo "[OK] PostgreSQL listo."
}

start_db_if_needed() {
  echo
  echo "Como quieres ejecutar PostgreSQL?"
  echo "1) Docker (recomendado)"
  echo "2) PostgreSQL local (ya instalado)"
  read -r -p "Opcion (1-2): " db_choice

  case "$db_choice" in
    1)
      if [[ ${#DOCKER_COMPOSE[@]} -eq 0 ]]; then
        error_exit "No se encontro Docker Compose. Instala Docker Compose o usa PostgreSQL local."
      fi
      echo "[INFO] Iniciando postgres y redis con docker-compose.yml..."
      "${DOCKER_COMPOSE[@]}" -f docker-compose.yml up -d postgres redis
      wait_for_postgres
      ;;
    2)
      echo "[INFO] Usando PostgreSQL local."
      ;;
    *)
      error_exit "Opcion invalida."
      ;;
  esac
}

run_database_setup() {
  echo
  echo "[INFO] Generando cliente Prisma..."
  pnpm db:generate

  echo "[INFO] Aplicando migraciones existentes (migrate deploy)..."
  pnpm --filter @martin-pos/database exec prisma migrate deploy

  echo "[INFO] Ejecutando seed..."
  pnpm --filter @martin-pos/database prisma:seed

  echo "[OK] Base de datos inicializada."
}

show_next_steps() {
  echo
  echo "[OK] Instalacion completada."
  echo
  echo "Siguientes pasos:"
  echo "1) Levantar stack Docker completo: ./setup.sh (opcion 1)"
  echo "2) O levantar en desarrollo local: pnpm dev"
  echo
  echo "Credenciales demo:"
  echo "Email: admin@martinpos.com"
  echo "Password: admin123"
}

main() {
  print_header
  ensure_prerequisites
  ask_module

  echo
  echo "[INFO] Instalando dependencias..."
  pnpm install

  create_or_update_env
  start_db_if_needed
  run_database_setup
  show_next_steps
}

main "$@"
