# Chave de assinatura do Android

Onde a chave vive, como identificá-la e como recuperar o acesso. **A senha não
está aqui** — ver [Onde estão as senhas](#onde-estão-as-senhas).

## Por que a senha não está neste arquivo

O keystore é a identidade do app na Play Store. Quem tem o arquivo **e** a senha
consegue assinar um pacote que o Android aceita como atualização legítima do
TotalDoc — um app que lida com CPF, dados de saúde e teleconsulta. Versionar os
dois juntos daria essa capacidade a qualquer pessoa com leitura no repositório, e
removê-los depois não resolve: o valor permanece no histórico do git.

Por isso o repositório guarda **como achar** a chave, não a chave.

## Identificação da chave

| | |
|---|---|
| Arquivo | `~/.totaldoc-keys/totaldoc-upload.jks` (fora do repositório) |
| Formato | PKCS12 |
| Alias | `totaldoc-upload` |
| Algoritmo | RSA 2048 |
| Criada em | 17/08/2026 |
| Válida até | 02/01/2054 |
| Titular | `CN=TelaDoc, OU=TelaDoc, O=TelaDoc, L=Curitiba, ST=PR, C=BR` |
| SHA-256 | `A6:02:2D:CB:E4:41:14:85:06:8D:60:9F:8C:3D:58:08:93:81:15:E2:AC:D1:43:83:1D:EB:01:4F:AD:AA:1A:9C` |

O SHA-256 é a forma de confirmar que uma cópia é a chave certa, e é o mesmo valor
que o Play Console mostra em **Integridade do app → Certificado da chave de
upload**. Para conferir uma cópia:

```sh
keytool -list -v -keystore <arquivo.jks> -alias totaldoc-upload
```

## Onde estão as senhas

> **A PREENCHER.** Registre aqui o local — nunca o valor:
>
> - Cofre de senhas: `<ex.: 1Password → cofre TotalDoc → item "Keystore Android">`
> - Ou AWS Secrets Manager: `<nome do secret na conta 388779989373>`

São dois valores (na prática iguais, como manda o formato PKCS12): senha do
keystore e senha da chave.

### Sugestão: AWS Secrets Manager

O projeto já usa a conta AWS `388779989373`. Guardar o keystore e as senhas lá
resolve o backup e o acesso da equipe de uma vez:

```sh
# o proprio arquivo, em base64
aws secretsmanager create-secret \
  --name totaldoc/android/upload-keystore \
  --description "Keystore de upload do app Android (PKCS12, alias totaldoc-upload)" \
  --secret-binary fileb://~/.totaldoc-keys/totaldoc-upload.jks

# as senhas
aws secretsmanager create-secret \
  --name totaldoc/android/upload-keystore-credentials \
  --secret-string '{"storePassword":"...","keyAlias":"totaldoc-upload","keyPassword":"..."}'
```

Para recuperar numa máquina nova:

```sh
mkdir -p ~/.totaldoc-keys
aws secretsmanager get-secret-value \
  --secret-id totaldoc/android/upload-keystore \
  --query SecretBinary --output text | base64 -d > ~/.totaldoc-keys/totaldoc-upload.jks
chmod 600 ~/.totaldoc-keys/totaldoc-upload.jks

aws secretsmanager get-secret-value \
  --secret-id totaldoc/android/upload-keystore-credentials \
  --query SecretString --output text
```

Depois monte o `keystore.properties` (raiz do projeto) a partir de
[`build-config/keystore.properties.example`](build-config/keystore.properties.example).

## Se a chave for perdida

Como o app usa **Play App Signing** (obrigatório para apps novos), esta é apenas
a *chave de upload* — a de assinatura fica com o Google. Perder esta não impede
atualizar o app: no Play Console, em **Integridade do app → Chave de upload →
Solicitar redefinição**, gera-se uma nova e envia-se o certificado:

```sh
keytool -genkeypair -v -keystore ~/.totaldoc-keys/nova-upload.jks \
  -alias totaldoc-upload -keyalg RSA -keysize 2048 -validity 10000 -storetype PKCS12

keytool -export -rfc -alias totaldoc-upload \
  -file ~/.totaldoc-keys/upload_certificate.pem \
  -keystore ~/.totaldoc-keys/nova-upload.jks
```

A aprovação do Google leva de horas a alguns dias. Perder a chave de upload é
recuperável; ainda assim, mantenha o backup — a redefinição trava lançamentos
enquanto não sai.

## Pendências desta chave

Dois pontos que **custam nada agora** e ficam caros depois do primeiro envio ao
Play Console, quando esta chave passa a ser a de upload registrada:

1. **A senha atual é fraca** (definida às pressas na criação). Trocar depois
   exige o processo de redefinição acima.
2. **O titular do certificado diz `TelaDoc`**, que é o fornecedor de
   telemedicina, não a empresa dona do app. É cosmético (não aparece para o
   usuário) mas fica gravado no certificado para sempre.

Regerar antes do primeiro upload resolve os dois de uma vez — é o mesmo comando
da seção anterior, com `-dname` correto e uma senha forte.

## Ver também

- [BUILD-LOCAL.md](BUILD-LOCAL.md) — como gerar e assinar o AAB
- `plugins/withAndroidSigning.js` — injeta a assinatura no Gradle a cada prebuild
