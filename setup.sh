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

build_and_up() {
  echo
  echo "[INFO] Construyendo e iniciando servicios..."
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" up -d --build
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
  read -r -p "Deseas ver logs de eventos? (s/N): " show_logs
  if [[ "${show_logs,,}" == "s" || "${show_logs,,}" == "si" ]]; then
    "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" logs -f
  fi
  echo
  pause_enter
}

cleanup_all() {
  echo
  echo "[WARN] Esto eliminara cache de build, contenedores, imagenes y volumenes no usados."
  read -r -p "Confirmas limpieza total? (s/N): " confirm
  if [[ "${confirm,,}" == "s" || "${confirm,,}" == "si" ]]; then
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
4) Borrar cache, contenedores e imagenes
5) Salir
EOF

  echo
  read -r -p "Selecciona una opcion [1-5]: " option
  case "$option" in
    1) build_and_up ;;
    2) stop_services ;;
    3) start_services ;;
    4) cleanup_all ;;
    5) echo "Saliendo..."; exit 0 ;;
    *) echo "Opcion invalida."; pause_enter ;;
  esac
done
