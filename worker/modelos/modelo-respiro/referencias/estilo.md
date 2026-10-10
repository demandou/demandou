# O estilo Respiro

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a calma com ritmo: parece a página de um diário de terapia ao fim da tarde, em que a respiração acontece na tela no mesmo compasso da fala. Quase toda "melhoria" que adiciona enfeite, brilho ou pressa piora o resultado.

## A ideia

A pessoa abre em tela cheia e, no primeiro segundo, o quadro se recolhe numa **janela em arco** sobre um papel pêssego, com uma moldura pontilhada a lápis. Embaixo, a nota à mão e o título se escrevem; se ela vai ensinar uma respiração, o **mapa do respiro** já está a lápis — uma linha que sobe, anda no alto e desce — e cada trecho ganha tinta quando o número é dito. Na inspiração, um ponto do mapa vira uma **forma macia** de damasco que enche dentro de um anel de contagem, 1, 2, 3, 4, enquanto a janela, menor, sobe para um canto e também cresce um pouco, como um peito enchendo. Na pausa, a janela desliza para o outro lado e a forma fica cheia, viva. Na expiração, as duas trocam de andar devagar, cada uma contornando a outra, e a forma esvazia. Na repetição, ela se divide como líquido em formas menores que respiram uma de cada vez. Depois, a pessoa volta grande e a reflexão se escreve como numa página de diário, com uma onda que vai desacelerando até virar linha.

## Regras que definem o estilo

- **Gramática de layout — o respiro**: tela cheia → janela grande com papel embaixo → janela no alto à esquerda com a forma embaixo → janela à direita → forma no alto e janela embaixo → janela grande → janela estreita no fechamento. A janela muda de lugar e de tamanho nas fronteiras dos momentos, em ~1,1 s, sempre com a mesma curva lenta e simétrica (`liquido` em `src/anim.tsx`). Nunca há corte seco de layout. A pessoa nunca é recortada do fundo nem esticada: o motor (`VideoNaCaixa`) só reenquadra o vídeo dentro do arco.
- **A janela respira**: cresce cerca de 5% do peito vazio ao cheio, a partir do centro, e, fora das fases, respira sozinha num ciclo de 5 s. É isso que faz o vídeo nunca parar, mesmo nos trechos só de fala.
- **Nada passa por cima do rosto**: a forma, o anel e o mapa ficam por trás da janela; numa troca de andar, cada um contorna o outro por um lado. Nada de brilho, sombra ou halo atrás da pessoa — a moldura é um pontilhado a lápis, afastado 16 px.
- **A forma**: três camadas chapadas de damasco (véu `#F6D2BB`, meio `#EEB492`, núcleo `#E59A74`), cada uma com a borda ondulando devagar e fora de fase com as outras — papel recortado que respira, nunca um círculo perfeito, nunca degradê ou brilho. Na pausa cheia a borda fica só um pouco mais viva.
- **A contagem cai na fala**: uma marca por número no anel, já a lápis antes de começar; o traço de tinta corre contínuo pelo anel, a última marca cai no instante em que o número é dito e as do meio ficam espaçadas por igual. Contagem lenta: o número troca subindo devagar. Contagem rápida (menos de ~0,45 s por número, como "segura… sete"): os números se dissolvem um no outro e as marcas enchem devagar, sem tique. Antes da contagem, o total aparece apagado.
- **Quem sai espera quem entra**: o texto que sai só se dissolve quando o próximo começa a aparecer; o anel da contagem viaja com a forma; o mapa some onde estava enquanto surge no lugar novo; na troca de andar, cada uma fica no seu andar o máximo possível e as duas se cruzam rápido no fim. O mapa já está a lápis sob a janela desde o primeiro meio segundo, e a onda da nota já está a lápis por trás da janela que sobe. Nenhum quadro com metade do papel vazia.
- **Poucas cores**: papel `#F4E4D6` (linho pêssego), damasco nos três tons acima, tinta de cacau `#3C2A2B` para texto e traços, tinta suave `#7A605E` para notas secundárias, lápis `#C2A595` para tudo que ainda vai acontecer (o lugar das marcas, do mapa, da onda, do ícone). O grifo de marca-texto é `#F0B997`. Não há segunda cor de destaque: o destaque é o damasco.
- **Duas fontes, sem condensada**: Newsreader (serifada macia; 400–500) para títulos, números da contagem e legenda; Caveat (escrita à mão legível; 600–700) para as notas. O "I" maiúsculo da Caveat tem traços em cima e embaixo e não se confunde com o "l". Tamanhos no quadro de 1080: números da contagem 200 px; palavra da fase ("inspira") 112–136 px e o detalhe embaixo 84–88 px; títulos em serifada 104–118 px; notas à mão 96–122 px; números do mapa 104 px (grande) e 64 px (pequeno); nomes do mapa 64 px; legenda 68 px; assinatura 72 px + 72 px. Nada abaixo de 60 px. Os componentes diminuem a letra para caber (com piso): texto longo demais fica pequeno — encurte.
- **Escrita com sentido**: a nota à mão aparece da esquerda para a direita, como a caneta passando; a serifada sobe devagar e ganha foco, como quem inspira; o que sai some desfocando e subindo (o que sai cruza com o que entra). Nada quica, nada pisca, nada gira.
- **Movimento com significado**: a forma enche porque a pessoa diz "inspira"; o anel corre porque ela está contando; o mapa ganha tinta porque ela disse o número; a forma se divide porque ela disse "repete"; a onda desacelera porque ela disse "desacelerar". Se um movimento não explica nada, ele não entra.
- **Nada parado, nada vazio**: dentro de cada momento algo novo a cada 1,5–2,5 s; os lugares de tudo que vai acontecer já aparecem a lápis; sem mapa ou sem onda, o texto vai para o meio do papel.
- **Legenda escrita no papel**, embaixo da janela grande, sem caixa nem pílula, cada palavra passando de apagada para tinta quando é falada. Some durante os momentos.
- **Som raro e tonal**: uma nota que sobe no começo da inspiração, uma parada na pausa, uma que desce na expiração (sol → dó, dó, dó → fá), um acorde grave quando o mapa se completa, duas notas quando a forma se divide e um arpejo quente no fechamento. Senos suaves com passa-baixa, volume baixo. Nada em cima de cada número, nada de ruído, clique, sino ou "whoosh".

## Os blocos universais neste estilo

Listas e passos são escritos à mão no papel, com bolinhas de damasco que enchem e respiram; número, destaque e comparação usam a forma de damasco (o número conta dentro dela, o destaque `alerta` a esvazia, a comparação dá uma forma a cada lado); gráficos são desenhados à mão com os mesmos três tons. Mesmas fontes, cores e movimento lento e líquido; textos são medidos e nunca vazam. A pessoa fica sempre na janela em arco, sem cobrir texto.

## O que pode mudar por vídeo

- Textos, tempos, componentes, contagens e lugares (é o trabalho do plano), inclusive `"layout"` para variar o lugar de uma fase.
- `marca` (nome e área).
- `janela.zoom` / `janela.ancoraY`, se o rosto ficar grande ou pequeno demais nas janelas menores.
- As pausas mantidas no corte (é parte do estilo deixar as de respiração).
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Cores, fontes, tamanhos de texto e espessuras (em `src/tema.ts` e nos componentes). Se o usuário pedir a cor da marca dele, troque **os três tons do damasco** por três tons da cor dele (núcleo, meio mais claro, véu bem claro) e o `grifo` por um tom médio dela; o papel, a tinta e o lápis seguram o estilo. Cores quentes e suaves funcionam (terracota clara, rosa-argila, mel); cores frias e saturadas brigam com o papel pêssego — nesse caso troque também o papel por um tom claro e neutro.
- As posições e tamanhos da janela, da forma e das notas (em `src/layout.ts`), a duração das trocas (`VIAGEM`), a altura da legenda.
- A regra de que nada passa por cima do rosto.
- Não adicione emojis, stickers, barras de progresso, tremidas, flashes, cortes secos, sombras, brilhos, degradês, fotos de banco nem imagens de pacientes. Em saúde mental, nada de diagnóstico, promessa de cura ou "antes e depois".

## Se precisar de algo que o modelo não tem

- **Uma fase nova** (por exemplo "expira pelo nariz" com outra forma de esvaziar): use `fase` com a `nota` que a pessoa disse — o nome da fase só decide se a forma enche (`inspira`), fica (`segura`) ou esvazia (`solta`). Para outro comportamento, acrescente o nome em `NomeDaFase` (`src/plano.ts`), o valor em `arDaFase` e a forma do mapa em `FORMA` (`src/respiro.ts`) e o lugar padrão em `DA_FASE` (`src/layout.ts`).
- **Um ícone novo para o fechamento**: acrescente o traço em `FORMAS` (`src/componentes/Icones.tsx`, caixa 112 × 140, contorno fechado + miolo opcional) e o nome no tipo de `icone` do `Cta`.
- **Um componente novo**: siga a gramática acima — lugar e área vindos de `src/layout.ts` (`AREAS`, `cenaDoLayout`), texto falado com `Escrita`/`Serifa` e `temposDoTexto`, o que ainda vai acontecer a lápis, saída com `dissolver`, cores de `tema.ts` — e consulte a skill do Remotion para as regras de animação. Registre o tipo em `Momento` (`src/plano.ts`), o lugar padrão em `LAYOUT_PADRAO` e o desenho em `Edicao.tsx`.
