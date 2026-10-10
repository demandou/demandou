# O estilo Tática

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um programa de análise de futebol bem produzido — o comentarista, a prancheta e o pacote gráfico da transmissão — e não um vídeo com enfeites de futebol. Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

Quem explica uma jogada na TV faz três coisas: fala olhando para a câmera, chama a prancheta e desenha o lance por cima dela. O modelo repete esse ritmo. A pessoa abre em quadro cheio; a cada dica, ela encolhe para a caixa de transmissão no canto (como o comentarista) e a tela inteira vira o campo, onde o lance se desenha no ritmo da fala — a bola chega quando ela diz "chegar", o chute corre quando ela diz "chuta", o canto acende quando ela diz "canto". Entre uma dica e outra ela volta ao quadro cheio, com a vinheta "DICA 2". O placar "DICA 1/3" no canto diz o tempo todo onde estamos, como o placar de um jogo.

## Regras que definem o estilo

- **Duas telas, uma de cada vez.** Quadro cheio (a pessoa, rosto na linha do centro, arte de TV na altura do peito) ou prancheta (o campo em tela cheia, a pessoa na caixa de transmissão no canto de cima à direita, 384×486 px, cantos de 26 px, fio claro em volta e a tarja de nome na base). A troca é a própria caixa da pessoa crescendo ou encolhendo (0,52 s, macia nas duas pontas): a prancheta aparece por trás dela, já desenhada, e some por baixo dela. O corte da fala cai no meio desse movimento.
- **A prancheta é giz sobre grama.** Verde de gramado com faixas de corte (a cada 5,5 m, em perspectiva), linhas brancas de 6 px com pontas redondas, a área vista de trás do lance com perspectiva leve (a câmera fica a 55 m da linha do gol), gol com rede fina. Vinheta escura discreta nas bordas e uma faixa mais escura no alto, onde ficam o cabeçalho e a caixa — nunca brilho.
- **O lance tem uma linguagem fixa**, a mesma de qualquer prancheta: fichas redondas em pé sobre o campo com sombra no chão (nosso time amarelo, adversário escuro com fio claro, goleiro adversário branco), número em fonte larga; **passe = seta tracejada branca**, **chute = seta contínua amarela**, corrida = rastro pontilhado, olhar = cone claro, destaque = anel amarelo que assenta + etiqueta de TV. A bola é uma bola de verdade (gomos escuros que giram quando ela rola), pequena.
- **O gol de frente** é o close do lance (960 px de largura, da linha de 60 px à de 1020 px, com quem chuta embaixo, até ~1550 px): traves grossas, rede em perspectiva, goleiro em desenho chapado (corpo escuro com fio de giz, luvas claras) que acompanha a bola e pula; seis zonas que nascem tracejadas e acendem em amarelo; quem chuta na frente da tela, de costas para nós. Do campo para o gol a câmera "entra": o campo cresce em volta do gol até o gol do campo virar o gol de frente (um corte casado, sem quadro vazio); a bola do campo some antes de a bola da vista de frente aparecer — nunca duas bolas na tela.
- **Pacote gráfico de TV, sóbrio**: tarjas escuras (#0B1016) de cantos de 12 px com uma barra amarela à esquerda, quadrados amarelos com o número, etiquetas escuras com barra amarela. O fundo entra por varredura da esquerda para a direita (0,34 s) e o texto aparece inteiro quando o fundo já abriu — **texto nunca aparece cortado**; na saída a arte inteira desliza para a esquerda e some, cruzando com a que entra. Sem moldura dupla, sem brilho, sem gradiente, sem sombra colorida.
- **Poucas cores, cada uma com função**: verde de campo (#1C6A3D, faixas #21774A, fora do campo #124B2B), giz (#F3F6EF: linhas, texto claro), **amarelo de placar (#FFCB2E) = o acento**: o número das dicas, o chute, a zona acesa, o nosso time, o que é importante; preto de TV (#0B1016: tarjas, adversário). Nada de vermelho, azul ou degradê.
- **Uma família só: Hubot Sans** (variável, gratuita, do Google Fonts) em dois cortes: **larga** (largura 125%, peso 900, caixa-alta) nos títulos, números, placar e tarjas — a cara de transmissão esportiva; e **normal** (100%, 600–700) no apoio, nos itens e na legenda. Rótulos em caixa-alta espaçada (112,5%, 800). Foi escolhida também porque o **I maiúsculo tem serifa**: "Iogurte", "IPTU" e "Il1" nunca confundem I com l. Nada de fonte condensada.
- **Texto que se acende**: títulos e tarjas nascem com as palavras apagadas (esboço a 16–20%) e cada palavra sobe de trás de uma régua e acende no instante em que é dita. Nada de caixa vazia esperando a fala.
- **Legível no celular** (julgue nos quadros reduzidos a 540 px): numeral da abertura 300 px, título da abertura 56–104 px, "DICA" da vinheta 112 px com o número de 250 px, título da dica 88 px (até 50), apoio 48 px, itens do resumo 44–58 px, nome no fechamento até 104 px, chamada 48–72 px, etiquetas do campo e do gol 40 px (nunca menos de 34), tarja da caixa de transmissão 36/32 px (nunca menos de 30), número das fichas ≥ 34 px, placar 54 px, legenda 46 px. As medidas de texto vêm da própria fonte (`src/medidas.ts`): o template escolhe o corpo e quebra as linhas antes de desenhar.
- **Cantos reservados**: placar no canto de cima à esquerda (y 170); caixa de transmissão no canto de cima à direita; nada acima de 170 px (abas do app) nem abaixo de 1560 px (interface do app); fichas fora da faixa dos botões do app (à direita, embaixo — ver a tabela em `plano.md`).
- **Movimento com significado**: cada ação do lance acontece na palavra que a descreve; as fichas entram crescendo do chão; o número do placar rola; o goleiro pula atrasado quando a bola é rasteira. Entra decidido e assenta: sem quique, sem elástico, sem giro de enfeite, sem tremida.
- **Som raro e tonal**: duas notas de placar na abertura e em cada vinheta, um "vum" grave quando a prancheta entra, um toque surdo de bola no passe e um mais forte no chute, uma nota curta subindo de altura quando uma zona acende, um acorde curto no fim. Nada de apito (é agudo), torcida, ruído, clique ou sino.

## Os blocos universais no mesmo estilo

Qualquer assunto vira programa de TV. Número = placar com barra de progresso; destaque = tarja que bate (amarelo cheio no alerta); definição = glossário; pergunta = enquete; lista, passos, comparação e gráfico = o quadro de giz com fichas amarelas, passes tracejados, a bola e barras amarelas. Mesmas regras: esboço apagado antes da fala, amarelo só para o que é assunto, texto nunca cortado, nada de papel sobre papel nas trocas.

## O que pode mudar por vídeo

- Textos, tempos, lances (jogadores, ações, zonas) e a escolha dos componentes (é o trabalho do plano).
- `marca` (nome e área).
- O recorte: o `modelo.json` fixa 9:16 para gravação vertical; gravação horizontal vira 3:4.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica das duas telas (`src/layout.ts`): tamanho e lugar da caixa de transmissão, duração e curva da troca, a vinheta entre as dicas. É a identidade do modelo.
- A câmera do campo (`src/campo.ts`): ela foi ajustada para a área caber com fichas legíveis no celular.
- Cores. Se o usuário pedir a cor do time dele, troque **só** o `placar` em `src/tema.ts` por uma cor clara e quente o bastante para ler sobre o verde e sobre o preto (o número escuro vai em cima dela). O verde, o giz e o preto seguram o visual.
- A fonte e os tamanhos; as margens de 60 px.
- Não adicione emojis, escudos, logotipos de canal ou de campeonato, brilho atrás da pessoa, contorno nas letras, gradientes, flashes, "zoom de impacto" ou transições entre cortes além da troca de tela. Não troque o desenho chapado por fotos de estádio ou ícones 3D.

## Se precisar de algo que o modelo não tem

- **Outra ação no campo** (drible, tabela, cruzamento pelo alto): acrescente o tipo em `AcaoCampo` (`src/plano.ts`), a regra de posição da bola em `src/lance.ts` e o desenho em `src/componentes/CampoVista.tsx`, com a mesma linguagem (tracejado = bola rolando entre jogadores, contínuo amarelo = finalização). Consulte a skill do Remotion para as regras de animação.
- **Outra vista** (campo inteiro, meio-campo, quadra de futsal com medidas próprias): crie um componente irmão de `CampoVista` com sua própria `projetar` e use-o em `Prancheta.tsx`; mantenha as cores, a espessura das linhas e as fichas.
- **Mais componentes de quadro cheio**: siga o `Frase.tsx` — tarja escura, barra amarela, `diagramar` de `src/medidas.ts` para o corpo do texto, `Linhas` com `fantasma` para as palavras acenderem na fala, entrada por varredura e saída cruzando com o próximo.
