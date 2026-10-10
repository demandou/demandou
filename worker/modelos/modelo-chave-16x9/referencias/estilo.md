# O estilo Chave (versão deitada, 16:9)

O sistema abaixo é o do vertical e vale inteiro no quadro deitado: as mesmas cores, fontes, objetos, estados a lápis, balanços, sons e trocas. O que muda é onde as coisas ficam: as medidas do 16:9 e a composição da aula 9 (a pessoa numa porta à direita, a explicação na parede à esquerda) estão em "Moldura da pessoa" e em "Medidas (quadro deitado 1920 × 1080)".

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer o hall de um apartamento bem cuidado (madeira, cimento queimado, latão, papel) com objetos de verdade, e não um vídeo com cartões e ícones; quase toda "melhoria" que adiciona coisa piora o resultado. Isso vale para qualquer assunto: cripto, saúde ou receita aparecem nas mesmas etiquetas, placas, pranchetas e recibos.

## A ideia

O vídeo é uma visita. Abre com a porta do apartamento fechada (no quadro deitado, de duas folhas); ela destrava e se abre, e a pessoa aparece no vão. O batente de madeira vira a moldura dela até o fim. Quando a fala organiza uma ideia, a câmera recua para o hall: a pessoa vai para a porta da direita, apoiada no piso, e, na parede de cimento queimado à esquerda, aparece o objeto que mostra a ideia (uma etiqueta de preço, um quadro de chaves, a prancheta, um recibo). Nas partes grandes do vídeo, um quadro de chaves desce no alto da parede e cada parte é uma chave. Sóbrio, calmo e concreto.

## O sistema visual

### Motion

- **Objeto de verdade, não animação de interface.** Etiquetas caem no gancho, no pino ou no prego e balançam como pêndulo amortecido curto (≤ 10°, assenta em ~1 s). Placas sobem e assentam nos parafusos. Peças paradas balançam muito de leve (meio grau, em 3,4 s), como coisa pendurada. Sem quique, sem elástico, sem giro decorativo, sem flash.
- **Tudo já está desenhado a lápis.** Títulos, itens, números, linhas da conta, barras do gráfico, etiquetas e chaveiros aparecem desde o começo em cinza (texto apagado, contorno tracejado) e ganham tinta, papel, foto ou cor no instante em que são ditos. Cada palavra sobe um pouco e ganha tinta no seu tempo; quando termina, vira texto simples.
- **Três estados de uma etiqueta**: a lápis (vai acontecer), acesa (verde: é a vez dela) e feita (papel com o visto verde).
- **Movimento com significado**: o número conta e um traço o sublinha quando assenta; o traço verde desce de um passo ao outro; a linha do gráfico avança ponto a ponto; a barra da conta ganha o pedaço de cada linha e o total soma; o vencedor ganha o visto e o outro o xis; no fim, a chave entra na fechadura da placa e gira.
- **Trocas**: a pessoa vai da tela cheia para a porta da direita (e volta) em 0,52 s, com curva firme e simétrica, começando 0,14 s antes da fronteira (o corte some no movimento). O objeto da parede entra pela esquerda junto com ela; o que sai e o que entra andam juntos para o mesmo lado, como a câmera passando pelo hall: nunca se sobrepõem, nada esmaece. As artes do peito ficam recortadas pela porta da pessoa e saem com ela; entre duas artes de peito, a que sai desce e some antes de a nova entrar.

### Organização e hierarquia

- Uma ideia por vez, num objeto só, ocupando a parede da esquerda ou o peito.
- Títulos em serifa no alto do objeto; itens em grotesca; detalhes menores em cinza; rótulos em caixa alta espaçada, em verde.
- Itens sempre numerados (etiquetas, círculos, chaveiros) e marcados com o visto quando já foram ditos.
- As partes grandes do vídeo ficam no quadro de chaves, no alto da parede: o espectador vê em que parte está ("Item 2 de 3").

### Tipografia

- **Young Serif** 400 (títulos, números, frases e perguntas no peito, a assinatura): serifa pesada e calorosa, de placa de prédio. Algarismos alinhados (o "1" tem bandeira e não parece "I").
- **Familjen Grotesk** 500 a 700 (itens, rótulos, valores, legenda): o "l" tem perna e o "I" é reto, então "Il1" e "IPTU" não se confundem.
- Espaçamento: títulos −0,01em; rótulos em caixa alta +0,09em.
- Tamanhos (quadro deitado de 1920 × 1080; a parede da esquerda tem o tamanho da parede do vertical, então os corpos são os mesmos): títulos 60 a 92 px; frases no peito 52 a 88 px; números da etiqueta de preço até 250 px; itens 40 a 62 px; detalhes ≥ 30 px; rótulos em caixa alta 30 a 46 px; legenda 44 px. Nada abaixo de 30 px. Julgue nos quadros a ~960 px de largura.
- Todo texto é medido com as larguras das fontes (`src/medida.ts`) e reduzido até caber; nunca vaza.

### Moldura da pessoa

- Sempre o vídeo inteiro reenquadrado dentro de uma porta (`VideoNaCaixa` do motor, que segue o rosto). Nunca recortada do fundo, nunca coberta.
- O batente (madeira clara com chanfro e junta escura) é desenhado por dentro da caixa da pessoa e engrossa de 22 a 34 px conforme o tamanho dela. Numa porta menor, a plaquinha preta com o número da porta fica no alto do batente (se houver número).
- Lugares no quadro deitado (`src/layout.ts`, a regra da aula 9): **tela cheia** (a tela é o vão, a pessoa como foi gravada; é a base) e **porta da direita** (a moldura: x 1264, 560 px de largura, do alto em y 48 até o piso em y 996). Na porta, o vídeo aproxima até o rosto ocupar ~40% da largura dela (gravação de longe aproxima mais, até 1,8×; de perto, nada), o rosto fica no meio, a cabeça inteira com folga em cima, e o motor acompanha o rosto com ajuste suave (o rastro), sem saltos.
- Nada de pessoa numa coluna estreita nem numa janelinha no canto: ou tela cheia, ou a porta inteira da direita.

### Cores e textura

- **cimento queimado** `#C9C4BB`: a parede (textura suave em `public/parede.jpg`); piso de porcelanato `#A0988C` com rodapé claro.
- **madeira clara** `#A8764A` (com `#C49268` e `#7A5233`): batente, réguas, quadro de chaves, barras do gráfico, as folhas da porta.
- **preto fosco** `#1E1D1B`: texto, pinos, pregos, a prancheta, os chaveiros de couro, as placas.
- **papel** `#F6F2EA`: etiquetas, tiras, a folha da prancheta, o recibo.
- **latão** `#C39A4E`: só metal (argolas, ilhós, chaves, parafusos, prendedor, o selo "?").
- **verde** `#1E6B53`: o único acento, só para o que está acontecendo agora (a etiqueta acesa, o visto, o total, o traço do número, a tinta do gráfico, o destaque das frases).
- **terracota** `#A8452C`: só problema (a placa de alerta, o risco, o xis do lado que perde).
- Sombras curtas e embaixo dos objetos (papel e madeira têm peso), nunca halo. Nada de gradiente decorativo, brilho atrás da pessoa, contorno em letra, emoji ou foto de banco.

### Som

Senos com envelope curto e passa-baixa (`public/sfx/`): duas notas graves na porta; toque de madeira subindo de altura em cada etiqueta que chega no gancho; toque curto em cada chave, passo ou dado; nota grave no número e na placa de destaque; duas notas quando a conta fecha ou o vencedor ganha; acorde curto no fechamento; dois toques graves quando a chave gira. Nunca dois a menos de 0,45 s. Nada de ruído, rangido, chacoalhar de chaves, clique agudo ou sino.

### Medidas (quadro deitado 1920 × 1080, `src/tema.ts`)

| O quê | Onde |
|---|---|
| margens seguras (YouTube) | 96 px nas laterais; nada importante abaixo de y 984 (controles do player); texto até y 960 |
| porta da direita (a moldura da pessoa) | x 1264 a 1824 (560 px), do alto em y 48 até o piso em y 996; o rosto no meio dela |
| parede da esquerda (o quadro) | x 96 a 1216 (~1120 px), y 72 a 960: blocos de parede e o "N×" |
| quadro de chaves (itens) | régua em y 60 na largura da parede, etiquetas de 196 px até y ~316; os painéis dos itens embaixo dele, de y 326 a 960 |
| artes no peito (tela cheia) | do `zona.topo` do motor (logo abaixo do queixo, ~640) até y 960, centradas no rosto, até 1240 px de largura; a etiqueta tem a largura do texto; definição, pergunta e fechamento em fileira; o fechamento sobe até ~30 px abaixo do queixo |
| rosto baixo no quadro | sobrando menos de ~230 px embaixo do queixo, a arte do peito vai para o lado livre do rosto |
| legenda | terço de baixo, y 868, uma linha de até ~42 caracteres, 44 px |
| piso | rodapé e porcelanato a partir de y 996 (sob os controles do player) |

### A composição da aula 9 do curso (editar uma aula horizontal)

- Tela cheia como base; a parede abre quando acrescenta clareza e fecha ao fim da ideia.
- A pessoa numa moldura à direita (a porta), com o rosto centralizado nela e acompanhado com ajuste suave; a explicação na parede à esquerda, entrando na ordem do raciocínio, com tempo de leitura.
- Sem excesso de cor nem informação simultânea: um objeto, uma ideia, o verde em uma coisa.
- Cortes nas pausas excessivas e nos erros, mantendo a respiração natural (o `cortar.mjs` deste modelo junta pausas de até ~0,45 s, mais que o vertical).

## O que pode mudar por vídeo

- Textos, tempos, itens, valores, ícones, marcas dos chaveiros e a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e área), o número da porta (`numero` na `abertura`), o enquadramento na porta da direita (`pessoa.zoom`, `pessoa.ancoraY`).
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica das portas, das trocas e do quadro de chaves (`src/layout.ts`, `src/componentes/Quadro.tsx`, `src/componentes/Parede.tsx`): tamanhos, posições, curvas e durações. É a identidade do modelo.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `verde` (e o `verdeClaro`, uma versão bem clara dele) em `src/tema.ts`, por uma cor média e escura o bastante para texto de papel por cima. Madeira, cimento, preto e latão seguram a elegância.
- As fontes e os tamanhos mínimos; nada de texto abaixo de y 960 (controles do player) nem fora das margens de 96 px.
- Não adicione emojis, stickers, fotos de banco, brilho atrás da pessoa, contorno nas letras, gradientes, tremidas, flashes nem transições entre cortes além das trocas de porta. Não troque os desenhos a traço por ícones coloridos.

## Se precisar de algo que o modelo não tem

- **Um ícone novo** (chaveiro, fechamento): acrescente em `desenhos` (`src/componentes/Icones.tsx`), viewBox 64×64, só traço (pontas redondas, sem preenchimento), e o nome no tipo `Icone` (`src/plano.ts`).
- **Um cômodo novo** (miniaturas da prancheta): acrescente o desenho em `src/componentes/Comodos.tsx` (viewBox 200×150, formas simples com as cores da paleta) e o nome no tipo `Comodo`.
- **Um bloco novo de parede**: um componente que recebe `m`, `t`, `palavras`, `w` e `h` e desenha dentro da área da parede da esquerda (~1120 × 890 px), com estado a lápis antes de cada palavra; acrescente o tipo em `src/plano.ts`, o nome em `TIPOS_DE_PAREDE` (`src/layout.ts`) e o caso em `src/Edicao.tsx`. Use `prog`, `balanco`, `Linhas` e `temposDoTexto` (`src/anim.tsx`), `encaixar` (`src/medida.ts`), as peças de `src/componentes/Pecas.tsx` e as cores de `src/tema.ts`. Consulte a skill do Remotion para as regras de animação.
