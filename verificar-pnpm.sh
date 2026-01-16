#!/bin/bash
# Script para verificar que pnpm está funcionando correctamente

echo "🔍 Verificando instalación de pnpm..."
echo ""

# Verificar que pnpm está instalado
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm está instalado"
    echo "   Ubicación: $(which pnpm)"
    echo "   Versión: $(pnpm --version)"
    echo ""
    echo "✅ Puedes usar pnpm normalmente:"
    echo "   pnpm install    # Instalar dependencias"
    echo "   pnpm dev        # Ejecutar en desarrollo"
    echo "   pnpm build      # Construir para producción"
else
    echo "❌ pnpm no está instalado"
    echo ""
    echo "Instala pnpm con:"
    echo "curl -fsSL https://get.pnpm.io/install.sh | sh -"
    echo "source ~/.zshrc"
fi
