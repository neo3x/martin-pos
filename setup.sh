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
  Martin POS - Deploy Setup
  Compose file: $COMPOSE_FILE
==========================================

1) Construir contenedores y lanzar servicios
2) Detener servicios
3) Iniciar servicios
4) Ejecutar instalador (scripts/install.sh)
5) Borrar cache, contenedores e imagenes
6) Salir
EOF

  echo
  read -r -p "Selecciona una opcion [1-6]: " option
  case "$option" in
    1) build_and_up ;;
    2) stop_services ;;
    3) start_services ;;
    4) run_install_script ;;
    5) cleanup_all ;;
    6) echo "Saliendo..."; exit 0 ;;
    *) echo "Opcion invalida."; pause_enter ;;
  esac
done
