// Parte do motor: fotos e objetos que entram no ritmo da fala ("ela fala 'mel' e o pote aparece").
//
// O scripts/imagens.mjs busca, baixa e grava a escolha em `plano.imagens`; aqui ficam as peças
// que os modelos usam para mostrar:
//   <Foto>       foto enquadrada pelo ponto de foco, com aproximação lenta (Ken Burns) e entrada no tempo
//   <Recorte>    PNG transparente (objeto 3D, recorte do aluno) que entra como adesivo
//   <SemImagem>  o cartão tipográfico de quando não há imagem boa (nunca fica um buraco)
// O visual (borda, sombra, cantos, cores, fonte) é de cada modelo, por props: estas peças só
// cuidam do enquadramento, do movimento e do tempo.
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// ---------- tipos ----------

// ponto de foco em frações da imagem inteira (0,0 = canto de cima à esquerda)
export type Foco = { x: number; y: number };

// o que o imagens.mjs grava em `plano.imagens[id]`
export type ImagemEscolhida = {
  // caminho dentro de public/: "img/mel.jpg"
  arquivo?: string;
  largura?: number;
  altura?: number;
  foco?: Foco;
  transparente?: boolean;
  // true = nenhuma imagem boa: o modelo desenha o cartão
  sem?: boolean;
  // a palavra dita (o cartão usa)
  palavra?: string;
};
export type ImagensDoPlano = Record<string, ImagemEscolhida>;

export type Efeito = "aproximar" | "afastar" | "panoramica" | "parado";
export type Direcao = "esquerda" | "direita" | "cima" | "baixo";
export type EntradaFoto = "corte" | "fade" | "subir" | "escala" | "revelar";
export type SaidaFoto = "corte" | "fade" | "escala";
export type EntradaRecorte = "escala" | "salto" | "cair" | "subir" | "corte";

// o campo que um momento do plano usa para pedir uma imagem: `imagem: { id: "mel", efeito: "aproximar" }`
export type ImagemNoMomento = { id: string; foco?: Foco; efeito?: Efeito };

// a imagem pronta para as peças: o que veio do plano mais o id
export type Imagem = ImagemEscolhida & { id?: string };

// ---------- funções ----------

const limitar = (v: number, a: number, b: number) => Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b));
export const suaveEntrada = Easing.bezier(0.16, 1, 0.3, 1);
const progresso = (t: number, inicio: number, dur: number, easing: (n: number) => number = suaveEntrada) =>
  dur <= 0 ? (t >= inicio ? 1 : 0) : interpolate(t, [inicio, inicio + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Acha a imagem de um momento no plano: `imagemDoPlano(plano, momento.imagem)` ou `imagemDoPlano(plano, "mel")`.
// Devolve null quando o id não está no plano (rode `node scripts/imagens.mjs --escolher ...`).
// O `foco` do momento, se houver, vale por cima do foco escolhido.
export const imagemDoPlano = (plano: { imagens?: ImagensDoPlano }, ref: string | ImagemNoMomento | undefined | null): Imagem | null => {
  if (!ref) return null;
  const id = typeof ref === "string" ? ref : ref.id;
  const achada = plano.imagens?.[id];
  if (!achada) return null;
  const foco = typeof ref === "string" ? undefined : ref.foco;
  return { ...achada, id, ...(foco ? { foco } : {}) };
};

// true quando há um arquivo para mostrar
export const temImagem = (img: Imagem | null | undefined): img is Imagem & { arquivo: string } => !!img && !img.sem && !!img.arquivo;

// Onde a foto fica dentro de uma caixa `W`×`H` (px) em "cover", com o foco o mais perto possível
// do centro sem deixar borda vazia. Devolve o retângulo da imagem e onde o foco caiu (px na caixa).
export const enquadrarFoto = (W: number, H: number, iw: number, ih: number, foco: Foco = { x: 0.5, y: 0.5 }) => {
  const s = Math.max(W / iw, H / ih);
  const w = iw * s;
  const h = ih * s;
  const x = limitar(W / 2 - foco.x * w, W - w, 0);
  const y = limitar(H / 2 - foco.y * h, H - h, 0);
  return { x, y, w, h, escala: s, focoX: x + foco.x * w, focoY: y + foco.y * h };
};

// O movimento lento dentro da caixa, em unidades da caixa (1 = largura/altura da caixa).
// `p` vai de 0 a 1 ao longo do tempo da foto. `ox`,`oy`: o ponto que fica parado no zoom (o foco).
// `ret`: o retângulo da imagem na caixa (esquerda, direita, topo, base), para nunca mostrar borda.
export const kenBurns = (
  efeito: Efeito,
  p: number,
  intensidade: number,
  direcao: Direcao,
  ox: number,
  oy: number,
  ret: { e: number; d: number; t: number; b: number } = { e: 0, d: 1, t: 0, b: 1 },
) => {
  const i = Math.max(0, intensidade);
  if (efeito === "parado") return { z: 1, tx: 0, ty: 0 };
  if (efeito === "aproximar") return { z: 1 + i * p, tx: 0, ty: 0 };
  if (efeito === "afastar") return { z: 1 + i * (1 - p), tx: 0, ty: 0 };
  // panorâmica: aproxima um pouco para ter folga e desliza dentro da folga
  const z = 1 + Math.max(i, 0.06);
  const horizontal = direcao === "esquerda" || direcao === "direita";
  const [o, a, b] = horizontal ? [ox, ret.e, ret.d] : [oy, ret.t, ret.b];
  // limites do deslocamento para a imagem continuar cobrindo a caixa
  const min = 1 - o - (b - o) * z;
  const max = -o - (a - o) * z;
  const curso = Math.min(Math.max(0, max - min), i * 1.4);
  const centro = limitar(0, min + curso / 2, max - curso / 2);
  // "direita" = a câmera anda para a direita (a imagem anda para a esquerda)
  const ida = direcao === "direita" || direcao === "baixo";
  const d = ida ? centro + curso / 2 - curso * p : centro - curso / 2 + curso * p;
  return horizontal ? { z, tx: d, ty: 0 } : { z, tx: 0, ty: d };
};

// Opacidade e transformação da entrada e da saída (para modelos que montam a própria moldura).
export const entradaSaida = (
  t: number,
  de: number,
  ate: number | undefined,
  entrada: EntradaFoto,
  durEntrada: number,
  saida: SaidaFoto,
  durSaida: number,
) => {
  const pe = entrada === "corte" ? (t >= de ? 1 : 0) : progresso(t, de, durEntrada);
  const ps = ate === undefined || saida === "corte" ? 0 : progresso(t, ate - durSaida, durSaida, Easing.in(Easing.cubic));
  let opacidade = 1;
  let transform = "";
  let clipPath: string | undefined;
  if (entrada === "fade") opacidade *= pe;
  if (entrada === "subir") {
    opacidade *= pe;
    transform += ` translateY(${(1 - pe) * 8}%)`;
  }
  if (entrada === "escala") {
    opacidade *= pe;
    transform += ` scale(${0.92 + 0.08 * pe})`;
  }
  if (entrada === "revelar") clipPath = `inset(0 ${(1 - pe) * 100}% 0 0)`;
  if (saida === "fade") opacidade *= 1 - ps;
  if (saida === "escala") {
    opacidade *= 1 - ps;
    transform += ` scale(${1 - 0.06 * ps})`;
  }
  return { opacidade, transform: transform.trim() || undefined, clipPath, entrou: pe };
};

const useRelogio = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, agora: frame / fps };
};

// ---------- <SemImagem>: o cartão tipográfico ----------

// quebra em até 3 linhas equilibradas e acha o maior corpo que cabe
const caberTexto = (texto: string, W: number, H: number, larguraDaLetra = 0.58, entrelinha = 1.08) => {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  let melhor = { linhas: [texto], corpo: 10 };
  for (let n = 1; n <= Math.min(3, Math.max(1, palavras.length)); n++) {
    // quebra gulosa com alvo de caracteres por linha
    const alvo = Math.ceil(texto.length / n);
    const linhas: string[] = [];
    let atual = "";
    for (const p of palavras) {
      if (atual && (atual + " " + p).length > alvo && linhas.length < n - 1) {
        linhas.push(atual);
        atual = p;
      } else atual = atual ? `${atual} ${p}` : p;
    }
    if (atual) linhas.push(atual);
    // "de", "e", "da" sozinhos numa linha ficam estranhos: juntam com a linha de baixo
    for (let k = linhas.length - 2; k >= 0; k--)
      if (linhas[k].length <= 3) {
        linhas[k + 1] = `${linhas[k]} ${linhas[k + 1]}`;
        linhas.splice(k, 1);
      }
    if (linhas.length > 1 && linhas[linhas.length - 1].length <= 3) linhas.splice(-2, 2, `${linhas[linhas.length - 2]} ${linhas[linhas.length - 1]}`);
    const maior = Math.max(...linhas.map((l) => l.length), 1);
    const corpo = Math.min((W * 0.84) / (maior * larguraDaLetra), (H * 0.74) / (linhas.length * entrelinha), H * 0.34);
    if (corpo > melhor.corpo) melhor = { linhas, corpo };
  }
  return melhor;
};

export type PropsSemImagem = {
  texto: string;
  largura: number;
  altura: number;
  de?: number;
  ate?: number;
  entrada?: EntradaFoto;
  durEntrada?: number;
  saida?: SaidaFoto;
  durSaida?: number;
  // visual do modelo
  fundo?: string;
  cor?: string;
  fonte?: string;
  peso?: number;
  // texto pequeno acima da palavra (ex.: "imagine:")
  rotulo?: string;
  // true = etiqueta laranja "sem imagem · id", para as guias de conferência (nunca no vídeo final)
  aviso?: boolean;
  id?: string;
  style?: React.CSSProperties;
  t?: number;
};

export const SemImagem: React.FC<PropsSemImagem> = ({
  texto,
  largura,
  altura,
  de = 0,
  ate,
  entrada = "fade",
  durEntrada = 0.3,
  saida = "corte",
  durSaida = 0.25,
  fundo = "#161616",
  cor = "#F4F1EA",
  fonte = "inherit",
  peso = 800,
  rotulo,
  aviso = false,
  id,
  style,
  t,
}) => {
  const { agora } = useRelogio();
  const tempo = t ?? agora;
  if (tempo < de || (ate !== undefined && tempo > ate)) return null;
  const { linhas, corpo } = caberTexto(texto || "?", largura, altura * (rotulo ? 0.8 : 1));
  const es = entradaSaida(tempo, de, ate, entrada, durEntrada, saida, durSaida);
  // a palavra cresce de leve enquanto está na tela: o cartão nunca fica parado
  const vida = ate !== undefined ? Math.min(1, (tempo - de) / Math.max(0.5, ate - de)) : Math.min(1, (tempo - de) / 4);
  return (
    <div
      style={{
        position: "relative",
        width: largura,
        height: altura,
        overflow: "hidden",
        background: fundo,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: es.opacidade,
        transform: es.transform,
        clipPath: es.clipPath,
        ...style,
      }}
    >
      {rotulo ? (
        <div style={{ fontFamily: fonte, color: cor, opacity: 0.7, fontSize: Math.max(18, corpo * 0.28), fontWeight: 600, marginBottom: corpo * 0.12 }}>{rotulo}</div>
      ) : null}
      <div style={{ transform: `scale(${1 + 0.04 * vida})`, textAlign: "center" }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: fonte, fontWeight: peso, fontSize: corpo, lineHeight: 1.08, color: cor, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
      {aviso ? (
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            background: "#FF8A00",
            color: "#000",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: 800,
            fontSize: 22,
            padding: "3px 8px",
          }}
        >
          sem imagem{id ? ` · ${id}` : ""}
        </div>
      ) : null}
    </div>
  );
};

// ---------- <Foto> ----------

export type PropsFoto = {
  // a imagem do plano (imagemDoPlano) ou um caminho dentro de public/ ("img/mel.jpg")
  imagem?: Imagem | null;
  src?: string;
  // por cima do foco gravado
  foco?: Foco;
  // tempo em que a foto entra e sai (segundos, no mesmo relógio do componente; veja `t`)
  de?: number;
  ate?: number;
  // movimento lento: "aproximar" (padrão), "afastar", "panoramica" ou "parado"
  efeito?: Efeito;
  // quanto o movimento anda no tempo da foto: 0,1 = 10% de zoom
  intensidade?: number;
  // panorâmica: para onde a câmera anda
  direcao?: Direcao;
  entrada?: EntradaFoto;
  durEntrada?: number;
  saida?: SaidaFoto;
  durSaida?: number;
  // tamanho da caixa em px. Com os dois, o foco fica centrado de verdade; sem eles a foto
  // preenche o pai (100%) e o foco fica visível, mas não necessariamente no centro.
  largura?: number;
  altura?: number;
  // visual do modelo: borda, sombra, raio, posição…
  style?: React.CSSProperties;
  // na própria imagem (ex.: filter para casar a cor com o modelo)
  estiloDaImagem?: React.CSSProperties;
  // quando não há imagem: cartão com a palavra (padrão) ou o que o modelo quiser
  semImagem?: React.ReactNode;
  // props do cartão padrão (cores e fonte do modelo)
  cartao?: Partial<PropsSemImagem>;
  // tempo atual em segundos; sem isto, usa o quadro atual (dentro de <Sequence>, o tempo da Sequence)
  t?: number;
  // segundos antes de `de` em que a imagem já fica montada (invisível), para carregar sem piscar
  antes?: number;
};

export const Foto: React.FC<PropsFoto> = ({
  imagem,
  src,
  foco,
  de = 0,
  ate,
  efeito = "aproximar",
  intensidade = 0.1,
  direcao = "direita",
  entrada = "corte",
  durEntrada = 0.35,
  saida = "corte",
  durSaida = 0.25,
  largura,
  altura,
  style,
  estiloDaImagem,
  semImagem,
  cartao,
  t,
  antes = 0.5,
}) => {
  const { agora } = useRelogio();
  // sem tamanho, o cartão de "sem imagem" ocupa a composição inteira (vertical ou 16:9)
  const { width, height } = useVideoConfig();
  const tempo = t ?? agora;
  if (tempo < de - antes || (ate !== undefined && tempo > ate)) return null;
  const arquivo = src ?? (temImagem(imagem) ? imagem.arquivo : undefined);

  if (!arquivo) {
    if (tempo < de) return null;
    if (semImagem !== undefined) return <>{semImagem}</>;
    return (
      <SemImagem
        texto={imagem?.palavra ?? imagem?.id ?? ""}
        largura={largura ?? width}
        altura={altura ?? height}
        de={de}
        ate={ate}
        entrada={entrada}
        durEntrada={durEntrada}
        saida={saida}
        durSaida={durSaida}
        id={imagem?.id}
        style={style}
        t={tempo}
        {...cartao}
      />
    );
  }

  const f = foco ?? imagem?.foco ?? { x: 0.5, y: 0.5 };
  const iw = imagem?.largura;
  const ih = imagem?.altura;
  const exato = !!(largura && altura && iw && ih);
  const dur = ate !== undefined ? Math.max(0.1, ate - de) : 4;
  const p = limitar((tempo - de) / dur, 0, 1);
  const es = entradaSaida(tempo, de, ate, entrada, durEntrada, saida, durSaida);
  const visivel = tempo >= de;

  let estiloImg: React.CSSProperties;
  if (exato) {
    const W = largura as number;
    const H = altura as number;
    const q = enquadrarFoto(W, H, iw as number, ih as number, f);
    const kb = kenBurns(efeito, p, intensidade, direcao, q.focoX / W, q.focoY / H, {
      e: q.x / W,
      d: (q.x + q.w) / W,
      t: q.y / H,
      b: (q.y + q.h) / H,
    });
    estiloImg = {
      position: "absolute",
      left: q.x,
      top: q.y,
      width: q.w,
      height: q.h,
      maxWidth: "none",
      transformOrigin: `${q.focoX - q.x}px ${q.focoY - q.y}px`,
      transform: `translate(${kb.tx * W}px, ${kb.ty * H}px) scale(${kb.z})`,
    };
  } else {
    // sem o tamanho da caixa: objectPosition no foco deixa o foco no mesmo lugar relativo da caixa
    const kb = kenBurns(efeito, p, intensidade, direcao, f.x, f.y);
    estiloImg = {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: `${f.x * 100}% ${f.y * 100}%`,
      transformOrigin: `${f.x * 100}% ${f.y * 100}%`,
      transform: `translate(${kb.tx * 100}%, ${kb.ty * 100}%) scale(${kb.z})`,
    };
  }

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        width: largura ?? "100%",
        height: altura ?? "100%",
        opacity: visivel ? es.opacidade : 0,
        transform: es.transform,
        clipPath: es.clipPath,
        ...style,
      }}
    >
      <Img src={staticFile(arquivo)} style={{ ...estiloImg, ...estiloDaImagem }} />
    </div>
  );
};

// ---------- <Recorte>: objeto com fundo transparente, como adesivo ----------

export type PropsRecorte = {
  imagem?: Imagem | null;
  src?: string;
  de?: number;
  ate?: number;
  // largura do adesivo em px (a altura segue a proporção da imagem)
  largura?: number;
  // "escala" (padrão, sem quicar), "salto" (mola com um leve passar do ponto), "cair", "subir", "corte"
  entrada?: EntradaRecorte;
  durEntrada?: number;
  saida?: SaidaFoto;
  durSaida?: number;
  // balanço lento enquanto está na tela (o adesivo nunca fica parado); false desliga
  flutuar?: boolean;
  // inclinação de repouso, em graus
  giro?: number;
  // filtro de sombra (CSS drop-shadow); false tira
  sombra?: string | false;
  style?: React.CSSProperties;
  estiloDaImagem?: React.CSSProperties;
  // quando não há imagem: o que o modelo quiser (padrão: nada; o modelo decide se mostra um cartão)
  semImagem?: React.ReactNode;
  t?: number;
  antes?: number;
};

export const Recorte: React.FC<PropsRecorte> = ({
  imagem,
  src,
  de = 0,
  ate,
  largura = 360,
  entrada = "escala",
  durEntrada = 0.45,
  saida = "escala",
  durSaida = 0.22,
  flutuar = true,
  giro = 0,
  sombra = "drop-shadow(0 18px 28px rgba(0,0,0,0.35))",
  style,
  estiloDaImagem,
  semImagem = null,
  t,
  antes = 0.5,
}) => {
  const { fps, agora } = useRelogio();
  const tempo = t ?? agora;
  if (tempo < de - antes || (ate !== undefined && tempo > ate)) return null;
  const arquivo = src ?? (temImagem(imagem) ? imagem.arquivo : undefined);
  if (!arquivo) return tempo >= de ? <>{semImagem}</> : null;

  const proporcao = imagem?.largura && imagem?.altura ? imagem.altura / imagem.largura : 1;
  const altura = largura * proporcao;
  const desde = tempo - de;

  let escala = 1;
  let dy = 0;
  let rot = giro;
  let opacidade = 1;
  if (entrada === "escala") {
    const pe = progresso(tempo, de, durEntrada);
    escala = 0.55 + 0.45 * pe;
    opacidade = Math.min(1, pe * 2.5);
  } else if (entrada === "salto") {
    const s = spring({ frame: Math.round(desde * fps), fps, config: { damping: 13, stiffness: 170, mass: 0.8 } });
    escala = Math.max(0, s);
    opacidade = Math.min(1, s * 3);
  } else if (entrada === "cair") {
    const pe = progresso(tempo, de, durEntrada, Easing.bezier(0.3, 0.9, 0.35, 1));
    dy = -(1 - pe) * altura * 0.9;
    rot = giro - 10 * (1 - pe);
    opacidade = Math.min(1, pe * 3);
  } else if (entrada === "subir") {
    const pe = progresso(tempo, de, durEntrada);
    dy = (1 - pe) * altura * 0.35;
    opacidade = pe;
  } else if (desde < 0) opacidade = 0;

  if (ate !== undefined && saida !== "corte") {
    const ps = progresso(tempo, ate - durSaida, durSaida, Easing.in(Easing.cubic));
    opacidade *= 1 - ps;
    if (saida === "escala") escala *= 1 - 0.35 * ps;
  }
  if (flutuar && desde > 0) {
    dy += Math.sin((desde / 3.2) * Math.PI * 2) * largura * 0.018;
    rot += Math.sin((desde / 4.1) * Math.PI * 2) * 1.6;
  }
  if (desde < 0) opacidade = 0;

  return (
    <div style={{ position: "relative", width: largura, height: altura, ...style }}>
      <Img
        src={staticFile(arquivo)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: opacidade,
          transform: `translateY(${dy}px) rotate(${rot}deg) scale(${escala})`,
          filter: sombra || undefined,
          ...estiloDaImagem,
        }}
      />
    </div>
  );
};
