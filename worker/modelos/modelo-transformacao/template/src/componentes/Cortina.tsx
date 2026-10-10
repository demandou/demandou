// A assinatura do Transformação: a foto grande com a cortina ANTES | DEPOIS.
// - As duas fotos ficam alinhadas sob a mesma câmera; a cortina corta a de cima na posição da alça.
// - A alça anda com a fala: em cada dica a câmera aproxima a área (marcador numerado), a área aparece
//   no antes e a alça varre para o depois enquanto a dica é dita.
// - Na revelação (`janelaEm`) a foto toma a tela inteira e a pessoa vai para a janela.
import { Img, staticFile } from "remotion";
import { prog, rapido, salto, suave, temposDoTexto, usePalavras } from "../anim";
import { COSTURA } from "../layout";
import { encaixar, larguraTexto } from "../medida";
import { imagemDoPlano, SemImagem, temImagem, type Foco, type Imagem } from "../motor/imagem";
import type { AntesDepois, Marcador, Plano } from "../plano";
import { cor, fonte, sombraCartao, sombraLeve } from "../tema";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const W = 1080;

type Quadro = { t: number; v: number; dur: number };

// valor que anda de quadro-chave em quadro-chave (cada um parte de onde o anterior estava)
const encadear = (t: number, inicial: number, chaves: Quadro[]) => {
  let v = inicial;
  for (const k of [...chaves].sort((a, b) => a.t - b.t)) {
    if (t < k.t) break;
    v = v + (k.v - v) * suave(clamp((t - k.t) / k.dur, 0, 1));
  }
  return v;
};

// instantes em que o texto de cada marcador é dito (a alça varre entre o primeiro e o último)
export const temposDosMarcadores = (m: AntesDepois, palavras: { em: number; ate: number; w: string }[]) => {
  const ms = [...(m.marcadores ?? [])].sort((a, b) => a.em - b.em);
  return ms.map((mk, i) => {
    const limite = ms[i + 1]?.em ?? m.janelaEm ?? m.ate;
    const ts = temposDoTexto(mk.texto, mk.em, palavras, limite);
    const ini = Math.max(mk.em + 0.35, ts[0] ?? mk.em);
    const fimFala = Math.max(ini + 0.7, (ts[ts.length - 1] ?? ini) + 0.3);
    return { mk, ts, varre: ini, varreAte: Math.min(fimFala, limite - 0.1) };
  });
};

// posição da alça: 0 = só o antes, 1 = só o depois
export const posicaoDaAlca = (m: AntesDepois, t: number, palavras: { em: number; ate: number; w: string }[]) => {
  const chaves: Quadro[] = [];
  const primeira = [...(m.alca ?? [])].sort((a, b) => a.em - b.em)[0];
  const inicial = primeira && primeira.em <= m.de + 0.05 ? primeira.pos : 0.5;
  for (const a of m.alca ?? []) chaves.push({ t: a.em, v: clamp(a.pos, 0, 1), dur: 0.6 });
  for (const x of temposDosMarcadores(m, palavras)) {
    chaves.push({ t: x.mk.em, v: 0, dur: 0.45 });
    chaves.push({ t: x.varre, v: 1, dur: Math.max(0.6, x.varreAte - x.varre) });
  }
  return encadear(t, inicial, chaves);
};

// a câmera sobre a foto: foco (frações da foto) e zoom
const cameraNoTempo = (m: AntesDepois, t: number) => {
  const ms = m.marcadores ?? [];
  const fx: Quadro[] = [];
  const fy: Quadro[] = [];
  const z: Quadro[] = [];
  const ir = (em: number, f: Foco, zoom: number, dur = 0.75) => {
    fx.push({ t: em, v: f.x, dur });
    fy.push({ t: em, v: f.y, dur });
    z.push({ t: em, v: zoom, dur });
  };
  for (const mk of ms) ir(mk.em, mk.foco, clamp(mk.zoom ?? 2, 1, 3.2));
  if (m.janelaEm !== undefined) ir(m.janelaEm, { x: 0.5, y: 0.5 }, 1, 0.6);
  const ultimo = Math.max(m.de, ...[...ms.map((x) => x.em), m.janelaEm ?? -1].filter((x) => x <= t));
  // um leve avanço contínuo: a foto nunca fica parada
  const deriva = 1 + 0.035 * clamp((t - ultimo) / 3.5, 0, 1);
  return { x: encadear(t, 0.5, fx), y: encadear(t, 0.45, fy), z: encadear(t, 1, z) * deriva };
};

type Enq = { left: number; top: number; w: number; h: number };

const enquadrar = (img: Imagem, H: number, cam: { x: number; y: number; z: number }, ty: number): Enq => {
  const iw = img.largura ?? 1288;
  const ih = img.altura ?? 1600;
  const s0 = Math.max(W / iw, H / ih);
  const w = iw * s0 * cam.z;
  const h = ih * s0 * cam.z;
  const left = clamp(W / 2 - cam.x * w, W - w, 0);
  const top = clamp(ty - cam.y * h, H - h, 0);
  return { left, top, w, h };
};

const Camada: React.FC<{ img: Imagem | null; H: number; e: Enq | null; reserva: string; fundo: string; t: number; filtro?: string }> = ({
  img,
  H,
  e,
  reserva,
  fundo,
  t,
  filtro,
}) =>
  temImagem(img) && e ? (
    <Img src={staticFile(img.arquivo)} style={{ position: "absolute", left: e.left, top: e.top, width: e.w, height: e.h, filter: filtro }} />
  ) : (
    <SemImagem texto={img?.palavra || reserva} largura={W} altura={H} fundo={fundo} cor={cor.cartao} fonte={fonte} peso={800} t={t} de={-10} />
  );

// o marcador numerado (pino redondo com o número)
export const Disco: React.FC<{ n: number | string; d: number; fundo?: string; tinta?: string; anel?: boolean; style?: React.CSSProperties }> = ({
  n,
  d,
  fundo = cor.depois,
  tinta = cor.cartao,
  anel = true,
  style,
}) => (
  <div
    style={{
      width: d,
      height: d,
      borderRadius: "50%",
      background: fundo,
      color: tinta,
      fontFamily: fonte,
      fontWeight: 800,
      fontSize: d * 0.52,
      lineHeight: `${d}px`,
      textAlign: "center",
      boxShadow: anel ? `0 0 0 ${Math.round(d * 0.07)}px ${cor.cartao}, ${sombraLeve}` : undefined,
      ...style,
    }}
  >
    {n}
  </div>
);

// a alça da cortina: um traço claro de cima a baixo e o puxador com as duas setas
export const Alca: React.FC<{ x: number; altura: number; yPuxador: number; opacidade?: number; d?: number }> = ({ x, altura, yPuxador, opacidade = 1, d = 92 }) => (
  <div style={{ position: "absolute", left: x - 3, top: 0, width: 6, height: altura, opacity: opacidade }}>
    <div style={{ position: "absolute", inset: 0, background: cor.cartao, boxShadow: "0 0 14px rgba(0,0,0,0.35)" }} />
    <div
      style={{
        position: "absolute",
        left: 3 - d / 2,
        top: yPuxador - d / 2,
        width: d,
        height: d,
        borderRadius: "50%",
        background: cor.cartao,
        boxShadow: sombraCartao,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: d * 0.12,
      }}
    >
      <svg width={d * 0.2} height={d * 0.3} viewBox="0 0 10 16">
        <path d="M9 1 L2 8 L9 15" fill="none" stroke={cor.tinta} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg width={d * 0.2} height={d * 0.3} viewBox="0 0 10 16">
        <path d="M1 1 L8 8 L1 15" fill="none" stroke={cor.tinta} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

export const Etiqueta: React.FC<{ texto: string; fundo: string; tam: number; style?: React.CSSProperties }> = ({ texto, fundo, tam, style }) => (
  <div
    style={{
      position: "absolute",
      padding: `${tam * 0.3}px ${tam * 0.62}px`,
      borderRadius: tam * 0.36,
      background: fundo,
      color: cor.cartao,
      fontFamily: fonte,
      fontWeight: 800,
      fontSize: tam,
      letterSpacing: "0.08em",
      lineHeight: 1,
      whiteSpace: "nowrap",
      boxShadow: sombraLeve,
      ...style,
    }}
  >
    {texto.toLocaleUpperCase("pt-BR")}
  </div>
);

// o cartão da dica atual, embaixo da foto: número, texto que se monta na fala e o detalhe
const CartaoDaDica: React.FC<{ t: number; x: ReturnType<typeof temposDosMarcadores>[number]; i: number; n: number; base: number; troca: number; sai: number }> = ({
  t,
  x,
  i,
  n,
  base,
  troca,
  sai,
}) => {
  const { mk, ts } = x;
  const LARG = 1000;
  const PAD = 22;
  const D = 78;
  const largTexto = LARG - PAD * 2 - D - 30;
  const enc = encaixar(mk.texto, { largura: largTexto, max: 52, min: 38, linhas: 2, fonte: { peso: 800 } });
  const det = mk.detalhe ? encaixar(mk.detalhe, { largura: largTexto, max: 34, min: 28, linhas: 1, fonte: { peso: 500 } }) : null;
  const altTexto = enc.linhas.length * enc.tamanho * 1.12 + (det ? det.linhas.length * det.tamanho * 1.25 + 10 : 0);
  const alt = Math.max(D, altTexto) + PAD * 2;
  // o cartão cresce com o texto: largura pelas palavras já ditas, altura pelas linhas
  let kk = 0;
  let dir = 0;
  let linhasVistas = 0;
  enc.linhas.forEach((l, li) => {
    const ws = l.split(" ");
    let fr = 0;
    ws.forEach((_, wi) => {
      const a = prog(t, (ts[kk++] ?? mk.em) - 0.04, 0.2, rapido);
      if (a > 0) {
        const f = { peso: 800 as const };
        const ant = wi ? larguraTexto(ws.slice(0, wi).join(" "), enc.tamanho, f) : 0;
        dir = Math.max(dir, ant + (larguraTexto(ws.slice(0, wi + 1).join(" "), enc.tamanho, f) - ant) * a);
      }
      fr = Math.max(fr, a);
    });
    if (fr > 0) linhasVistas = li + fr;
  });
  const detW = det && t >= (mk.detalheEm ?? (ts[ts.length - 1] ?? mk.em) + 0.4) ? larguraTexto(det.linhas.join(" "), det.tamanho, { peso: 500 }) : 0;
  const cardW = Math.min(LARG, Math.max(PAD * 2 + D + 30 + Math.max(dir, detW) + 70, PAD * 2 + D + 200));
  const cardH = Math.max(D + PAD * 2, Math.max(1, linhasVistas) * enc.tamanho * 1.12 + PAD * 2 + (detW ? det!.linhas.length * det!.tamanho * 1.25 + 10 : 0));
  // o cartão entra uma vez (na primeira dica); depois só o conteúdo troca
  const entra = i === 0 ? prog(t, mk.em, 0.35, rapido) : 1;
  const saiP = prog(t, sai, 0.2);
  // troca de dica: o conteúdo antigo sai antes do novo aparecer (sem dupla exposição)
  const conteudo = prog(t, troca, 0.2, rapido);
  let k = 0;
  const palavrasDoTexto = enc.linhas.map((l) => l.split(" ").map((w) => ({ w, em: ts[k++] ?? mk.em })));
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        top: base - 40 - alt,
        width: cardW,
        height: cardH,
        borderRadius: 30,
        background: cor.cartaoVidro,
        boxShadow: sombraCartao,
        opacity: entra * (1 - saiP),
        transform: entra < 1 || saiP > 0 ? `translateY(${(1 - entra) * 60 + saiP * 40}px)` : undefined,
      }}
    >
      <div style={{ position: "absolute", left: PAD, top: (cardH - D) / 2, opacity: conteudo, transform: conteudo < 1 ? `scale(${0.6 + 0.4 * salto(conteudo)})` : undefined }}>
        <Disco n={i + 1} d={D} anel={false} />
      </div>
      <div style={{ position: "absolute", left: PAD + D + 30, top: (cardH - Math.max(1, linhasVistas) * enc.tamanho * 1.12 - (detW ? det!.linhas.length * det!.tamanho * 1.25 + 10 : 0)) / 2, width: largTexto, opacity: conteudo }}>
        {palavrasDoTexto.map((linha, li) => (
          <div key={li} style={{ fontFamily: fonte, fontWeight: 800, fontSize: enc.tamanho, lineHeight: 1.12, color: cor.tinta, whiteSpace: "nowrap" }}>
            {linha.map((p, pi) => {
              const a = prog(t, p.em - 0.04, 0.16, rapido);
              return (
                <span key={pi} style={{ opacity: a, display: "inline-block", transform: a < 1 ? `translateY(${(1 - a) * 18}px)` : undefined }}>
                  {p.w}
                  {pi < linha.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        ))}
        {det ? (
          <div
            style={{
              marginTop: 10,
              fontFamily: fonte,
              fontWeight: 500,
              fontSize: det.tamanho,
              lineHeight: 1.25,
              color: cor.depois,
              whiteSpace: "nowrap",
              opacity: prog(t, mk.detalheEm ?? (ts[ts.length - 1] ?? mk.em) + 0.4, 0.25),
            }}
          >
            {det.linhas.join(" ")}
          </div>
        ) : null}
      </div>
      {/* em que dica estamos: um ponto por dica */}
      {n > 1 ? (
        <div style={{ position: "absolute", right: 26, top: 22, display: "flex", gap: 8 }}>
          {Array.from({ length: n }, (_, j) => (
            <div key={j} style={{ width: 12, height: 12, borderRadius: 6, background: j <= i ? cor.depois : cor.linha }} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const CortinaAntesDepois: React.FC<{ m: AntesDepois; t: number; plano: Plano; H: number; vem: boolean; vai: boolean }> = ({ m, t, plano, H, vem, vai }) => {
  const palavras = usePalavras();
  const antes = imagemDoPlano(plano, m.antes);
  const depois = imagemDoPlano(plano, m.depois);
  const [rotA, rotD] = m.rotulos ?? ["Antes", "Depois"];
  // 0 = painel (foto em cima), 1 = a foto ocupa a tela inteira
  const j = clamp((H - COSTURA) / (1920 - COSTURA), 0, 1);
  const ty = (120 + H - 250 * (1 - j)) / 2;
  const cam = cameraNoTempo(m, t);
  const eA = temImagem(antes) ? enquadrar(antes, H, cam, ty) : null;
  const eD = temImagem(depois) ? enquadrar(depois, H, cam, ty) : eA;
  const ref = eD ?? eA;
  const pos = posicaoDaAlca(m, t, palavras);
  const X = W * (1 - pos);
  const opAlca = clamp(Math.min(X, W - X) / 70, 0, 1);
  const yPuxador = (150 + H - 260 * (1 - j)) / 2;

  const dicas = temposDosMarcadores(m, palavras);
  const fimDicas = m.janelaEm ?? m.ate;
  let atual = -1;
  dicas.forEach((d, i) => {
    if (t >= d.mk.em) atual = i;
  });

  // entrada cruzando com o momento anterior do painel; saída idem
  const entra = vem ? prog(t, m.de + 0.18, 0.25) : 1;
  const sai = vai ? prog(t, m.ate - 0.02, 0.18) : 0;

  const tamEt = 34 + 12 * j;
  const pino = (mk: Marcador, i: number) => {
    if (!ref || t < mk.em) return null;
    const p = mk.ponto ?? mk.foco;
    const sx = ref.left + p.x * ref.w;
    const limite = j < 0.5 ? COSTURA - 40 - 190 - 50 : 1920;
    const sy = Math.min(ref.top + p.y * ref.h, limite);
    // o pino marca o depois: aparece quando a cortina passa por ele
    const lado = clamp((sx - X - 70) / 60, 0, 1);
    if (lado <= 0) return null;
    const d = 74;
    return (
      <div key={i} style={{ position: "absolute", left: sx - d / 2, top: sy - d / 2, opacity: lado, transform: `scale(${0.5 + 0.5 * salto(lado)})` }}>
        <Disco n={i + 1} d={d} />
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "hidden", opacity: entra * (1 - sai) }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Camada img={antes} H={H} e={eA} reserva={rotA} fundo={cor.antes} t={t} filtro="saturate(0.9)" />
      </div>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${X}px)` }}>
        <Camada img={depois} H={H} e={eD} reserva={rotD} fundo={cor.depois} t={t} />
      </div>
      {(m.marcadores ?? []).map(pino)}
      <Alca x={X} altura={H} yPuxador={yPuxador} opacidade={opAlca} />
      <Etiqueta texto={rotA} fundo={cor.antes} tam={tamEt} style={{ left: 40, top: 150, opacity: clamp((X - 120) / 160, 0, 1) }} />
      <Etiqueta texto={rotD} fundo={cor.depois} tam={tamEt} style={{ right: 40, top: 150, opacity: clamp((W - X - 120) / 160, 0, 1) }} />
      {atual >= 0 && t < fimDicas + 0.3 ? (
        <CartaoDaDica
          t={t}
          x={dicas[atual]}
          i={atual}
          n={dicas.length}
          base={Math.min(H, COSTURA)}
          troca={atual === 0 ? dicas[0].mk.em + 0.1 : dicas[atual].mk.em + 0.2}
          sai={fimDicas - 0.05}
        />
      ) : null}
      {/* troca de dica: o conteúdo antigo some nos 0,2 s antes de o novo aparecer */}
      {atual > 0 && t < dicas[atual].mk.em + 0.2 ? (
        <CartaoDaDica t={t} x={dicas[atual - 1]} i={atual - 1} n={dicas.length} base={Math.min(H, COSTURA)} troca={-10} sai={dicas[atual].mk.em} />
      ) : null}
    </div>
  );
};
