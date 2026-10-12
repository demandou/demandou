# Estilo da Manchete (para conferir os quadros e para quem mexer no template)

A Manchete é o jeito de um Reel de notícia comentada: B-roll em cima, a pessoa embaixo, legenda no peito, tarja no começo. **Sóbrio**: sem transição, sem filtro, sem zoom, sem emoji, sem texto grande. Se um quadro parece "editado demais", está errado.

## Identidade

| Papel | Valor |
|---|---|
| **Destaque** (tarja, marcas dos blocos universais) | rosa-vermelho `#F2305B` |
| Texto | branco; legenda com sombra `0 2px 10px rgba(0,0,0,.75)`, sem caixa e sem contorno |

- Fonte: **Manrope** 800 (tarja e legenda). Larguras reais em `src/larguras.ts`; `src/medida.ts` mede e reduz o corpo.
- **Proibido:** filtro, LUT, vinheta, brilho ou desfoque sobre a pessoa; zoom ou punch-in; transição (só corte seco); legenda com caixa, contorno ou cor de destaque; texto grande no meio do B-roll; logo ou tela final.

## Layout (quadro 1080×1920)

1. **Faixa do B-roll**: x 0–1080, y 0–600, de borda a borda e **toda preenchida** pela imagem (cover com foco; nunca letterbox nem preto). Sempre ocupada.
2. **Tarja**: pílula baixa e **centrada**, y 560–644 (84 px; **monta na borda da faixa**, metade na foto e metade na pessoa), cantos de 18 px, texto de 34 a 50 px; nunca passa de x 72–1008 (margem segura). Nada de pílula solta flutuando sobre o fundo da pessoa (foi o que deixou o v1 amador). **O modelo não tem selo** (nenhum quadrado com foto ou ícone ao lado da tarja).
3. **Pessoa**: y 600–1920, largura total, plano fixo; olhos em y 1070, rosto na linha central, ~36% da largura; o topo da cabeça fica abaixo da tarja.
4. **Legenda**: 22 px abaixo do queixo (sobre o colarinho/peito, nunca na boca nem na barba), 1 linha, 38 a 50 px (pequena: é a fala, não título).
4b. **Crédito**: miúdo (22 px) no alto à direita da faixa, x ≤ 1008, y 128. Foto CC BY: "Foto: Autor · CC BY 2.0"; imagem gerada por IA: "imagem ilustrativa".
5. **Margem segura**: nenhum texto, rótulo, cartão ou print importante encosta nas laterais (≥ 64 px de cada lado), no topo (≥ 120 px) nem abaixo de y 1700; nada à direita de x 960 na parte de baixo (botões do app).

`--guias` desenha tudo isso.

## Movimento

| O quê | Como |
|---|---|
| Troca de B-roll | corte seco, na virada de ideia (6 a 14 s) |
| Dentro do B-roll | a foto aproxima/afasta/desliza devagar; a cada 2 a 5 s um corte seco de ângulo (`angulos`) |
| Tarja | presente no primeiro quadro e fica ~6 s (`tarjaAte`), saindo num corte de B-roll (pode atravessar o primeiro); sem animação |
| Pessoa | plano fixo; só o rastro do rosto corrige quando ela se mexe |
| Legenda | 2 a 4 palavras, troca em corte seco com a fala |
| Som | nenhum efeito |

## Conferência dos quadros (olhe a ~540 px de largura)

- A primeira palavra sai em até 0,1 s e o primeiro quadro já tem B-roll + tarja + pessoa?
- O rosto está na linha central, inteiro, e a tarja não encosta no topo da cabeça?
- O B-roll é **aquilo** que a fala diz, preenche a faixa inteira (sem borda preta) e entra na palavra certa (±0,15 s, `ferramentas/timing.mjs`)?
- Todo texto cabe na caixa dele e respeita a margem segura?
- A tarja está centrada, montada na borda da faixa (nada flutuando sobre a pessoa), e some num corte de B-roll perto dos 6 s?
- A legenda é branca, sem caixa, de 2 a 4 palavras, logo abaixo do queixo?
- A cor do vídeo da pessoa está igual à da gravação?
