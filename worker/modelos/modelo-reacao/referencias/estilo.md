# O estilo Reação

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a **leitura guiada**: o espectador lê o que a pessoa lê, no ritmo dela, porque o marca-texto amarelo passa na linha certa e a câmera aproxima o trecho. Ele é feito de poucas peças repetidas com rigor: a mesa azul-ardósia, o cartão branco, o marca-texto, a moldura da pessoa. Quase toda "melhoria" que adiciona outro tipo de peça (brilho, contorno, emoji solto, transição de efeito) piora.

O estilo vale para qualquer assunto: responder seguidor, notícia, post, boato, finanças, saúde, carreira. O que muda é o conteúdo dos cartões, nunca a linguagem visual abaixo.

## A ideia

A pessoa reage a algo. O vídeo **mostra esse algo**, em cima, e a deixa embaixo, inteira, falando. O comentário abre o vídeo (a aba laranja "Respondendo"); o print ou o post aparecem quando ela os cita; cada ideia nova é um cartão que sobe como num feed. Diferença para o Viral (imagem em tela cheia + legenda karaokê): aqui o conteúdo é **texto lido**, e a imagem é só apoio.

## 1. Dinâmica do motion

- **O feed:** cada cartão sobe por trás da moldura da pessoa em 0,5 s (curva que desliza e assenta, sem quicar) e empurra o anterior para cima, que some enquanto sobe. O primeiro cartão sobe de trás da moldura nos primeiros 0,5 s. Nada de fade solto: os dois andam juntos.
- **O marca-texto:** retângulo amarelo levemente inclinado, que cresce palavra por palavra no instante em que ela é dita. A palavra marcada fica em tinta escura (também em cartão escuro). Nas listas, o marca-texto do item anterior apaga quando o próximo entra.
- **A câmera do `print`:** aproxima o trecho marcado dentro do cartão (10 a 22%, em 0,6 s, curva suave) e volta antes do próximo cartão. O risco vermelho atravessa a linha em 0,38 s e o texto riscado esmaece.
- **Entradas internas:** itens e painéis sobem 24–30 px e aparecem em 0,3–0,4 s; números contam em 0,95 s. Terminada a entrada, o texto fica desenhado simples, sem camada de animação.
- **Nada parado:** a cada 1,5 a 2 s algo muda dentro do cartão (um item, um trecho marcado, uma palavra, um número).

## 2. Organização e hierarquia

- **A mesa em cima, a pessoa embaixo.** Mesa: x 60 a 1020, y 124 a 902. Emenda (`COSTURA`): y 960. Moldura: x 28, largura 1024, cantos de 46 px, anel branco de 7 px; a cabeça inteira logo abaixo da emenda.
- **Um cartão por vez**, centrado na mesa; cartões brancos informam, o escuro bate forte, o laranja chama. Nunca três brancos iguais seguidos.
- **Legenda:** uma linha numa pílula escura, na emenda; a palavra dita no marca-texto. Só aparece onde o cartão não repete a fala.
- Cantos reservados: nada importante acima de y 110 nem abaixo de y 1540 (interface do app).

## 3. Tipografia

- **Rubik**, uma família só: 800 nos títulos, destaques e números; 700 em itens, comentário e legenda; 600/500 em apoio.
- Texto do cartão entre 40 e 124 px (o encaixe escolhe o maior que cabe em 1 a 4 linhas); rótulos a partir de 26 px; legenda de 34 a 50 px.
- Nada condensado, nada com contorno. Caixa alta só em etiquetas curtas ("RESPONDENDO", fonte da manchete, título de lista).

## 4. Cores, textura e som

| Papel | Cor |
|---|---|
| Mesa (fundo) | `#1E3350` → `#2B4668`, com pontinhos brancos a 9% |
| Cartão claro / tinta | `#FFFFFF` / `#121820` |
| Cartão escuro | `#0F1A2B` |
| Marca-texto e palavra falada | `#FFE14A` |
| Acento (aba, fechamento, números) | `#FF6A3D` |
| Desmentido / alerta | `#E5383B` (risco) e `#FF9A86` (cartão de alerta) |
| Lado certo | `#1FAA6B` |

Sombra suave embaixo dos cartões (`0 22px 48px`), nunca brilho. Nenhum logo ou marca de rede social; avatares genéricos. Sons tonais e raros (veja o SKILL.md).

## 5. O que nunca fazer

- Imitar o visual de uma rede social ou de um jornal real.
- Mais de um cartão visível além da troca de 0,5 s.
- Pôr a pessoa numa coluna estreita ao lado do conteúdo.
- Usar preto e dourado (é a marca do Cofre) ou fonte condensada.
- Escrever na tela o nome da ferramenta de render.
