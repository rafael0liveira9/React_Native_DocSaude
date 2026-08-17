const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin: corrige script phases que quebram quando o caminho do
 * projeto contém espaço — como "…/Clientes/totalDoc/Aplicativo Mobile".
 *
 * O expo-constants declara no podspec um script phase assim:
 *
 *     bash -l -c "$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh"
 *
 * As aspas protegem a expansão no /bin/sh, mas o `bash -c` recebe a string já
 * expandida e a divide de novo nos espaços. O build então falha com:
 *
 *     bash: /Users/…/totalDoc/Aplicativo: No such file or directory
 *
 * No EAS isso nunca aparece porque lá o checkout fica em /home/expo/workingdir.
 * Localmente restariam duas saídas: renomear a pasta do projeto ou blindar o
 * script — este plugin faz a segunda, adicionando ao Podfile um post_install que
 * reescreve os script phases com o caminho entre aspas antes do build.
 */

const MARCADOR = '# >>> totaldoc:space-fix';

// Ruby injetado no post_install do Podfile. String.raw preserva as barras
// invertidas exigidas pelo Ruby sem uma segunda camada de escape do JS.
const POST_INSTALL_FIX = String.raw`
    # >>> totaldoc:space-fix
    # Protege caminhos com espaco nos script phases (plugins/withPodScriptPhaseSpaceFix.js)
    installer.pods_project.targets.each do |target|
      target.build_phases.each do |phase|
        next unless phase.respond_to?(:shell_script) && phase.shell_script
        original = phase.shell_script
        corrigido = original.gsub(/bash -l -c "(\$[A-Za-z_][A-Za-z0-9_]*[^"]*)"/) do
          'bash -l -c "\"' + $1 + '\""'
        end
        phase.shell_script = corrigido if corrigido != original
      end
    end
    installer.pods_project.save
    # <<< totaldoc:space-fix
`;

/**
 * O mesmo problema existe no target do app: o "Bundle React Native code and
 * images" executa o caminho do react-native-xcode.sh via crase, e o resultado
 * (com espaço) é dividido em duas palavras:
 *
 *     `"$NODE_BINARY" --print "…react-native-xcode.sh"`
 *
 * Trocamos por "$( … )", que preserva o caminho inteiro como um argumento só.
 */
function withAppBundleScriptSpaceFix(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const fases = project.hash.project.objects.PBXShellScriptBuildPhase || {};

    Object.keys(fases).forEach((chave) => {
      const fase = fases[chave];
      if (!fase || typeof fase !== 'object' || !fase.shellScript) return;

      // O valor vem serializado como literal de string do pbxproj
      let script = JSON.parse(fase.shellScript);
      if (!script.includes('react-native-xcode.sh')) return;

      const corrigido = script.replace(
        /`("\$NODE_BINARY".*react-native-xcode\.sh'")`/g,
        '"$($1)"'
      );

      if (corrigido !== script) {
        fase.shellScript = JSON.stringify(corrigido);
      }
    });

    return config;
  });
}

function withPodfileSpaceFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes(MARCADOR)) {
        return config;
      }

      // Insere logo após a chamada do react_native_post_install, dentro do
      // bloco post_install que o template já cria.
      const ancora = /(react_native_post_install\([\s\S]*?\n    \)\n)/;
      if (!ancora.test(contents)) {
        console.warn('⚠️  post_install não encontrado no Podfile — correção de espaço não aplicada');
        return config;
      }

      // Função de substituição (não string): o Ruby injetado contém `$1`, que numa
      // string de replace seria interpretado como grupo de captura do JS.
      contents = contents.replace(ancora, (match) => match + POST_INSTALL_FIX);
      fs.writeFileSync(podfilePath, contents, 'utf8');

      return config;
    },
  ]);
}

module.exports = function withPodScriptPhaseSpaceFix(config) {
  return withAppBundleScriptSpaceFix(withPodfileSpaceFix(config));
};
