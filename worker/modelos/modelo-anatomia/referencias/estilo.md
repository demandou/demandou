# O estilo Anatomia

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é **a explicação desenhada como ilustração médica premium**: papel branco-azulado, traço fino de tinta, um único azul clínico e o vermelho do músculo só dentro da ilustração. Tudo o que entra na tela é algo que a pessoa acabou de nomear. Quase toda "melhoria" que adiciona outra cor de destaque, brilho, emoji, contorno grosso, fonte de efeito ou transição chamativa piora.

O estilo vale para qualquer assunto: dermatologia, estética, odontologia, fisioterapia, nutrição, saúde em geral e, no modo esquema, finanças, cripto, rotina, carreira. Muda o conteúdo das estruturas, nunca a linguagem abaixo.

## A ideia

A pessoa explica; em cima, uma prancha de anatomia **se monta e acende no ritmo da fala**. A ilustração não é decoração: é o diagrama do que está sendo dito (a região, a estrutura, a camada, o prazo). Embaixo, a pessoa inteira, com o fundo natural, numa moldura.

## 1. Dinâmica do motion

- **Entrada da ilustração:** sai de um ponto do vídeo (um quadro de anatomia na parede) voando até a prancha em 0,68 s, ou cresce no lugar; o traço se desenha em azul-fantasma e vira tinta; o rosto gira de 3/4 (0,42 rad) para frente em ~1,4 s e depois respira (escala ±0,6%, giro ±0,03 rad).
- **Revelação:** uma linha de varredura azul desce em 0,6 s e, acima dela, a pele vira o mapa dos músculos (fibras com volume, tendões claros), com um véu de pele translúcido por cima.
- **Viagem da câmera:** 0,7 s, saindo 0,35 s antes da palavra da região; aproxima até 2,5× numa estrutura pequena; o rosto gira um pouco para mostrar as estruturas laterais.
- **A estrutura acende:** retícula (elipse + 4 marcas) se desenha em 0,5 s na palavra da região; na palavra da estrutura, contorno azul, halo leve e fibras de luz correndo (traços brancos ao longo das fibras), pulsando a cada ~1 s; os músculos de contexto apagam para 16%. A deformação acompanha: o frontal levanta a sobrancelha, o corrugador franze, o orbicular aperta o olho.
- **Rótulo:** o ponto aparece, a linha-guia se desenha em 0,44 s até o título sublinhado, o título sobe por máscara; a função e o número grande entram nas palavras deles. Sai com desfoque quando a câmera parte para a próxima.
- **Rugas:** vinco escuro + luz embaixo, desenhados da esquerda para a direita na palavra; depois ficam a 42%.
- **Corte:** a lente abre de um círculo de 40 px para o retângulo da prancha em 0,57 s, com anel azul; o bloco sobe 30 px; pulsos de luz correm pelo nervo em 0,5 s; as moléculas (hexágonos azuis) voam da agulha até a junção.
- **Virada:** a pergunta entra palavra e letra a letra (0,022 s por letra) com desfoque; a linha de luz desce a tela em 0,6 s (faixa com luz azul e branca); a pergunta cresce 8% e se desfaz.
- **Tela dividida:** o quadro cheio encolhe para a moldura de baixo em 0,66 s (ease in-out), com a sombra e a borda crescendo.
- **Nada parado:** algo muda a cada 1 a 2,5 s (uma estrutura, uma palavra, a câmera, um pulso, um número).

## 2. Organização e hierarquia

- **Prancha em cima** (y 0 a 840; área útil x 64 a 1016, y 130 a 800). **Pessoa embaixo** (moldura x 60, y 840, 960 × 1016, cantos de 44 px, borda branca de 1,5 px, sombra suave). Rosto no centro da moldura, a ~52% da altura dela, cabeça inteira.
- Rosto da prancha: cabeça de ~530 px na vista geral (centro em x 540, y 535), um rótulo por vez em y 318, à esquerda (x 64) ou à direita (até x 1016). O cabeçalho do mito fica em y 196 (acima dos rótulos).
- Hierarquia: número grande azul (150 px) → título do rótulo (Sora 650, 42 px) → função (Sora 500, 30 px, tinta clara) → selo "conteúdo ilustrativo" (28 px, ardósia, em pílula branca).
- Nos blocos universais: título pequeno em caixa alta espaçada (ardósia), texto principal em Sora 650/700, ênfase só em azul com traço fino embaixo.
- Legenda: na costura (y ~930, acima da cabeça) quando a tela divide; abaixo do queixo no quadro cheio.

## 3. Tipografia

- **Sora** variável (arquivo local `public/fonts/Sora-Variable.ttf`): 800 na legenda e no NOME da virada; 700 em títulos e números; 650 em rótulos; 600 em títulos de prancha (caixa alta, +0,06em); 500 em funções e textos de apoio.
- Tracking: −0,02em nos títulos, −0,04em só nos números grandes, nada mais apertado. Nada condensado.
- Texto de leitura entre 26 e 120 px (o encaixe escolhe o maior que cabe e nunca vaza).

## 4. Cores, textura e som

| Papel | Cor |
|---|---|
| Papel da prancha | #F7FAFD → #EEF3F8, com brilho gelo #DCE9F7 no alto |
| Tinta (traço, texto) | #13202F; texto de apoio #3E4E62; ardósia #6A7C92; linhas #9EB0C4 |
| Azul clínico (o único acento) | #2F6FE4 (claro #5B97FF) |
| Músculo (só na ilustração) | #B4554D, fibras #F0AA9F → #A3473F, tendão #F5EAE5 |
| Alerta (só `destaque` alerta e o lado errado) | #C2413A |
| Materiais do corte/esquema | pele #F7E3DA, gordura #FBF3E1, osso #F3EDDC, disco #DDE8F2, esmalte #F7F9FB, dentina #F1E6CF, polpa #F2B8AE, nervo #F6E6B4, neutro #E9EFF6 |

- Legenda: branca (#FFF8F2) com contorno preto de 10 px e sombra leve. Nunca palavra colorida.
- A pessoa: vídeo natural, sem brilho, halo, luz ou filtro. Nunca recorte serrilhado: sempre a moldura.
- Sons (em `public/sfx/`): `swap_crystal` (virada), `lift_airy` (a tela divide), `tone1–4` (estruturas, números, destaques), `dive_light` (mergulho no corte), `block_airlock` (bloqueio), `relax_downer` (relaxa), `chart_boost` (linha do tempo). Volumes 0,14 a 0,35, bem abaixo da voz. Sem batida, sem sino, sem ruído branco.

## 5. O que não fazer

- Outra cor de destaque além do azul (nem laranja, nem verde, nem dourado).
- Ilustração colorida/realista, foto de banco, emoji ou ícone de app no lugar do traço fino.
- Mostrar número, prazo ou nome que não foi dito; nome comercial de medicamento sem confirmar com o usuário.
- Pôr a pessoa numa coluna lateral, recortar a pessoa do fundo ou mexer na cor do vídeo dela.
- Mais de um rótulo do rosto ao mesmo tempo; texto encostado na borda; nada importante abaixo de y 1700.
- A palavra "Remotion" ou qualquer marca real na tela.
