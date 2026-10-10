import { Easing } from "remotion";
import { limitar, mistura, prog, remonta } from "../anim";
import { encaixar, encaixarTodos, larguraTexto } from "../medida";
import type { Partes, Prato as TPrato } from "../plano";
import { cor, display, paleta, sans } from "../tema";
import { F_ITEM, F_TITULO, Ilustrativo, lapis, respiro, TextoFalado, type PropsBloco } from "./comum";
import { Fracao } from "./Fracao";
import { Icone } from "./Icones";

const rad = (g: number) => (g * Math.PI) / 180;

// cores das partes, na ordem, quando o plano não diz (a quinta é um cinza quente)
const CORES_PADRAO = [paleta.folha.fundo, paleta.tomate.fundo, paleta.gema.fundo, paleta.tinta.fundo, cor.cinza];
const TEXTO_SOBRE: Record<string, string> = { [cor.gema]: cor.tinta };

// fatia do disco entre os ângulos a0 e a1 (graus; 0 = 3h, sentido horário)
const fatia = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  if (a1 - a0 >= 359.9) return `M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
  const x0 = cx + r * Math.cos(rad(a0));
  const y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  return `M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
};

// ângulos de cada parte: a primeira fica à esquerda (termina às 12h); as outras seguem no sentido horário
export const angulosDasPartes = (fracoes: number[]) => {
  const saida: [number, number][] = [];
  const primeira = fracoes[0] ?? 0;
  saida.push([270 - primeira * 360, 270]);
  let inicio = 270;
  for (const f of fracoes.slice(1)) {
    saida.push([inicio, inicio + f * 360]);
    inicio += f * 360;
  }
  return saida;
};

export const textoFracao = (f: number) => {
  const conhecidas: [number, string][] = [
    [1 / 2, "1/2"],
    [1 / 4, "1/4"],
    [3 / 4, "3/4"],
    [1 / 3, "1/3"],
    [2 / 3, "2/3"],
    [1 / 5, "1/5"],
    [1 / 8, "1/8"],
  ];
  const achada = conhecidas.find(([v]) => Math.abs(v - f) < 0.01);
  return achada ? achada[1] : `${Math.round(f * 100)}%`;
};

// As partes prontas para desenhar: frações que somam 1 (as que faltam dividem o resto por igual) e cores.
export const resolverPartes = (b: Pick<Partes, "partes" | "ilustrativo">) => {
  const partes = b.partes.slice(0, 6);
  const ditas = partes.filter((p) => typeof p.fracao === "number" && p.fracao > 0);
  const soma = ditas.reduce((a, p) => a + (p.fracao ?? 0), 0);
  const faltam = partes.length - ditas.length;
  const resto = faltam ? Math.max(0, 1 - Math.min(soma, 1)) / faltam : 0;
  const qualitativo = ditas.length === 0;
  const total = qualitativo ? partes.length : soma + resto * faltam;
  return {
    qualitativo,
    ilustrativo: b.ilustrativo ?? qualitativo,
    partes: partes.map((p, i) => {
      const fr = qualitativo ? 1 / partes.length : (typeof p.fracao === "number" && p.fracao > 0 ? p.fracao : resto) / (total || 1);
      const corHex = p.cor ? paleta[p.cor].fundo : CORES_PADRAO[i % CORES_PADRAO.length];
      return { ...p, fracao: fr, corHex, texto: TEXTO_SOBRE[corHex] ?? cor.creme, temFracao: !qualitativo && typeof p.fracao === "number" };
    }),
  };
};

// Fio de azeite: um fio fino e ondulado que desce em arco por cima da primeira parte (a salada),
// perto da borda, sem passar pelas frações. `ponto(s)` dá a posição ao longo do fio (0 a 1).
const pontoDoFio = (cx: number, cy: number, R: number, s: number) => {
  const ang = rad(mistura(252, 112, s));
  const onda = R * 0.055 * Math.sin(s * Math.PI * 2 * 5.5) * Math.sin(s * Math.PI) ** 0.5;
  const r = R * 0.61 + onda;
  return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
};
const fioDeAzeite = (cx: number, cy: number, R: number, dx = 0, dy = 0) => {
  const pts: string[] = [];
  const N = 180;
  for (let i = 0; i <= N; i++) {
    const { x, y } = pontoDoFio(cx, cy, R, i / N);
    pts.push(`${i === 0 ? "M" : "L"}${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}`);
  }
  return pts.join(" ");
};

// Garfo (à esquerda) e faca (à direita), vistos de cima, em pé ao lado do prato
const garfo = (x: number, cy: number, R: number) => {
  const l = R * 0.065;
  const d = R * 0.022;
  return [
    `M${x - l} ${cy - R * 0.74} L${x - l} ${cy - R * 0.36} C${x - l} ${cy - R * 0.22} ${x + l} ${cy - R * 0.22} ${x + l} ${cy - R * 0.36} L${x + l} ${cy - R * 0.74}`,
    `M${x - d} ${cy - R * 0.74} L${x - d} ${cy - R * 0.38} M${x + d} ${cy - R * 0.74} L${x + d} ${cy - R * 0.38}`,
    `M${x} ${cy - R * 0.26} L${x} ${cy + R * 0.76}`,
  ];
};
const faca = (x: number, cy: number, R: number) => {
  const l = R * 0.04;
  return [
    `M${x - l} ${cy - R * 0.74} L${x - l} ${cy + R * 0.02} L${x + l} ${cy + R * 0.02} C${x + l * 2.4} ${cy - R * 0.3} ${x + l * 2} ${cy - R * 0.62} ${x - l} ${cy - R * 0.74} Z`,
    `M${x} ${cy + R * 0.02} L${x} ${cy + R * 0.76}`,
  ];
};

// Espaço dos talheres, em frações do raio: prato (2R) + dois talheres com o respiro
const LARGURA_COM_TALHERES = 2.42;

// A assinatura do Mosaico: um todo dividido em partes, no disco visto de cima (no exemplo, o prato).
// A borda se desenha e fecha o círculo; as linhas tracejadas mostram onde as partes vão ficar; cada parte
// se preenche (a fatia gira até o tamanho certo) quando é dita. Com `talheresEm`, garfo e faca chegam dos
// lados; com `azeite`, uma galheta entra, inclina e deixa um fio dourado sobre a primeira parte.
// - `prato` (o exemplo): a legenda das partes aparece toda junta em `rotulosEm`, só em bloco largo;
// - `partes`: a legenda de cada parte entra quando ela é dita (ao lado do disco em bloco largo, embaixo em
//   bloco alto); sem frações ditas, as partes ficam iguais e o bloco mostra "ilustrativo".
// `extras` (gráfico de pizza): um texto a mais por parte na legenda (o valor dito).
export const Prato: React.FC<PropsBloco<TPrato | Partes> & { extras?: string[] }> = ({ b, t, w, h, util, pal, palavras, janela, extras }) => {
  const pad = respiro(w, h);
  const alto = Math.min(h, util);
  const { partes, ilustrativo } = resolverPartes(b);
  const vivo = b.tipo === "partes";
  // ladrilho pequeno (companheiro): só o disco, sem título nem etiqueta
  const pequeno = w < 600 || h < 420;
  const tit = b.titulo && !pequeno ? encaixar(b.titulo, { largura: w - 2 * pad - (ilustrativo ? 250 : 0), max: 96, min: 44, linhas: 2, fonte: F_TITULO, entrelinha: 1.04 }) : null;
  const topo = tit ? pad + tit.altura + 10 : 0;
  const comTalheres = b.talheresEm !== undefined;

  // ---- onde fica o disco e a legenda
  let cx: number;
  let cy: number;
  let R: number;
  let reserva = 0;
  let topoRotulos = 0;
  const ALTURA_ROTULO = 118;
  const nRotulos = b.rotulosEm !== undefined ? partes.length + (b.azeite ? 1 : 0) : 0;
  const alturaRotulos = Math.ceil(nRotulos / 2) * ALTURA_ROTULO + 12;
  // legenda viva (partes): ao lado, embaixo ou nenhuma
  const comRotulo = partes.some((p) => p.rotulo);
  const altDisco = alto - topo;
  const modo: "lado" | "embaixo" | "nenhuma" = !vivo || !comRotulo || pequeno ? "nenhuma" : w >= 700 && w > altDisco * 1.12 ? "lado" : w >= 560 && altDisco > w * 0.95 ? "embaixo" : "nenhuma";
  const larguraLegenda = modo === "lado" ? (w - 2 * pad) * 0.5 : w - 2 * pad;
  // a legenda: o rótulo (até 2 linhas) e, no gráfico de pizza, o valor dito, colado no fim (ou numa linha só dele)
  const legendas = encaixarTodos(
    partes.map((p, i) => [p.rotulo ?? "", extras?.[i] ?? ""].filter(Boolean).join(" ")),
    { largura: larguraLegenda - 58, max: modo === "lado" ? 66 : 58, min: 38, linhas: 2, fonte: F_ITEM, entrelinha: 1.06 },
  ).map((lg, i) => {
    const extra = extras?.[i];
    if (!extra) return lg;
    const r = encaixar(partes[i].rotulo ?? "", { largura: larguraLegenda - 58, max: lg.tamanho, min: lg.tamanho, linhas: 2, fonte: F_ITEM, entrelinha: 1.06 });
    const ultima = r.linhas[r.linhas.length - 1] ?? "";
    const cabe = larguraTexto(`${ultima} ${extra}`, lg.tamanho, F_ITEM) <= larguraLegenda - 58;
    const linhas = cabe ? [...r.linhas.slice(0, -1), `${ultima} ${extra}`] : [...r.linhas, extra];
    return { ...lg, linhas, altura: linhas.length * lg.tamanho * 1.06 };
  });
  const altLinhaLegenda = (i: number) => Math.max(64, legendas[i].altura + 26);
  const altLegendaEmbaixo = modo === "embaixo" ? partes.reduce((a, _, i) => a + altLinhaLegenda(i), 0) + 20 : 0;

  if (!vivo) {
    // o prato do exemplo: o disco ocupa o bloco; a legenda (em `rotulosEm`) abre lugar embaixo, em blocos
    // largos (a reserva cresce aos poucos com a largura e perto da hora de aparecer: o prato sobe sem pular)
    const area = Math.min(h - topo, Math.max(util + h * 0.12 - topo, (h - topo) * 0.55));
    reserva = nRotulos ? limitar((w - 620) / 160) * prog(t, (b.rotulosEm ?? 0) - 0.75, 0.75, remonta) : 0;
    topoRotulos = alto - pad * 0.6 - alturaRotulos;
    const areaPrato = mistura(area, topoRotulos - topo, reserva);
    R = Math.min((w - 2 * pad) / (comTalheres ? LARGURA_COM_TALHERES : 2), (areaPrato - 2 * pad) / 2);
    cx = w / 2;
    cy = topo + areaPrato / 2 + reserva * 8;
  } else if (modo === "lado") {
    const largDisco = w - 2 * pad - larguraLegenda - 24;
    R = Math.min(largDisco / (comTalheres ? LARGURA_COM_TALHERES : 2), (altDisco - 2 * pad) / 2);
    cx = pad + largDisco / 2;
    cy = topo + altDisco / 2;
  } else {
    const areaDisco = altDisco - altLegendaEmbaixo;
    R = Math.min((w - 2 * pad) / (comTalheres ? LARGURA_COM_TALHERES : 2), (areaDisco - 2 * pad) / 2);
    cx = w / 2;
    cy = topo + areaDisco / 2 + (modo === "embaixo" ? pad * 0.3 : 0);
  }
  R = Math.max(R, 20);
  const Rf = R * 0.76;
  const angulos = angulosDasPartes(partes.map((p) => p.fracao));
  const traco = pal.texto;

  // entrada: a borda se desenha a partir das 12h e fecha o círculo; depois a louça e as linhas do método
  const pBorda = prog(t, janela.de + 0.1, 0.9, Easing.inOut(Easing.cubic));
  const pCorpo = prog(t, janela.de + 0.55, 0.5);
  const pGuias = prog(t, janela.de + 0.85, 0.7);
  const larguraBorda = Math.max(3, R * 0.018);

  // talheres
  const pGarfo = comTalheres ? prog(t, b.talheresEm ?? 0, 0.55) : 0;
  const pFaca = comTalheres ? prog(t, (b.talheresEm ?? 0) + 0.12, 0.55) : 0;
  const xGarfo = cx - R - R * 0.21;
  const xFaca = cx + R + R * 0.21;

  // azeite: a galheta entra e inclina, o filete cai, o fio corre pela primeira parte e a galheta sai
  const e = b.azeite?.em ?? 0;
  const pEntra = b.azeite ? prog(t, e, 0.25) : 0;
  const pFio = b.azeite ? prog(t, e + 0.25, 0.62, Easing.inOut(Easing.quad)) : 0;
  const pSai = b.azeite ? prog(t, e + 0.87, 0.25) : 0;
  const filete = b.azeite ? prog(t, e + 0.18, 0.1) * (1 - prog(t, e + 0.87, 0.1)) : 0;
  const cabeca = pontoDoFio(cx, cy, R, pFio);
  const queda = R * 0.3;
  const tamGalheta = R * 0.58;
  const giro = mistura(0, 116, prog(t, e + 0.02, 0.25)) - 50 * pSai;
  const bicoX = 0.34 * tamGalheta * Math.sin(rad(giro));
  const bicoY = -0.34 * tamGalheta * Math.cos(rad(giro));
  const galhetaX = cabeca.x - bicoX;
  const galhetaY = cabeca.y - queda - bicoY - (1 - pEntra) * R * 0.35 - pSai * R * 0.3;
  const ouro = "#D9AA3A";

  // legenda viva: posição de cada linha
  const linhasLegenda = (() => {
    if (modo === "nenhuma") return [];
    const alturas = partes.map((_, i) => altLinhaLegenda(i));
    const total = alturas.reduce((a, v) => a + v, 0);
    const x = modo === "lado" ? w - pad - larguraLegenda : pad;
    let y = modo === "lado" ? cy - total / 2 : alto - pad * 0.6 - altLegendaEmbaixo + 20;
    return alturas.map((a) => {
      const r = { x, y, h: a };
      y += a;
      return r;
    });
  })();

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {tit ? (
        <div style={{ position: "absolute", left: pad, top: pad, width: w - 2 * pad }}>
          <TextoFalado
            linhas={tit.linhas}
            t={t}
            palavras={palavras}
            janela={janela}
            tamanho={tit.tamanho}
            cor={pal.texto}
            estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.025em" }}
          />
        </div>
      ) : null}
      {vivo && ilustrativo && !pequeno ? <Ilustrativo pal={pal} p={prog(t, janela.de + 0.3, 0.4)} style={{ right: pad, top: pad }} /> : null}
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* corpo do disco (louça) */}
        <circle cx={cx} cy={cy} r={R} fill="#FFFCF6" opacity={pCorpo} />
        <circle cx={cx} cy={cy} r={R * 0.86} fill="none" stroke={traco} strokeOpacity={0.16 * pCorpo} strokeWidth={Math.max(2, R * 0.012)} />
        {/* borda: o traço que fecha o círculo */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={traco}
          strokeOpacity={0.8}
          strokeWidth={larguraBorda}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={pBorda < 0.999 ? `${pBorda} 1` : undefined}
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity={pBorda > 0.002 ? 1 : 0}
        />
        {/* o "método": linhas tracejadas onde as partes vão ficar */}
        {angulos.map(([a0], i) => {
          const x = cx + Rf * Math.cos(rad(a0));
          const y = cy + Rf * Math.sin(rad(a0));
          return (
            <line
              key={`g${i}`}
              x1={cx}
              y1={cy}
              x2={mistura(cx, x, pGuias)}
              y2={mistura(cy, y, pGuias)}
              stroke={traco}
              strokeOpacity={0.3 * (pGuias > 0.01 ? 1 : 0)}
              strokeWidth={Math.max(2.5, R * 0.014)}
              strokeDasharray={`${R * 0.05} ${R * 0.04}`}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={Rf} fill="none" stroke={traco} strokeOpacity={0.22 * pGuias} strokeWidth={Math.max(2.5, R * 0.014)} strokeDasharray={`${R * 0.05} ${R * 0.04}`} />
        {/* talheres */}
        {comTalheres && pGarfo > 0.001
          ? garfo(xGarfo - (1 - pGarfo) * R * 0.3, cy, R).map((d, i) => (
              <path key={`ga${i}`} d={d} fill="none" stroke={traco} strokeOpacity={0.85 * pGarfo} strokeWidth={i === 2 ? R * 0.045 : R * 0.02} strokeLinecap="round" strokeLinejoin="round" />
            ))
          : null}
        {comTalheres && pFaca > 0.001
          ? faca(xFaca + (1 - pFaca) * R * 0.3, cy, R).map((d, i) => (
              <path key={`fa${i}`} d={d} fill="none" stroke={traco} strokeOpacity={0.85 * pFaca} strokeWidth={i === 1 ? R * 0.045 : R * 0.02} strokeLinecap="round" strokeLinejoin="round" />
            ))
          : null}
        {/* as partes, cada uma no seu tempo */}
        {partes.map((parte, i) => {
          const p = prog(t, parte.em, 0.85, remonta);
          if (p <= 0.001) return null;
          const [a0, a1] = angulos[i];
          return <path key={`f${i}`} d={fatia(cx, cy, Rf, a0, a0 + (a1 - a0) * p)} fill={parte.corHex} />;
        })}
        {/* divisórias entre as partes já servidas */}
        {partes.map((parte, i) => {
          const p = prog(t, parte.em + 0.5, 0.4);
          if (p <= 0.001) return null;
          return angulos[i].map((a, k) => (
            <line
              key={`d${i}-${k}`}
              x1={cx}
              y1={cy}
              x2={cx + Rf * 1.01 * Math.cos(rad(a))}
              y2={cy + Rf * 1.01 * Math.sin(rad(a))}
              stroke="#FFFCF6"
              strokeWidth={Math.max(4, R * 0.028) * p}
              strokeLinecap="round"
            />
          ));
        })}
        {/* fio de azeite: dourado, com um risco de brilho fino por cima (sem brilho em volta) */}
        {b.azeite && pFio > 0.001 ? (
          <>
            <path
              d={fioDeAzeite(cx, cy, R)}
              fill="none"
              stroke={ouro}
              strokeWidth={Math.max(4, R * 0.024)}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={pFio < 0.999 ? `${pFio} 1` : undefined}
            />
            <path
              d={fioDeAzeite(cx, cy, R, -R * 0.005, -R * 0.006)}
              fill="none"
              stroke="#FFF1C4"
              strokeOpacity={0.85}
              strokeWidth={Math.max(1.5, R * 0.007)}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={pFio < 0.999 ? `${pFio * 0.98} 1` : "0.98 1"}
            />
          </>
        ) : null}
        {b.azeite && filete > 0.01 ? (
          <line x1={cabeca.x} y1={cabeca.y - queda * filete} x2={cabeca.x} y2={cabeca.y} stroke={ouro} strokeWidth={Math.max(2.5, R * 0.012)} strokeLinecap="round" />
        ) : null}
      </svg>
      {/* a galheta */}
      {b.azeite && pEntra > 0.001 && pSai < 0.999 ? (
        <div
          style={{
            position: "absolute",
            left: galhetaX - tamGalheta / 2,
            top: galhetaY - tamGalheta / 2,
            width: tamGalheta,
            height: tamGalheta,
            rotate: `${giro}deg`,
            opacity: pEntra * (1 - pSai),
          }}
        >
          <Icone nome="azeite" tamanho={tamGalheta} cor="#8E6F1B" peso={5.5} cheio={1} corCheio="#FFF7E2" />
        </div>
      ) : null}
      {/* frações dentro das partes (só em discos grandes e com frações ditas) */}
      {R >= 160
        ? partes.map((parte, i) => {
            // no gráfico de pizza o valor já está na legenda; nas partes, só frações ditas
            if (extras || (vivo && !parte.temFracao)) return null;
            const [a0, a1] = angulos[i];
            const meio = (a0 + a1) / 2;
            // metades exatas (partes): a fração no meio de cada metade; no prato do exemplo, como sempre foi
            const dist = vivo && Math.abs(parte.fracao - 0.5) < 0.01 ? Rf * 0.46 : parte.fracao >= 0.5 ? Rf * 0.3 : Rf * 0.56;
            const alt = parte.fracao >= 0.5 ? R * 0.34 : R * 0.26;
            const x = cx + dist * Math.cos(rad(meio));
            const y = cy + dist * Math.sin(rad(meio));
            if (t < parte.em + 0.35) return null;
            const texto = textoFracao(parte.fracao);
            return (
              <div key={`q${i}`} style={{ position: "absolute", left: x - alt * 0.49, top: y - alt / 2 }}>
                <Fracao texto={texto} altura={alt} cor={parte.texto} t={t} de={parte.em + 0.35} largura={alt * 1.4} />
              </div>
            );
          })
        : null}
      {/* legenda viva (partes): cada parte entra quando é dita; antes, uma pastilha a lápis */}
      {linhasLegenda.map((r, i) => {
        const parte = partes[i];
        const p = prog(t, parte.em + 0.15, 0.45);
        const lg = legendas[i];
        return (
          <div key={`l${i}`} style={{ position: "absolute", left: r.x, top: r.y, width: larguraLegenda, height: r.h, display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 9, outline: `2.5px dashed ${lapis(pal)}`, outlineOffset: -2, opacity: 1 - p }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 9, background: parte.corHex, opacity: p, scale: String(0.55 + 0.45 * p) }} />
            </div>
            <div
              style={{
                fontFamily: display,
                fontWeight: 700,
                fontSize: lg.tamanho,
                lineHeight: 1.06,
                letterSpacing: "-0.015em",
                color: pal.texto,
                opacity: p,
                clipPath: p < 0.999 ? `inset(-0.2em ${((1 - p) * 104).toFixed(2)}% -0.2em -0.1em)` : undefined,
              }}
            >
              {lg.linhas.map((l, k) => (
                <div key={k} style={{ whiteSpace: "nowrap" }}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {/* legenda do prato do exemplo: cor, fração e uma palavra por parte, toda em `rotulosEm` */}
      {!vivo && reserva > 0.01
        ? (() => {
            const itens = [
              ...partes.map((p) => ({ cor: p.corHex, fracao: textoFracao(p.fracao), texto: p.rotulo ?? "" })),
              ...(b.azeite ? [{ cor: ouro, fracao: "", texto: "azeite" }] : []),
            ];
            const gap = 24;
            const larg = (w - 2 * pad - gap) / 2;
            const y0 = topoRotulos + (1 - reserva) * 30;
            return itens.map((it, i) => {
              const pr = prog(t, (b.rotulosEm ?? 0) + i * 0.3, 0.5) * reserva;
              const col = i % 2;
              const fila = Math.floor(i / 2);
              return (
                <div
                  key={`r${i}`}
                  style={{
                    position: "absolute",
                    left: pad + col * (larg + gap),
                    top: y0 + fila * ALTURA_ROTULO,
                    width: larg,
                    height: ALTURA_ROTULO - 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    opacity: pr,
                    translate: `0 ${(1 - pr) * 18}px`,
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: 12, background: it.cor, flexShrink: 0 }} />
                  {it.fracao ? (
                    <div style={{ flexShrink: 0 }}>
                      <Fracao texto={it.fracao} altura={80} cor={pal.texto} t={t} de={(b.rotulosEm ?? 0) + i * 0.3} />
                    </div>
                  ) : (
                    <div style={{ flexShrink: 0, width: 78, display: "flex", justifyContent: "center" }}>
                      <Icone nome="gota" tamanho={66} cor={ouro} p={prog(t, (b.rotulosEm ?? 0) + i * 0.3, 0.6)} peso={8} />
                    </div>
                  )}
                  <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 48, lineHeight: 1.02, color: pal.texto, whiteSpace: "nowrap" }}>{it.texto}</div>
                </div>
              );
            });
          })()
        : null}
    </div>
  );
};
