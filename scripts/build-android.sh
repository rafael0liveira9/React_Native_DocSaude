#!/bin/bash
# Build local de release do Android (AAB para o Play Console), sem EAS.
#
#   ./scripts/build-android.sh            # produção (padrão)
#   ./scripts/build-android.sh dev        # aponta para a API de homologação
#   ./scripts/build-android.sh prod apk   # APK avulso em vez de AAB
#
# Requer android/keystore.properties (ver BUILD-LOCAL.md). Sem ele o Gradle
# aborta em vez de assinar com a chave de debug.
set -euo pipefail

cd "$(dirname "$0")/.."

AMBIENTE="${1:-prod}"
FORMATO="${2:-aab}"

API_PROD="https://yk171d97y4.execute-api.us-east-1.amazonaws.com/prd"
API_DEV="https://vpaa97q6g8.execute-api.us-east-1.amazonaws.com/dev"

case "$AMBIENTE" in
  prod) API_URL="$API_PROD" ;;
  dev)  API_URL="$API_DEV" ;;
  *) echo "Ambiente inválido: $AMBIENTE (use prod ou dev)"; exit 1 ;;
esac

# As credenciais ficam na RAIZ do projeto: o `expo prebuild --clean` mais abaixo
# apaga a pasta android/ inteira, entao um keystore.properties lá dentro seria
# destruído antes do Gradle lê-lo.
if [ ! -f keystore.properties ] && [ ! -f android/keystore.properties ] && [ -z "${TOTALDOC_KEYSTORE_FILE:-}" ]; then
  echo "ERRO: keystore.properties não encontrado na raiz do projeto e"
  echo "      TOTALDOC_KEYSTORE_FILE não definido."
  echo "      Veja BUILD-LOCAL.md — seção 'Keystore do Android'."
  exit 1
fi

# O Expo carrega .env.local mesmo em NODE_ENV=production e ele tem precedência
# sobre .env.production. Como o .env.local do projeto aponta para homologação, um
# build de produção sairia falando com o ambiente errado. Por isso o ambiente é
# definido aqui explicitamente e o .env.local é neutralizado durante o build.
export EXPO_PUBLIC_API_URL="$API_URL"
export EXPO_NO_DOTENV=1
export NODE_ENV=production

# O Metro reaproveita o bundle em cache mesmo quando EXPO_PUBLIC_API_URL muda —
# testado: um build de produção logo após um de homologação saiu com a URL de
# homologação embutida. Limpar o cache é o que garante o ambiente correto.
rm -rf "${TMPDIR:-/tmp}"/metro-cache 2>/dev/null || true

echo "==> Ambiente: $AMBIENTE  |  API: $API_URL"
echo "==> Formato: $FORMATO"

VERSION_NAME=$(node -p "require('./app.json').expo.version")
VERSION_CODE=$(node -p "require('./app.json').expo.android.versionCode")
echo "==> Versão: $VERSION_NAME (versionCode $VERSION_CODE)"

echo "==> Regenerando projeto nativo (expo prebuild)"
npx expo prebuild --platform android --clean

echo "==> Compilando"
cd android
if [ "$FORMATO" = "apk" ]; then
  ./gradlew assembleRelease
  ARTEFATO="android/app/build/outputs/apk/release/app-release.apk"
else
  ./gradlew bundleRelease
  ARTEFATO="android/app/build/outputs/bundle/release/app-release.aab"
fi
cd ..

echo
echo "==> Pronto: $ARTEFATO"
ls -lh "$ARTEFATO" | awk '{print "    tamanho: " $5}'

# Confere que o artefato NÃO saiu com a chave de debug
echo "==> Verificando assinatura"
if [ "$FORMATO" = "apk" ]; then
  APKSIGNER=$(find "${ANDROID_HOME:-$HOME/Library/Android/sdk}/build-tools" -name apksigner | sort -V | tail -1)
  "$APKSIGNER" verify --print-certs "$ARTEFATO" | grep -i "signer #1 certificate DN" || true
else
  unzip -p "$ARTEFATO" META-INF/*.RSA 2>/dev/null | keytool -printcert 2>/dev/null | grep -i "Owner:" || \
    echo "    (AAB assinado — confira o fingerprint no Play Console após o upload)"
fi
