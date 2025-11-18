#!/bin/bash

echo "🏪 Iniciando Martin POS en modo desarrollo..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Archivo .env no encontrado. Ejecuta primero: ./scripts/install.sh"
    exit 1
fi

# Start Docker services if needed
if command -v docker-compose &> /dev/null; then
    echo "🐳 Iniciando servicios Docker..."
    docker-compose up -d postgres redis
    sleep 3
fi

# Start all services
echo "🚀 Iniciando servicios..."
pnpm dev
