# O estilo Wireframe

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer o trabalho de um designer de verdade — preciso, medido, calmo — e não um vídeo enfeitado de "tecnologia". Quase toda "melhoria" que adiciona coisa (brilho, neon, gradiente, mockup 3D girando, emoji de foguete) piora o resultado.

## A ideia

Quem trabalha com página e design aponta o erro e mostra a medida. Aqui a tela vira o canvas de um programa de design: a pessoa entra nele como o **comentário fixado** do revisor, ao lado de um celular com a página em wireframe. Cada erro dito ganha a marca de revisão (etiqueta numerada, contorno tracejado) e a sua medida no inspetor — palavras, px de rolagem, contraste. No conserto, a página renasce limpa e colorida, um passo por palavra, e no fim ela vende. O espectador vê o antes e o depois acontecendo, não lê sobre eles.

## Regras que definem o estilo

- **Um canvas de design sem marca.** Fundo grafite `#1C1D20` com grade de pontos `#34363C` a cada 36 px; uma barra discreta em cima com o ícone de quadro (#), o nome da tela e o contador de problemas; o rótulo "Celular · 390 × 844" em mono acima do aparelho. Nada de logotipo de programa de design, de sistema ou de navegador; nada de barra de ferramentas cheia.
- **A pessoa é o comentário fixado**: o vídeo dentro de um quadro de cantos redondos com o **canto de baixo à esquerda em ponta** (o formato do pino de comentário), borda clara de 7 px e sombra escura macia — nunca brilho atrás dela. Embaixo, o balão do comentário com o nome, "agora" e a fala em curso. Em quadro cheio não tem moldura (rosto na linha do centro). Nunca é recortada do fundo: funciona com qualquer gravação.
- **O celular é o herói**: aparelho escuro com ilha da câmera e botões laterais, tela 532 × 1174 px; a página desenhada em unidades de 390 de largura (como um celular de verdade) e ampliada. O wireframe é cinza de verdade: blocos `#DCDFE4`, linhas de texto fictício `#CDD1D7`, traço `#B4B9C1`, a imagem com um "X", o título fraco em letra clara `#C5C9CF` sobre `#F3F4F6`. Nada de texto de mentira legível ("lorem ipsum").
- **Revisão em vermelho `#FF4733`, e só isso é vermelho**: etiquetas numeradas (pílula vermelha com o número num círculo branco e o rótulo), contornos tracejados com um véu vermelho de 10%, a régua da 1ª tela, as medidas de espaçamento com o valor em px (as *redlines* dos designers), a seleção da camada de texto, o pino e a ação do fechamento. Resolvido = a etiqueta fica escura com ✓ na cor da página e o rótulo é riscado.
- **A página limpa tem a cor da marca**, que se espalha a partir do botão (um círculo que abre): fundo `cor`, texto e botão em `tinta`, a ilustração chapada em tons da própria cor. O contraste mostrado no inspetor é **calculado de verdade** (WCAG) — a página nunca pode contradizer a fala. A cor da página aparece também no "Tudo certo", no "v2" e no "Resolvido".
- **Espera a lápis em tudo**: palavras de título, frase, promessa e fechamento nascem como barras cinzas do tamanho da palavra (texto fictício de wireframe) e viram texto quando são ditas; o botão tem a vaga tracejada esperando por ele; o inspetor nasce tracejado; as amostras de cor esperam tracejadas. Nada surge do vazio e nenhuma caixa fica vazia.
- **O inspetor mede**: painel grafite `#26282C` com borda `#373A40`; rótulo em mono caixa-alta espaçada, número grande em mono que conta (vermelho no erro, cor da página no conserto), uma linha de unidade e um desenho simples (miniatura de tela, minimapa da rolagem, amostras de cor e régua de contraste com o mínimo 4,5, barra de carregamento, links, barras antes/depois). Os cartões trocam em carrossel vertical.
- **Três fontes, cada uma com função**: Inclusive Sans (interface, títulos, balão, etiquetas; o I maiúsculo tem serifa e o l tem cauda, então "IPTU", "Inglês" e "Il1" nunca se confundem), Red Hat Mono (medidas, números, rótulos do inspetor e da camada), Young Serif (só o logotipo e a promessa da página limpa — é "a página do cliente"). Gratuitas, do Google Fonts. Nada de condensada.
- **Legível no celular** (julgue nos quadros reduzidos a 540 px): título da abertura 86 px, frase 66 px, chamada do fechamento 62 px, promessa da página ~55 px (botão da página 33 px), fala no balão 44 px, nome da tela 38 px, nome no comentário 34–40 px, etiquetas de erro e avisos 34 px, número do inspetor até 84 px, unidade 36 px, botões 34 px, rótulos em mono 30 px. Nada abaixo de 30 px (a barra de status do celular não tem texto, só formas).
- **Zonas reservadas**: acima de 140 px não há nada (é onde fica o topo do aplicativo); a barra do canvas ocupa de 142 a 202 px; abaixo de 1600 px e na faixa da direita (x > 965, y > 1050) fica a interface do aplicativo — nada importante ali (o inspetor termina em x = 960).
- **Movimento com significado**: a página rola até o botão e volta, a parede de texto recolhe linha por linha, a imagem sobe para o lugar dela, o botão viaja até a vaga, a cor se espalha a partir do botão, o conta-gotas vai da letra para o fundo, os números contam, os avisos de venda empilham. Entra decidido e assenta: sem quique, sem elástico, sem giro, sem tremida, sem flash.
- **Som raro e tonal**: um tom grave quando o canvas abre, um tom que desce a cada erro (G, F, E graves), um que sobe a cada conserto (G, A, C), duas notas no primeiro aviso de venda, um acorde suave na ação do fechamento. Senos com envelope curto e passa-baixa (`public/sfx/*.wav`). Nada de clique agudo, ruído ou sino.

## Os blocos universais no estilo

- **Frame de design** (`topicos`, `passos`, `comparacao`, `grafico`): um quadro claro no lugar do celular, no mesmo canto, com o painel escuro de camadas no lugar do inspetor. Itens são cartões brancos com a etiqueta vermelha numerada e o contorno tracejado da revisão; o que falta dizer é só a barra cinza do tamanho da palavra.
- **Camada em quadro cheio** (`numero`, `destaque`, `definicao`, `pergunta`): o cartão claro da abertura, com a caixa vermelha, as alças e a medida L × A; o vermelho cheio só no `destaque` de alerta; a cor da página só como marca-texto ou no que foi resolvido.
- **Texto que cabe sempre:** medido com a própria fonte, reduz o corpo até um mínimo (36 a 54 px conforme o bloco) e quebra em mais linhas; nunca vaza. Quando o cartão de quadro cheio tem altura limitada (a `zona`), o texto diminui antes de passar dela.
- **Trocas sem quadro vazio:** o frame ou o celular já está desenhado atrás da pessoa que encolhe; entre dois frames, o novo cobre o antigo por varredura de cima para baixo (nunca duas páginas de texto sobrepostas).

## O que pode mudar por vídeo

- Textos, tempos, erros, passos, avisos e a escolha dos componentes (é o trabalho do plano).
- A página inteira (`pagina`): nome da tela, marca fictícia, título fraco, promessa, botão, apoio, ilustração, **cor e tinta** (a cor da marca do usuário, com contraste ≥ 7:1), e os números do inspetor.
- `marca` (nome e área do comentário), o rótulo da camada da `frase`, a ação do fechamento (`salvar`, `seguir`, `comentar`).
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica (`src/cena.ts`): as janelas do canvas, a caixa da pessoa (`PINO`), os tempos das trocas, a rolagem, os passos do conserto, a regra de nunca cobrir o rosto.
- A geometria do canvas (`src/tema.ts`: `CELULAR`, `PINO`, `BALAO`, `INSPETOR`, `HUD_Y`) e a da página (`PG` em `src/cena.ts`, `layoutLimpo` em `src/layoutPagina.ts`).
- O grafite, os cinzas do wireframe e o vermelho de revisão. Se o usuário quiser "a cara da marca dele", troque **só** `pagina.cor` e `pagina.tinta` no plano — é a página dele que ganha a cor, não a revisão.
- As fontes e os tamanhos.
- Não adicione emojis, logotipos (de programa, de sistema, de rede social, de marca real), brilho ou desfoque atrás da pessoa, contorno nas letras, gradientes coloridos, mockups 3D, transições além das do canvas. Não troque os ícones a traço por ícones coloridos ou de banco.

## Se precisar de algo que o modelo não tem

- **Uma ilustração nova** para a página: acrescente em `src/componentes/Ilustracoes.tsx` (viewBox 350 × 300, formas chapadas, cores tiradas de `cor` e `tinta` com `tom()`, nada de logotipo nem foto) e o nome no tipo `Ilustracao` em `src/plano.ts`.
- **Um tipo de erro novo** (formulário longo, sem prova social…): em `src/plano.ts` acrescente o tipo em `TipoErro` e o passo em `TipoPasso`; em `src/cena.ts`, `PASSO_DO_ERRO` e o que o passo transforma em `estadoDaPagina`; em `src/componentes/Celular.tsx`, a área do contorno em `area()` e o desenho do bloco (em wireframe e limpo, sem passar da dobra de ~860 unidades); em `src/componentes/Inspetor.tsx`, o rótulo em `ROTULOS` e o cartão (erro e conserto) com um número que conta e um desenho simples. A etiqueta, o som, o contador e o "Resolvido" vêm de graça. Consulte a skill do Remotion para as regras de animação.
