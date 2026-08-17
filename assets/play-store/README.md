# Assets da ficha do Google Play

Imagens da listagem da loja. Ficam versionadas aqui (e não em `dist/`, que é
ignorado) porque são reenviadas a cada mudança de ficha e servem de base para
outras lojas.

| Arquivo | Uso no Play Console | Requisito |
|---|---|---|
| `icone-play-store-512x512.png` | Ícone do app | 512×512, PNG 32 bits, até 1 MB |
| `feature-graphic-1024x500.png` | Recurso gráfico | 1024×500, PNG ou JPEG, **sem transparência** |

## Como foram geradas

Ambas derivam de arte já existente no projeto — não são recriações.

**Ícone** — recortado de [`../icone/icone.png`](../icone/icone.png) (3810×3810).
O enquadramento não foi escolhido a olho: medi o `ic_launcher.webp` que o build
gera e reproduzi a mesma proporção, com o símbolo ocupando **61,5% da largura**,
centralizado. Assim o ícone da loja fica idêntico ao que aparece na tela do
aparelho, só que sem o upscale que sairia dos 192 px do launcher.

O fundo é **branco**, e não o `#E6F4FE` do `app.json`: o `adaptiveIcon` define
`backgroundImage` apontando para o próprio `icone.png` (que já tem fundo branco),
e isso anula o `backgroundColor`. Ou seja, o azul claro nunca aparece. Se um dia
a linha `backgroundImage` for removida, o `#E6F4FE` passa a valer e **este ícone
precisa ser regerado** para continuar batendo com o do aparelho.

**Recurso gráfico** — logo recortada de
[`../docsaude/LOGO-TOTALDOC-fundo-azul-marinho.png`](../docsaude/LOGO-TOTALDOC-fundo-azul-marinho.png)
(4167×4167), reduzida para 619×340 e centralizada sobre `#0D1633`, a cor exata
amostrada da própria arte — que também é o `background` do tema do app
(`constants/Colors`), então a peça conversa com a primeira tela pós-instalação.

As margens (202 px nas laterais, 80 px acima e abaixo) não são só estética: o
Play recorta esse gráfico em proporções diferentes conforme a superfície, e
conteúdo colado nas bordas some.

## Ao regerar

Reduções grandes a partir dos originais em alta resolução: use reamostragem
Lanczos. O recurso gráfico não pode ter canal alfa — o Play recusa.

## O que ainda falta na ficha

- Screenshots (mín. 2, proporção entre 16:9 e 9:16)
- Política de privacidade em URL pública — costuma ser o item que trava
- Classificação de conteúdo e questionário de Segurança de Dados
