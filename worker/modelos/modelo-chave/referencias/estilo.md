# O estilo Chave

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer o hall de um apartamento bem cuidado (madeira, cimento queimado, latão, papel) com objetos de verdade, e não um vídeo com cartões e ícones; quase toda "melhoria" que adiciona coisa piora o resultado. Isso vale para qualquer assunto: cripto, saúde ou receita aparecem nas mesmas etiquetas, placas, pranchetas e recibos.

## A ideia

O vídeo é uma visita. Abre com a porta do apartamento fechada; ela destrava e se abre, e a pessoa aparece no vão. O batente de madeira vira a moldura dela até o fim. Quando a fala organiza uma ideia, a câmera recua para o hall: a pessoa vai para uma porta apoiada no piso e, na parede de cimento queimado, aparece o objeto que mostra a ideia (uma etiqueta de preço, um quadro de chaves, a prancheta, um recibo). Nas partes grandes do vídeo, um quadro de chaves desce do alto e cada parte é uma chave. Sóbrio, calmo e concreto.

## O sistema visual

### Motion

- **Objeto de verdade, não animação de interface.** Etiquetas caem no gancho, no pino ou no prego e balançam como pêndulo amortecido curto (≤ 10°, assenta em ~1 s). Placas sobem e assentam nos parafusos. Peças paradas balançam muito de leve (meio grau, em 3,4 s), como coisa pendurada. Sem quique, sem elástico, sem giro decorativo, sem flash.
- **Tudo já está desenhado a lápis.** Títulos, itens, números, linhas da conta, barras do gráfico, etiquetas e chaveiros aparecem desde o começo em cinza (texto apagado, contorno tracejado) e ganham tinta, papel, foto ou cor no instante em que são ditos. Cada palavra sobe um pouco e ganha tinta no seu tempo; quando termina, vira texto simples.
- **Três estados de uma etiqueta**: a lápis (vai acontecer), acesa (verde: é a vez dela) e feita (papel com o visto verde).
- **Movimento com significado**: o número conta e um traço o sublinha quando assenta; o traço verde desce de um passo ao outro; a linha do gráfico avança ponto a ponto; a barra da conta ganha o pedaço de cada linha e o total soma; o vencedor ganha o visto e o outro o xis; no fim, a chave entra na fechadura da placa e gira.
- **Trocas**: a pessoa muda de porta em 0,52 s, com curva firme e simétrica, começando 0,14 s antes da fronteira (o corte some no movimento). O objeto da parede que sai e o que entra andam juntos para o mesmo lado, como a câmera passando pelo hall: nunca se sobrepõem, nada esmaece. As artes do peito ficam recortadas pela porta da pessoa e saem com ela; entre duas artes de peito, a que sai desce e some antes de a nova entrar.

### Organização e hierarquia

- Uma ideia por vez, num objeto só, ocupando a parede ou o peito.
- Títulos em serifa no alto do objeto; itens em grotesca; detalhes menores em cinza; rótulos em caixa alta espaçada, em verde.
- Itens sempre numerados (etiquetas, círculos, chaveiros) e marcados com o visto quando já foram ditos.
- As partes grandes do vídeo ficam no quadro de chaves, no alto: o espectador vê em que parte está ("Item 2 de 3").

### Tipografia

- **Young Serif** 400 (títulos, números, frases e perguntas no peito, a assinatura): serifa pesada e calorosa, de placa de prédio. Algarismos alinhados (o "1" tem bandeira e não parece "I").
- **Familjen Grotesk** 500 a 700 (itens, rótulos, valores, legenda): o "l" tem perna e o "I" é reto, então "Il1" e "IPTU" não se confundem.
- Espaçamento: títulos −0,01em; rótulos em caixa alta +0,09em.
- Tamanhos (quadro de 1080): títulos 60 a 92 px; frases no peito 52 a 80 px; números da etiqueta de preço até 250 px; itens 40 a 62 px; detalhes ≥ 30 px; rótulos em caixa alta 30 a 46 px; legenda 46 px. Nada abaixo de 30 px. Julgue nos quadros reduzidos a 540 px.
- Todo texto é medido com as larguras das fontes (`src/medida.ts`) e reduzido até caber; nunca vaza.

### Moldura da pessoa

- Sempre o vídeo inteiro reenquadrado dentro de uma porta (`VideoNaCaixa` do motor, que segue o rosto). Nunca recortada do fundo, nunca coberta.
- O batente (madeira clara com chanfro e junta escura) é desenhado por dentro da caixa da pessoa e engrossa de 22 a 34 px conforme o tamanho dela. Numa porta menor, a plaquinha preta com o número da porta fica no alto do batente (se houver número).
- Lugares (`src/layout.ts`): **quadro cheio** (a tela é o vão); **porta de baixo** (apoiada no piso a 1648 px, 600 px de altura, centrada, de 600 a 860 px de largura conforme o tamanho do rosto, para a cabeça caber inteira); **porta do alto** (sob o quadro de chaves, 530 px de altura); **porta deslocada** (à direita, de corpo inteiro). As portas estreitas ao lado do painel (o demo) só valem para pessoa longe da câmera.
- Nada de pessoa numa coluna vertical estreita em vídeos novos.

### Cores e textura

- **cimento queimado** `#C9C4BB`: a parede (textura suave em `public/parede.jpg`); piso de porcelanato `#A0988C` com rodapé claro.
- **madeira clara** `#A8764A` (com `#C49268` e `#7A5233`): batente, réguas, quadro de chaves, barras do gráfico.
- **preto fosco** `#1E1D1B`: texto, pinos, pregos, a prancheta, os chaveiros de couro, as placas.
- **papel** `#F6F2EA`: etiquetas, tiras, a folha da prancheta, o recibo.
- **latão** `#C39A4E`: só metal (argolas, ilhós, chaves, parafusos, prendedor, o selo "?").
- **verde** `#1E6B53`: o único acento, só para o que está acontecendo agora (a etiqueta acesa, o visto, o total, o traço do número, a tinta do gráfico, o destaque das frases).
- **terracota** `#A8452C`: só problema (a placa de alerta, o risco, o xis do lado que perde).
- Sombras curtas e embaixo dos objetos (papel e madeira têm peso), nunca halo. Nada de gradiente decorativo, brilho atrás da pessoa, contorno em letra, emoji ou foto de banco.

### Som

Senos com envelope curto e passa-baixa (`public/sfx/`): duas notas graves na porta; toque de madeira subindo de altura em cada etiqueta que chega no gancho; toque curto em cada chave, passo ou dado; nota grave no número e na placa de destaque; duas notas quando a conta fecha ou o vencedor ganha; acorde curto no fechamento; dois toques graves quando a chave gira. Nunca dois a menos de 0,45 s. Nada de ruído, rangido, chacoalhar de chaves, clique agudo ou sino.

### Medidas (`src/tema.ts`)

Margem de 56 px; nada acima de 176 px (abas do app); quadro de chaves com a régua em 196 px e as etiquetas até ~490 px; parede de 196 px até 30 px acima da porta de baixo; todo texto termina acima de 1556 px (interface do app); piso a partir de 1648 px; artes no peito a partir do `zona.topo` do motor, e o fechamento sobe até ~30 px abaixo do queixo para deixar as mãos livres.

## O que pode mudar por vídeo

- Textos, tempos, itens, valores, ícones, marcas dos chaveiros e a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e área), o número da porta (`numero` na `abertura`), o enquadramento nas portas menores (`pessoa.zoom`, `pessoa.ancoraY`).
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica das portas, das trocas e do quadro de chaves (`src/layout.ts`, `src/componentes/Quadro.tsx`, `src/componentes/Parede.tsx`): tamanhos, posições, curvas e durações. É a identidade do modelo.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `verde` (e o `verdeClaro`, uma versão bem clara dele) em `src/tema.ts`, por uma cor média e escura o bastante para texto de papel por cima. Madeira, cimento, preto e latão seguram a elegância.
- As fontes e os tamanhos mínimos; nada de texto abaixo de 1560 px nem acima de 176 px.
- Não adicione emojis, stickers, fotos de banco, brilho atrás da pessoa, contorno nas letras, gradientes, tremidas, flashes nem transições entre cortes além das trocas de porta. Não troque os desenhos a traço por ícones coloridos.

## Se precisar de algo que o modelo não tem

- **Um ícone novo** (chaveiro, fechamento): acrescente em `desenhos` (`src/componentes/Icones.tsx`), viewBox 64×64, só traço (pontas redondas, sem preenchimento), e o nome no tipo `Icone` (`src/plano.ts`).
- **Um cômodo novo** (miniaturas da prancheta): acrescente o desenho em `src/componentes/Comodos.tsx` (viewBox 200×150, formas simples com as cores da paleta) e o nome no tipo `Comodo`.
- **Um bloco novo de parede**: um componente que recebe `m`, `t`, `palavras`, `w` e `h` e desenha dentro da área da parede, com estado a lápis antes de cada palavra; acrescente o tipo em `src/plano.ts`, o nome em `TIPOS_DE_PAREDE` (`src/layout.ts`) e o caso em `src/Edicao.tsx`. Use `prog`, `balanco`, `Linhas` e `temposDoTexto` (`src/anim.tsx`), `encaixar` (`src/medida.ts`), as peças de `src/componentes/Pecas.tsx` e as cores de `src/tema.ts`. Consulte a skill do Remotion para as regras de animação.
