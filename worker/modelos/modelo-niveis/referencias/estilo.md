# Estilo do Níveis (para conferir os quadros e para quem mexer no template)

Um editor discreto: nada de efeito. O Reel de origem é uma pessoa de plano único, três cartões sobre o fundo da cena, rótulos brancos e uma chamada para seguir e comentar. Se um quadro parece "editado demais", está errado.

## Identidade

| Papel | Valor |
|---|---|
| Topo | o próprio fundo da cena (sem faixa preta); uma sombra suave escura (26%) até y ~680, só para os rótulos lerem |
| Cartão de nível | 320 × 440 px (~3:4), cantos de 20 px, fundo claro (`#F3F0E8` ou a cor do `fundo`), sombra suave |
| Rótulo | branco, Plus Jakarta Sans 800, caixa alta, 56 px (nunca abaixo de 52), sem caixa |
| Pílula do fechamento / cartão do perfil | branco `#FFFFFF`, texto preto 800; botão "Seguir" azul `#4A5CF0` |
| Cor de destaque | **nenhuma** (o azul do botão é da interface do app) |

- **Proibido:** legenda, contorno no texto, emoji, filtro/LUT/vinheta sobre a pessoa, transição, shake, zoom animado, sons de efeito, tela final.

## Layout (quadro 1080×1920, calculado a partir do rosto em `src/tema.ts → medidas`)

1. **Cartões:** topo em y 70, três colunas em x 40 / 380 / 720 (320 px de largura, vão de 20 px: quase a largura toda, fixas mesmo com só o primeiro cartão); rótulo logo abaixo (y ~522).
2. **Pessoa:** quadro cheio, com o rosto em ~32% da largura. Ela desce (`desloca`) até o topo do cabelo ficar em y ~640; o alto é o reflexo esticado do fundo acima do cabelo.
3. **Blocos de peito:** a partir de ~60 px abaixo do queixo até y 1490 (interface do app), x 64 a 960.
4. **Fechamento:** cartão do perfil centrado no topo (y 84, 468 × 132); pílula centrada no peito (y ~1060 ou 90 px abaixo do queixo).

## Movimento

| O quê | Como |
|---|---|
| Cartão novo | corte seco (1 quadro) na palavra do nível; fica até o corte do ciclo seguinte |
| Troca de rótulo | corte seco (campo `depois`) |
| Câmera | cada corte troca a escala entre 1,0 / 1,03 / 1,05; o rosto não muda de altura |
| Fechamento | cartão do perfil no `de`; pílula 0,5 s depois; até o último quadro |
| Blocos de peito | entram com máscara que sobe (0,42 s), saem em 0,2 s |
| Som | nenhum |

## Conferência dos quadros (olhe a ~540 px de largura)

- Os três cartões na mesma grade em todos os ciclos, ocupando a largura toda?
- Cada rótulo lê inteiro, grande (≥ 52 px), sem tocar na cabeça?
- O reflexo do alto parece fundo natural (sem cabelo, sem objeto cortado)?
- A imagem é o nível dito, legível em 1 s, e os três contrastam?
- A cabeça fica abaixo dos rótulos?
- O fechamento mostra o cartão do perfil e a pílula, sem os cartões de nível?
- O vídeo termina na última palavra?

## Onde mexer no template

| Arquivo | O quê |
|---|---|
| `src/tema.ts` | cores, fonte, zooms, medidas da faixa e da pessoa, posição dos cartões |
| `src/camera.ts` | o zoom de cada trecho |
| `src/componentes/Palco.tsx` | a assinatura (`Niveis`: cartões e rótulos) e o fechamento (`FechamentoCta`) |
| `src/componentes/Blocos.tsx` | os blocos universais (peito) |
| `src/componentes/Pecas.tsx` | cartão com máscara, etiqueta, marcador |
| `src/componentes/Texto.tsx` | texto que se monta na fala |
| `ferramentas/justar.mjs` | cortes justos nas pausas reais |
