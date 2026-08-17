#!/bin/bash
# Build local de release do iOS (.ipa para App Store Connect / TestFlight), sem EAS.
#
#   ./scripts/build-ios.sh              # produção (padrão)
#   ./scripts/build-ios.sh dev          # aponta para a API de homologação
#   ./scripts/build-ios.sh prod upload  # compila e envia para o TestFlight
#
# Requer certificado "Apple Distribution" e o provisioning profile de App Store
# instalados no Keychain. Ver BUILD-LOCAL.md.
set -euo pipefail

cd "$(dirname "$0")/.."

AMBIENTE="${1:-prod}"
ACAO="${2:-}"

SCHEME="TotalDocSade"
WORKSPACE="ios/$SCHEME.xcworkspace"
TEAM_ID="54YRYNDX6B"
SAIDA="build/ios"

API_PROD="https://yk171d97y4.execute-api.us-east-1.amazonaws.com/prd"
API_DEV="https://vpaa97q6g8.execute-api.us-east-1.amazonaws.com/dev"

case "$AMBIENTE" in
  prod) API_URL="$API_PROD" ;;
  dev)  API_URL="$API_DEV" ;;
  *) echo "Ambiente inválido: $AMBIENTE (use prod ou dev)"; exit 1 ;;
esac

# Mesmo cuidado do Android: .env.local aponta para homologação e tem precedência
# sobre .env.production, e o Metro reaproveita bundle em cache entre ambientes.
export EXPO_PUBLIC_API_URL="$API_URL"
export EXPO_NO_DOTENV=1
export NODE_ENV=production
rm -rf "${TMPDIR:-/tmp}"/metro-cache 2>/dev/null || true

VERSION_NAME=$(node -p "require('./app.json').expo.version")
BUILD_NUMBER=$(node -p "require('./app.json').expo.ios.buildNumber")
echo "==> Ambiente: $AMBIENTE  |  API: $API_URL"
echo "==> Versão: $VERSION_NAME (build $BUILD_NUMBER)"

echo "==> Regenerando projeto nativo (expo prebuild)"
npx expo prebuild --platform ios --clean

echo "==> Instalando pods"
(cd ios && pod install)

rm -rf "$SAIDA"
mkdir -p "$SAIDA"

echo "==> Arquivando (xcodebuild archive)"
xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$SAIDA/$SCHEME.xcarchive" \
  -destination "generic/platform=iOS" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  -allowProvisioningUpdates \
  | grep -E "error:|warning: unable|Archive Succeeded|\*\* ARCHIVE" || true

if [ ! -d "$SAIDA/$SCHEME.xcarchive" ]; then
  echo "ERRO: archive não foi gerado. Rode o comando sem o filtro de log para ver o erro completo."
  exit 1
fi

echo "==> Exportando .ipa"
xcodebuild -exportArchive \
  -archivePath "$SAIDA/$SCHEME.xcarchive" \
  -exportPath "$SAIDA" \
  -exportOptionsPlist build-config/ExportOptions.plist \
  -allowProvisioningUpdates

IPA=$(find "$SAIDA" -name "*.ipa" | head -1)
echo
echo "==> Pronto: $IPA"
ls -lh "$IPA" | awk '{print "    tamanho: " $5}'

if [ "$ACAO" = "upload" ]; then
  if [ -z "${ASC_KEY_ID:-}" ] || [ -z "${ASC_ISSUER_ID:-}" ]; then
    echo "ERRO: defina ASC_KEY_ID e ASC_ISSUER_ID (chave da App Store Connect API)."
    echo "      Ver BUILD-LOCAL.md — seção 'Envio para o TestFlight'."
    exit 1
  fi
  echo "==> Enviando para a App Store Connect"
  xcrun altool --upload-app \
    --type ios \
    --file "$IPA" \
    --apiKey "$ASC_KEY_ID" \
    --apiIssuer "$ASC_ISSUER_ID"
  echo "==> Enviado. O processamento no TestFlight leva alguns minutos."
else
  echo
  echo "Para enviar ao TestFlight:  ./scripts/build-ios.sh $AMBIENTE upload"
  echo "Ou abra o Transporter.app e arraste o .ipa acima."
fi
