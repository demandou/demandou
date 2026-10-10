# O estilo Dossiê

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a **investigação montada na frente do espectador**: um quadro só, onde cada ideia é uma prova presa com pino, a câmera que viaja até ela no instante em que é dita e o fio vermelho que liga tudo. Ele é feito de poucas peças repetidas com rigor: a cortiça escura, o papel (manila, relatório, ficha, jornal, post-it), a tinta quase preta, o pino de metal, o fio e o carimbo vermelhos. Quase toda "melhoria" que adiciona outro tipo de peça (brilho, contorno, emoji, transição de efeito, outra cor de destaque) piora.

O estilo vale para qualquer assunto: golpes, true crime, mistérios, bastidores de empresa, finanças, saúde, história pessoal. O que muda é o conteúdo das peças, nunca a linguagem visual abaixo.

## A ideia

A pessoa conta um caso. Em cima, o caso **se monta**: a pasta abre, as provas chegam uma a uma, o fio as liga, o carimbo dá o veredito, a pasta fecha. Embaixo, a pessoa inteira, falando. Diferença para o Arquivo (folha de papel com fichas que deslizam e a foto da pessoa que se move): aqui o papel nunca cobre a pessoa, e o movimento é da **câmera sobre um quadro contínuo**, não de folhas que entram e saem.

## 1. Dinâmica do motion

- **A viagem:** no máximo 0,35 s: a câmera sai da peça atual ~0,27 s antes da próxima palavra e chega 0,08 s depois, com leve desfoque de movimento na direção da viagem; as duas peças ficam em quadro o caminho todo e o fio estica entre elas. Peças em anel (3×3) a ~1040 px na horizontal e ~1100 na vertical; o centro do anel fica para o veredito.
- **O quadro inteiro:** no `destaque` do centro, a câmera recua até mostrar todas as peças do bloco, os fios de todas convergem para o memorando, o carimbo bate e a câmera aproxima 22% devagar, puxando para o carimbo (legível o tempo todo).
- **Enquadramento:** a peça atual ocupa ~80% da área segura; as vizinhas e o fio aparecem cortados nas bordas (o espectador sempre vê que é um quadro). O fio tem ~7,5 px na tela (~5 px no quadro inteiro), sombra na cortiça e uma leve barriga de barbante, maior enquanto estica.
- **A peça assenta:** aparece 0,15 s antes da palavra, cai 34 px, gira 2,5° e encosta em 0,4 s, sem quicar. O pino é cravado (desce e assenta) quando a câmera sai; o fio chega nele na palavra.
- **Parado numa peça:** a câmera aproxima 4,5% em ~3 s e anda poucos px; nas listas e fichas, puxa de leve para o item atual (sem tirar a peça da área segura). Nenhum quadro só com cortiça.
- **Dentro da peça:** título palavra por palavra (sobe 0,16 em, 0,24 s); tarja de censura corre em 0,34 s; tarja de tinta (ênfase) corre da esquerda em 0,26 s; número conta em 1 s; carimbo desce em 0,1 s e bate seco, com tremor de 7 px no quadro; celular vibra em rajadas; notificação desce do topo.
- **Nada parado:** a cada 1 a 2,5 s algo muda (uma peça, um campo, uma palavra, um carimbo, a câmera).

## 2. Organização e hierarquia

- **O quadro em cima** (y 0 a 1040, 54% da tela), fechado por um trilho de madeira escura; **a pessoa embaixo** (moldura x 30, largura 1020, de y 1064 até passar da borda, cantos de 34 px, contorno escuro de 5 px).
- Área segura das peças: x 64 a 1016, y 130 a 1006. A peça atual ocupa ~80% dela; a pasta (abertura e fechamento) e o celular são enquadrados um pouco mais perto.
- Uma peça por vez na tela; as anteriores ficam presas no quadro e aparecem nas viagens.
- Hierarquia dentro da peça: título grande em Sora 800 → texto em Sora 600/700 → rótulo datilografado pequeno. Ênfase = tarja de tinta (nunca outra cor).
- Legenda: uma linha em Sora 700 (34 a 46 px) numa faixa escura translúcida, abaixo do queixo, acima de y 1700; a palavra dita em manila claro.

## 3. Tipografia

- **Sora** (Google Fonts): 800 em títulos, carimbos, números; 700 em itens, nomes e legenda; 600 em textos de apoio. Tracking entre -0,02em e 0,05em (caixa alta do carimbo).
- **Special Elite** (máquina de escrever): só rótulos curtos (FICHA, RELATÓRIO, NOME, CPF, PROVA A, POR TELEFONE), caixa alta, espaçamento 0,1–0,14em.
- **Permanent Marker**: só o "?" do post-it.
- Texto de leitura entre 30 e 112 px no quadro (o encaixe escolhe o maior que cabe e nunca vaza).

## 4. Cores, textura e som

| Papel | Cor |
|---|---|
| Cortiça (textura) | marrom-grafite escuro, luz de luminária no centro, bordas e topo escurecidos |
| Pasta manila | `#CDAA6C` (capa), `#B48F55` (fundo e aba), `#E0C68D` (etiquetas) |
| Papel de relatório / ficha / jornal / post-it | `#F1EBDD` / `#F6F1E4` / `#E2DAC4` / `#E8D46A` |
| Tinta (texto, tarjas, ênfase) | `#1C1915` |
| Vermelho-sangue: **só o fio e o carimbo** | `#A3141C` (carimbo), `#8E1218` + `#C9363D` (fio torcido) |
| Pino | metal claro com reflexo |
| Fundo embaixo da pessoa | `#120E0B` |

Grão de papel multiplicado em todo papel; sombra de papel sobre a cortiça (nunca brilho). A cor do vídeo da pessoa nunca muda; nada de halo ou luz atrás dela. Sons tonais e raros, bem abaixo da voz: `fio` (corda dedilhada) na chegada de cada peça, `carimbo` (batida grave) em cada carimbo, `pasta` (duas notas) quando a capa abre, `fim` (três notas de marimba) depois do último carimbo. Nada de sino, nada de ruído branco, nada de "papel rasgando".

## 5. O que nunca fazer

- Mostrar número, nome ou dado que não foi dito (use a tarja de censura).
- Logo ou marca real (banco, Pix, app, rede social): ícones genéricos.
- Vermelho fora do fio e do carimbo; preto + dourado (é a marca do Cofre).
- Texto longo em máquina de escrever; fonte condensada.
- Pôr a pessoa numa coluna estreita ao lado ou cobrir a pessoa com papel.
- Duas peças novas a menos de 1,2 s uma da outra.
- Escrever na tela o nome da ferramenta de render.
