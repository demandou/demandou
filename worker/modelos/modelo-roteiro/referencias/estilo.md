# O estilo Roteiro

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a sensação de um roteiro de viagem sendo traçado na hora, num caderno de viagem bem desenhado. Quase toda "melhoria" que adiciona enfeite piora o resultado.

## A ideia

Um roteiro planejado a lápis que ganha tinta enquanto a pessoa fala. O vídeo abre com um cartão de embarque no peito; no primeiro corte, a pessoa vira um cartão-postal e a tela vira o mapa da cidade, desenhado à mão: rio, morros em curvas de nível, bairros como manchas de quarteirões. A rota inteira já está ali, tracejada a lápis; quando a pessoa diz um lugar, o pontilhado azul chega até ele, o pino cai e um postal ilustrado do lugar ganha cor; quando diz a hora, o sol anda na barra do dia; quando a frase da parada termina, o carimbo de "visitado" bate. O postal da pessoa viaja junto (troca de lado quando a viagem muda de direção) e ela volta para a tela cheia no fechamento, com o passaporte carimbado.

## Regras que definem o estilo

- **Gramática de layout**: tela cheia (cartão no peito) → mapa com a pessoa no postal → tela cheia. A troca começa no corte e leva 0,75 s, sempre com a mesma curva (sai e chega suave). No mapa, o postal fica do lado de onde a rota veio e o pino ativo do outro lado; a câmera do mapa acompanha a viagem, se afasta no meio das viagens longas e mostra a rota inteira na dica. Nada de recortar a pessoa do fundo: ela é sempre o vídeo inteiro dentro de uma moldura.
- **Rosto sempre visível**: em tela cheia, na linha vertical do centro; no postal (512 px, quase metade da largura — a pessoa continua sendo a protagonista), inteiro, com respiro em cima. Ao trocar de lado, o postal encolhe um pouco e sobe no meio da travessia, para não esconder a ponta da rota; na dica, vai para o canto de cima sem pinos. Nada passa por cima do rosto — a barra do dia fica acima do postal, os cartões abaixo, o selo só no canto da foto.
- **Lápis → tinta é a assinatura**: tudo o que vai acontecer já está esboçado em cinza-lápis (rota tracejada, pinos tracejados com número, cartões com desenho a traço e nome apagado, títulos em cinza) e passa a tinta no instante da fala. É isso que garante "nunca vazio" e "algo muda a cada frase". Não troque por textos que surgem do nada.
- **Paleta de luz de viagem**: areia `#F1E6D1` (o chão do mapa), papel `#FBF6EC` (cartões, bilhete, postal), céu `#CBE0EC` (água e céu da barra), **um** azul de azulejo `#1F47A6` para tudo que é assunto (rota, pinos, carimbos, nomes em destaque, ênfases), e o amarelo do sol `#F2B23A` só no sol, no bonde e nos doces. O lápis `#B2A389` é a cor do que ainda não aconteceu. Do primeiro ao último período o mapa esquenta de leve (o fim do dia é mais dourado). Sem gradiente colorido, sem brilho, sem contorno em texto; a única sombra é a de papel sobre a mesa (escura, curta, para baixo).
- **Duas fontes, sem condensadas**: Fraunces (serifada de exibição com curvas macias; 600 nos nomes de lugares e títulos, itálico para o destino e as ênfases) e Fira Sans (sans humanista; rótulos em caixa alta espaçada, rótulos da barra do dia, chips, números de pino, passageiro). Nas duas o I maiúsculo não se confunde com o l. Ambas gratuitas, pelo Google Fonts.
- **Ilustração de um ilustrador só**: traço azul-azulejo de espessura única, cantos redondos, cor chapada por baixo (papel, céu, areia, sol). Desenhos legíveis em qualquer quadro: o traço se faz em sequência e a cor entra por baixo; antes da fala, o mesmo desenho aparece só em traço de lápis.
- **Movimento de viagem**: a rota anda com velocidade de viagem (sai, cruza, chega devagar), para no ponto de embarque e segue com o veículo; o pino cai e assenta; o cartão entra subindo e assenta com uma leve inclinação de postal; o carimbo bate decidido (chega 30% maior e assenta, sem quicar); o sol percorre um arco e a etiqueta azul do período ativo desliza de um rótulo para o outro (um só elemento se move; os rótulos não trocam de fonte). Nada de elástico, tremida, flash ou giro gratuito. A única inclinação é a dos papéis (postal, cartões, passaporte), de 0,5° a 2,5°, como papéis sobre a mesa.
- **Movimento com significado**: o veículo só aparece onde o transporte realmente sai; o "pertinho dali" é um trecho curto entre dois pinos vizinhos; o sol se põe atrás do casario quando a pessoa diz "pôr do sol"; o passaporte guarda um carimbo por parada visitada. Se um movimento não explica nada, ele não entra.
- **Legível no celular**: nomes de lugares de 72 px (cartões lado a lado, 2 linhas) a 84 px (cartão largo, até 3 linhas), encolhendo no máximo até 52 px num nome longo; títulos de embarque e passaporte 80–100 px, linha de baixo do passaporte 52 px, chips e rótulos dos ícones 40 px, rótulos da barra do dia 38 px, rótulos de bairro 36 px, etiquetas dos cartões e assinatura do postal 34 px, letreiros do bilhete 32–34 px; nada abaixo de 30 px (julgue com o quadro reduzido a 540 px). Pinos de 78 × 102 px com número de 36 px.
- **Legenda em etiqueta de papel**, Fira Sans 46, uma linha, cada palavra ganhando tinta; só aparece nos trechos sem momento (os cartões e o mapa já dizem o que é falado).
- **Som raro e tonal**: um acorde suave na abertura, uma nota por pino (subindo de parada em parada), um "tum" grave por carimbo, uma nota na dica e no marcador do fechamento. Nada de ruído, risco de papel, clique agudo ou sino.

## Os blocos universais no mesmo estilo

Qualquer assunto vira papel de viagem sobre o mesmo mapa. Número = etiqueta de bagagem com a escala do mapa; destaque = papel com carimbo; definição = placa de rua de azulejo e rota até o significado; frase = verso de cartão-postal (selo, risco em telha); pergunta = formulário de desembarque; fechamento = passaporte. No mapa: lista = pinos soltos e guia de papel; passos = rota numerada; comparação = rota que se divide em dois postais; gráfico = quarteirões, rota com pinos ou carimbo redondo. Mesmas regras: lápis antes da fala, tinta na fala, telha só para o problema (alerta, lado errado, risco), azulejo para o assunto, nada de papel sobre papel nas trocas.

## O que pode mudar por vídeo

- Textos, tempos, o mapa (opcional: cidade, água, bairros, morros, posições), os desenhos e a escolha dos componentes (é o trabalho do plano).
- `marca` (nome e área) e os rótulos da barra do dia (`dia`).
- `postal.zoom` e `postal.ancoraY`, se o rosto ficar pequeno ou cortado no postal.
- O recorte (9:16 ou 3:4), escolhido pelo `cortar.mjs`.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Cores, fontes, espessuras de traço e tamanhos de texto (em `src/tema.ts`). Se o usuário pedir a cor da marca dele, troque **só** o `azulejo` (e o `azulejoVeu`, a versão clarinha); areia, papel, céu e sol seguram o estilo.
- As posições fixas (barra do dia, postal, faixa dos cartões, âncora dos pinos, em `src/tema.ts`) e a lógica da câmera e do postal (em `src/roteiro.ts`).
- A regra de um acento: se tudo fica azul, nada é assunto.
- Não adicione emojis, stickers, mapas de verdade (prints, satélite), fotos de banco, setas genéricas, barra de progresso, transições entre cortes ou brilhos. Eles pertencem a outros modelos — ou a nenhum.

## Se precisar de algo que o modelo não tem

- **Um desenho novo** (lugar, comida, transporte): acrescente em `src/componentes/Desenhos.tsx` — caixa 240 × 180, traço com `k.s(i, corDePreenchimento)` (traço que se desenha, com cor por baixo), detalhe com `k.d(i)`, cor sem traço com `k.f(cor)`; `n` = quantidade de traços em sequência — e o nome em `NOMES_DESENHOS`. Confira no tamanho do cartão (238 px) e no ícone pequeno (84 px).
- **Um transporte novo**: o nome em `Transporte` (`src/plano.ts`), o nome de exibição em `NOME_DO_TRANSPORTE` (`src/componentes/Cartoes.tsx`) e um desenho com o mesmo nome.
- **Um componente novo**: siga a gramática acima — tela cheia (cartão na `zona`) ou mapa (cartão na faixa `CARTOES`), texto falado com `TextoALapis` e `temposDoTexto` (`src/anim.tsx`), cores de `tema.ts` — e consulte a skill do Remotion para as regras de animação.
