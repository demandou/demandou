# O estilo Visor

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer uma câmera de verdade — precisa, discreta, sem enfeite. Quase toda "melhoria" que adiciona brilho, cor ou efeito piora o resultado.

## A ideia

O espectador está olhando pela tela de uma câmera enquanto um fotógrafo ensina. A interface não decora: ela **faz** o que a pessoa diz. Quando ela fala "liga a grade", a grade liga; "toca pra focar", o quadrado procura e trava; "arrasta pra ajustar a luz", o sol sobe e a imagem clareia; "fotografa", o obturador dispara. Uma cena ilustrada simples — uma xícara na mesa — é a foto que melhora a cada dica e, no fim, aparece grande, em cima da versão antiga. O vídeo fecha com a câmera tirando uma foto da própria pessoa.

## Regras que definem o estilo

- **A câmera é fictícia e sem marca.** Nada de ícones, nomes, sons ou cores de um aplicativo real (o amarelo de foco de um celular famoso, por exemplo, não entra).
- **Vidro fumê escuro, traço branco fino e UM acento.** (O vermelho de aviso `#FF6B57` existe só para alerta, erro e risco: a faixa de zebra do `destaque` de alerta, o ✕ e o `risco` riscado. Nunca é decoração nem "REC" piscando.) Corpo do aplicativo `#0A0B0C`; rótulos em vidro fumê (`rgba(13,15,16,0.64)` com desfoque do que está atrás); branco `#F3F4F1`; o acento água-marinha `#3EE0CF` só para o que trava, liga ou dá certo (foco travado, grade ligada, o modo atual, o DEPOIS, o botão apertado). Nunca dois acentos.
- **O que ainda vai acontecer espera a lápis.** Títulos já aparecem em cinza claro e cada palavra ganha corpo quando é dita; a galeria e o espaço do ANTES são tracejados até receber a foto; o ícone da grade fica cinza até ligar; o botão do fechamento é só contorno até ser apertado.
- **Duas fontes:** Hanken Grotesk (títulos, legenda, nomes — o "l" minúsculo tem rabicho, então não se confunde com o "I") e Chivo Mono (números da câmera, "AJUSTE 01", selos em caixa alta espaçada). Gratuitas, do Google Fonts.
- **Tamanhos mínimos (quadro de 1080 de largura):** títulos 72 px (abertura 86), segunda linha e notas 40–44, legenda 46, leituras do alto 37–40, seletor de modos e selos em mono 34, "AJUSTE 01" 32, nada abaixo de 30.
- **O rosto nunca é coberto nem distorcido.** A moldura de detecção e o quadrado de foco ficam em volta do rosto; a régua de exposição fica ao lado; rótulos ficam no peito, no painel ao lado da pessoa ou dentro da cena; a legenda espera a pessoa chegar no lugar novo antes de aparecer. A pessoa muda de lugar (tela cheia, cartão, janelinha, coluna) só por reenquadramento, sem esticar.
- **Movimento de câmera:** entra decidido e assenta, sem quique. As trocas de lugar cruzam (a pessoa encolhe revelando a cena ou cresce cobrindo-a) e os cantos de enquadramento acompanham. O quadrado de foco "procura" aos trancos e para seco; o pano limpa a lente num só passe; a xícara desliza até a linha e para.
- **Sempre acontecendo alguma coisa**, e sempre com sentido: palavras que se acendem, a ação da dica, a nota, o EV contando, o seletor de modos deslizando, o contador virando, a foto chegando na galeria. Nada fica parado mais de ~2,5 s.
- **Flash nunca cru:** o disparo é um piscar branco suave (no máximo ~1/3 de opacidade, some em 0,3 s) junto com o obturador afundando.
- **Som raro e tonal:** um som por batida importante, grave, com altura que varia (duas notas na grade, dois toques no foco, dois baques no obturador). Nada de ruído, clique agudo nem sino.
- **A cena ilustrada é uma foto, não um desenho animado:** neutros quentes (parede, mesa, luz da janela), cor só no café, sombra suave. Cada defeito é legível sozinho (embaçada, escura, torta, fora de foco, no centro).

## Os blocos universais no estilo

- **Tela de vidro** (`topicos`, `passos`, `comparacao`, `grafico`): um painel escuro atrás da pessoa, que encolhe e o revela (ou cresce e o cobre). O que falta dizer é só contorno tracejado, nunca o texto. Um quadrado de foco (cantos no acento) anda de item em item; no gráfico, a grade dos terços aparece ao fundo.
- **Rótulo no peito** (`numero`, `destaque`, `definicao`, `frase`, `pergunta`): vidro fumê sobre a pessoa em tela cheia, de baixo para cima, sempre abaixo do queixo. Número = leitura de exposição em Chivo Mono; alerta = zebra; definição e destaque `chave` = quadrado de foco travando.
- **Texto que cabe sempre:** medido com a própria fonte, quebra em até 2 a 4 linhas e reduz o corpo até um mínimo (36 a 60 px conforme o bloco); nunca corta nem vaza. Terminada a entrada de uma palavra, ela vira texto simples.
- **Trocas de layout sem quadro vazio:** o conteúdo já está sob a pessoa quando ela encolhe; só some quando ela o cobre ou quando outro layout o substitui na hora.

## O que pode mudar por vídeo

- Textos, tempos e a escolha dos momentos (é o trabalho do plano).
- As ações de cada `cena` e o lugar da pessoa (`pessoa`), dentro do que `references/plano.md` permite.
- `marca` (nome e área do cartão de perfil).
- O nome dos modos no seletor (`modo`; na `comparacao`, `seletor`) e o rótulo dos ajustes (`rotulo`).
- O ajuste do quadrado de foco (`quadro`) para o rosto de cada gravação.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Cores, fontes e tamanhos. Se o usuário pedir a cor da marca dele, troque **só** `acento` (e `acentoTexto`, a cor do texto sobre o acento) em `src/tema.ts` — e confira que a cor nova não é amarelo de foco nem se perde na pele ou no fundo.
- A posição dos elementos da câmera (leituras no alto, seletor e obturador embaixo, acima da interface do aplicativo).
- Nada por cima do rosto: nem rótulo, nem grade, nem brilho.
- Não adicione brilho/glow atrás da pessoa, contorno nas letras, emoji, degradê colorido, tremida, vazamento de luz, flash branco cheio, "REC" piscando ou barras de rolo de filme: pertencem a outros estilos ou deixam a câmera falsa.

## Se precisar de algo que o modelo não tem

- **Um ícone novo:** adicione o traço em `src/componentes/Icones.tsx` (viewBox 48×48, só linhas) e, se for usado em `nota`, o nome em `NomeIcone`, em `src/plano.ts`.
- **Um defeito novo na cena** (ex.: "zoom digital" pixelado): acrescente o campo em `EstadoCena` (`src/layout.ts`), o defeito no `estadoAntes`, o conserto no `estadoNoTempo`, o desenho em `src/componentes/Cena.tsx` e o nome em `Acao` (`src/plano.ts`) e no seletor (`modoPadrao`, em `src/hud.ts`). Um defeito por ação, legível sozinho.
- **Um componente novo:** siga a gramática acima — rótulo de vidro de `Etiqueta.tsx`, texto palavra por palavra com `Palavras` e `temposDoTexto` (`src/anim.tsx`), cores de `tema.ts`, entrada com `prog`, nada sobre o rosto — e consulte a skill do Remotion para as regras de animação.
