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
echo   OmniPunto - Deploy Setup
echo   Compose file: %COMPOSE_FILE%
echo ==========================================
echo.
echo 1. Construir contenedores y lanzar servicios
echo 2. Detener servicios
echo 3. Iniciar servicios
echo 4. Prisma: solo migraciones
echo 5. Prisma: migraciones + seed
echo 6. Borrar cache, contenedores e imagenes
echo 7. Salir
echo.
choice /c 1234567 /n /m "Selecciona una opcion: "

if errorlevel 7 goto end
if errorlevel 6 goto cleanup
if errorlevel 5 goto prisma_migrate_seed
if errorlevel 4 goto prisma_migrate_only
if errorlevel 3 goto start_services
if errorlevel 2 goto stop_services
if errorlevel 1 goto build_and_up

goto menu

:build_and_up
echo.
echo [INFO] Construyendo e iniciando servicios...
%DOCKER_COMPOSE% -f %COMPOSE_FILE% up -d --build
if errorlevel 1 (
  echo [ERROR] Fallo la construccion o el inicio de servicios.
  echo.
  set "showLogsErr="
  set /p showLogsErr="Deseas ver logs de eventos? (S/N): "
  if /I "!showLogsErr!"=="S" (
    %DOCKER_COMPOSE% -f %COMPOSE_FILE% logs -f
  )
  echo.
  pause
  goto menu
)
echo.
choice /c SN /n /m "Deseas ver logs de eventos? (S/N): "
if errorlevel 2 goto build_done
if errorlevel 1 (
  %DOCKER_COMPOSE% -f %COMPOSE_FILE% logs -f
)

:build_done
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

:prisma_migrate_only
call :ensure_prisma_services
if errorlevel 1 (
  echo.
  pause
  goto menu
)

call :run_prisma_migrate
if errorlevel 1 (
  echo.
  pause
  goto menu
)

echo.
echo [INFO] Migraciones Prisma aplicadas correctamente.
echo.
pause
goto menu

:prisma_migrate_seed
call :ensure_prisma_services
if errorlevel 1 (
  echo.
  pause
  goto menu
)

call :run_prisma_migrate
if errorlevel 1 (
  echo.
  pause
  goto menu
)

call :run_prisma_seed
if errorlevel 1 (
  echo.
  pause
  goto menu
)

echo.
echo [INFO] Migraciones y seed Prisma finalizados.
echo.
pause
goto menu

:ensure_prisma_services
echo.
echo [INFO] Levantando servicios requeridos (postgres + backend)...
%DOCKER_COMPOSE% -f %COMPOSE_FILE% up -d postgres backend
if errorlevel 1 (
  echo [ERROR] No fue posible iniciar postgres/backend.
  exit /b 1
)
exit /b 0

:run_prisma_migrate
echo.
echo [INFO] Ejecutando Prisma migrate deploy...
%DOCKER_COMPOSE% -f %COMPOSE_FILE% exec backend sh -lc "/app/packages/database/node_modules/.bin/prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma"
if errorlevel 1 (
  echo [ERROR] No fue posible ejecutar migrate deploy.
  echo         Verifica estado del backend y la base de datos.
  exit /b 1
)
exit /b 0

:run_prisma_seed
echo.
echo [INFO] Ejecutando seed Prisma...
%DOCKER_COMPOSE% -f %COMPOSE_FILE% exec backend sh -lc "cd /app/packages/database && npx ts-node prisma/seed.ts"
if errorlevel 1 (
  echo [ERROR] El seed fallo. Revisa logs de backend y estado de la base de datos.
  exit /b 1
)
echo [INFO] Seed completado.
exit /b 0

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
