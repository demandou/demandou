# Estilo do Canal (para conferir os quadros e para quem mexer no template)

O Canal é a edição de um canal de YouTube feito por profissional, em 16:9: jump cuts que trocam a câmera, a pessoa que abre espaço para a informação (o reframe), B-roll limpo e um pacote gráfico discreto de vidro escuro. Entrega **MP4 horizontal 1920×1080 (16:9) para YouTube**. Se um quadro parece "editado demais" ou "cassino", está errado.

## Identidade

| Papel | Valor |
|---|---|
| Painéis, chips e tarjas | vidro escuro `rgba(17,19,24,0.80)` + desfoque do fundo (26 px) + borda `rgba(255,255,255,0.09)`; raio 22 px |
| Texto | giz `#F6F5F1`; apoio `#A3A9B4`; trilho `#2A2E37` |
| **Destaque** (marcador, selos, traços, botão, linha do tempo) | cobalto `#3D63FF` (texto sobre o vidro: `#9CB2FF`), a única cor de destaque |
| Alerta e risco | coral `#FF5B4A` |

- Fontes: **Inter** 500–800 para o que se lê (títulos 800 com tracking −0,02em); **DM Mono** 500 só em rótulos curtos, contadores e "CAPÍTULO". Larguras reais em `src/larguras.ts`; `src/medida.ts` mede, quebra e reduz o corpo.
- Tamanhos: abertura 52–92 px; nomes dos cartões 36–64; palavra-chave 48–88; capítulo 36–60; rótulos mono 16–27; nada abaixo de 18 px.
- **Proibido:** filtro, LUT, vinheta, brilho, halo ou luz atrás da pessoa; texto com contorno; preto e dourado; mais de uma cor de destaque; tremer, girar, piscar, quicar; sino; logo de plataforma (o botão de inscrição e o avatar são genéricos); a palavra "Remotion" na tela.

## Layout (quadro 1920×1080)

1. **Margem segura:** 96 px nas laterais, 72 px no alto; a linha de baixo das tarjas é y 984 (os controles do player cobrem o rodapé).
2. **Lado livre:** o oposto ao rosto (`src/tema.ts → ladoLivre`). Painel lateral de 824 px de largura, de y 116 a y 964, centrado na altura da tela.
3. **Reframe:** a pessoa vai para ~27% da largura (73% se a informação ficar à esquerda), com zoom de 1,3 a 1,5 (o mínimo que leva o rosto até lá sem deixar borda vazia); a linha dos olhos quase não muda.
4. **Embaixo, encostados na margem de fora do lado livre:** tarja de nome, capítulo, inscrição, fechamento.
5. **Palavra-chave:** no lado livre, na altura do rosto.
6. **B-roll:** cobre a tela; etiqueta no alto à esquerda.
7. **Legenda (opcional):** embaixo, no centro, até 2 linhas, terminando em y 984.

## Movimento

| O quê | Como |
|---|---|
| Câmera | aberto 1,0 ↔ fechado 1,3 em cada corte (médio 1,15 para não repetir); capítulo abre; inscrição no médio; volta do reframe abre |
| Reframe | seco num corte; 0,5 s (seno) no meio da frase; corte dentro do reframe aperta ×1,06 |
| Ênfase | aproximação lenta até o próximo corte, até ~4%; punch-in pedido (`aproximar: 0.06`) em até 0,8 s |
| Troca de câmera no meio da frase | seca, como um corte de câmera (`camera` com `plano`) |
| Chamada | chip pequeno embaixo no lado livre; o selo ▶ respira devagar; dá lugar ao capítulo no mesmo canto |
| Trilha do reframe | os lugares entram em sequência (0,2 s um do outro) com o título; o próximo a ser dito pulsa em cobalto |
| Painéis e chips | deslizam 48 px do lado livre e abrem de cima para baixo em 0,42 s; saem em 0,24 s; linha cobalto corre no alto enquanto estão no ar |
| Cartões do reframe | o novo entra cobrindo o anterior da esquerda para a direita (0,42 s); a foto anda ~7%; a trilha acende o item dito |
| Texto falado | cada palavra aparece na hora em que é dita; o marcador cobalto cresce junto |
| Número | conta de 0 ao valor em 0,9 s; a barra cobalto enche junto |
| Inscrição | o cursor entra, aperta o botão (escala 0,93) e o botão vira "Inscrito" com o ok |
| Som | "vum" tonal na entrada do reframe, toque no corte para o B-roll, tique no clique; tudo bem abaixo da voz; nunca sino |

## Conferência dos quadros (olhe a ~540–960 px de largura)

- O rosto está livre em todos os quadros? No reframe o painel não encosta na pessoa?
- Dois quadros de cortes vizinhos têm câmeras diferentes?
- O cartão, a imagem e a palavra-chave são **aquilo** que foi dito, na hora em que foi dito? Sem marca, logo, texto ou gente reconhecível nas imagens?
- Todo texto cabe, está legível e longe das bordas (96 px nas laterais, 72 no alto, nada abaixo de y 984)?
- Nenhuma tarja preta sobrando nas fotos (elas preenchem a área delas)?
- Nas trocas, nenhum quadro com dois textos sobrepostos; nenhum painel vazio parado?
- A cor da pessoa está igual à da gravação?

## Onde mexer no template

| Arquivo | O quê |
|---|---|
| `src/tema.ts` | cores, fontes, zooms, margens, lado livre, cálculo do reframe |
| `src/camera.ts` | a mesa de corte: câmera de cada trecho, reframe, aproximação lenta |
| `src/componentes/Lateral.tsx` | o `reframe` e os blocos que entram nele |
| `src/componentes/Faixas.tsx` | abertura, tarja de nome, palavra-chave, chamada, capítulo, inscrição, fechamento e B-roll |
| `src/componentes/Pecas.tsx`, `Texto.tsx`, `Legenda.tsx` | vidro, rótulos, selos, ícones, texto falado, legenda |
| `ferramentas/justar.mjs` | cortes justos nas pausas reais |
| `ferramentas/timing.mjs` | confere cada inserção na palavra (±0,15 s) |
