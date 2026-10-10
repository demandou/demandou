# O estilo Pulso

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um app de treino e um relógio esportivo bem desenhados — claros, precisos, ao ar livre — em que cada ideia dita vira algo que se mede: um anel que acende, um ponteiro que anda, um número que conta, casas que enchem, uma rota que se desenha, um pulso que bate. Quase toda "melhoria" que adiciona coisa (brilho de LED, gradiente neon, emoji de coração, relógio 3D, mapa de satélite, logotipo de marca de relógio) piora o resultado.

## A ideia

O relógio no pulso mede intensidade, e intensidade existe em qualquer assunto: o quanto (um número), em que nível (uma escala de 1 a 5), qual parte (a maioria × uma parte), em que ritmo (devagar × forte), o que está batendo e o que parou. A pessoa é o visor; o assunto dela acende em volta. O espectador entende a ideia olhando para o relógio, não lendo sobre ela.

## 1. Dinâmica do motion

- **Tudo espera a lápis e acende na palavra**: palavras em cinza-esboço que se apagam subindo enquanto a palavra cheia acende no lugar; partes do anel tracejadas; linhas de lista como esqueleto cinza (o "carregando" de um app); balão tracejado com três pontinhos "digitando"; casas tracejadas; números em "0", "---" ou "-:--". Nada surge do vazio e nada aparece antes de ser dito.
- **Terminada a entrada, a palavra é texto simples** (uma camada só): nenhum quadro pega uma palavra acesa pela metade.
- **O ponteiro nunca para**: corre até a parte da vez, assenta e oscila de leve, como uma frequência. O coração na abertura de baixo do relógio bate (mais rápido no alerta).
- **Movimento com significado**: cada palavra é um batimento no traçado do pulso; o anel acende parte por parte; a zona em foco engrossa e as outras apagam; números contam em dígitos de largura fixa e travam no valor; casas enchem em cascata e a barra se abre em duas; a rota se desenha na velocidade do ritmo com um ponto na ponta; o perdedor de uma comparação vira linha reta; o botão afunda e muda.
- **Trocas sem quadro vazio e sem dupla exposição** (0,6 s, arrancando e freando, começando 0,15 s antes da primeira palavra da batida):
  - saindo da tela cheia, o cartão do peito sai rápido pela esquerda e o painel novo já está embaixo da pessoa, que encolhe por cima dele (a pessoa é a cortina); o painel acompanha a base da pessoa enquanto ela se move, sem ficar por baixo dela;
  - voltando para a tela cheia, o painel fica até a pessoa crescer por cima dele, e o cartão novo sobe já opaco enquanto ela termina de crescer;
  - de um lugar do app para outro, as duas páginas deslizam juntas (a velha sai pela esquerda, a nova entra pela direita, encostadas);
  - entre dois cartões do peito, os dois deslizam juntos.
- Sem quique, sem elástico, sem giro, sem brilho, sem tremida, sem flash.

## 2. Organização e hierarquia

- Uma ideia por tela, de cima para baixo: a pessoa (no relógio, no card ou no mapa) e o painel embaixo. Nada passa por cima do visor, do card ou do avatar.
- Um item grande por vez: o item da vez ganha uma faixa clara na cor da zona; os que passaram ficam cinza; os que vêm esperam como esqueleto.
- Números e títulos grandes; rótulos, unidades e letreiros menores. Letreiros em caixa alta espaçada para nomes de lados e categorias.
- Etiqueta "ilustrativo", "valores de exemplo" ou "exemplo" (contornada, discreta) sempre que o desenho não vem de números ditos.

## 3. Tipografia

- **Bai Jamjuree 700** (Google Fonts): títulos, itens, números, leituras — letra de mostrador esportivo, de largura normal, nada condensado; espaçamento −0,01em nos títulos.
- **Reddit Sans 600–800**: rótulos, unidades, detalhes, letreiros (800, caixa alta, +0,14em).
- As duas têm o l de cauda ("Il1", "IPTU", "Inglês" nunca se confundem).
- Todo texto é medido com a própria fonte (`src/medida.ts`) e diminui até caber, quebrando em linhas equilibradas, sem palavra curta pendurada: nunca vaza.
- Tamanhos (num quadro de 1080 de largura; julgue nos quadros reduzidos a 540 px): títulos e frases 60–112 px; itens de lista 44–72 px; número do peito 90–176 px; porcentagens 120–150 px; leituras 56–80 px; balão 42–72 px; rótulos 34–50 px; letreiros 24–32 px; legenda 52 px; numerais do aro 34 px. Nada abaixo de 24 px nos letreiros e de 30 px no resto.

## 4. Moldura da pessoa

- **Tela cheia**: rosto na linha vertical do centro; o cartão do peito começa logo abaixo do queixo (980–1060 px).
- **O visor redondo do relógio**: grande (600 px, centro em 540, 760), no alto (480 px, centro em 540, 600) ou menor (420 px, centro em 540, 555). O relógio — caixa preta fosca `#141619`, alças curtas em cima e embaixo, borda `#2C3036`, numerais no aro, o anel por dentro e o coração na abertura de baixo — cresce a partir da borda do visor quando a pessoa vira círculo.
- **O card de cima**: 840 px de largura, cantos de 40 px, de 600 a 720 px de altura (mais alto quando a gravação é de perto, para a cabeça caber).
- **O avatar**: círculo de 340 px com anel branco no canto de cima de um mapa.
- O rosto é seguido quadro a quadro (`VideoNaCaixa` do motor). O zoom de cada lugar se ajusta à largura do rosto medida: gravação de perto fica com menos zoom e o enquadramento sobe para não cortar o topo da cabeça.

## 5. Cores, textura e som

- Fundo giz `#ECEEEA` com curvas de nível muito leves (`#DADED7`, a cada cinco uma um pouco mais forte); cartões brancos com sombra baixa e macia; tinta `#0F1113`, apoio `#565C63`, esboço `#C2C7C1`.
- **Só as cinco cores das zonas são fortes**, com papéis fixos em qualquer assunto: zona 1 `#9AA6B2` (cinza: o que passou), zona 2 `#2D7FF9` (azul: a cor da marca, o neutro, a chave), zona 3 `#1FAE6B` (verde: o certo, o vencedor), zona 4 `#FF8A1F` (laranja: atenção, o problema), zona 5 `#EE3D2F` (vermelho: o alerta, o risco, o riscado). Letras pequenas sobre branco usam as versões escuras (`#1B63D6`, `#14824F`, `#D9660A`, `#C92C20`); faixas usam as versões claras. Nada de gradiente, neon, glow ou cor extra.
- Som raro e tonal, um por batida importante (`public/sfx/`): batida grave de coração no alerta, notas subindo quando o anel completa, "bip" grave quando algo trava, um tom quando uma parte enche e dois descendo quando divide, uma nota grave no trecho leve e uma subida rápida no forte, duas notas no fechamento. Nada de clique agudo, bipe de monitor hospitalar, ruído ou sino.

## Zonas reservadas da tela

Acima de 110 px, só fundo (a assinatura começa em 136); o conteúdo vai até ~1520 px e nada passa de 1540 (interface do app); **nada a menos de 120 px das bordas** (à direita ficam os botões de curtir, comentar, compartilhar).

## O que pode mudar por vídeo

- Textos, tempos, cores de zona dos blocos, número de casas, trechos, leituras, opções e a escolha dos blocos (é o trabalho do plano).
- `marca`, letreiros (`rotulo`), os rótulos da régua das zonas (`escala`), o botão do fechamento (`icone`).
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica dos lugares e das trocas (`src/layout.ts`) e o estado do relógio (`src/relogio.ts`).
- Cores. Se o usuário pedir a cor da marca dele, troque **só** a cor da zona 2 (`ZONAS[1]` em `src/tema.ts`) por uma cor viva o bastante para ler texto branco em cima — e mantenha as outras quatro, porque elas têm papel (certo, atenção, alerta, passado).
- As fontes, os tamanhos mínimos e as margens (120 px dos lados).
- Não adicione emojis (nem o coração), logotipos de relógio ou app, brilho atrás da pessoa, contorno nas letras, gradientes, mapa de satélite, mostrador analógico com ponteiros de hora, bipe de monitor, transições além das trocas de layout. Não troque os ícones a traço por ícones coloridos.

## Se precisar de algo que o modelo não tem

- **Um ícone novo**: acrescente em `DESENHOS` (`src/componentes/Icones.tsx`) — viewBox 48×48, traços com pontas redondas, o objeto de ~6 a ~42; áreas cheias só em `cheios`. Genérico: nada que lembre o logotipo de um produto.
- **Uma rota diferente**: as curvas de `VOLTA` e `TIRO` em `src/componentes/Rota.tsx` (coordenadas do mapa, de 0 a 840) ou `rotaDe` em `src/componentes/Caminho.tsx`, deixando o canto de cima à esquerda livre para o avatar (até x 380, y 380).
- **Um bloco novo**: o tipo em `src/plano.ts`, o lugar da pessoa em `lugarDe` (`src/layout.ts`), o componente em `src/componentes/` desenhado em coordenadas do quadro 1080×1920 embaixo da pessoa, com o conteúdo esperando a lápis, o texto medido por `encaixar` (`src/medida.ts`) e as palavras montadas por `Linhas` (`src/anim.tsx`). Acrescente o caso em `painel` (`src/Edicao.tsx`) e o som em `sons`. As entradas e saídas já vêm do `presencaAbaixo`; não faça o componente aparecer ou sumir sozinho. Consulte a skill do Remotion para as regras de animação.
