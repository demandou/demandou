# O estilo Quiz

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é o **programa de perguntas**: a pergunta, as alternativas que acendem na fala, o suspense do anel e a revelação em verde. Ele é feito de poucas peças repetidas com rigor: cartão branco, selo de letra, anel, faixa verde, moldura de medida. Quase toda "melhoria" que adiciona outro tipo de peça (brilho, neon, confete, luzes piscando, roleta, moedas, dourado) piora e puxa para cara de cassino, que é o oposto do estilo.

O estilo vale para qualquer assunto: curiosidades, saúde, finanças, idiomas, concursos, vendas, histórias. O que muda de um vídeo para outro é a pergunta, as alternativas e as imagens, nunca a linguagem visual abaixo.

## A ideia

A pessoa testa o público. O vídeo **monta o painel do programa**: a pergunta aparece no alto, as alternativas acendem uma a uma na letra falada, o anel conta junto com a voz e a certa acende em verde. Depois, a resposta sobe para uma faixa no alto e o fato explica o porquê. A pessoa fica embaixo o tempo todo, como a câmera do apresentador (nunca numa coluna estreita).

## 1. Dinâmica do motion

- **Cartões**: sobem 34 px e assentam com um leve passar do ponto (82% → 100% em 0,34 s, `salto`); depois **flutuam** ±3 px devagar, cada um no seu tempo (nada fica parado).
- **A alternativa em dois tempos**: na letra, o cartão entra com o selo e a letra grande e clara no meio; no nome, a letra some e a imagem cresce (72% → 100%) com o nome subindo 16 px. A alternativa mais recente tem borda cobalto até a próxima entrar.
- **Texto**: palavra por palavra, cada uma subindo 28% do corpo e acendendo em 0,22 s, no instante em que é dita. Terminada a entrada, a palavra fica desenhada simples (sem camada de animação por cima).
- **O anel**: entra no primeiro número (50% → 100%), o arco cobalto esvazia de forma contínua até a revelação, cada número dito entra com um soco curto (+8%). Na revelação o anel cresce 25% e some em 0,28 s.
- **A revelação**: a certa passa de branco a verde em 0,3 s, o selo vira ✓, um brilho diagonal atravessa o cartão uma vez e o cartão dá um soco de 5%; as outras ficam cinza, a imagem perde a cor e o cartão encolhe 4%. A pessoa leva um soco de 5% de zoom.
- **O voo da resposta** (quiz → fato): ~0,26 s antes do fato, as erradas e a pergunta somem em 0,2 s; a certa viaja em 0,34 s até o alto e vira a faixa verde (selo ✓, imagem, nome). Só depois que ela assenta o cartão do fato aparece embaixo, já no lugar (sem subir, nunca por baixo da faixa em movimento); a frase do fato começa no meio do cartão e sobe quando o dado bate. A faixa respira de leve enquanto o fato é contado.
- **O dado do fato**: a moldura de medida (quatro cantos) se abre do centro e o dado bate em cobalto (70% → 100%); depois a moldura respira.
- **O cartão-mistério**: o verso cobalto com "?" e listras que andam; na palavra, encolhe na horizontal (0,16 s) e abre branco com a resposta (0,26 s).
- **Troca de bloco**: o bloco que sai encolhe 3% e some em 0,2 s; o próximo entra por cima. Nada de faixa, cortina, flash ou giro.
- **Fundo**: anéis finos e tracejados giram devagar atrás do painel o vídeo todo.

## 2. Organização e hierarquia

- **Duas partes**: o painel em cima (x 64 a 1016, y 132 a 966; a interface do app ocupa os primeiros ~120 px) e a moldura da pessoa embaixo (x 30 a 1050, a partir de y 1000, cantos de 46 px; os de baixo ficam fora do quadro).
- **O quiz**: pergunta centrada no alto (com um traço cobalto de 88 px acima); grade de alternativas embaixo dela, 12 px para dentro do painel (os selos saem do cartão sem passar da margem de 64 px), vão de 24 px.
  - 4 alternativas: 2×2; o anel (até 212 px) no meio da grade; selos nos cantos de fora (A em cima à esquerda, B em cima à direita, C embaixo à esquerda, D embaixo à direita); o conteúdo de cada cartão se afasta 96 px do centro para o anel não cobrir nada.
  - 3 alternativas: 2×2 com o anel na quarta casa.
  - 2 alternativas ou verdadeiro/falso: dois cartões altos (até 600 px) lado a lado, anel no meio.
  - Dentro do cartão: imagem em cima, nome embaixo (Sora 700, até 50 px); sem imagem, o nome grande no meio (Sora 800, até 62 px; 78 px com 2 alternativas).
- **A faixa da resposta**: 952 × 176 px no alto do painel (y 140); o cartão do fato embaixo dela até a base do painel, com um filete verde no topo.
- **Margens**: nada de texto ou cartão a menos de 64 px das laterais, nada acima de y 120, nada importante abaixo de y 1700. A tarja de apresentador fica logo acima da moldura (y 868 a 980, 20 px de folga), à esquerda, longe do rosto: círculo cobalto de 84 px com a inicial, nome em Sora 800 de 44 px (mínimo 34) e área em Sora 600 de 30 px (mínimo 24).
- **Legenda**: só quando um momento pede (`legenda: true`): pílula branca abaixo do queixo, até 4 palavras, a palavra dita em cobalto.

## 3. Tipografia

- Uma família só: **Sora** (Google Fonts), pesos 600, 700 e 800, tracking −0,02em no 800 e −0,01em no resto (nunca mais apertado que −0,025em).
- Pergunta 40–72 px (800); abertura 56–108 px; alternativas 28–78 px; dado do fato 72–200 px; número 90–230 px (algarismos tabulares); resposta da revelação 56–150 px.
- Selos: letra em Sora 800 a 52% do diâmetro (66 px na grade de 4, 78 px com 2).
- Etiquetas (rótulo, "ilustrativo", títulos curtos do fato): Sora 700 em caixa alta, 20–26 px, tracking +0,08em, numa pílula.
- O texto é medido com as larguras reais da Sora (`src/larguras.ts`) e reduz até caber; nunca vaza nem é cortado.

## 4. Moldura da pessoa

- Sempre a moldura larga embaixo; o rosto ocupa ~29% da largura da moldura, com o centro no eixo do quadro e ~56 px de folga acima do cabelo.
- `VideoNaCaixa` com `rosto={plano.rosto}`: a moldura segue o rosto quadro a quadro.
- Escala por trecho: 100% ↔ 106% em corte seco, só quando o trecho anterior durou mais de 1 s (as letras "A… B… C…" cortadas bem juntas mantêm a escala). Soco de 5% na revelação.
- **Nunca** mexa na cor do vídeo: sem filtro, brilho, halo ou luz atrás da pessoa. A única sombra é a da moldura, para fora dela.

## 5. Cores

| Papel | Cor |
|---|---|
| fundo do estúdio | #ECEFF7 (luz branca no centro, #DFE4F2 nas bordas) |
| anéis do cenário | cobalto a 6% |
| cartões | #FFFFFF, sombra macia azul-marinho (13% e 8%) |
| tinta | #13183A (texto), #5B6183 (detalhes) |
| destaque (o único) | cobalto #2F4BFF (selos, anel, palavra-chave, borda da alternativa da vez); claro #E3E7FF (trilho do anel, letra provisória) |
| certo (só a resposta certa e o vencedor) | verde #12B76A |
| apagado | #A9AFC6 |
| alerta (só `destaque` de alerta e risco) | coral #F2553D |

Não use preto com dourado, roxo neon, vermelho e amarelo piscando, gradiente arco-íris ou fundo escuro de palco de cassino.

## 6. Sons

Tonais, raros e bem abaixo da voz (volume 0,14 a 0,36 antes da normalização a −14 LUFS): uma nota de marimba por alternativa (dó, ré, mi, sol, subindo), um "toc" grave em cada número da contagem, duas notas subindo (quinta) na revelação, um "pop" grave curto no fato, abertura, número, destaque, definição e fechamento, uma subida suave na virada da `revelacao`. Nada de sino, campainha, buzina de programa, aplauso, moedas ou ruído branco.

## 7. Imagens

- Nas alternativas, prefira **objetos em PNG transparente** do mesmo tipo (todos ilustrações 3D, ou todos fotos recortadas): ficam inteiros no cartão branco e também no verde da revelação.
- Sem imagem boa, nenhuma imagem: o nome grande no cartão é um estilo válido.
- Nunca imagem com texto, logo, marca ou pessoa reconhecível.
