# Estilo da Aula (para conferir os quadros e para quem mexer no template)

A Aula é a edição de um curso gravado feito por profissional, em 16:9: o professor que fala com o aluno em quadro cheio e, quando ensina, dá lugar ao slide que se monta na fala, ficando numa janela ao lado. Acadêmico e moderno: papel claro, tinta escura, um acento. Entrega **MP4 horizontal 1920×1080 (16:9) para curso e YouTube**. Se um quadro parece "PowerPoint jogado", "lousa" ou "cassino", está errado.

## Identidade

| Papel | Valor |
|---|---|
| Fundo (modo slide) | papel `#ECEAE4` com quadriculado de 48 px em `rgba(22,27,46,0.055)` |
| Slide e cartões | folha branca `#FFFFFF`, raio 28 px, sombra suave; cartões do modo professor com um traço violeta de 6 px no alto |
| Texto | tinta azul-noite `#161B2E`; apoio `#5F6678`; linhas `#D8D5CC`; trilho `#E4E1D9` |
| **Acento** (marca-texto, termo da vez, fórmula, selos, vistos, barra de progresso) | violeta `#6B3BF2` (texto em `#4C22CC`; marca-texto `#E7DEFF`; fundo de caixa `#F5F1FF`), a única cor de destaque |
| Erro e risco | vermelho `#E5484D` (só no riscado e no "errado") |

- Fontes: **Plus Jakarta Sans** 600–800 para o que se lê (títulos 800 com tracking −0,025em); **STIX Two Text** 500 nas fórmulas (letras em itálico, números e operadores retos). Larguras reais da Plus Jakarta em `src/larguras.ts`; `src/medida.ts` mede, quebra (o "R$" nunca fica sozinho no fim da linha) e reduz o corpo.
- Tamanhos (pensados para um celular deitado): capa até 112 px; título de slide 40–64; itens 26–52; número final até 176 (220 sem `desde`); fórmula até 150 (mínimo ~56); resumo 26–32; cabeçalho 28–30; nome do professor 34–38; nada abaixo de 22 px.
- **Proibido:** lousa verde ou textura de giz; preto e dourado; mais de uma cor de destaque; filtro, LUT, vinheta, brilho, halo ou luz atrás da pessoa; texto com contorno; tremer, girar, piscar, quicar; sino; logo de plataforma; a palavra "Remotion" na tela; número que não foi falado.

## Layout (quadro 1920×1080)

1. **Margem segura:** 96 px nas laterais, 64 px no alto; nada abaixo de y 984 (os controles do player cobrem o rodapé).
2. **Cabeçalho (barra de progresso):** pílula branca em (96, 64), 60 px de altura: número da aula em violeta, título, um trecho de 56 px por seção e o nome da seção da vez.
3. **Modo slide:** slide de 1176×836 em y 148 (61% da largura), do lado oposto ao rosto; janela de 520×660 (raio 32, moldura branca de 7 px) do lado do rosto, centrada na altura do slide, com 32 px de vão. Dentro do slide, margem de 56 px; sobretítulo no alto, título embaixo dele, conteúdo e, no último slide, o resumo no pé.
4. **Modo professor:** quadro cheio; cartões de 840 px no lado livre, encostados na margem de fora e na base y 960 (crescem para cima): cobrem o que estiver na mesa ao lado da pessoa. A câmera da volta do slide é sempre a aberta (1,0), para o cartão cair no mesmo lugar.
5. **Legenda (opcional):** até 2 linhas, embaixo do slide (o slide encolhe 92 px) ou embaixo no centro, terminando em y 984.
6. **Cauda:** no fim, o último slide vai para o centro (x 372) com o cabeçalho junto; a janela some.

## Movimento

| O quê | Como |
|---|---|
| Professor ↔ slide | seca, como um corte: o professor vai direto para a janela (ou para o quadro cheio); o conteúdo do slide entra no lugar (aparece e sobe 12 px em 0,22 s). A janela nunca passa por cima do texto |
| Slide → slide | o conteúdo sai (some e sobe 8 px em 0,16 s) e o novo entra no lugar (0,22 s); a folha fica parada; nunca os dois juntos, nada cortado ao meio |
| Câmera do professor | cortes seguidos no modo professor alternam 1,0 ↔ 1,12; a volta do slide é sempre 1,0; aproximação lenta de até 3% em cada tomada |
| Cartões | aparecem e somem secos junto com o corte (quadro 0, corte do motor, troca de modo); fora disso, deslizam 40 px e se revelam em 0,4 s, opacos. A capa já abre completa; a fala acende o número e o título |
| Cauda | o professor some em 0,28 s e o slide vai para o centro em 0,45 s |
| Texto falado | cada palavra aparece na hora em que é dita (sobe 10 px); o marca-texto passa por trás do destaque |
| Itens | entram deslizando 24 px; o da vez em tinta, os anteriores em cinza; nos passos, o fio desce até o da vez |
| Fórmula | cada termo se escreve da esquerda para a direita em 0,26 s, acende (violeta + marca-texto) e assenta em tinta quando o próximo é dito; completa, a moldura violeta se desenha em volta e o lápis aparece |
| Gráfico | eixos em 0,5 s; cada série se desenha na fala (0,8 a 1,4 s) com o ponto da ponta pulsando; base tracejada; sombreado da diferença |
| Número | conta em pt-BR do `desde` (ou 0) até o valor em 0,36 s; a seta desce junto |
| Resumo | linhas entram a cada 0,22 s; o visto cresce |
| Barra de progresso | o trecho da seção da vez enche com o tempo; o nome da seção troca subindo |
| Som | "virar de página" tonal nas trocas de modo e de slide, toque suave quando a fórmula fecha; bem abaixo da voz; nunca sino |

## Conferência dos quadros (olhe a ~540–960 px de largura)

- O rosto está livre em todos os quadros? Na janela, a cabeça inteira com folga?
- Nas trocas (professor ↔ slide, slide ↔ slide, cauda), algum quadro com dois textos um sobre o outro, texto cortado ao meio, cartão meio transparente ou a janela por cima do slide? Olhe 4 quadros em cada troca.
- Alguma caixa vazia ou gráfico "esperando"? No modo professor, o cartão cobre o que distrai na mesa?
- O que está na tela é **aquilo** que foi dito, na hora em que foi dito? A fórmula é a ditada, termo a termo? Algum número que não foi falado?
- Todo texto cabe, está legível e longe das bordas (96 px nas laterais, 64 no alto, nada abaixo de y 984)?
- Algum slide vazio esperando (só o título por mais de ~1,5 s)?
- O resumo fica legível ≥ 1,2 s?
- A cor da pessoa está igual à da gravação?

## Onde mexer no template

| Arquivo | O quê |
|---|---|
| `src/tema.ts` | cores, fontes, margens, tamanho e lugar do slide e da janela, zooms do professor |
| `src/modo.ts` | a mesa de corte: modo de cada trecho, a caixa da pessoa, as viradas, as páginas e as trocas |
| `src/componentes/Slide.tsx` | as páginas e a troca entre elas; `slide` (itens, fórmula, resumo), `topicos`/`passos`, `numero`, `comparacao`, `definicao`, `pergunta` |
| `src/componentes/Grafico.tsx` | o `grafico` (séries qualitativas, barras, linha, rosca) |
| `src/componentes/Professor.tsx` | capítulo, abertura, palavra-chave, frase e fechamento (cartões do modo professor) |
| `src/componentes/Progresso.tsx` | o cabeçalho com a barra de progresso da aula |
| `src/componentes/Folha.tsx`, `Pecas.tsx`, `Texto.tsx`, `Legenda.tsx` | cabeçalho do slide, cartão, sobretítulo, selos, vistos, ícones, texto falado, legenda |
| `ferramentas/justar.mjs` | cortes justos nas pausas reais |
| `ferramentas/ataques.mjs` | onde a voz começa e para (para acertar o tempo das palavras) |
| `ferramentas/timing.mjs` | confere cada coisa na palavra (±0,15 s), a fórmula, os números e o resumo |
