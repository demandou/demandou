# O estilo Funil

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um gráfico de dados bem feito, como os de um bom jornal impresso, que se monta ao vivo enquanto a pessoa fala, e não um "infográfico de marketing" cheio de setas, ícones e cores. Quase toda "melhoria" que adiciona coisa piora o resultado.

O estilo vale para qualquer assunto: cripto, saúde, carreira, vendas, aulas. O que muda de um vídeo para outro é o conteúdo dos blocos, nunca a linguagem visual abaixo.

## A ideia

Quem explica algo mostra o que importa e **onde se perde**. O modelo desenha isso com um vocabulário pequeno, de jornal: **pontos** que são pessoas (ou o que a fala contar), um **funil** cuja largura é quantos chegam a cada etapa, **traços** grafite que se desenham, **contadores** que contam, **selos** (pílulas) que nomeiam passos, **divisas** finas entre linhas. Tudo em grafite sobre papel; laranja só no problema, verde só no conserto. A pessoa acompanha num bloco ao lado e volta ao quadro cheio nas frases que pedem o rosto grande.

## 1. Dinâmica do motion

- **Tudo entra na fala.** Cada palavra de título, rótulo ou item sobe de trás de uma régua no instante em que é dita (0,34 s); quando termina de subir, ela é desenhada como texto simples. Cada número conta a partir da palavra que o diz (0,6 a 1,3 s, acelera e desacelera). Cada item, etapa, dado ou lado entra no seu `em`.
- **Esboço a lápis antes da fala**: texto apagado (22–30%), pontos tracejados, números como "—", contornos que se desenham na abertura da página. Nunca uma caixa vazia.
- **Pontos têm física de areia**: caem do alto e assentam (aceleram e param, sem quicar), descem pelo gargalo passando perto do eixo, abrem um anel ao pousar. Quem fica pelo caminho apaga para 17%.
- **Troca de lugar**: a caixa da pessoa encolhe para o bloco ou cresce para o quadro cheio (0,55 s, macia nas duas pontas); a página aparece por trás dela. Entre duas páginas, uma régua grafite de 4 px desce pela tela em 0,4 s: acima dela, a página nova; abaixo, a velha. O bloco se move para o item da vez em 0,5 s (numa troca de página, antes da régua).
- **Nunca dois textos um sobre o outro**, nem fantasmas: o cartão sai antes de a página aparecer; a página apaga antes de o cartão entrar; a régua separa as duas páginas. O bloco tem uma faixa só dele, à direita; o texto quebra antes dela.
- **Vida parada não existe**: nada fica mais de ~2,5 s sem novidade (um item, uma palavra, um ponto que pousa, o bloco que desce). O vazamento laranja pisca três vezes e depois respira devagar.
- Sem quique, sem elástico, sem giro, sem tremida, sem zoom de impacto.

## 2. Organização e hierarquia

- **Uma ideia por tela.** Um momento = um bloco.
- **Página**: etiqueta (ILUSTRATIVO, ou a nota "● = 10 pessoas") no alto à esquerda (y 136); título na largura toda (56–80 px, até 2 linhas); conteúdo numa **coluna à esquerda** (de x 60 até a borda do bloco), de cima para baixo, centrado na altura livre. Abaixo da posição mais baixa do bloco, a linha pode ir até x 940.
- **Itens de lista, passos e lados** têm todos o mesmo corpo (o maior que cabe em até 2 linhas, ou 3 se precisar); detalhes menores (36–44 px, 600, grafite suave).
- **Funil**: o contador da primeira etapa fica acima da boca, numa linha; os das outras à esquerda da parede, alinhados à direita; o selo da taxa na divisa, do lado de fora. Sem números, só os rótulos (grafite 800, 38–64 px) e o funil um pouco mais estreito (boca 620 px, eixo x 476) para eles caberem.
- **Quadro cheio**: cartão grafite na `zona` (abaixo do queixo, acima de y 1560); o texto principal manda; rótulos e assinatura menores.
- Cantos reservados: nada acima de y 130 (abas do app) nem abaixo de y 1560 (interface do app); à direita, abaixo de y 1250, longe da borda (botões do app).

## 3. Tipografia

- **Uma família só: Schibsted Grotesk** (Google Fonts), uma grotesca de jornal. O **I maiúsculo tem serifa** ("Iogurte", "IPTU", "Il1" nunca confundem).
- 800 em títulos, itens, números e contadores; 700 em rótulos de gráfico e significados; 600 em detalhes e marcas de escala. Espaçamento entre letras de −0,02 a −0,01em nos títulos; caixa-alta espaçada (0,08–0,14em) só em selos e etiquetas.
- Algarismos de largura igual nos contadores (não "dançam"); separador de milhar estreito. Números sempre em pt-BR (83.000; 1,5; R$; US$; %; "25 mil", "1,5 mi").
- **Tamanhos** (quadro de 1080 de largura, lido num celular): títulos de página 56–80; itens 44–96; termo da definição 72–150; número do cartão 84–170; título dos cartões 60–78 (destaque até 104); contadores do funil 76; rótulos do funil 38–64; selos 30–38; etiquetas 30–32; legenda 46. **Nada abaixo de 30 px.** O texto diminui para caber e quebra em até 2–3 linhas; nunca é cortado.
- Nada de fonte condensada, contorno nas letras ou sombra.

## 4. Moldura da pessoa

- **Quadro cheio**: rosto na linha do centro, aproximando devagar (até 4%); em cada corte dentro de um trecho cheio, um salto seco de 6% disfarça o pulo.
- **Bloco**: retrato (1:1,24) à direita, 380 px nas páginas e 390–440 px no funil, cabeça e ombros (`retrato.zoom` ~2,15), fio grafite de 3 px por dentro, cantos de 24 px, etiqueta grafite com o nome no canto de baixo. **Acompanha o item da vez**: no funil, desce junto com o fluxo (só cabe ao lado das etapas onde o funil já afinou); nas páginas, vai para a altura do item, lado ou dado (fica entre o título e a zona dos botões do app). Rosto inteiro, seguido quadro a quadro pelo rastro do motor; nunca coberto, nunca esticado.
- Nunca uma coluna vertical estreita com a pessoa; nunca brilho, sombra colorida ou contorno atrás dela.

## 5. Cores, textura e som

- Papel cinza-quente `#E8E6E1` com uma grade de pontos a 9%; miolo (dentro do funil e do tubo) `#F7F6F2`; grafite `#1F2023` (pontos, contornos, texto, cartões), grafite suave 66%, lápis 34%, apagado 17%, divisas 22%.
- **Laranja de sinal `#FF5A1F` = o problema**: o destaque da abertura e da frase, o risco, o alerta, o vazamento, o lado errado, o destaque de alerta. Nunca enfeite.
- **Verde `#12A37A` = o conserto**: o selo consertado, os pontos que passam a mais por causa dele, o lado certo, o vencedor de um errado-certo. Nunca enfeite.
- Gráficos sem cor nova: partes da pizza são grafite cheio, anel grafite e tons de lápis.
- **Som raro e tonal**: um "vum" grave quando a página abre; uma gota curta quando cada etapa, item, dado ou lado entra (no funil, cada vez mais grave: o fluxo afina); duas notas descendo no alerta; duas subindo no conserto; um acorde curto no fechamento. Nunca dois sons a menos de 0,4 s. Nada de caixa registradora, moedas, notificação, ruído, clique ou sino.

## O que pode mudar por vídeo

- Textos, tempos, a escolha dos blocos, as etapas e números (é o trabalho do plano).
- `marca` (nome e área) e `retrato` (enquadramento no bloco).
- O recorte: o `modelo.json` fixa 9:16 para gravação vertical; gravação horizontal vira 3:4.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica dos dois lugares e do bloco que acompanha (`src/layout.ts`, `src/pagina.ts`).
- A geometria e a física dos pontos (`src/funil.ts`): eixo, boca, bico, regra das larguras, tamanho dos pontos, unidade, queda pelo gargalo.
- As cores e a função de cada uma. Se o usuário pedir a cor da marca dele, ela pode entrar **só** no papel (um cinza levemente tingido); pontos, contornos e textos continuam grafite.
- A fonte, os tamanhos mínimos e as margens.
- Não adicione emojis, ícones de rede social, logotipos, cifrões voando, setas 3D, brilho atrás da pessoa, contorno nas letras, gradientes, flashes, "zoom de impacto" ou transições entre cortes além da troca de lugar.

## Se precisar de algo que o modelo não tem

- **Uma forma nova de informação**: quase sempre ela cabe num dos 11 blocos (veja a tabela do SKILL.md). Se não couber, crie um componente irmão em `src/componentes/Pagina.tsx` (página) ou `src/componentes/Cartoes.tsx` (quadro cheio) com a mesma linguagem (pontos, traço grafite, selos, esboço a lápis, palavras que sobem na fala), acrescente o tipo em `src/plano.ts` e, se for de página, o foco do bloco em `src/pagina.ts`. Consulte a skill do Remotion para as regras de animação.
- **Uma etapa do funil que se divide em dois caminhos**: componente irmão em `src/componentes/TelaDoFunil.tsx`, com o mesmo contorno, pontos e selos.
- **Um passo que piora**: o conserto só sobe a taxa. Para mostrar uma piora, use um `alerta` sem conserto e conte na fala.
