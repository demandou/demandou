# O KIT DO EDITOR AVANÇADO (a API que a cena usa)

O corte é um projeto Remotion 4.0.530, a 30 fps, vertical 1080 × 1920 (os cortes) ou deitado 1920 × 1080 (o vídeo completo de gravação deitada: veja a seção 9). `LARGURA` e `ALTURA` do kit dizem qual é. O kit (src/kit) já faz: o fundo da marca, o apresentador (tela cheia, moldura, recorte com alfa, máscaras complementares, rastro do rosto), a legenda, a voz, a paralaxe e as letras da marca. Você escreve SÓ a pasta src/cenas:

- `roteiro.json`: onde o apresentador está, onde fica a legenda e quando cada cena entra;
- `cena-01.tsx`, `cena-02.tsx`, ...: cada cena exporta `Atras` (desenhado ATRÁS da pessoa) e/ou `Frente` (À FRENTE dela);
- `comum.tsx` (opcional): o que mais de uma cena usa (uma maquete, um ícone desenhado à mão).

Imports permitidos, e só estes: `react`, `remotion`, `@remotion/three`, `three`, `@react-three/fiber`, `../kit`, `./cena-NN` e `./comum`.

## 1. roteiro.json

- Na técnica `maquete-3d`, o roteiro leva `"objeto": {"nome": "tenda", "palavra": "cortina"}`: o objeto físico que a fala nomeia e a palavra exata dita que nomeia ele ou uma parte dele. Palavra que não está na fala reprova no portão.

```json
{
  "tecnica": "recorte-letreiro",
  "fundo": "estudio",
  "paralaxe": 1,
  "apresentador": [
    { "em": "inicio", "recorte": true, "base": 1802, "rosto": { "x": 540, "y": 760 } },
    { "em": { "palavra": "remete" }, "transicao": 1.5, "recorte": true, "cabecaPorFora": true, "forma": "assimetrica", "borda": true,
      "caixa": { "x": 70, "y": 1180, "l": 940, "a": 622 }, "base": 1802, "rosto": { "x": 540, "y": 760 } }
  ],
  "legenda": { "topo": 1622, "esquerda": 70, "largura": 940, "tamanho": 50, "alinhar": "center" },
  "cenas": [
    { "arquivo": "cena-01.tsx", "de": { "palavra": "bem feito" }, "ate": { "palavra": "o certo", "mais": -0.2 }, "oQue": "BEM FEITO grande atrás da cabeça" }
  ]
}
```

ÂNCORA (todo instante do roteiro): `{ "palavra": "frase dita", "vez": 2, "mais": -0.2 }` (a `vez`-ésima vez que a frase é dita, mais `mais` segundos, de -0,6 a 0,6), um número de segundos, `"inicio"` ou `"fim"`. A frase é a fala como foi dita, uma ou mais palavras seguidas; acento, caixa e pontuação não contam. O `de` de toda cena é uma palavra da fala (o portão de tempo confere).

`tecnica`: `"maquete-3d"` (aula 8.1), `"recorte-letreiro"` (aula 8.2), `"graficos"` (aula 6) ou `"moldura-explicativa"` (aula 7). Use a que o pedido mandar.

`fundo`: `"estudio"` (degradê da marca, luz atrás da cabeça, grade fina e arcos), `"grade"` ou `"liso"`. `paralaxe`: 0 a 1,5 (0 desliga).

`apresentador`: uma lista de QUADROS, em ordem. Em `em` começa a transição para o quadro, que dura `transicao` segundos (padrão 0,9) e interpola janela, cantos, escala e rosto (nada de corte seco). Campos:
- `caixa` `{x, y, l, a}` em px do quadro: a janela onde a pessoa aparece. Sem caixa: a tela inteira.
- `forma`: `"reta"`, `"arredondada"` (aula 7), `"assimetrica"` (aula 8.2: canto grande arredondado em cima à esquerda, chanfro embaixo à direita) ou `"chanfrada"` (aula 8.1: janela de prancha, contorno duplo).
- `borda` (padrão: sim fora da tela inteira): a borda se DESENHA na transição, com painel, sombra e o canto chanfrado no destaque da marca.
- `escala`: px da gravação → px do quadro. Padrão: cobrir a janela.
- `rosto` `{x, y}`: onde o centro do rosto fica no quadro. Padrão: meio da janela, a 38% da altura dela. Sem recorte, a gravação sempre cobre a janela inteira (o rosto vai até onde der).
- `acompanhar` (0 a 1, padrão 0,6): quanto a janela segue o movimento do rosto. Numa moldura pequena use 1 (o rosto fica sempre no centro).
- `inclinacao`: graus de perspectiva (aula 8.1: discreta, 4 a 8).
- `recorte: true` (só quando o corte TEM recorte): a pessoa sem o fundo da gravação, com contorno real. Aí a altura vem de `base` (o y onde a gravação termina, a base do corpo), não de `rosto.y`; `rosto.x` continua valendo. Com moldura, a base padrão é a base da janela. NO CORTE EM PÉ, A ESCALA DO RECORTE É DO KIT (12/10): ele mede o corpo que a gravação tem e escala para o corpo ir do topo da cabeça até a base, qualquer que seja a gravação (busto do OBS ou meio corpo do celular); `escala` é ignorada. Os números de `base`, topo da cabeça e rosto vêm prontos no pedido (`geometria.recorte.recomendado`). A JANELA COM RECORTE FICA BAIXA E LARGA: a base dela em 1700 ou mais (1802 é a da aula 8.2), altura 560 ou mais e largura 800 ou mais, nunca uma tira nem uma janela no meio da tela com faixa vazia embaixo; o portão recusa. Com `cabecaPorFora`, a cabeça fica alta (topo a 29% da altura) e o corpo grande sai da janela. ATRÁS DA PESSOA SÓ A PALAVRA GIGANTE (o letreiro da 8.2, legível em volta da cabeça): número, cartão, título e rótulo ficam na área livre (`useAreaLivre`), nunca atrás da pessoa nem encostados na borda de cima da janela; a revisão reprova.
- `cabecaPorFora: true` (com recorte e moldura): cabeça e ombros passam POR CIMA da borda de cima, pelas máscaras complementares da mesma camada (nada se duplica). É a assinatura da aula 8.2.
- A moldura que SOBE DO PÉ (aula 8.2): um quadro com `"caixa": {"x": 70, "y": <base>, "l": 940, "a": 0}` e `"borda": false` antes do quadro com a janela inteira; a borda se desenha enquanto sobe.

`legenda`: a faixa da legenda simples (até duas linhas, a palavra dita no destaque). `topo`, `esquerda`, `largura`, `tamanho` (34 a 64, padrão 48), `alinhar`. As duas linhas terminam acima de y = 1840; a faixa não cobre rosto, cartão nem maquete.

`cenas`: `{arquivo, de, ate, oQue}`. A cena só é montada entre `de` e `ate`: a saída dela acontece ANTES do `ate`. Cenas podem se sobrepor (uma maquete que fica, e cartões que entram por cima). `oQue` diz numa frase o que a cena explica (a revisão usa).

## 2. Um arquivo de cena

```tsx
import React from "react";
import { MARCA, LETRA, comoTitulo, useTempo, useApresentador, dito, k, mix, janela, MEIO, ENTRADA, Letreiro, type CenaProps } from "../kit";

export const Atras: React.FC<CenaProps> = ({ de, ate }) => {
  const { t } = useTempo();
  const ap = useApresentador();
  const v = janela(t, de, ate, 0.5, 0.4);
  if (v.visivel <= 0) return null;
  const topo = (ap.cabeca?.topo ?? 560) - 150;
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: topo, textAlign: "center", fontFamily: LETRA.titulo, fontWeight: 900, fontSize: 200, lineHeight: 0.85, opacity: v.visivel }}>
      <Letreiro texto={comoTitulo("bem")} tamanho={180} largura={960} cor={MARCA.titulo} t={t} inicio={dito("bem feito")} />
    </div>
  );
};
```

`CenaProps`: `{ de, ate }`, os segundos da cena já resolvidos. Cada componente é desenhado num `AbsoluteFill` do quadro inteiro: posicione tudo com `position: "absolute"` em px do quadro.

## 3. O tempo (tudo pelo quadro, tudo pela fala)

- `useTempo()` → `{ f, t, fps }`: o quadro e o segundo atuais. TODO movimento sai de `t`.
- `dito("frase", vez?)` → o segundo em que a frase COMEÇA a ser dita; `ditoAte("frase", vez?)` → quando termina. Só com o texto entre aspas (o portão de tempo confere cada um contra a fala). O que entra na tela entra no `dito()` da palavra que o nomeia: nada aparece antes de ser dito.
- `k(t, a, b, curva?)` → 0 a 1 entre os segundos a e b, preso nas pontas. Curvas: `SAIDA` (entrada que assenta, o padrão), `ENTRADA` (saída que acelera), `MEIO` (vai e volta), `MOLA` (empurrão sem quique).
- `mix(a, b, p)`; `janela(t, de, ate, entra?, sai?)` → `{ entrada, saida, visivel }` (preparação, entrada, permanência e saída).
- `falaEntre(de, ate)` → as palavras ditas no intervalo.
- `DURACAO`, `FPS`, `DADOS` (os dados do corte, só leitura).

## 4. A marca (nunca escreva cor nem fonte)

- `MARCA.fundo`, `MARCA.titulo` (texto e superfícies claras), `MARCA.destaque` (pouco e com função: a palavra-chave, o detalhe, a linha de chamada), `MARCA.destaqueTexto` (o destaque em TEXTO sobre o fundo: sempre este em letra, legenda e rótulo, porque o destaque cru pode não ter contraste), `MARCA.painel`, `MARCA.painelClaro`, `MARCA.fundoProfundo`, `MARCA.apoio` (texto de apoio), `MARCA.linha`, `MARCA.linhaForte`, `MARCA.sombra`, `MARCA.escuro`.
- `comAlfa(cor, a)` e `misturar(a, b, p)` para variar as cores da marca. Nenhuma outra cor.
- `LETRA.titulo` (títulos e letreiros, peso 800 a 900), `LETRA.texto` (apoio e rótulos), `LETRA.caixaAlta`, `comoTitulo(texto)` (caixa alta quando a letra pede, com acento).

## 5. O apresentador (só leitura)

`useApresentador()` → `{ caixa, dentro, borda, recorte, cheia, rosto, cabeca, baseDaGravacao }`, no quadro atual, em px do quadro:
- `rosto: { x, y, queixo, caixa }`: NENHUM texto, cartão ou objeto pode cobrir `rosto.caixa`.
- `cabeca: { x, topo }` (só com recorte): para pôr a palavra grande ATRÁS da cabeça. A regra que funcionou na aula 8.2: a base das letras uns 60 px abaixo de `cabeca.topo`, para a cabeça cobrir o pé das letras do meio e a palavra continuar legível.
- `caixa`: a janela agora (para os elementos à frente da borda, aula 8.2: "pequenos destaques à frente da moldura").
- `cruzam(a, b)` diz se duas caixas se cruzam.
- `useAreaLivre(margem?)` → `{ x, y, l, a }`: o maior retângulo do quadro que NÃO cruza a janela (o lado mais largo; com a janela na largura toda, a faixa de cima ou de baixo). Com a janela fora da tela cheia (sobretudo no 16:9 do completo), TODO título, letreiro e cartão vai dentro da área livre: centrado nela, nunca centrado no quadro. Texto que cruza a moldura da pessoa reprova a revisão.

## 6. Peças de texto e traço

- `<Letreiro texto t inicio cor tamanho largura familia? peso? espacamentoEm? atraso? duracao? mascaraHorizontal? />`: construção por letras (cada letra com atraso curto). `tamanho` é o tamanho pedido e `largura` o espaço que a palavra pode ocupar (até a borda menos a margem): o letreiro ENCOLHE até caber e nunca sai do quadro. `mascaraHorizontal`: revelada da esquerda para a direita (aula 8.2, ATENÇÃO). Ponha dentro de um `<div>` com a fonte e o peso.
- `<TituloQueCabe texto largura maximo cor peso? alinhar? espacamentoEm? style? />`: um título que ENCOLHE até caber (texto cortado na borda reprova a revisão); se numa linha ficaria com menos de 60% do `maximo`, vai em duas linhas equilibradas. `maximo` de 90 para cima. Por cima da gravação em tela cheia, ponha o título numa caixa com fundo `comAlfa(MARCA.fundo, 0.78)`. `useTamanhoQueCabe(texto, largura, maximo, opcoes?)` devolve o tamanho para quem monta o próprio bloco.
- `<Cartao t inicio titulo apoio? icone? x|direita y largura? lado? ativo? saida? tamanho? />`: cartão de borda fina e cantos arredondados (aula 7) que entra com deslocamento curto e o ícone se desenhando; `ativo` 0 a 1 destaca o explicado e tira ênfase dos outros; `saida` (segundos) tira o cartão; com `largura`, o título encolhe até caber nela.
- `<Icone nome tamanho? cor? espessura? progresso? />`: ícones de traço que se desenham (`progresso` 0 a 1). Nomes: caixa, notebook, celular, calendario, check, lista, pessoa, pessoas, casa, coracao, grafico, alvo, lampada, relogio, estrela, seta, cursor, conversa, poltrona, livro, ferramenta, foguete, escudo, lupa, engrenagem, bandeira, chave, cadeado, mundo, megafone, etiqueta, predio, berco, tenda, corda, estaca, plataforma, mao, mais, menos, xis. Outro ícone: desenhe com `<svg viewBox="0 0 24 24">` e `<path>` com `pathLength={1}`, `strokeDasharray="1 1"` e `strokeDashoffset={1 - p}`.
- `<Traco d progresso cor? espessura? />`: um caminho SVG em px do quadro que se desenha (sublinhado, seta, contorno). `<LinhaEntre de ate progresso seta? curva? />`: linha entre dois pontos.

## 7. O 3D (aula 8.1)

```tsx
import * as THREE from "three";
import { Cena3D, LuzesDaMarca, ChaoDaMarca, COR_3D, useDescartar, type ChaveDeCamera, type Rotulo3D } from "../kit";

const chaves: ChaveDeCamera[] = [
  { em: de, pos: [0.5, 10.5, 1.5], alvo: [0, 0, 0] },
  { em: dito("constrói"), pos: [6, 4.4, 7.2], alvo: [0, 0.9, 0] },
];
<Cena3D x={0} y={0} largura={1080} altura={1120} chaves={chaves} rotulos={rotulos}>
  <LuzesDaMarca destaque={une} />
  <ChaoDaMarca />
  <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
    <boxGeometry args={[2, 1, 1.4]} />
    <meshStandardMaterial color={COR_3D.superficie} roughness={0.8} />
  </mesh>
</Cena3D>
```

- `<Cena3D x y largura altura chaves rotulos? opacidade? sombras?>`: o `ThreeCanvas` numa área do quadro. A câmera anda pelas `chaves` (`{em, pos, alvo, fov?}`, `em` em segundos, em ordem) com curva suave e assentamento perto de cada chave: as "pausas curtas nas posições principais". Sem giro completo, sem atravessar a geometria.
- `rotulos`: `{ texto, ponto: [x, y, z], visivel, ativo?, lado? }`. O kit projeta o ponto pela MESMA câmera e desenha a caixa do rótulo com a linha de chamada até o objeto; rótulos não se sobrepõem. `lado`: "direita" (margem direita, padrão), "esquerda" ou "acima".
- `<LuzesDaMarca destaque? alvo? />` (céu no título, chão no fundo, uma luz com sombra e um realce no destaque) e `<ChaoDaMarca raio? grade? />`.
- `COR_3D.superficie`, `superficieEscura`, `destaque`, `fundo`, `metal`, `linha`: as cores do 3D, todas da marca.
- `cameraEm(t, chaves)` e `projetar(t, chaves, ponto, largura, altura)` → `{x, y}` em px do canvas, para prender um elemento HTML a um objeto.
- Geometria criada com `useMemo` (Shape, ExtrudeGeometry, TubeGeometry, BufferGeometry) passa por `useDescartar(geo)`.
- Explodir em camadas: a mesma geometria em `<group position={[0, elevacao * abre, 0]}>`, com `abre` 0 → 1 → 0 pela fala; a base fica alinhada e a reconstrução acontece NA TELA, sem corte.
- Dentro do `Cena3D` só malha, grupo, luz e material; texto e rótulo ficam fora (os `rotulos`).
- Sem GPU no servidor: até ~40 malhas, uma luz com sombra, sem pós-processamento. Nada de modelo externo, textura ou imagem.
- O chão do kit (`ChaoDaMarca`) fica 2 cm abaixo de y = 0: a base da maquete fica em y = 0 ou acima. Duas superfícies no mesmo plano "brigam" (aparece uma escada preta): desloque 1 a 2 cm. Material transparente (`transparent`) não lança sombra: `castShadow` só no opaco.

## 7b. Os gráficos (aula 6)

```tsx
import { PainelDeDado, GraficoDeLinha, GraficoDeBarras, Contador, Etiqueta, formatarNumero } from "../kit";

<PainelDeDado x={60} y={96} largura={960} altura={600} visivel={v.visivel}>
  <Contador t={t} ate={83} inicio={dito("oitenta e três mil")} fim={ditoAte("mil")} prefixo="US$ " texto="US$ 83 MIL" />
  <GraficoDeLinha largura={920} altura={320} pontos={[0.2, 0.35, 0.3, 0.6, 0.9]} progresso={desenho} suave nivel={{ valor: 0.62, progresso: nivel }} />
  <Etiqueta texto="ILUSTRAÇÃO" cor="apoio" />
</PainelDeDado>
```

- `<PainelDeDado x y largura altura visivel? style?>`: o painel do gráfico (degradê do painel da marca, cantos de 36 px, borda fina, sombra), com entrada por `visivel` (0 a 1). Os filhos se posicionam em px DENTRO do painel.
- `<GraficoDeLinha largura altura pontos progresso nivel? rotuloDaPonta? grade? suave? margem? />`: a linha no destaque da marca com a área em degradê, desenhada da esquerda para a direita por `progresso` (0 a 1), com o ponto brilhando na ponta. `pontos` de 0 (baixo) a 1 (alto) é DESENHO, não dado. `nivel: { valor, rotulo?, progresso }` é a linha tracejada de um patamar; `rotuloDaPonta` sai da ponta quando a linha chega (texto da fala).
- `<GraficoDeBarras largura altura barras t margem? />`: barras `{ rotulo, valor (0 a 1, desenho), inicio (o dito() de cada uma), destaque? }` que crescem uma a uma, o rótulo embaixo.
- `<Contador t ate inicio fim casas? prefixo? sufixo? texto? style? />`: conta de 0 até `ate` (o número DITO) entre `inicio` e `fim`; com `texto`, termina mostrando o texto (ex.: "US$ 83 MIL"). Número que não foi dito, nunca.
- `<Etiqueta texto cor? tamanho? style? />`: a etiqueta pequena (`cor`: "destaque", "titulo" ou "apoio", esta com borda e sem fundo, para o aviso "ILUSTRAÇÃO").
- `formatarNumero(n, casas?)`: o número como se escreve no Brasil (83.000; 1,5).
- A curva é ilustração: sem eixo com valor e sem data inventada. Quando o painel mostra uma curva, leve `<Etiqueta texto="ILUSTRAÇÃO" cor="apoio" />`.

## 8. O que o portão recusa (a cena volta para você corrigir)

`useFrame`, `@keyframes`, `animation` e `transition` de CSS, `Math.random`, `Date`, `setTimeout`/`setInterval`/`requestAnimationFrame`, `fetch` e qualquer rede, `import()` e `require`, `window`/`document`/`globalThis`/`navigator`/`process`, `eval`/`Function`/`constructor`/`Proxy`, `useState`/`useEffect`/`useRef`/`useLayoutEffect` (a cena é função do quadro; use `useMemo` para o que é caro), `async`/`await`/`Promise`, `staticFile` e qualquer mídia (`Video`, `Audio`, `Img`, `OffthreadVideo`: a pessoa e a voz já estão no palco), `delayRender`, `dangerouslySetInnerHTML`, `<style>`, `<img>`, endereço de rede em texto, travessão (— ou –) em qualquer texto, `dito()` com frase que não está na fala, número na tela que não foi dito, e import fora da lista. Depois do portão vêm o `tsc` (TypeScript estrito), o bundle e um render de conferência.

## 9. O quadro deitado (16:9, o vídeo completo)

Quando o pedido diz "O QUADRO: DEITADO, 1920 × 1080", tudo vale igual, mas a composição é a do vídeo para o YouTube:

- Todo px é do quadro 1920 × 1080. Use `LARGURA` e `ALTURA` do kit para o que ocupa a largura toda; nunca copie os números dos exemplos (eles são do quadro em pé).
- A pessoa fica num LADO e a explicação no outro, nunca uma por cima da outra. Tela cheia: a gravação já é deitada e cobre o quadro sem corte (escala 1); o rosto fica no terço da gravação. O espaço livre de cada lado da cabeça é onde o motion entra.
- Maquete 3D (8.1): a moldura chanfrada vai para a esquerda, cerca de 40% da largura e 80% da altura (ex.: `{"x": 70, "y": 110, "l": 760, "a": 860}`), e o `Cena3D` ocupa a direita (ex.: `x 860, y 60, largura 1000, altura 900`).
- Gráficos (aula 6): o apresentador numa janela à esquerda ou à direita (ex.: `{"x": 1060, "y": 140, "l": 800, "a": 800}`), e o `PainelDeDado` do outro lado (ex.: `x 70, y 120, largura 920, altura 760`). Uma inserção por vez, como no vertical.
- Recorte com letreiro (8.2): a pessoa recortada no meio ou num terço, escala 1 (os números vêm prontos em `geometria.recorte.comEscala100`); a palavra grande atrás da cabeça cabe na largura toda (`TituloQueCabe` com `largura` até 1700); moldura assimétrica larga e baixa, cabeça por fora.
- Moldura explicativa (aula 7): a moldura arredondada num canto, cerca de 45% da largura; os cartões em coluna do outro lado.
- Legenda: a faixa embaixo, centralizada sob a pessoa ou no lado livre, até duas linhas, terminando acima de y = 1035 e sem cobrir a maquete, o painel nem o rosto (ex.: `{"topo": 900, "esquerda": 360, "largura": 1200, "tamanho": 44}`).
- Tamanhos: título de 90 px ou mais continua valendo; texto de apoio de 36 px ou mais. A margem das bordas é de 40 px.

O completo é editado em blocos de cerca de um minuto, emendados um atrás do outro. Cada bloco é um corte como os outros, com a fala no tempo do bloco; o pedido diz como o bloco anterior terminou (CONTINUIDADE). O primeiro quadro do apresentador repete o último do bloco anterior, a legenda segue na mesma faixa, e nenhuma cena termina pela metade no fim do bloco.
