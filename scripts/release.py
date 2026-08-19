#!/usr/bin/env python3
"""Incrementa a versão e gera os pacotes de release do TotalDoc Saúde.

    python3 scripts/release.py --bump patch            # 1.1.1 -> 1.1.2, iOS e Android
    python3 scripts/release.py --plataforma ios        # só o .ipa
    python3 scripts/release.py --sem-bump              # regera sem mexer na versão
    python3 scripts/release.py --versao 2.0.0          # define a versão explicitamente
    python3 scripts/release.py --ambiente dev          # aponta para homologação

Regra das lojas: `version` é o número visível ao usuário; `buildNumber` (iOS) e
`versionCode` (Android) precisam ser MAIORES a cada envio, mesmo que a versão
visível não mude. Por isso eles sobem sempre, e o `--bump` controla só a versão.

A compilação em si fica com scripts/build-android.sh e scripts/build-ios.sh —
são eles que forçam o ambiente da API, limpam o cache do Metro e conferem a
assinatura. Aqui só cuidamos de versão, orquestração e conferência do resultado.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
APP_JSON = RAIZ / "app.json"
DIST_ANDROID = RAIZ / "dist" / "android"
DIST_IOS = RAIZ / "build" / "ios"


def ler_config():
    return json.loads(APP_JSON.read_text(encoding="utf-8"))["expo"]


def escrever_versoes(versao, build_ios, version_code):
    """Reescreve só os três campos, preservando formatação e comentários do arquivo.

    Um json.dump reformataria o app.json inteiro e sujaria o diff a cada release.
    """
    texto = APP_JSON.read_text(encoding="utf-8")
    substituicoes = [
        (r'("version"\s*:\s*)"[^"]*"', rf'\g<1>"{versao}"'),
        (r'("buildNumber"\s*:\s*)"[^"]*"', rf'\g<1>"{build_ios}"'),
        (r'("versionCode"\s*:\s*)\d+', rf"\g<1>{version_code}"),
    ]
    for padrao, novo in substituicoes:
        texto, n = re.subn(padrao, novo, texto, count=1)
        if n != 1:
            sys.exit(f"ERRO: não encontrei o campo {padrao} no app.json")
    APP_JSON.write_text(texto, encoding="utf-8")
    json.loads(texto)  # falha cedo se a edição quebrou o JSON


def proxima_versao(atual, tipo):
    if tipo == "nenhum":
        return atual
    partes = atual.split(".")
    if len(partes) != 3 or not all(p.isdigit() for p in partes):
        sys.exit(f"ERRO: versão '{atual}' não é X.Y.Z — use --versao para definir manualmente")
    maior, menor, correcao = (int(p) for p in partes)
    if tipo == "major":
        return f"{maior + 1}.0.0"
    if tipo == "minor":
        return f"{maior}.{menor + 1}.0"
    return f"{maior}.{menor}.{correcao + 1}"


def rodar(script, *args):
    print(f"\n{'=' * 68}\n>> {script} {' '.join(args)}\n{'=' * 68}", flush=True)
    r = subprocess.run([str(RAIZ / "scripts" / script), *args], cwd=RAIZ)
    if r.returncode != 0:
        sys.exit(f"\nERRO: {script} falhou (código {r.returncode}). Versão já foi gravada no app.json.")


def artefatos(padrao, pasta):
    return sorted(pasta.glob(padrao)) if pasta.is_dir() else []


def main():
    p = argparse.ArgumentParser(
        description="Incrementa a versão e gera os pacotes de release.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--bump", choices=["major", "minor", "patch", "nenhum"], default="patch",
                   help="parte da versão visível a incrementar (padrão: patch)")
    p.add_argument("--versao", help="define a versão explicitamente (ex.: 2.0.0); ignora --bump")
    p.add_argument("--sem-bump", action="store_true",
                   help="não mexe em nada: regera os pacotes com os números atuais")
    p.add_argument("--plataforma", choices=["ios", "android", "ambas"], default="ambas")
    p.add_argument("--ambiente", choices=["prod", "dev"], default="prod")
    p.add_argument("--enviar-ios", action="store_true",
                   help="envia o .ipa ao TestFlight (exige ASC_KEY_ID e ASC_ISSUER_ID)")
    args = p.parse_args()

    cfg = ler_config()
    versao_atual = cfg["version"]
    build_atual = int(cfg["ios"]["buildNumber"])
    code_atual = int(cfg["android"]["versionCode"])

    if args.sem_bump:
        versao, build_ios, version_code = versao_atual, build_atual, code_atual
    else:
        versao = args.versao or proxima_versao(versao_atual, args.bump)
        build_ios = build_atual + 1
        version_code = code_atual + 1

    print("Versão")
    print(f"  visível:     {versao_atual} -> {versao}")
    print(f"  iOS build:   {build_atual} -> {build_ios}")
    print(f"  versionCode: {code_atual} -> {version_code}")
    print(f"  ambiente:    {args.ambiente}")

    if not args.sem_bump:
        escrever_versoes(versao, build_ios, version_code)
        print("\napp.json atualizado.")

    if args.plataforma in ("android", "ambas"):
        rodar("build-android.sh", args.ambiente)
    if args.plataforma in ("ios", "ambas"):
        rodar("build-ios.sh", args.ambiente, *(["upload"] if args.enviar_ios else []))

    print(f"\n{'=' * 68}\nPacotes gerados\n{'=' * 68}")
    encontrados = artefatos("*.aab", DIST_ANDROID) + artefatos("*.apk", DIST_ANDROID) + artefatos("*.ipa", DIST_IOS)
    for a in encontrados:
        print(f"  {a.relative_to(RAIZ)}  ({a.stat().st_size / 1_048_576:.0f} MB)")
    if not encontrados:
        print("  (nenhum encontrado — confira a saída acima)")

    print(f"\nAo enviar, informe a versão {versao} nas lojas.")
    print("Play Console: suba o .aab   |   App Store Connect: o build aparece sozinho após processar.")


if __name__ == "__main__":
    main()
