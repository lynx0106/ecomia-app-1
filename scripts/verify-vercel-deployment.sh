#!/bin/bash
# =============================================================================
# EcomIA - Vercel Deployment Verification Script
# =============================================================================
# Script para verificar el estado del deployment en Vercel
# Uso: ./scripts/verify-vercel-deployment.sh [URL]
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL por defecto
PRODUCTION_URL="${1:-https://ecom-ia.online}"

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}EcomIA - Verificación de Deployment en Vercel${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""
echo -e "Verificando URL: ${YELLOW}${PRODUCTION_URL}${NC}"
echo ""

# -----------------------------------------------------------------------------
# 1. Verificar que el sitio está accesible
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[1/7] Verificando accesibilidad del sitio...${NC}"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "${PRODUCTION_URL}" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} Sitio accesible (HTTP $HTTP_STATUS)"
elif [ "$HTTP_STATUS" = "000" ]; then
    echo -e "  ${RED}✗${NC} Error: No se pudo conectar al sitio"
    echo -e "    Verifica tu conexión de internet o que la URL sea correcta"
    exit 1
else
    echo -e "  ${RED}✗${NC} Sitio responde con error (HTTP $HTTP_STATUS)"
    exit 1
fi

# -----------------------------------------------------------------------------
# 2. Verificar certificado SSL
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[2/7] Verificando certificado SSL...${NC}"

SSL_CHECK=$(curl -vI "${PRODUCTION_URL}" 2>&1 | grep -i "SSL certificate verify" || echo "OK")

if [[ "$SSL_CHECK" == *"OK"* ]] || [[ "$SSL_CHECK" == "" ]]; then
    echo -e "  ${GREEN}✓${NC} Certificado SSL válido"
else
    echo -e "  ${RED}✗${NC} Problema con certificado SSL"
    echo -e "    $SSL_CHECK"
fi

# -----------------------------------------------------------------------------
# 3. Verificar contenido de la página
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[3/7] Verificando contenido de la landing page...${NC}"

PAGE_CONTENT=$(curl -s -L "${PRODUCTION_URL}")

# Verificar texto clave de EcomIA
if echo "$PAGE_CONTENT" | grep -q "EcomIA"; then
    echo -e "  ${GREEN}✓${NC} Contenido 'EcomIA' encontrado"
else
    echo -e "  ${RED}✗${NC} Advertencia: No se encontró 'EcomIA' en la página"
fi

# Verificar botón de Crear Cuenta
if echo "$PAGE_CONTENT" | grep -q "Crear Cuenta"; then
    echo -e "  ${GREEN}✓${NC} Botón 'Crear Cuenta' encontrado"
else
    echo -e "  ${YELLOW}⚠${NC} No se encontró 'Crear Cuenta' (puede estar en versión anterior)"
fi

# Verificar botón de Iniciar Sesión
if echo "$PAGE_CONTENT" | grep -q "Iniciar Sesión\|Iniciar Sesi"; then
    echo -e "  ${GREEN}✓${NC} Botón 'Iniciar Sesión' encontrado"
else
    echo -e "  ${YELLOW}⚠${NC} No se encontró 'Iniciar Sesión'"
fi

# -----------------------------------------------------------------------------
# 4. Verificar API endpoints
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[4/7] Verificando API endpoints...${NC}"

# Verificar endpoint /api/chat
API_CHAT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "${PRODUCTION_URL}/api/chat" || echo "000")

if [ "$API_CHAT_STATUS" = "405" ] || [ "$API_CHAT_STATUS" = "400" ]; then
    echo -e "  ${GREEN}✓${NC} API /api/chat responde (HTTP $API_CHAT_STATUS - esperado sin POST)"
elif [ "$API_CHAT_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} API /api/chat responde (HTTP $API_CHAT_STATUS)"
else
    echo -e "  ${YELLOW}⚠${NC} API /api/chat estado incierto (HTTP $API_CHAT_STATUS)"
fi

# -----------------------------------------------------------------------------
# 5. Verificar headers de respuesta
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[5/7] Verificando headers de Vercel...${NC}"

HEADERS=$(curl -s -I -L "${PRODUCTION_URL}")

if echo "$HEADERS" | grep -qi "x-vercel"; then
    echo -e "  ${GREEN}✓${NC} Headers de Vercel detectados"
    
    # Extraer información adicional
    VERCEL_ID=$(echo "$HEADERS" | grep -i "x-vercel-id" | head -1 | cut -d: -f2 | tr -d ' \r')
    if [ -n "$VERCEL_ID" ]; then
        echo -e "    Vercel ID: ${VERCEL_ID}"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} No se detectaron headers de Vercel (puede ser CDN)"
fi

# -----------------------------------------------------------------------------
# 6. Verificar tiempo de respuesta
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[6/7] Verificando tiempo de respuesta...${NC}"

RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" -L "${PRODUCTION_URL}")

# Convertir a milisegundos para comparación
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc | cut -d. -f1)

if [ "$RESPONSE_TIME_MS" -lt 1000 ]; then
    echo -e "  ${GREEN}✓${NC} Tiempo de respuesta excelente: ${RESPONSE_TIME}s"
elif [ "$RESPONSE_TIME_MS" -lt 3000 ]; then
    echo -e "  ${GREEN}✓${NC} Tiempo de respuesta bueno: ${RESPONSE_TIME}s"
elif [ "$RESPONSE_TIME_MS" -lt 5000 ]; then
    echo -e "  ${YELLOW}⚠${NC} Tiempo de respuesta aceptable: ${RESPONSE_TIME}s"
else
    echo -e "  ${RED}✗${NC} Tiempo de respuesta lento: ${RESPONSE_TIME}s"
fi

# -----------------------------------------------------------------------------
# 7. Verificar configuración local
# -----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[7/7] Verificando configuración local del proyecto...${NC}"

# Verificar que existe .env.local.example
if [ -f ".env.local.example" ]; then
    echo -e "  ${GREEN}✓${NC} Archivo .env.local.example existe"
else
    echo -e "  ${RED}✗${NC} Falta archivo .env.local.example"
fi

# Verificar package.json
if [ -f "package.json" ]; then
    echo -e "  ${GREEN}✓${NC} Archivo package.json existe"
    
    # Verificar scripts necesarios
    if grep -q '"build"' package.json; then
        echo -e "  ${GREEN}✓${NC} Script 'build' configurado"
    else
        echo -e "  ${RED}✗${NC} Falta script 'build' en package.json"
    fi
else
    echo -e "  ${RED}✗${NC} Falta archivo package.json"
fi

# Verificar next.config
if [ -f "next.config.ts" ] || [ -f "next.config.js" ]; then
    echo -e "  ${GREEN}✓${NC} Configuración de Next.js existe"
else
    echo -e "  ${RED}✗${NC} Falta configuración de Next.js"
fi

# -----------------------------------------------------------------------------
# Resumen Final
# -----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Resumen de Verificación${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""

# Contar checks exitosos
TOTAL_CHECKS=7
PASSED_CHECKS=0

# Simplificación: asumimos que si llegamos aquí, la mayoría pasó
if [ "$HTTP_STATUS" = "200" ]; then ((PASSED_CHECKS++)); fi
if [[ "$SSL_CHECK" == *"OK"* ]] || [[ "$SSL_CHECK" == "" ]]; then ((PASSED_CHECKS++)); fi
if echo "$PAGE_CONTENT" | grep -q "EcomIA"; then ((PASSED_CHECKS++)); fi
if [ "$API_CHAT_STATUS" != "000" ]; then ((PASSED_CHECKS++)); fi
if echo "$HEADERS" | grep -qi "x-vercel"; then ((PASSED_CHECKS++)); fi
if [ "$RESPONSE_TIME_MS" -lt 5000 ]; then ((PASSED_CHECKS++)); fi
if [ -f ".env.local.example" ] && [ -f "package.json" ]; then ((PASSED_CHECKS++)); fi

echo -e "Checks completados: ${GREEN}${PASSED_CHECKS}/${TOTAL_CHECKS}${NC}"
echo ""

if [ "$PASSED_CHECKS" -eq "$TOTAL_CHECKS" ]; then
    echo -e "${GREEN}✓ Deployment verificado exitosamente${NC}"
    echo -e "${GREEN}  El proyecto está correctamente desplegado en Vercel${NC}"
    EXIT_CODE=0
elif [ "$PASSED_CHECKS" -ge 5 ]; then
    echo -e "${YELLOW}⚠ Deployment funcional con advertencias${NC}"
    echo -e "${YELLOW}  Algunos checks no pasaron, revisar logs arriba${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}✗ Problemas detectados en el deployment${NC}"
    echo -e "${RED}  Revisar configuración de Vercel y logs${NC}"
    EXIT_CODE=1
fi

echo ""
echo -e "Próximos pasos:"
echo -e "  1. Revisar Vercel Dashboard: https://vercel.com/dashboard"
echo -e "  2. Verificar variables de entorno en Vercel"
echo -e "  3. Ver documentación: ${YELLOW}VERCEL_STATUS_CHECK.md${NC}"
echo ""

exit $EXIT_CODE
