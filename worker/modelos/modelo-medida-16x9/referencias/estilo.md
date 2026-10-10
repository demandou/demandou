# O estilo Medida, em detalhe (versão deitada, 16:9)

Para quem planeja e confere os quadros. O template já faz tudo isto; este arquivo explica o que é proposital, para você não "consertar" o que está certo e saber o que olhar.

## A ideia

Esta é a versão deitada (1920 × 1080) do Medida, para o vídeo completo do YouTube. O estilo é o mesmo do vertical (cores, fontes, objetos, física, sons); muda a composição, que segue a aula 9 do curso: tela cheia como base e, quando entra a explicação, a pessoa numa moldura à direita, com o rosto centralizado, e o papel com o palco à esquerda.

**Tornar uma quantidade palpável.** Um número dito ("35 gramas", "4 comprimidos", "R$ 40") não pesa nada; sete sachês caindo num copo, sim. O estilo é um laboratório de cozinha limpo: papel creme, vidro de verdade, objetos sem marca, rótulos à mão em itálico, e o vermelho guardado para o único momento em que algo passa do limite.

## Layout (quadro 1920 × 1080)

| Peça | Onde |
|---|---|
| Papel creme (blocos), o QUADRO da esquerda | x 96 a 1120, y 132 a 948 |
| Moldura da pessoa, à direita | x 1184 a 1824, y 132 a 948, cantos de 44 px; o rosto centralizado na largura e a ~40% da altura (y ~458), ocupando ~36% da largura dela |
| Palco da assinatura | o desenho do vertical levado inteiro para o papel, numa escala de ~1,09 (x 96 a 1120, y 174 a 906) |
| Mesa da assinatura (base dos objetos) | y ~801 |
| Objeto no papel | à esquerda (centro x ~365; ao lado do copo, x ~203) |
| Copo / pote | centro x ~531, base y ~801 |
| Números e rótulos da assinatura | à direita do copo, a partir de x ~792 (ainda dentro do papel) |
| Selo | canto de cima à direita do papel (borda direita em x 1128, topo 158) |
| Títulos de tela cheia (virada, abertura) | na coluna livre ao lado da pessoa (do lado com mais espaço, da margem até perto do rosto), na altura do rosto; no quadro deitado não há altura acima da cabeça |
| Objeto no peito | abaixo do queixo, no eixo do rosto, com ~1 largura de rosto de altura, sempre acima da faixa da legenda |
| Legenda | tela cheia: área segura de baixo, centro em y 918, faixa x 96 a 1824; moldura: dentro dela, logo abaixo do queixo |
| Tarja de nome | canto de baixo à esquerda, acima da faixa da legenda (base em y 858) |

Nada importante abaixo de y 984 (controles do player do YouTube); margens laterais ≥ 96 px.

## Movimento

- **Revelação editorial** (rótulos, números, fatos): sobe por máscara com desfoque (0,42 s, curva de saída suave). Quando termina, o texto fica limpo, sem camada de máscara.
- **Física** (unidades, sachês dos tópicos, fichas, rótulo nutricional): cai de cima, passa 4 px do ponto e assenta. As unidades do copo seguem gravidade de verdade e quicam na pilha; quem cai em cima empurra a pilha um tiquinho.
- **Objeto**: nasce pequeno (35% → 100%) no peito, gira até o rótulo, flutua de leve; no `palcoEm`, voa num arco raso por baixo do rosto até o papel da esquerda, com um giro completo, enquanto a pessoa vai para a moldura da direita, e pousa no papel com sombra de contato.
- **Linha de referência**: o anel tracejado se desenha em volta do copo (0,55 s) e puxa a guia até o rótulo. No "passou", o anel e a faixa acima dele ficam vermelhos e o anel pulsa uma vez.
- **Câmera**: empurrão lento no palco (4,5%) durante a explicação; nos blocos universais, 2,5% ao longo do bloco. Punch seco de corte na pessoa.
- **Trocas**: tela cheia ↔ moldura da direita em 0,52 s (curva entra-e-sai); dentro da moldura o rosto fica centralizado e o rastro acompanha a pessoa de leve, sem saltos; o bloco que sai sobe 24 px, desfoca e some em 0,3 s enquanto o próximo entra.
- **Virada**: a linha de luz (branca no centro, na cor da virada nas pontas, com brilho) desce o quadro inteiro em 0,6 s; o título ao lado da cabeça cresce 8% e se desfaz.

## Tipografia

- **Sora** 800 nos números e nos títulos de leitura, tracking −0,025em; 700 nos itens; 600 nos detalhes; números tabulares.
- **Fraunces itálica** 400–500 só em rótulos curtos e títulos de bloco ("de açúcar", "ideal do dia", "Como trocar o refrigerante"). Nunca em parágrafo.
- Legenda: Sora 800, 60 px (na moldura, encolhe até 40 px para caber numa linha), branca, contorno preto de 10 px por trás do preenchimento, sombra leve; blocos de até 3 palavras; cada palavra sobe quando é dita. Sem palavra colorida.
- Mínimos: rótulos 30 px, itens 28 px, tarja de nome 36 px.

## Cores

| Papel | Cor |
|---|---|
| Papel creme / sombra do papel | #F3EEE4 / #E9E2D4, com grão leve |
| Tinta (texto) | #1C2A22 (nunca preto puro) |
| Ênfase (sálvia profunda) | #2B5A44 |
| Luz, líquido, aspas, destaque sobre vídeo | menta #A9D8B6 |
| Sachê / ficha | #FBF8F1 |
| **Alerta (só passou do limite, alerta, errado)** | vermelho #CF4536 |

O vídeo da pessoa nunca muda de cor: nada de brilho, halo ou luz atrás dela. A sombra suave do objeto no peito é a única coisa sobre ela.

## Os objetos 3D

- Sem marca: o rótulo é desenhado pelo template (cor do plano, faixa creme, ícone em traço, nome em maiúsculas espaçadas).
- Materiais: alumínio escovado (lata), vidro com Fresnel (copo, pote, garrafa), papel fosco (sachê, caixa), metal escovado (moeda), açúcar granulado (cubo), cápsula de duas cores (comprimido). Luz de estúdio claro, reflexo de softbox, sem pós-processamento.
- O copo mostra a pilha inteira por dentro; o líquido é translúcido para as unidades continuarem aparecendo.

## Som

Tonais, raros, bem abaixo da voz (volumes de 0,16 a 0,4): `swap_crystal` (virada), `sobe` (objeto nasce), `lata_abre` + `fizz` (lata), `sache1` (unidades caindo; moeda mais aguda, cubo mais grave), `despeja` (líquido), `limite` (passou / alerta), `marimba` (tópicos), `tone1–4` (passos, gráfico, opções, comparação), `tag_set` (número, definição, fatos), `affirm` (vencedor, fechamento). Nada de sino, ruído branco ou caixa registradora. Trilha só se o usuário pedir, sem batida.

## O que não fazer

- Não mostre número que não foi dito; não invente a referência ("o ideal é…") se a pessoa não disse.
- Não use marca real em rótulo, moeda ou objeto.
- Não ponha a pessoa numa coluna estreita nem num canto pequeno; ela fica em tela cheia ou na moldura da direita, com o rosto centralizado.
- Não abra o papel em toda frase: no vídeo completo a tela cheia é a base, e o papel entra quando ajuda a entender.
- Não deixe o papel vazio: se a fala tem um vão, use um bloco (destaque, frase) ou volte à tela cheia.
- Não use a virada para gerar outra pessoa ou mudar o rosto.
