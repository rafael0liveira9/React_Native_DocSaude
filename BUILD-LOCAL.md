# Build local — Android e iOS sem EAS

Como gerar e assinar os artefatos de produção na própria máquina, sem depender da
infraestrutura de build do Expo. O EAS deixa de ser necessário para compilar e
enviar; o `expo prebuild` continua sendo usado — ele é local e gratuito, e é o que
transforma o `app.json` nas pastas `android/` e `ios/`.

```
npm run build:android       # AAB de produção   → Play Console
npm run build:ios           # IPA de produção   → App Store Connect
npm run submit:ios          # compila e envia para o TestFlight
npm run build:android:dev   # mesma coisa apontando para homologação
npm run build:ios:dev
```

---

## Antes do primeiro build

### 1. Keystore do Android (obrigatório, e é o passo mais delicado)

O Google identifica o app pela chave que assina o pacote. Se você assinar com uma
chave diferente da que já publicou, o Play Console **recusa o upload** — não existe
como "trocar a senha", e reconquistar a identidade do app depende de abrir chamado
com o Google. Então o keystore precisa ser exatamente o que o EAS usou até aqui.

Baixe o keystore que está guardado no EAS:

```bash
npx eas credentials --platform android
# Selecione: production → Keystore → Download existing keystore
```

O comando é interativo e mostra, além do arquivo `.jks`, a senha do keystore, o
alias e a senha da chave. **Guarde os quatro dados** — são eles que vão no arquivo
de configuração abaixo.

Coloque o `.jks` fora do projeto (a pasta `android/` é apagada a cada build) e
crie o arquivo de credenciais:

```bash
mkdir -p ~/.totaldoc-keys
mv ~/Downloads/*.jks ~/.totaldoc-keys/totaldoc-upload.jks
chmod 600 ~/.totaldoc-keys/totaldoc-upload.jks

cp build-config/keystore.properties.example android/keystore.properties
# edite android/keystore.properties com o caminho e as senhas
```

`android/keystore.properties` e `*.jks` estão no `.gitignore` — nunca vão para o
repositório. Faça um backup do `.jks` e das senhas em um cofre de senhas: perder
essa chave significa perder a capacidade de atualizar o app na Play Store.

> **Se o app usa Play App Signing** (o padrão para apps criados nos últimos anos),
> o `.jks` do EAS é só a *chave de upload*. Nesse caso ela pode ser substituída
> pelo Play Console → Configuração → Integridade do app → "Solicitar redefinição
> da chave de upload", sem perder o app. A chave de assinatura de verdade fica com
> o Google. Confirme em qual cenário você está antes de mexer.

### 2. Certificado de distribuição do iOS (obrigatório)

Esta máquina hoje tem só certificados **Apple Development** — não dá para gerar um
build de App Store com eles. É preciso o **Apple Distribution**.

O caminho mais direto é reaproveitar o que já existe no EAS:

```bash
npx eas credentials --platform ios
# production → Distribution Certificate → Download
```

Importe o `.p12` baixado (duplo clique, ou `security import`) e confirme:

```bash
security find-identity -v -p codesigning | grep "Apple Distribution"
```

O provisioning profile de App Store o Xcode busca sozinho — o script passa
`-allowProvisioningUpdates`. Para isso a conta Apple precisa estar logada em
Xcode → Settings → Accounts, com acesso ao time `54YRYNDX6B`.

### 3. Chave da App Store Connect API (só para `npm run submit:ios`)

Em appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect
API, crie uma chave com papel **App Manager** e baixe o `.p8` (só dá para baixar
uma vez).

```bash
mkdir -p ~/.appstoreconnect/private_keys
mv ~/Downloads/AuthKey_XXXXXXXXXX.p8 ~/.appstoreconnect/private_keys/

# no ~/.zshrc
export ASC_KEY_ID="XXXXXXXXXX"        # o ID que aparece na listagem
export ASC_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

O `xcrun altool` encontra o `.p8` sozinho nesse diretório. Sem essas variáveis o
script apenas gera o `.ipa` e você pode enviá-lo pelo **Transporter.app**.

---

## Numeração de versão

Com o EAS, `versionCode` e `buildNumber` viviam nos servidores do Expo
(`appVersionSource: "remote"` + `autoIncrement`). Em build local isso não existe:
o `eas.json` passou a usar `appVersionSource: "local"` e os números agora ficam
no `app.json`, versionados junto com o código.

| Onde | Campo | Valor atual | Regra |
|---|---|---|---|
| `app.json` → `expo.version` | versão visível | `1.1.0` | muda quando o app muda para o usuário |
| `app.json` → `expo.android.versionCode` | inteiro | `7` | **+1 a cada envio** ao Play Console |
| `app.json` → `expo.ios.buildNumber` | string | `"44"` | **+1 a cada envio** ao App Store Connect |

Os valores partem do que já foi publicado (Android estava no versionCode 6, iOS no
build 43). Subir um pacote com número repetido é recusado pelas duas lojas, então
incremente antes de cada build — é o único passo manual do processo.

---

## Como funciona

Cada script faz, em ordem: define o ambiente da API → limpa o cache do Metro →
`expo prebuild --clean` → compila → verifica a assinatura.

### Por que o ambiente é forçado no script

Duas armadilhas reais, ambas verificadas na prática:

1. **`.env.local` vence em produção.** O Expo carrega `.env.local` mesmo com
   `NODE_ENV=production`, e ele tem precedência sobre `.env.production`. Como o
   `.env.local` do projeto aponta para homologação, um `npx expo run:android
   --variant release` feito "na mão" gera um app de produção conversando com o
   banco `dev-totaldoc`. Os scripts usam `EXPO_NO_DOTENV=1` e definem
   `EXPO_PUBLIC_API_URL` explicitamente.

2. **O Metro reaproveita bundle em cache entre ambientes.** Um build de produção
   feito logo depois de um de homologação saiu com a URL de homologação embutida,
   mesmo com a variável correta. Por isso os scripts apagam `$TMPDIR/metro-cache`
   antes de compilar.

Para conferir num artefato pronto qual URL ficou embutida:

```bash
unzip -p android/app/build/outputs/bundle/release/app-release.aab \
  base/assets/index.android.bundle | grep -c "yk171d97y4"   # 1 = produção
```

### Por que a assinatura do Android é um config plugin

O template do `prebuild` assina o buildType `release` com a `debug.keystore`. Como
`expo prebuild --clean` reescreve o `android/app/build.gradle` a cada execução,
editar esse arquivo à mão não adianta — a mudança some no build seguinte. Por isso
existe `plugins/withAndroidSigning.js`: ele reinjeta a configuração toda vez.

O plugin também faz o build **falhar** se o keystore não estiver configurado, em
vez de cair silenciosamente na chave de debug e produzir um pacote que o Play
Console recusa lá na frente.

---

## Envio

**Android** — Play Console → Produção (ou Teste interno) → Criar versão → suba o
`android/app/build/outputs/bundle/release/app-release.aab`.

**iOS** — `npm run submit:ios` envia direto. Alternativa: abrir o Transporter e
arrastar o `.ipa` de `build/ios/`. Depois de alguns minutos ele aparece no
TestFlight (o app é o `ascAppId` 6754724014).

---

## Problemas comuns

**`Keystore de release ausente`** — falta `android/keystore.properties`. É o guard
funcionando; veja o passo 1.

**`No signing certificate "iOS Distribution" found`** — o certificado Apple
Distribution não está no Keychain. Veja o passo 2.

**Build iOS falha depois de trocar dependências** — limpe os pods:
```bash
rm -rf ios/Pods ios/Podfile.lock && npx expo prebuild --platform ios --clean && (cd ios && pod install)
```

**Gradle sem memória** — aumente em `android/gradle.properties`:
`org.gradle.jvmargs=-Xmx4096m`. Como o arquivo é regenerado, para valer sempre use
o plugin `expo-build-properties` no `app.json`.

**Ver o erro completo do iOS** — os scripts filtram o log do `xcodebuild`. Rode o
comando sem o `| grep` para ver tudo, ou abra `ios/TotalDocSade.xcworkspace` no
Xcode e arquive por lá (Product → Archive).

---

## O que ainda depende do Expo

- **`expo prebuild`** — local e gratuito, gera `android/` e `ios/` a partir do
  `app.json`. Só sai dessa dependência migrando para bare workflow (versionar as
  pastas nativas), o que troca conveniência de upgrade por controle manual.
- **`eas credentials`** — só para *extrair* keystore e certificado desta vez.
  Depois que estiverem em `~/.totaldoc-keys` e no Keychain, não é mais preciso.
- **EAS Update / OTA** — não está em uso no projeto.

A conta do Expo continua útil como backup dos artefatos de credencial; nada no
fluxo acima envia código para os servidores deles.
