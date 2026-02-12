#!/bin/bash
# =============================================================================
# EcomIA - Log Cleanup Script
# =============================================================================
# Script para limpiar logs antiguos y mantener el repositorio limpio
# Uso: ./scripts/cleanup-logs.sh
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}EcomIA - Log Cleanup Script${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""

# Directorio base del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# -----------------------------------------------------------------------------
# 1. Limpiar logs en directorio raíz
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[1/3] Limpiando logs en directorio raíz...${NC}"

if [ -f "startup.log" ]; then
    LOG_SIZE=$(du -h startup.log | cut -f1)
    echo "  → Eliminando startup.log ($LOG_SIZE)"
    rm -f startup.log
    echo -e "  ${GREEN}✓${NC} startup.log eliminado"
else
    echo "  → No se encontró startup.log"
fi

# Limpiar otros archivos .log en raíz
LOG_COUNT=$(find . -maxdepth 1 -name "*.log" -type f 2>/dev/null | wc -l)
if [ "$LOG_COUNT" -gt 0 ]; then
    echo "  → Eliminando $LOG_COUNT archivo(s) .log en raíz"
    find . -maxdepth 1 -name "*.log" -type f -delete
    echo -e "  ${GREEN}✓${NC} Archivos .log eliminados"
fi

# -----------------------------------------------------------------------------
# 2. Limpiar directorio logs/
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[2/3] Limpiando directorio logs/...${NC}"

if [ -d "logs" ]; then
    # Contar archivos antes de limpiar
    TOTAL_FILES=$(find logs -type f 2>/dev/null | wc -l)
    
    if [ "$TOTAL_FILES" -gt 0 ]; then
        # Calcular tamaño total
        TOTAL_SIZE=$(du -sh logs 2>/dev/null | cut -f1)
        echo "  → Encontrados $TOTAL_FILES archivos ($TOTAL_SIZE)"
        
        # Eliminar logs más antiguos que 7 días
        OLD_LOGS=$(find logs -type f -mtime +7 2>/dev/null | wc -l)
        if [ "$OLD_LOGS" -gt 0 ]; then
            echo "  → Eliminando $OLD_LOGS logs antiguos (>7 días)"
            find logs -type f -mtime +7 -delete
            echo -e "  ${GREEN}✓${NC} Logs antiguos eliminados"
        else
            echo "  → No hay logs antiguos para eliminar"
        fi
        
        # Opcional: Comprimir logs recientes
        RECENT_LOGS=$(find logs -type f -name "*.log" ! -name "*.gz" 2>/dev/null | wc -l)
        if [ "$RECENT_LOGS" -gt 0 ]; then
            echo "  → Comprimiendo $RECENT_LOGS logs recientes..."
            find logs -type f -name "*.log" ! -name "*.gz" -exec gzip {} \;
            echo -e "  ${GREEN}✓${NC} Logs comprimidos (.gz)"
        fi
    else
        echo "  → Directorio logs/ está vacío"
    fi
else
    echo "  → Directorio logs/ no existe"
fi

# -----------------------------------------------------------------------------
# 3. Limpiar logs de npm/node
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[3/3] Limpiando logs de npm/node...${NC}"

NPM_LOGS=$(find . -maxdepth 1 -name "npm-debug.log*" -o -name "yarn-error.log*" 2>/dev/null | wc -l)
if [ "$NPM_LOGS" -gt 0 ]; then
    echo "  → Eliminando $NPM_LOGS logs de npm/yarn"
    find . -maxdepth 1 \( -name "npm-debug.log*" -o -name "yarn-error.log*" \) -delete
    echo -e "  ${GREEN}✓${NC} Logs de npm/yarn eliminados"
else
    echo "  → No hay logs de npm/yarn"
fi

# -----------------------------------------------------------------------------
# Resumen
# -----------------------------------------------------------------------------
echo ""
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}✓ Limpieza completada${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo "Política de logs:"
echo "  • Logs > 7 días: Eliminados automáticamente"
echo "  • Logs recientes: Comprimidos (.gz)"
echo "  • startup.log: Eliminado si existe"
echo ""
echo "Recomendaciones:"
echo "  • Ejecuta este script semanalmente: ./scripts/cleanup-logs.sh"
echo "  • Configura cron job para automatización (opcional)"
echo "  • Los logs están en .gitignore y no se commitean"
echo ""
echo -e "${YELLOW}Nota:${NC} Para rotación automática en producción, considera usar Winston o Pino"
echo ""
