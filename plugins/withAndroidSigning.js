const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin: assinatura de release do Android.
 *
 * O template do prebuild assina o buildType `release` com a debug.keystore
 * ("Caution! In production, you need to generate your own keystore file"), o que
 * gera um AAB que o Play Console recusa. Como `npx expo prebuild` reescreve o
 * android/app/build.gradle a cada execução, a configuração precisa ser aplicada
 * por plugin — editar o arquivo à mão é perdido no próximo prebuild.
 *
 * As credenciais NÃO ficam no repositório: o Gradle lê `android/keystore.properties`
 * (ignorado pelo git) ou, se o arquivo não existir, as variáveis de ambiente
 * TOTALDOC_KEYSTORE_* — útil em CI. Sem nenhum dos dois o build de release falha
 * com mensagem explícita, em vez de gerar silenciosamente um artefato assinado
 * com a chave de debug.
 */

const SIGNING_CONFIG = `// >>> totaldoc:signing (injetado por plugins/withAndroidSigning.js)
// O arquivo fica na RAIZ do projeto, nao em android/: o \`expo prebuild --clean\`
// apaga a pasta android/ inteira e levaria as credenciais junto. Mantemos a
// leitura de android/keystore.properties como fallback.
def keystorePropertiesFile = rootProject.file('../keystore.properties')
if (!keystorePropertiesFile.exists()) {
    keystorePropertiesFile = rootProject.file('keystore.properties')
}
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

def resolveSigning = { String propKey, String envKey ->
    return keystoreProperties.getProperty(propKey) ?: System.getenv(envKey)
}
// <<< totaldoc:signing
`;

const RELEASE_SIGNING_CONFIG = `
        // >>> totaldoc:signing
        release {
            def storeFilePath = resolveSigning('storeFile', 'TOTALDOC_KEYSTORE_FILE')
            def storePasswordValue = resolveSigning('storePassword', 'TOTALDOC_KEYSTORE_PASSWORD')
            def keyAliasValue = resolveSigning('keyAlias', 'TOTALDOC_KEY_ALIAS')
            def keyPasswordValue = resolveSigning('keyPassword', 'TOTALDOC_KEY_PASSWORD')

            if (storeFilePath != null) {
                storeFile file(storeFilePath)
                storePassword storePasswordValue
                keyAlias keyAliasValue
                keyPassword keyPasswordValue
            }
        }
        // <<< totaldoc:signing
`;

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('totaldoc:signing')) {
      return config;
    }

    // 1. Carrega as credenciais antes do bloco android { }
    contents = contents.replace(/^android \{/m, `${SIGNING_CONFIG}\nandroid {`);

    // 2. Declara o signingConfig `release` ao lado do `debug` existente
    contents = contents.replace(
      /(signingConfigs \{)/,
      `$1${RELEASE_SIGNING_CONFIG}`
    );

    // 3. Aponta o buildType release para a chave de produção. Se o keystore não
    //    estiver configurado o build falha — nunca cai de volta na debug.keystore.
    contents = contents.replace(
      /(release \{\s*\n\s*)\/\/ Caution! In production[^\n]*\n\s*\/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\n\s*signingConfig signingConfigs\.debug/,
      `$1// >>> totaldoc:signing — chave de produção (ver BUILD-LOCAL.md)
            if (signingConfigs.release.storeFile == null) {
                throw new GradleException("Keystore de release ausente. Crie android/keystore.properties ou defina TOTALDOC_KEYSTORE_FILE/PASSWORD/KEY_ALIAS/KEY_PASSWORD. Veja BUILD-LOCAL.md.")
            }
            signingConfig signingConfigs.release
            // <<< totaldoc:signing`
    );

    config.modResults.contents = contents;
    return config;
  });
};
