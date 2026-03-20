#!/bin/bash

echo "🏪 Martin POS - Instalador"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18 o superior."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Instalando pnpm..."
    npm install -g pnpm
fi

echo "✅ Prerequisitos verificados"
echo ""

# Ask for module type
echo "Selecciona el módulo a instalar:"
echo "1) Restaurante"
echo "2) Librería/Bazar"
echo "3) Minimarket"
echo "4) Todos los módulos"
read -p "Opción (1-4): " module_choice

case $module_choice in
    1) MODULE_TYPE="RESTAURANT" ;;
    2) MODULE_TYPE="BOOKSTORE" ;;
    3) MODULE_TYPE="MINIMARKET" ;;
    4) MODULE_TYPE="ALL" ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "📦 Instalando dependencias..."
pnpm install

echo ""
echo "⚙️  Configurando entorno..."

# Create .env file
cat > .env << EOL
# Database
DATABASE_URL="postgresql://martinpos:martinpos123@localhost:5436/martin_pos?schema=public"
POSTGRES_PORT=5436

# JWT
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRES_IN="7d"

# AI APIs (configúralas después)
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""

# App Config
APP_PORT=3001
WEB_PORT=3008
NODE_ENV=development

# Módulo instalado
INSTALLED_MODULE="$MODULE_TYPE"

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"
EOL

echo "✅ Archivo .env creado"
echo ""

# Ask for Docker or local PostgreSQL
echo "¿Cómo quieres ejecutar PostgreSQL?"
echo "1) Docker (recomendado)"
echo "2) PostgreSQL local (ya instalado)"
read -p "Opción (1-2): " db_choice

if [ "$db_choice" == "1" ]; then
    echo ""
    echo "🐳 Iniciando PostgreSQL con Docker..."
    docker-compose up -d postgres redis

    echo "⏳ Esperando que PostgreSQL esté listo..."
    sleep 5
fi

echo ""
echo "🗄️  Configurando base de datos..."
pnpm db:generate
pnpm db:migrate
pnpm --filter @martin-pos/database prisma:seed

echo ""
echo "✅ ¡Instalación completada!"
echo ""
echo "🚀 Para iniciar la aplicación:"
echo ""
echo "  # Iniciar todo:"
echo "  pnpm dev"
echo ""
echo "  # O individualmente:"
echo "  pnpm backend:dev   # API en http://localhost:3001"
echo "  pnpm web:dev       # Web en http://localhost:3000"
echo "  pnpm mobile:dev    # Expo mobile app"
echo ""
echo "📝 Usuario por defecto:"
echo "  Email: admin@martinpos.com"
echo "  Password: admin123"
echo ""
echo "⚠️  No olvides configurar tus API keys de IA en el archivo .env"
