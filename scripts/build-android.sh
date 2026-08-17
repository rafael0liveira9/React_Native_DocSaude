#!/bin/bash
# Build local de release do Android (AAB para o Play Console), sem EAS.
#
#   ./scripts/build-android.sh            # produção (padrão)
#   ./scripts/build-android.sh dev        # aponta para a API de homologação
#   ./scripts/build-android.sh prod aab   # so o AAB (Play Console)
#   ./scripts/build-android.sh prod apk   # so o APK (instalar direto)
# Sem o 2o argumento gera os DOIS numa unica compilacao.
#
# Requer android/keystore.properties (ver BUILD-LOCAL.md). Sem ele o Gradle
# aborta em vez de assinar com a chave de debug.
set -euo pipefail

cd "$(dirname "$0")/.."

AMBIENTE="${1:-prod}"
FORMATO="${2:-ambos}"

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
case "$FORMATO" in
  apk)   ./gradlew assembleRelease ;;
  aab)   ./gradlew bundleRelease ;;
  ambos) ./gradlew bundleRelease assembleRelease ;;
esac
cd ..

# Os artefatos são copiados para dist/android/ porque `expo prebuild --clean`
# apaga a pasta android/ inteira no início de todo build — o AAB gerado numa
# execução some quando a seguinte gera o APK. Aqui eles sobrevivem.
mkdir -p dist/android
echo
echo "==> Artefatos em dist/android/"

APKSIGNER=$(find "${ANDROID_HOME:-$HOME/Library/Android/sdk}/build-tools" -name apksigner 2>/dev/null | sort -V | tail -1)

publicar() {
  local origem="$1" destino="dist/android/$2"
  [ -f "$origem" ] || return 0
  cp "$origem" "$destino"
  echo "    $destino  ($(ls -lh "$destino" | awk '{print $5}'))"
  # Confere que não saiu com a chave de debug
  if [ "${destino##*.}" = "apk" ] && [ -n "$APKSIGNER" ]; then
    "$APKSIGNER" verify --print-certs "$destino" 2>/dev/null \
      | grep -i "certificate DN" | sed 's/^/      /' || true
  fi
}

publicar android/app/build/outputs/bundle/release/app-release.aab "app-${AMBIENTE}-v${VERSION_NAME}-${VERSION_CODE}.aab"
publicar android/app/build/outputs/apk/release/app-release.apk "app-${AMBIENTE}-v${VERSION_NAME}-${VERSION_CODE}.apk"

# Prova de qual ambiente ficou embutido, lida do artefato pronto
echo "==> Ambiente embutido no bundle JS"
PACOTE=$(ls dist/android/app-${AMBIENTE}-v${VERSION_NAME}-${VERSION_CODE}.* 2>/dev/null | head -1)
if [ -n "$PACOTE" ]; then
  CAMINHO_BUNDLE="assets/index.android.bundle"
  [ "${PACOTE##*.}" = "aab" ] && CAMINHO_BUNDLE="base/assets/index.android.bundle"
  # O `strings` do macOS não lê de pipe: precisa de um arquivo em disco.
  TMP_BUNDLE=$(mktemp -d)
  unzip -o -q "$PACOTE" "$CAMINHO_BUNDLE" -d "$TMP_BUNDLE" 2>/dev/null || true
  strings -a "$TMP_BUNDLE/$CAMINHO_BUNDLE" 2>/dev/null \
    | grep -o "https://[a-z0-9]*\.execute-api\.us-east-1\.amazonaws\.com/[a-z]*" \
    | sort -u | sed 's/^/    /'
  rm -rf "$TMP_BUNDLE"
fi
