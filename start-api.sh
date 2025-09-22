#!/bin/bash

# Script de inicialização da API do Detector Inteligente
# Uso: ./start-api.sh [development|production]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar argumentos
MODE=${1:-development}

if [[ "$MODE" != "development" && "$MODE" != "production" ]]; then
    error "Modo inválido. Use: development ou production"
    exit 1
fi

log "🔍 Iniciando Detector Inteligente API em modo: $MODE"

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    error "Python 3 não encontrado. Instale Python 3.8+"
    exit 1
fi

# Verificar versão do Python
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
log "📍 Python version: $PYTHON_VERSION"

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    log "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativar ambiente virtual
log "🔧 Ativando ambiente virtual..."
source venv/bin/activate

# Atualizar pip
log "⬆️ Atualizando pip..."
pip install --upgrade pip

# Instalar dependências
if [ -f "requirements-api.txt" ]; then
    log "📚 Instalando dependências..."
    pip install -r requirements-api.txt
else
    warn "Arquivo requirements-api.txt não encontrado. Instalando dependências básicas..."
    pip install Flask Flask-CORS Werkzeug Pillow
fi

# Verificar arquivos necessários
REQUIRED_FILES=("api-server-swagger.py" "swagger.yaml" "swagger-ui.html")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        error "Arquivo obrigatório não encontrado: $file"
        exit 1
    fi
done

# Configurar variáveis de ambiente
export FLASK_APP=api-server-swagger.py
export FLASK_ENV=$MODE

if [ "$MODE" = "development" ]; then
    export DEBUG=true
    export PORT=5000
    log "🛠️ Modo desenvolvimento ativado"
else
    export DEBUG=false
    export PORT=${PORT:-8000}
    log "🚀 Modo produção ativado"
fi

# Criar diretórios necessários
mkdir -p /tmp/detector_uploads
mkdir -p logs

# Verificar porta disponível
if command -v lsof &> /dev/null; then
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        warn "Porta $PORT já está em uso"
        read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Função para cleanup
cleanup() {
    log "🧹 Limpando recursos..."
    # Matar processos filhos
    jobs -p | xargs -r kill
    exit 0
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

# Mostrar informações da API
log "📋 Informações da API:"
echo -e "   ${BLUE}Nome:${NC} Detector Inteligente API"
echo -e "   ${BLUE}Versão:${NC} 7.3.4"
echo -e "   ${BLUE}Modo:${NC} $MODE"
echo -e "   ${BLUE}Porta:${NC} $PORT"
echo -e "   ${BLUE}Debug:${NC} $DEBUG"

# URLs importantes
echo -e "\n${GREEN}🌐 URLs Importantes:${NC}"
echo -e "   ${BLUE}API Base:${NC} http://localhost:$PORT"
echo -e "   ${BLUE}Documentação:${NC} http://localhost:$PORT/docs"
echo -e "   ${BLUE}Health Check:${NC} http://localhost:$PORT/v1/health"
echo -e "   ${BLUE}Métricas:${NC} http://localhost:$PORT/v1/metrics"
echo -e "   ${BLUE}Swagger Spec:${NC} http://localhost:$PORT/swagger.yaml"

# Exemplos de uso
echo -e "\n${GREEN}📝 Exemplos de Uso:${NC}"
echo -e "   ${BLUE}Análise básica:${NC}"
echo -e "   curl -X POST http://localhost:$PORT/v1/analyze \\"
echo -e "        -H \"X-API-Key: demo-key-123\" \\"
echo -e "        -F \"image=@screenshot.jpg\""
echo -e ""
echo -e "   ${BLUE}Health check:${NC}"
echo -e "   curl http://localhost:$PORT/v1/health"

# Iniciar servidor
echo -e "\n${GREEN}🚀 Iniciando servidor...${NC}"

if [ "$MODE" = "production" ]; then
    # Produção com Gunicorn
    if command -v gunicorn &> /dev/null; then
        log "🏭 Iniciando com Gunicorn (produção)"
        exec gunicorn \
            --bind 0.0.0.0:$PORT \
            --workers 4 \
            --worker-class gevent \
            --worker-connections 1000 \
            --timeout 30 \
            --keepalive 2 \
            --max-requests 1000 \
            --max-requests-jitter 100 \
            --access-logfile logs/access.log \
            --error-logfile logs/error.log \
            --log-level info \
            api-server-swagger:app
    else
        warn "Gunicorn não encontrado. Usando Flask development server"
        python3 api-server-swagger.py
    fi
else
    # Desenvolvimento com Flask
    log "🛠️ Iniciando com Flask development server"
    python3 api-server-swagger.py
fi
