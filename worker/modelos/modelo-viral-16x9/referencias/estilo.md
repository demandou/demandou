# O estilo Viral (versão deitada, 16:9)

O sistema abaixo é o do vertical e vale inteiro no quadro deitado (1920×1080): as mesmas peças, cores, fontes, movimentos e sons. O que muda é a diagramação, pela composição da aula 9 do curso (a pessoa em tela cheia como base; quando um bloco pede apoio visual, ela vai para uma moldura à direita e o conteúdo ocupa o quadro da esquerda). As medidas do quadro deitado estão em cada seção.

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a **retenção**: o olho nunca fica sem motivo para continuar (a palavra falada acesa, um salto de zoom, uma imagem que corta, a barra que anda), sem virar poluição. Ele é feito de poucas peças repetidas com rigor: placa escura, tarja rosa, cartão branco, foto em tela cheia. Quase toda "melhoria" que adiciona outro tipo de peça (brilho, contorno, emoji solto, transição de efeito) piora.

O estilo vale para qualquer assunto: curiosidades, notícias, finanças, saúde, negócios, histórias. O que muda de um vídeo para outro é o conteúdo dos blocos e as imagens, nunca a linguagem visual abaixo.

## A ideia

A pessoa fala, e o vídeo **mostra o que ela acabou de nomear**. Coisa concreta vira imagem no instante da palavra: a tela inteira por um segundo (o corte) ou um cartão no quadro da esquerda, com a pessoa na moldura da direita (o pop). Palavra forte vira carimbo no peito com um soco de zoom. O resto do tempo, a legenda karaokê segura a atenção. Diferença para o Impacto (tipografia pura): aqui a imagem de apoio é protagonista.

## 1. Dinâmica do motion

- **Gancho escrito**: entra inteiro em menos de 1 s, uma palavra a cada ~0,1 s; com o vídeo começando nele, a primeira palavra já está no primeiro quadro.
- **Zoom no rosto**: salto seco a cada corte do vídeo e na volta de cada imagem em tela cheia (alterna 100% e 109%); soco de +11% nas palavras fortes (entra em 0,14 s, segura 0,36 s, volta em 0,9 s). Sempre ancorado no rosto (que é seguido quadro a quadro). Nunca mais que 130%.
- **Adesivos**: textos e cartões chegam com escala (60–82% → 100%) e um leve passar do ponto, em 0,24–0,34 s. O destaque chega como carimbo (145% → 100% em 0,2 s). Terminada a entrada, o texto fica desenhado simples, sem camada de animação.
- **Corte**: a foto entra seca, 7% maior, assenta em 0,22 s e aproxima devagar (12%) até sair seca. Nada de fade, nada de flash.
- **Troca de lugar**: a pessoa desliza para a moldura da direita em 0,38 s, e o quadro da esquerda entra junto com a emenda (o conteúdo entra empurrando). Na volta, ela cresce de novo para o quadro cheio por cima do conteúdo. Nenhum quadro com o lado da esquerda vazio; nenhum texto em cima de outro (o conteúdo que sai some em 0,16 s antes de o novo entrar).
- **Nada parado**: a tarja da legenda anda a cada palavra; o "?" da comparação balança; a chamada final respira; a barra do topo anda o vídeo inteiro.

## 2. Organização e hierarquia

- **Três lugares, alternando**: quadro cheio, a base (texto numa fileira larga no peito, do queixo até y 948) → pessoa na moldura da direita (x 1180 a 1920) e conteúdo no quadro da esquerda (x 96 a 1106, y 120 a 948; emenda em x 1180) → imagem em tela cheia. Nunca três iguais seguidos.
- **Uma ideia por tela**: um carimbo, um número, um cartão, uma lista curta.
- **Legenda**: telas de até 3 palavras numa linha; no terço de baixo (centro em y 900), centrada no quadro cheio e centrada na moldura quando a pessoa está nela. No corte, por cima da foto (a foto com zoom sobe o assunto para ~40% da altura, acima dela).
- Margens do YouTube: 96 px nas laterais; nada acima de y 110 além da barra de progresso (o título do player aparece ali); nada importante abaixo de y 984 (controles do player).

## 3. Tipografia

- **Uma família só: Montserrat** (Google Fonts), larga, de traço cheio: lê de longe, no celular e na TV.
- 900 em caixa alta: legenda, gancho, destaque, número, títulos, rótulos e tarjas. 800: itens, opções, significado. 700: detalhes.
- Algarismos de largura igual nos contadores (o número não "dança"). Números em pt-BR (3.000; 1,5; R$; US$; %).
- **Tamanhos** (quadro deitado, 1920×1080): legenda 60 (até 36 se a tela não couber na moldura); gancho 52–96; destaque 56–110; número 84–190; rótulo do número 38–84; frase 44–80; chamada 48–86; títulos 44–78; itens 28–62; detalhes ≥ 24. O texto é medido com as larguras reais da fonte (`src/larguras.ts`) e diminui para caber na largura e na altura do lugar dele; nunca é cortado. A faixa do peito é baixa: os textos dela viram fileiras largas (até ~1400 px), com menos linhas.
- Nada de fonte condensada, nada de contorno nas letras, nada de sombra borrada no texto. O contraste vem das placas.

## 4. Moldura da pessoa

- **Quadro cheio**: o vídeo inteiro, como foi gravado, com o zoom de impacto em volta do rosto. Os textos ficam no peito (faixa do queixo até y 948), centrados no rosto, numa fileira larga.
- **Pessoa na moldura**: a caixa é a faixa da direita, de x 1180 a 1920, na altura toda; o rosto fica centralizado na largura dela, a ~40% da altura, um pouco mais perto (112%), e é acompanhado com suavidade quando a pessoa se mexe (o rastro do rosto). Um traço rosa de 8 px, na vertical, marca a emenda. Nunca janelinha no canto.
- O vídeo da pessoa fica montado o tempo todo (a voz vem dele), inclusive debaixo das imagens em tela cheia.

## 5. Cores, textura e som

| Papel | Cor |
|---|---|
| fundo do quadro da esquerda | `#121016` (grafite violeta quase preto); no `pop`, a própria foto desfocada e escura |
| placas atrás do texto branco | `rgba(18,16,22,0.9)` |
| tarja: palavra falada, destaque, emenda, barra | rosa `#FF2E63`, com borda dura `#B8123F` 6–7 px embaixo (cara de adesivo) |
| alerta | amarelo `#FFC21A` com texto escuro `#141218` |
| o lado certo | verde `#2BD97C` |
| cartões claros (itens, opções, significado, borda do pop) | branco `#FFFFFF` com sombra suave |

- **Nada de preto e dourado** (é a cor do Cofre) e nada de brilho atrás da pessoa.
- Sons tonais e raros, gerados no próprio projeto (`public/sfx`): `corte` (um "tum" grave que desce), `pop` (bolha que sobe), `impacto` (grave redondo com uma subida curta), `alerta` (duas notas descendo), `tique` (toque curto), `fim` (três notas subindo, senoidais, sem cara de sino). Nada de ruído, chiado ou "whoosh" de ar.

## 6. Imagens

- **Corte**: a tela cheia é deitada (1920×1080): só imagem deitada e grande (1920 px ou mais de largura), assunto inteiro, sem texto, logo, marca d'água ou faixa de dados. Assunto pequeno na foto: `zoom` 1,3–1,6.
- **Pop**: qualquer proporção (o cartão segue a foto, entre 0,74 e 1,62, até 880 × 660 px no quadro da esquerda); fotos pequenas, quadradas ou em pé ficam nítidas no cartão. Objeto 3D transparente vira adesivo solto.
- Imagem errada ou feia é pior que um cartão tipográfico (`--escolher <id> 0`).
- Créditos CC BY vão para a descrição do vídeo (`creditos.txt`), nunca na tela.

## O que não fazer

- Legenda com mais de 3 palavras ou em duas linhas.
- Imagem que fica mais de 1,5 s em tela cheia, ou duas imagens na mesma frase.
- Zoom que vai e volta sem palavra forte (vira "tremedeira").
- Ícones e emojis decorativos fora do `cta`.
- Mudar a cor da tarja por momento (o rosa é a marca do estilo; amarelo só no alerta, verde só no certo).
- Escrever "Remotion" ou qualquer nome de ferramenta na tela.
