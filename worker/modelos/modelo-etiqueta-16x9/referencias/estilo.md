# O estilo Etiqueta (versão deitada, 16:9)

O estilo é o mesmo do vertical; muda só a composição, pela aula 9 do curso: a pessoa em tela cheia como base e, com a prateleira (ou outro bloco de apoio), a pessoa numa moldura à direita e a parede verde no quadro da esquerda.

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a **comparação de faixas**: o espectador vê, degrau por degrau, o que se ganha ao pagar mais, e o selo diz onde está o melhor custo-benefício. Ele é feito de poucas peças repetidas com rigor: etiqueta de papel, degrau, faixa "o que muda", medidor e selo.

O estilo vale para qualquer comparação de faixas: produtos, planos, serviços, hotéis, cursos, cortes de carne. O que muda de um vídeo para outro são os preços, as imagens e o texto dos degraus, nunca a linguagem visual abaixo.

## A ideia

A pessoa fala as faixas de preço, e o vídeo **monta uma prateleira em degraus**. Cada preço dito faz uma etiqueta cair do varal, balançar e contar o valor; o degrau sobe e o produto cai nele. Depois, o que muda em cada degrau aparece na faixa dele, com quanto o preço subiu. Um medidor "vale a pena?" vai de um degrau a outro, e no fim um selo carimba o melhor custo-benefício enquanto os outros esmaecem. A pessoa fica na moldura da direita, com o rosto centralizado e acompanhado.

## 1. Dinâmica do motion

- **Etiqueta**: cai do varal em 0,5 s com um passar do ponto, balança como pêndulo (amortece em ~1,5 s) e fica com um respiro lento; o preço conta de 0 ao valor em 0,8 s.
- **Degrau** sobe de baixo em 0,5 s; o **produto** cai nele 0,3 s depois, amassa de leve e deixa uma sombra.
- **Faixa "o que muda"**: texto e diferença de preço sobem na faixa no `textoEm`.
- **Medidor**: entra com a primeira etiqueta; a agulha procura no meio e depois salta de valor em valor, com um passar do ponto.
- **Selo**: carimba grande (190% para 100%) girando, e a etiqueta do degrau escolhido leva um empurrão e ganha borda limão; os outros degraus esmaecem a 50%.
- Nada de fade lento; entradas secas com leve passar do ponto. Sempre algo novo a cada ~1,5 s.

## 2. Organização e hierarquia

- A parede ocupa o quadro da esquerda (x 96 a 1106, de y 120 até a borda de baixo; a emenda com a moldura da pessoa fica em x 1180): título no alto à esquerda, medidor no canto de cima à direita do quadro, varal em y 284, etiquetas escalonadas (a do mais caro no alto, a do mais barato mais abaixo), produtos sobre os degraus, que descem até a borda de baixo. O texto de cada degrau fica acima de y 948 (os controles do player começam em y 984).
- Os degraus sobem da esquerda (barato) para a direita (caro), com largura igual (1010 ÷ número de degraus).
- Os textos de quadro cheio (gancho, destaque, frase, chamada) ficam numa fileira larga na altura do peito, centrada no rosto; o número e o rótulo lado a lado.
- Cada degrau: tampo claro, frente de madeira com `$`, `$$`, `$$$`, pílula ("a base" ou "o que muda"), a diferença de preço em tomate e o texto em tinta verde.

## 3. Tipografia

- Uma família só: **Sora** (Google Fonts), larga e redonda, algarismos claros. 800 em preços, rótulos e textos; 600–700 só nos detalhes. Preço na etiqueta 32–56 px; texto do degrau 30–40 px; título da prateleira 38–54 px. Legenda 60 px; gancho 52–96; destaque 56–110; número 84–190. Nada condensado, nada com contorno.

## 4. Moldura da pessoa

- Quadro cheio, como foi gravado (o vídeo 16:9 inteiro, sem recorte), na abertura, no fechamento e nos respiros; com a prateleira, a pessoa vai para a moldura da direita (x 1180 a 1920, a altura toda), com o rosto centralizado na largura dela, a ~40% da altura, 112% de aproximação, e a legenda embaixo, centrada nela. A parede entra pela esquerda junto com a emenda (um traço tomate vertical) em 0,4 s. Nunca janelinha no canto. O rosto é seguido quadro a quadro.

## 5. Cores, textura e som

| Papel | Cor |
|---|---|
| a parede da loja (o quadro da esquerda, com furinhos de painel) | verde-menta `#0E7C66` (`#09574A` nas placas) |
| etiqueta, cartão, medidor | papel creme `#FFF6E3`, texto tinta verde-garrafa `#10352D` |
| preço, tarja, palavra falada, barra | tomate `#E8402B` (borda `#A82413`) |
| o que muda, destaque, selo | limão `#FFE14D` (texto escuro) |
| degrau | madeira clara `#F1E3C2` (frente `#D9C698`) |
| lado bom do medidor | verde `#18A66B` |

Sombras duras ou suaves embaixo das peças, nunca brilho atrás da pessoa. Sons tonais e raros: um "tum" na etiqueta que cai, um tique na faixa, um toque na agulha e uma subida de notas no selo.

## 6. Imagens

- Cada degrau pede um produto **inteiro e reconhecível em 1 s**; de preferência PNG transparente (objeto), que pousa no degrau. Foto comum vira cartão com borda de papel.
- Imagem errada ou feia é pior que um cartão tipográfico (`--escolher <id> 0`, ou degrau sem `imagem`).
- Créditos CC BY vão para a descrição do vídeo (`creditos.txt`), nunca na tela.

## O que não fazer

- Inventar preço, ou ordenar os degraus de outro jeito que o dito: a ordem é de barato para caro.
- Pôr selo se a pessoa não escolheu um degrau.
- Mais de 4 degraus (a etiqueta fica estreita).
- Ícones e emojis decorativos fora do `cta`.
- Trocar a cor do selo ou da tarja por momento.
- Escrever "Remotion" ou qualquer nome de ferramenta na tela.
