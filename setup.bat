@echo off
setlocal EnableDelayedExpansion

if exist docker-compose.prod.yml (
  set "COMPOSE_FILE=docker-compose.prod.yml"
) else (
  set "COMPOSE_FILE=docker-compose.yml"
)

set "DOCKER_COMPOSE="
docker compose version >nul 2>&1
if %errorlevel%==0 (
  set "DOCKER_COMPOSE=docker compose"
) else (
  docker-compose version >nul 2>&1
  if %errorlevel%==0 (
    set "DOCKER_COMPOSE=docker-compose"
  )
)

if "%DOCKER_COMPOSE%"=="" (
  echo [ERROR] No se encontro Docker Compose. Instala Docker Desktop o docker-compose.
  exit /b 1
)

:menu
cls
echo ==========================================
echo   Martin POS - Deploy Setup
echo   Compose file: %COMPOSE_FILE%
echo ==========================================
echo.
echo 1. Construir contenedores y lanzar servicios
echo 2. Detener servicios
echo 3. Iniciar servicios
echo 4. Borrar cache, contenedores e imagenes
echo 5. Salir
echo.
choice /c 12345 /n /m "Selecciona una opcion: "

if errorlevel 5 goto end
if errorlevel 4 goto cleanup
if errorlevel 3 goto start_services
if errorlevel 2 goto stop_services
if errorlevel 1 goto build_and_up

goto menu

:build_and_up
echo.
echo [INFO] Construyendo e iniciando servicios...
%DOCKER_COMPOSE% -f %COMPOSE_FILE% up -d --build
echo.
pause
goto menu

:stop_services
echo.
echo [INFO] Deteniendo servicios...
%DOCKER_COMPOSE% -f %COMPOSE_FILE% stop
echo.
pause
goto menu

:start_services
echo.
echo [INFO] Iniciando servicios...
%DOCKER_COMPOSE% -f %COMPOSE_FILE% start
echo.
choice /c SN /n /m "Deseas ver logs de eventos? (S/N): "
if errorlevel 2 goto start_done
if errorlevel 1 (
  %DOCKER_COMPOSE% -f %COMPOSE_FILE% logs -f
)

:start_done
echo.
pause
goto menu

:cleanup
echo.
echo [WARN] Esto eliminara cache de build, contenedores, imagenes y volumenes no usados.
choice /c SN /n /m "Confirmas limpieza total? (S/N): "
if errorlevel 2 goto menu
if errorlevel 1 (
  echo [INFO] Bajando stack y eliminando artefactos...
  %DOCKER_COMPOSE% -f %COMPOSE_FILE% down --rmi all --volumes --remove-orphans
  docker builder prune -af
  docker system prune -a --volumes -f
)
echo.
pause
goto menu

:end
echo Saliendo...
exit /b 0
