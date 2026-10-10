# Estilo da Tese (para conferir os quadros e para quem mexer no template)

A Tese é o Reel de opinião viral sem pacote gráfico: o que ele tem de especial é o ritmo e a escolha do enquadramento. Se um quadro parece "editado demais" (caixa, cor, efeito), está errado.

## Identidade

| Papel | Valor |
|---|---|
| Palco de texto (metade de cima) | `#0C0B12`, sem borda, sem sombra |
| Texto | branco puro; apoio `#9C9AA8` (itens já ditos, rótulos) |
| Destaque | **nenhum**: ênfase = branco, peso e tamanho (o alerta é uma caixa branca com texto escuro) |
| Legenda | branca, Onest 700 ~56 px, contorno preto de 3 px por fora, sem caixa |

- Fonte: **Onest** (500 a 800). Larguras reais em `src/larguras.ts`; `src/medida.ts` mede, quebra e reduz o corpo.
- **Proibido:** filtro, LUT, vinheta, brilho, desfoque ou cor sobre o vídeo da pessoa; caixa na legenda; cor de destaque; transição; tremor; som de efeito; texto na tela fora da legenda e dos blocos.

## Layout (quadro 1080×1920)

1. **Split (o vídeo todo, exceto o fechado):** faixa de cima 0 a 864 px (45% da altura): imagem em cover com o foco, ou palco de texto. Pessoa em 864 a 1920 (1080×1056), rosto em ~38% da largura, centro a 34% da altura da caixa: cabeça inteira com ~90 px de folga em cima e o queixo acima da legenda (y 1610). Sem divisória. Começa assim, com o rosto à vista.
2. **Fechado:** pessoa em 1080×1920, rosto em ~70% da largura (limite de zoom 2,0×), olhos em ~36% da altura. Só viradas e pergunta direta (~2 s).
3. **Legenda:** centro em y 1610, x 540, abaixo do queixo, em qualquer layout.
4. **Margem segura:** laterais ≥ 64 px (≥ 6%), topo do texto ≥ 120 px, nada importante abaixo de y 1700. Texto sempre cabe no fundo dele (medido; a fonte reduz ou a linha quebra).
5. **Sem tarja preta:** imagem preenche a moldura (cover + foco); nunca letterbox nem fundo desfocado.

## Movimento

| O quê | Como |
|---|---|
| Entrada da inserção | corte seco, na palavra que a nomeia (±0,15 s); o rosto fechado corta numa pausa |
| B-roll | push-in lento ~6% durante todo o momento |
| Pessoa | enquadramento fixo por segmento; muda só no corte; segue o rosto |
| Texto de bloco | cada item entra na palavra dita; corte seco do palco |
| Número | conta de 0 ao valor em 1 s |
| Som | nenhum efeito |

## Conferência dos quadros (olhe a ~360 a 540 px de largura)

- O rosto está à vista desde o primeiro quadro; a faixa de cima ocupa 45% (y 0 a 864), nem mais nem menos.
- Cada inserção entra na palavra que a nomeia (`ferramentas/conferir-tempo.mjs`) e mostra o que é dito.
- Nada encosta nas laterais (64 px) nem passa de y 1700; imagem sem faixa preta.
- A legenda está no mesmo ponto em todos os quadros.
- O rosto nunca fica coberto; no split ele está inteiro embaixo.
- O palco de texto nunca aparece vazio.
