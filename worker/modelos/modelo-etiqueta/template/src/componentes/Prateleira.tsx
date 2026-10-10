// A assinatura da Etiqueta: a prateleira em degraus de preço (a camada de baixo, atrás da pessoa).
//  - o varal no alto: cada etiqueta cai do varal, balança e o preço conta;
//  - o degrau sobe e o produto cai em cima dele, com sombra;
//  - a faixa do degrau mostra "o que muda" e quanto o preço subiu em relação ao degrau de baixo;
//  - o medidor "vale a pena?" (canto de cima à esquerda) vai de um degrau a outro com a agulha;
//  - o selo de custo-benefício carimba o degrau escolhido, e os outros esmaecem.
import { Easing } from "remotion";
import { formatar, prog, rapido, salto, temposDoTexto } from "../anim";
import { PLACAR } from "../layout";
import { encaixar } from "../medida";
import { Foto, imagemDoPlano, Recorte, temImagem } from "../motor/imagem";
import type { Degrau, Etiqueta as TEtiqueta, Plano } from "../plano";
import { cor, fonte, sombraDura } from "../tema";
import { Tarjado } from "./Tarjado";

const suave = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ——— dados: todos os momentos `etiqueta` com o mesmo título são a mesma prateleira ———

export type DegrauNaPrateleira = { d: Degrau; k: number; em: number; textoEm: number; valeEm: number | null; vale: number | null };

const irmaos = (plano: Plano, m: TEtiqueta) =>
  plano.momentos.filter((x): x is TEtiqueta => x.tipo === "etiqueta" && (x.titulo ?? "") === (m.titulo ?? "")).sort((a, b) => a.de - b.de);

export const degrausDaPrateleira = (plano: Plano, m: TEtiqueta): DegrauNaPrateleira[] => {
  const todos = irmaos(plano, m)
    .flatMap((x) => x.degraus)
    .sort((a, b) => a.em - b.em);
  return todos.map((d, k) => ({
    d,
    k,
    em: d.em,
    textoEm: Math.max(d.textoEm ?? d.em + 0.9, d.em + 0.5),
    valeEm: d.vale === undefined ? null : (d.valeEm ?? (d.textoEm ?? d.em + 0.9) + 0.6),
    vale: d.vale ?? null,
  }));
};

const seloDa = (plano: Plano, m: TEtiqueta) => irmaos(plano, m).find((x) => x.selo)?.selo ?? null;
const configDa = (plano: Plano, m: TEtiqueta) => {
  const lista = irmaos(plano, m);
  return {
    unidade: lista.find((x) => x.unidade !== undefined)?.unidade ?? "R$",
    sufixo: lista.find((x) => x.sufixo !== undefined)?.sufixo ?? "",
    medidor: lista.find((x) => x.medidor)?.medidor ?? null,
    total: Math.max(2, lista.flatMap((x) => x.degraus).length),
  };
};

// ——— geometria ———

const RAIL = 296; // o varal (acima dele ficam o título e o medidor)
const TAG_H = 124;
const PRODUTO_H = 100;
const LIM = 900; // os degraus descem até a emenda (a pessoa cobre o resto)

const colunas = (n: number) => {
  const w = PLACAR.w / n;
  return Array.from({ length: n }, (_, k) => {
    const sobe = n === 1 ? 0 : k / (n - 1); // 0 = o mais barato
    const tagY = Math.round(RAIL + 14 + (1 - sobe) * 160);
    return { k, x: PLACAR.x + k * w, w, cx: PLACAR.x + k * w + w / 2, tagY, topo: tagY + TAG_H + 8 + PRODUTO_H };
  });
};

export const textoPreco = (v: number, unidade: string, sufixo: string) => `${unidade ? unidade + " " : ""}${formatar(v)}${sufixo}`;

// ângulo do balanço da etiqueta: um empurrão no instante `em` que vai morrendo, mais um respiro lento
const balanco = (t: number, k: number, empurroes: { em: number; graus: number }[]) => {
  let a = Math.sin(t * 1.7 + k * 1.9) * 1.1;
  for (const e of empurroes) {
    const s = t - e.em;
    if (s > 0) a += e.graus * Math.exp(-s / 0.85) * Math.cos(s * 9.2);
  }
  return a;
};

// ——— a etiqueta de papel pendurada no varal ———

const Etiquetinha: React.FC<{
  t: number;
  c: ReturnType<typeof colunas>[number];
  info: DegrauNaPrateleira;
  unidade: string;
  sufixo: string;
  corpoPreco: number;
  empurroes: { em: number; graus: number }[];
  destaque: number;
}> = ({ t, c, info, unidade, sufixo, corpoPreco, empurroes, destaque }) => {
  if (t < info.em - 0.05) return null;
  const L = c.tagY - RAIL - 6;
  const w = c.w - 40;
  const queda = prog(t, info.em, 0.5, Easing.bezier(0.3, 1.5, 0.5, 1));
  const dy = -(1 - queda) * (L + TAG_H + 80);
  const angulo = t >= info.em + 0.28 ? balanco(t, info.k, empurroes) : 0;
  const conta = suave(clamp((t - (info.em + 0.1)) / 0.8, 0, 1));
  const valor = Math.round(info.d.preco * conta);
  return (
    <div style={{ position: "absolute", left: c.cx, top: RAIL, width: 0, height: 0, transform: `translateY(${dy}px) rotate(${angulo}deg)`, transformOrigin: "0 0" }}>
      {/* fio */}
      <div style={{ position: "absolute", left: -2, top: -4, width: 4, height: L + 24, borderRadius: 2, background: cor.tinta, opacity: 0.9 }} />
      <div
        style={{
          position: "absolute",
          left: -w / 2,
          top: L + 6,
          width: w,
          height: TAG_H,
          filter: "drop-shadow(0 10px 14px rgba(4,50,42,0.5))",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: cor.papel,
            clipPath: "polygon(13% 0, 87% 0, 100% 17%, 100% 100%, 0 100%, 0 17%)",
            outline: destaque > 0 ? `6px solid ${cor.alerta}` : undefined,
          }}
        />
        {/* o furo do cordão */}
        <div style={{ position: "absolute", left: w / 2 - 12, top: 8, width: 24, height: 24, borderRadius: 12, background: cor.fundo, boxShadow: `inset 0 3px 0 ${cor.fundoBaixo}` }} />
        {/* faixa do degrau */}
        <div
          style={{
            position: "absolute",
            left: w / 2 - 70,
            top: 28,
            width: 140,
            height: 34,
            borderRadius: 17,
            background: cor.tintaEscura,
            color: cor.papel,
            fontFamily: fonte,
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: "0.08em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textTransform: "uppercase",
          }}
        >
          {info.d.rotulo}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            top: 64,
            textAlign: "center",
            fontFamily: fonte,
            fontWeight: 800,
            fontSize: corpoPreco,
            lineHeight: 1,
            color: cor.tarja,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {textoPreco(valor, unidade, sufixo)}
        </div>
      </div>
    </div>
  );
};

// ——— o produto em cima do degrau ———

const Produto: React.FC<{ t: number; plano: Plano; c: ReturnType<typeof colunas>[number]; info: DegrauNaPrateleira; mudo: number }> = ({ t, plano, c, info, mudo }) => {
  const de = info.em + 0.32;
  if (t < de - 0.4) return null;
  const img = imagemDoPlano(plano, info.d.imagem);
  const tem = temImagem(img);
  const larg = Math.min(c.w * 0.84, 290, img?.largura && img?.altura && img.transparente ? PRODUTO_H * 1.25 * (img.largura / img.altura) : 290);
  const cai = prog(t, de, 0.42, Easing.bezier(0.3, 1.35, 0.5, 1));
  const dy = -(1 - cai) * 150;
  const aperto = t > de + 0.3 && t < de + 0.55 ? 1 - 0.07 * Math.sin(((t - de - 0.3) / 0.25) * Math.PI) : 1;
  const base = c.topo;
  const nome = info.d.nome ?? img?.palavra ?? info.d.rotulo;
  const encarte = tem && !img?.transparente;
  const sombraW = larg * (0.5 + 0.35 * cai);
  return (
    <div style={{ position: "absolute", left: c.cx - c.w / 2, top: 0, width: c.w, height: 0 }}>
      {/* sombra no degrau */}
      <div style={{ position: "absolute", left: c.w / 2 - sombraW / 2, top: base - 8, width: sombraW, height: 18, borderRadius: 9, background: "rgba(40,28,6,0.34)", opacity: cai * mudo }} />
      <div
        style={{
          position: "absolute",
          left: c.w / 2 - larg / 2,
          top: base - PRODUTO_H + 2,
          width: larg,
          height: PRODUTO_H,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          opacity: clamp(cai * 3, 0, 1),
          transform: `translateY(${dy}px) scaleY(${aperto})`,
          transformOrigin: "50% 100%",
        }}
      >
        {tem && img?.transparente ? (
          <Recorte imagem={img} t={t} de={de} largura={larg} entrada="corte" flutuar={false} sombra="drop-shadow(0 6px 6px rgba(40,28,6,0.28))" style={{ marginBottom: -2 }} />
        ) : encarte ? (
          <div style={{ width: larg * 0.78, height: PRODUTO_H - 6, borderRadius: 18, overflow: "hidden", border: `7px solid ${cor.papel}`, boxShadow: "0 10px 16px rgba(4,50,42,0.4)", transform: "rotate(-3deg)", background: cor.papel }}>
            <Foto imagem={img} t={t} de={de} largura={larg * 0.78 - 14} altura={PRODUTO_H - 20} intensidade={0.06} />
          </div>
        ) : (
          <div
            style={{
              width: larg * 0.86,
              height: PRODUTO_H - 14,
              borderRadius: 18,
              background: cor.papel,
              color: cor.tintaEscura,
              fontFamily: fonte,
              fontWeight: 800,
              fontSize: encaixar(nome, { largura: larg * 0.86 - 30, max: 40, min: 24, linhas: 2, fonte: { peso: 800, caixaAlta: true } }).tamanho,
              lineHeight: 1.1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              textTransform: "uppercase",
              boxShadow: sombraDura(cor.papelSombra, 6),
              padding: "0 14px",
            }}
          >
            {nome}
          </div>
        )}
      </div>
    </div>
  );
};

// ——— o degrau (a madeira) com a faixa de "o que muda" ———

const Degrau_: React.FC<{
  t: number;
  c: ReturnType<typeof colunas>[number];
  info: DegrauNaPrateleira;
  anterior: DegrauNaPrateleira | null;
  unidade: string;
  sufixo: string;
  omitirTexto: number;
  caro: boolean;
}> = ({ t, c, info, anterior, unidade, sufixo, omitirTexto }) => {
  const sobe = prog(t, info.em - 0.08, 0.5, rapido);
  if (sobe <= 0) return null;
  const alturaTotal = LIM - c.topo;
  const gap = 6;
  const pTexto = prog(t, info.textoEm, 0.34, salto);
  const mostrar = clamp(pTexto, 0, 1) * (1 - omitirTexto);
  const diferenca = anterior ? info.d.preco - anterior.d.preco : null;
  const S = encaixar(info.d.texto, { largura: c.w - 2 * gap - 44, max: 40, min: 30, linhas: 3, fonte: { peso: 800 } });
  const marcador = "$".repeat(info.k + 1);
  return (
    <div
      style={{
        position: "absolute",
        left: c.x + gap / 2,
        top: c.topo,
        width: c.w - gap,
        height: alturaTotal + 24,
        transform: `translateY(${(1 - sobe) * (alturaTotal + 40)}px)`,
      }}
    >
      {/* tampo */}
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 16, borderRadius: "14px 14px 0 0", background: cor.degrau }} />
      {/* frente */}
      <div style={{ position: "absolute", left: 0, top: 16, width: "100%", bottom: 0, background: cor.degrauFrente, boxShadow: "inset 0 10px 0 rgba(120,92,30,0.18)" }}>
        <div style={{ position: "absolute", left: 22, top: 22, fontFamily: fonte, fontWeight: 800, fontSize: 32, color: cor.tintaSuave, letterSpacing: "0.04em" }}>{marcador}</div>
        <div style={{ position: "absolute", left: 22, right: 22, top: 22, height: 0, opacity: mostrar, transform: `translateY(${(1 - mostrar) * 18}px)` }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                padding: "5px 14px",
                borderRadius: 18,
                background: diferenca === null ? cor.tintaEscura : cor.alerta,
                color: diferenca === null ? cor.papel : cor.tintaEscura,
                fontFamily: fonte,
                fontWeight: 800,
                fontSize: 21,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {diferenca === null ? "a base" : "o que muda"}
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 22, right: 18, top: diferenca === null ? 62 : 68, opacity: mostrar, transform: `translateY(${(1 - mostrar) * 22}px)` }}>
          {diferenca !== null ? (
            <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: 44, lineHeight: 1.05, color: cor.tarja, marginBottom: 8, whiteSpace: "nowrap" }}>
              {`▲ +${textoPreco(diferenca, unidade, sufixo)}`}
            </div>
          ) : null}
          {S.linhas.map((l, i) => (
            <div key={i} style={{ fontFamily: fonte, fontWeight: 800, fontSize: S.tamanho, lineHeight: 1.12, color: cor.tintaEscura, whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ——— o medidor "vale a pena?" ———

const ponto = (cx: number, cy: number, r: number, graus: number) => [cx + r * Math.cos((graus * Math.PI) / 180), cy - r * Math.sin((graus * Math.PI) / 180)];
const arco = (cx: number, cy: number, r: number, de: number, ate: number) => {
  const [x1, y1] = ponto(cx, cy, r, 180 - de * 180);
  const [x2, y2] = ponto(cx, cy, r, 180 - ate * 180);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
};

const Medidor: React.FC<{ t: number; em: number; pontos: { em: number; v: number }[]; rotulo: string }> = ({ t, em, pontos, rotulo }) => {
  const p = prog(t, em, 0.45, salto);
  if (p <= 0) return null;
  // a agulha procura (balança no meio) até o primeiro valor; depois vai de um para o outro
  let de = 0.5;
  let para = 0.5;
  let desde = em;
  for (const x of pontos) {
    if (t >= x.em) {
      de = para;
      para = x.v;
      desde = x.em;
    }
  }
  const anda = salto(clamp((t - desde) / 0.7, 0, 1));
  const procurando = pontos.length === 0 || t < pontos[0].em;
  const v = procurando ? 0.5 + Math.sin((t - em) * 3.1) * 0.12 : de + (para - de) * anda + Math.sin(t * 7) * 0.006;
  const graus = 180 - clamp(v, 0, 1) * 180;
  const W = 380;
  const H = 152;
  const cx = W / 2;
  const cy = 124;
  const R = 88;
  const esp = 28;
  const [ax, ay] = ponto(cx, cy, R - esp / 2 - 6, graus);
  return (
    <div
      style={{
        position: "absolute",
        left: PLACAR.x + PLACAR.w - W,
        top: PLACAR.y - 8,
        width: W,
        height: H,
        borderRadius: 24,
        background: cor.papel,
        boxShadow: `${sombraDura(cor.papelSombra, 8)}, 0 16px 30px rgba(4,50,42,0.4)`,
        opacity: Math.min(1, p * 2.5),
        transform: p >= 1 ? undefined : `scale(${0.7 + 0.3 * p}) rotate(${(1 - p) * -6}deg)`,
        transformOrigin: "100% 50%",
      }}
    >
      <div style={{ position: "absolute", left: 0, width: "100%", top: 8, textAlign: "center", fontFamily: fonte, fontWeight: 800, fontSize: 28, color: cor.tintaEscura, letterSpacing: "0.04em", textTransform: "uppercase" }}>{rotulo}</div>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={arco(cx, cy, R - esp / 2, 0, 0.34)} stroke={cor.tarja} strokeWidth={esp} fill="none" />
        <path d={arco(cx, cy, R - esp / 2, 0.34, 0.67)} stroke={cor.alerta} strokeWidth={esp} fill="none" />
        <path d={arco(cx, cy, R - esp / 2, 0.67, 1)} stroke={cor.bom} strokeWidth={esp} fill="none" />
        <line x1={cx} y1={cy} x2={ax} y2={ay} stroke={cor.tintaEscura} strokeWidth={9} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={14} fill={cor.tintaEscura} />
      </svg>
      <div style={{ position: "absolute", left: 70, top: cy + 6, fontFamily: fonte, fontWeight: 800, fontSize: 22, color: cor.tintaSuave }}>NÃO</div>
      <div style={{ position: "absolute", right: 74, top: cy + 6, fontFamily: fonte, fontWeight: 800, fontSize: 22, color: cor.tintaSuave }}>SIM</div>
    </div>
  );
};

// ——— o selo de custo-benefício ———

const quebrarSelo = (texto: string) =>
  texto
    .toLocaleUpperCase("pt-BR")
    .split(/\s+/)
    .flatMap((w) => (w.length > 10 && w.includes("-") ? [w.slice(0, w.indexOf("-") + 1), w.slice(w.indexOf("-") + 1)] : [w]));

const Selo: React.FC<{ t: number; c: ReturnType<typeof colunas>[number]; em: number; texto: string }> = ({ t, c, em, texto }) => {
  if (t < em) return null;
  const p = prog(t, em, 0.42, Easing.bezier(0.2, 1.7, 0.4, 1));
  const linhas = quebrarSelo(texto);
  const maior = linhas.reduce((a, b) => (b.length > a.length ? b : a), "");
  const D = 244;
  const S = encaixar(maior, { largura: D * 0.78, max: 40, min: 22, linhas: 1, fonte: { peso: 800, caixaAlta: true } }).tamanho;
  const pontas = 18;
  const pts = Array.from({ length: pontas * 2 }, (_, i) => {
    const r = i % 2 === 0 ? D / 2 : D / 2 - 16;
    const a = (i / (pontas * 2)) * Math.PI * 2;
    return `${D / 2 + r * Math.cos(a)},${D / 2 + r * Math.sin(a)}`;
  }).join(" ");
  const giro = -9 + Math.sin(t * 1.6) * 1.6;
  const cy = c.topo + 128;
  return (
    <div
      style={{
        position: "absolute",
        left: c.cx - D / 2,
        top: cy - D / 2,
        width: D,
        height: D,
        opacity: clamp(p * 4, 0, 1),
        transform: `scale(${1.9 - 0.9 * p}) rotate(${giro + (1 - p) * 24}deg)`,
        filter: "drop-shadow(0 10px 12px rgba(4,50,42,0.45))",
      }}
    >
      <svg width={D} height={D} style={{ position: "absolute", left: 0, top: 0 }}>
        <polygon points={pts} fill={cor.tarja} />
        <circle cx={D / 2} cy={D / 2} r={D / 2 - 28} fill={cor.alerta} />
        <circle cx={D / 2} cy={D / 2} r={D / 2 - 28} fill="none" stroke={cor.tarja} strokeWidth={3} strokeDasharray="4 7" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: fonte, fontWeight: 800, fontSize: S, lineHeight: 1.08, color: cor.tintaEscura, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

// ——— a prateleira inteira ———

export const Prateleira: React.FC<{ m: TEtiqueta; t: number; plano: Plano; t0: number; saiCruzando: boolean }> = ({ m, t, plano, t0 }) => {
  const lista = degrausDaPrateleira(plano, m);
  const cfg = configDa(plano, m);
  const selo = seloDa(plano, m);
  const n = Math.max(cfg.total, lista.length);
  const cols = colunas(n);
  const primeiro = irmaos(plano, m)[0];
  // os momentos seguintes da mesma prateleira continuam de onde o primeiro parou (nada reentra)
  const emTitulo = primeiro === m ? Math.max(t0, m.tituloEm ?? m.de + 0.05) : Math.max(primeiro.tituloEm ?? primeiro.de + 0.05, 0);

  // o corpo do preço é o mesmo nas três etiquetas (o maior que cabe na maior)
  const maiorPreco = lista.reduce((a, b) => (b.d.preco > a.d.preco ? b : a), lista[0]);
  const corpoPreco = maiorPreco
    ? encaixar(textoPreco(maiorPreco.d.preco, cfg.unidade, cfg.sufixo), { largura: cols[0].w - 40 - 30, max: 56, min: 32, linhas: 1, fonte: { peso: 800 } }).tamanho
    : 56;

  // medidor: pontos (instante, valor) de cada degrau e do selo
  const pontos = [
    ...lista.filter((x) => x.valeEm !== null && x.vale !== null).map((x) => ({ em: x.valeEm as number, v: x.vale as number })),
    ...(selo && selo.vale !== undefined ? [{ em: selo.valeEm ?? selo.em - 0.4, v: selo.vale }] : []),
  ].sort((a, b) => a.em - b.em);
  const emMedidor = lista.length ? lista[0].em + 0.35 : m.de;

  // foco no degrau do selo: os outros esmaecem
  const emFoco = selo ? (selo.valeEm ?? selo.em - 0.4) : Infinity;
  const foco = selo ? prog(t, emFoco, 0.4) : 0;
  const rail = prog(t, primeiro.de + 0.1, 0.5, rapido);

  return (
    <>
      {/* a parede da loja: furinhos de painel */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: LIM, backgroundImage: "radial-gradient(rgba(255,251,240,0.13) 3.5px, transparent 4px)", backgroundSize: "40px 40px", backgroundPosition: "20px 20px" }} />
      {m.titulo ? (
        <div style={{ position: "absolute", left: PLACAR.x - 18, top: PLACAR.y, width: 600 }}>
          <div style={{ position: "absolute", left: 18, top: -16, width: 90 * prog(t, emTitulo, 0.3, rapido), height: 10, borderRadius: 5, background: cor.tarja }} />
          <Tarjado t={t} texto={m.titulo} tempos={temposDoTexto(m.titulo, emTitulo, plano.palavras, m.ate)} largura={570} max={54} min={38} linhas={2} placa={null} alinhar="esquerda" />
        </div>
      ) : null}
      {/* o varal */}
      <div style={{ position: "absolute", left: PLACAR.x - 10, top: RAIL - 4, width: (PLACAR.w + 20) * rail, height: 12, borderRadius: 6, background: cor.papelSombra, boxShadow: "0 4px 0 rgba(4,50,42,0.35)" }} />
      <div style={{ position: "absolute", left: PLACAR.x - 18, top: RAIL - 12, width: 24, height: 28, borderRadius: 8, background: cor.degrau, opacity: rail }} />
      <div style={{ position: "absolute", left: PLACAR.x + PLACAR.w - 6, top: RAIL - 12, width: 24, height: 28, borderRadius: 8, background: cor.degrau, opacity: rail }} />

      {lista.map((info, i) => {
        const c = cols[Math.min(info.k, cols.length - 1)];
        const escolhido = !!selo && selo.degrau === info.k;
        const esmaece = selo ? 1 - 0.5 * foco * (escolhido ? 0 : 1) : 1;
        const empurroes = [{ em: info.em + 0.28, graus: 15 }, ...(escolhido && selo ? [{ em: selo.em, graus: 9 }] : [])];
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: esmaece }}>
            <Degrau_ t={t} c={c} info={info} anterior={i > 0 ? lista[i - 1] : null} unidade={cfg.unidade} sufixo={cfg.sufixo} omitirTexto={escolhido && selo ? prog(t, selo.em, 0.2) : 0} caro={i === lista.length - 1} />
            <Produto t={t} plano={plano} c={c} info={info} mudo={1} />
            <Etiquetinha t={t} c={c} info={info} unidade={cfg.unidade} sufixo={cfg.sufixo} corpoPreco={corpoPreco} empurroes={empurroes} destaque={escolhido ? foco : 0} />
          </div>
        );
      })}

      {lista.length ? <Medidor t={t} em={emMedidor} pontos={pontos} rotulo={cfg.medidor?.rotulo ?? "Vale a pena?"} /> : null}
      {selo ? <Selo t={t} c={cols[Math.min(selo.degrau, cols.length - 1)]} em={selo.em} texto={selo.texto ?? "Melhor custo-benefício"} /> : null}
    </>
  );
};
