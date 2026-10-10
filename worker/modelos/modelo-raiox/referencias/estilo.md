# O estilo Raio-X

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer uma sala de laudos bem produzida — a chapa no negatoscópio, o esqueleto em traço luminoso que se corrige enquanto a pessoa fala — e não um vídeo com enfeites de "saúde". Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

Quem explica postura no consultório faz três coisas: fala olhando para o paciente, prende a chapa no negatoscópio e aponta na chapa o que está errado e como fica certo. O modelo repete esse ritmo. A pessoa abre em quadro cheio; a cada ajuste, ela vira uma chapa iluminada no alto da tela, o negatoscópio acende embaixo e a chapa do ajuste mostra o esqueleto sentado à mesa com a postura errada — o ponto de tensão acende onde dói, a parte se corrige na palavra que a pessoa diz, a linha de alinhamento ou o arco de 90° confirma, e a tensão apaga com ✓. A cada ajuste, uma chapa nova desliza por cima da anterior e a pessoa troca de lado. Na pausa, ela vai para o centro e o esqueleto se levanta e caminha. No fim, as chapas voltam em miniatura, todas corrigidas.

## Regras que definem o estilo

- **Três estados da pessoa, um de cada vez.** Quadro cheio (rosto na linha do centro, chapa-cartão na altura do peito), chapa iluminada no alto (372×456 px, à esquerda ou à direita, alternando a cada ajuste) e chapa iluminada no centro (na pausa, entre o relógio e o cronômetro). A troca é a própria caixa da pessoa se movendo (0,55 s, macia nas duas pontas), e o corte da fala cai no meio do movimento.
- **A pessoa é uma chapa iluminada, não uma janela.** Aro escuro de metal (12 px), uma borda de luz fria (9 px) e o vídeo dentro; o rodapé escuro traz o nome e a área em marcação de filme. **A luz fica na moldura, nunca atrás da pessoa**: nada de brilho, halo ou clarão em volta dela. O vídeo dela não recebe filtro de raio-x — o rosto fica natural.
- **O negatoscópio é o palco.** Aro de metal com presilhas, painel de luz fria que acende com duas pequenas oscilações (sem clarão cru) e a chapa por cima, com a borda de luz aparecendo em volta. A chapa é um negativo azulado, mais escuro nas bordas, com grão de filme e a faixa de identificação embaixo (marcador "D", recorte, número). A primeira chapa já está no painel e se revela enquanto a luz acende; as seguintes deslizam da direita por cima da anterior, que só sai quando a nova cobriu o painel.
- **O esqueleto é traço luminoso, de perfil, anatômico** — crânio com órbita e mandíbula, coluna vértebra por vértebra (com as curvas e os processos espinhosos), costelas, pelve e sacro, ossos longos com as pontas alargadas, mãos e pés — e a silhueta do corpo bem apagada em volta, como o tecido mole numa chapa. O lado de lá do corpo (o outro braço, a outra perna) fica mais apagado. Móveis (cadeira, mesa, monitor, teclado, porta) em traço fino e apagado. **O brilho é só do desenho.**
- **A postura se corrige de chapa em chapa**: o que já foi corrigido continua certo, o que ainda vai ser corrigido continua errado. Cada correção acontece na palavra que a descreve; nada se mexe sem motivo.
- **Linguagem fixa das anotações**: tensão = ponto vermelho que pulsa e apaga para o ciano com ✓; medida e alinhamento = linha tracejada ciano (olhos, prumo, eixos), arco que se desenha com o valor contando e o esquadro em 90°; apoio = a superfície que acende em ciano; destaque = anel ciano que se desenha; rótulo = marcação de filme em caixa-alta numa etiqueta escura com fio até o ponto.
- **Poucas cores, cada uma com função**: o fundo da sala (#04080D, parede #08111A), o filme (#0B1824 → #12263A no centro), o traço do osso (#E4F4FB), a luz fria do painel (#D9E9F0), **o ciano de medida (#5CC8E8) = o acento**: alinhamento, ângulo, apoio, o que ficou certo, os números das chamadas; **o vermelho (#FF5446) só para tensão** e para a palavra de dor do título. Nada de outra cor, degradê colorido ou sombra colorida.
- **Duas famílias gratuitas**: **Inclusive Sans** (700 nos títulos, 500 no apoio, 600 na legenda) — humanista, de leitura fácil, com o **I maiúsculo serifado** (o "Iogurte Il1 IPTU" não confunde) — e **Reddit Mono** (600–700) nas marcações de filme: etiquetas, faixa da chapa, rodapé da pessoa, valores de ângulo e mostradores. Nada de fonte condensada.
- **Texto que se revela como filme no revelador**: títulos nascem em esboço (17%) e cada palavra acende no instante em que é dita, com um leve desfoque que assenta e passando pelo ciano até o branco. Nada de caixa vazia esperando a fala.
- **Legível no celular** (julgue nos quadros reduzidos a 540 px): título do ajuste 88 → 66 px, apoio 48 → 44 px, título da abertura 88 → 64 px, chamada 116 → 72 px, título da pausa 72 → 58 px, laudo 84 → 64 px, fechamento 84 → 66 px, valor do ângulo 46 px, mostradores 40 px, etiquetas, faixa da chapa, rodapé da pessoa e assinatura 32 px (nunca menos de 32), legenda 46 px. As medidas de texto vêm da própria fonte (`src/medidas.ts`): o template escolhe o corpo e quebra as linhas antes de desenhar.
- **Cantos reservados**: nada acima de 170 px (abas do app) nem abaixo de 1560 px (interface do app); nenhum texto passa de x 960 (coluna de botões à direita). O negatoscópio vai de 718 a 1530 px; o conteúdo enche o quadro até aí.
- **Movimento com significado**: a tela sobe num suporte, a cabeça volta ao prumo, os pés descem ao chão, o cotovelo volta para o corpo, o arco conta até 90°, o esqueleto se levanta e caminha até a porta. Entra decidido e assenta: sem quique, sem elástico, sem giro de enfeite, sem tremida.
- **Som raro e tonal**: um "vum" grave quando o negatoscópio acende, um toque surdo quando a chapa encosta, um pulso grave quando a tensão acende na abertura, duas notas subindo quando a tensão apaga, uma nota curta quando a medida fecha, um tom que sobe quando a tela sobe ou o esqueleto se levanta, um acorde curto no fim. Nada de bipe de aparelho (é agudo), ruído, clique ou sino.

## Os blocos universais neste estilo

Os 11 blocos universais (`abertura`, `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `destaque`, `definicao`, `frase`, `pergunta`, `cta`) usam a mesma linguagem: chapa-cartão no peito em quadro cheio, ou negatoscópio com a chapa iluminada da pessoa no alto e o filme do momento embaixo; texto que se revela no revelador; ciano para medida e para o que está certo, vermelho só para tensão e alerta; marcações em Reddit Mono; mesmos tamanhos mínimos (nada abaixo de 32 px). O `ajuste` com `itens` é o mesmo raio-x com uma coluna de frente em vez do esqueleto sentado.

## O que pode mudar por vídeo

- Textos, tempos, correções (partes, passos, vistas, rótulos) e a escolha dos componentes (é o trabalho do plano).
- `marca` (nome e área).
- O recorte: o `modelo.json` fixa 9:16 para gravação vertical; gravação horizontal vira 3:4.
- O `zoom` das chapas da pessoa em `src/tema.ts`, se a cabeça cortar no alto (enquadramento muito fechado): diminua até o rosto caber inteiro.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica dos três estados (`src/layout.ts`): tamanho e lugar das chapas da pessoa, a alternância de lado, a duração e a curva das trocas, a chapa nova deslizando sobre a anterior. É a identidade do modelo.
- O esqueleto e a cena (`src/esqueleto/`): proporções, posturas certa e errada, móveis e câmeras das vistas — foram ajustados para a correção ficar legível no celular.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `ciano` em `src/tema.ts` por uma cor clara e fria o bastante para ler sobre o filme escuro. O vermelho de tensão, o negativo azulado e o traço branco seguram o visual.
- As fontes e os tamanhos; as margens de 60 px.
- Não adicione emojis, logotipos, brilho atrás da pessoa, contorno nas letras, gradientes coloridos, flashes, "zoom de impacto", filtro de raio-x no rosto ou transições entre cortes além das trocas da pessoa. Não troque o desenho anatômico por ícones, fotos de radiografia ou modelos 3D.

## Se precisar de algo que o modelo não tem

- **Outra parte que se corrige** (por exemplo, o apoio de punho ou a profundidade do assento): acrescente o valor em `Parte` (`src/plano.ts`), as duas posturas (errada e certa) em `src/esqueleto/pose.ts` (`posturaNaMesa`) e, se for um objeto, o desenho em `src/esqueleto/Desenho.tsx`, com a mesma linguagem (traço apagado para objetos, osso luminoso). Consulte a skill do Remotion para as regras de animação.
- **Outra cena** (em pé, deitado, agachamento): crie uma função irmã de `posturaNaMesa` com as posturas e uma vista nova em `RECORTES` (`src/esqueleto/Cena.tsx`); o esqueleto já aceita ângulos e alvos para braços e pernas (`Postura` em `pose.ts`) — a pausa usa isso para levantar e caminhar.
- **Mais componentes de quadro cheio**: siga o `Laudo.tsx` — `Cartao` (filme com borda de luz), `diagramar` de `src/medidas.ts` para o corpo do texto, `Linhas` para as palavras se revelarem na fala, entrada subindo e saída cruzando com o próximo.
