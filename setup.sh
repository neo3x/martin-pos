#!/usr/bin/env bash
set -euo pipefail

if [[ -f "docker-compose.prod.yml" ]]; then
  COMPOSE_FILE="docker-compose.prod.yml"
else
  COMPOSE_FILE="docker-compose.yml"
fi

if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker compose)
elif docker-compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker-compose)
else
  echo "[ERROR] No se encontro Docker Compose. Instala Docker Compose y vuelve a intentarlo."
  exit 1
fi

pause_enter() {
  read -r -p "Presiona Enter para continuar..."
}

is_yes() {
  case "$1" in
    [sS]|[sS][iI]) return 0 ;;
    *) return 1 ;;
  esac
}

ask_show_logs() {
  read -r -p "Deseas ver logs de eventos? (s/N): " show_logs
  if is_yes "${show_logs:-}"; then
    "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" logs -f
  fi
}

build_and_up() {
  echo
  echo "[INFO] Construyendo e iniciando servicios..."
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" up -d --build
  echo
  ask_show_logs
  echo
  pause_enter
}

stop_services() {
  echo
  echo "[INFO] Deteniendo servicios..."
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" stop
  echo
  pause_enter
}

start_services() {
  echo
  echo "[INFO] Iniciando servicios..."
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" start
  echo
  ask_show_logs
  echo
  pause_enter
}

run_install_script() {
  echo
  if [[ ! -f "scripts/install.sh" ]]; then
    echo "[ERROR] No se encontro scripts/install.sh"
    echo
    pause_enter
    return
  fi

  echo "[INFO] Ejecutando scripts/install.sh..."
  bash scripts/install.sh
  echo
  pause_enter
}

ensure_prisma_services() {
  echo
  echo "[INFO] Levantando servicios requeridos (postgres + backend)..."
  if ! "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" up -d postgres backend; then
    echo "[ERROR] No fue posible iniciar postgres/backend."
    echo
    return 1
  fi
  return 0
}

run_prisma_migrate() {
  echo
  echo "[INFO] Ejecutando Prisma migrate deploy..."
  if ! "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" exec backend sh -lc "/app/packages/database/node_modules/.bin/prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma"; then
    echo "[ERROR] No fue posible ejecutar migrate deploy."
    echo "        Verifica que el backend este corriendo y tenga acceso a la base de datos."
    return 1
  fi
  return 0
}

run_prisma_seed() {
  echo
  echo "[INFO] Ejecutando seed Prisma..."
  if ! "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" exec backend sh -lc "cd /app/packages/database && npx ts-node prisma/seed.ts"; then
    echo "[ERROR] El seed fallo. Revisa logs de backend y estado de la base de datos."
    return 1
  fi
  echo "[INFO] Seed completado."
  return 0
}

prisma_migrate_only() {
  if ! ensure_prisma_services; then
    echo
    pause_enter
    return
  fi

  if ! run_prisma_migrate; then
    echo
    pause_enter
    return
  fi

  echo
  echo "[INFO] Migraciones Prisma aplicadas correctamente."
  pause_enter
}

prisma_migrate_and_seed() {
  if ! ensure_prisma_services; then
    echo
    pause_enter
    return
  fi

  if ! run_prisma_migrate; then
    echo
    pause_enter
    return
  fi

  if ! run_prisma_seed; then
    echo
    pause_enter
    return
  fi

  echo
  echo "[INFO] Migraciones y seed Prisma finalizados."
  pause_enter
}

cleanup_all() {
  echo
  echo "[WARN] Esto eliminara cache de build, contenedores, imagenes y volumenes no usados."
  read -r -p "Confirmas limpieza total? (s/N): " confirm
  if is_yes "${confirm:-}"; then
    echo "[INFO] Bajando stack y eliminando artefactos..."
    "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" down --rmi all --volumes --remove-orphans
    docker builder prune -af
    docker system prune -a --volumes -f
  fi
  echo
  pause_enter
}

while true; do
  clear
  cat <<EOF
==========================================
  OmniPunto - Deploy Setup
  Compose file: $COMPOSE_FILE
==========================================

1) Construir contenedores y lanzar servicios
2) Detener servicios
3) Iniciar servicios
4) Ejecutar instalador (scripts/install.sh)
5) Prisma: solo migraciones
6) Prisma: migraciones + seed
7) Borrar cache, contenedores e imagenes
8) Salir
EOF

  echo
  read -r -p "Selecciona una opcion [1-8]: " option
  case "$option" in
    1) build_and_up ;;
    2) stop_services ;;
    3) start_services ;;
    4) run_install_script ;;
    5) prisma_migrate_only ;;
    6) prisma_migrate_and_seed ;;
    7) cleanup_all ;;
    8) echo "Saliendo..."; exit 0 ;;
    *) echo "Opcion invalida."; pause_enter ;;
  esac
done
