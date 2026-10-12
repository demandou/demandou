// Os 11 blocos universais, desenhados como folhas de papel postas na mesa: cada peça cai com sombra,
// tem fita crepe, tinta e marca-texto de cobalto. Tudo em coordenadas de tela (a área útil da mesa).
// No quadro deitado a mesa é o quadro da esquerda (AREA: 1020 × 800, maior que a do vertical), com
// a pessoa na moldura da direita: as folhas têm o mesmo desenho e ficam centradas nela.
import { Img, staticFile } from "remotion";
import { desliza, formatar, prog, rapido, temposDoTexto } from "../anim";
import { AREA, QUADRO } from "../layout";
import { encaixar, larguraTexto, quebrarLinhas, trechoNoTexto } from "../medida";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type { Abertura as TAbertura, Comparacao as TComparacao, Cta as TCta, Definicao as TDefinicao, Destaque as TDestaque, Frase as TFrase, Grafico as TGrafico, Numero as TNumero, Passos as TPassos, Pergunta as TPergunta, Plano, Topicos as TTopicos } from "../plano";
import { cor, fonte } from "../tema";
import { Icone } from "./Icones";
import { Fita, Papel, Rotulo, TextoNoTempo, aparece } from "./Mesa";

type P<M> = { m: M; t: number; plano: Plano; varrida: number };
const CX = AREA.x + AREA.w / 2;
const CY = AREA.y + AREA.h / 2 + 4;

// ——— abertura: o título escrito numa folha presa com fita ———
export const Abertura: React.FC<P<TAbertura>> = ({ m, t, plano, varrida }) => {
  const em = m.em ?? m.de;
  const enc = encaixar(m.texto, { largura: 800, max: 118, min: 58, linhas: 3, fonte: { peso: 800 } });
  const tempos = temposDoTexto(m.texto, em, plano.palavras, m.ate);
  const F = { peso: 800 as const };
  const larg = (s: string) => larguraTexto(s, enc.tamanho, F);
  const Wf = Math.max(...enc.linhas.map(larg)) + 100;
  const Hf = enc.linhas.length * enc.tamanho * 1.12 + 130;
  // tamanho da folha depois de cada palavra: ela cresce com o texto, ancorada no canto de cima à esquerda
  const passos: { w: number; h: number }[] = [];
  let k = 0;
  enc.linhas.forEach((linha, li) => {
    const ws = linha.split(" ");
    ws.forEach((_, wi) => {
      passos[k++] = { w: Math.max(...enc.linhas.slice(0, li).map(larg), 0, larg(ws.slice(0, wi + 1).join(" "))) + 100, h: (li + 1) * enc.tamanho * 1.12 + 130 };
    });
  });
  let ult = -1;
  tempos.forEach((tp, i) => {
    if (t >= tp) ult = i;
  });
  const antes = ult > 0 ? passos[ult - 1] : { w: Math.min(passos[0]?.w ?? 400, 420), h: passos[0]?.h ?? Hf };
  const atual = ult >= 0 ? passos[ult] : antes;
  const p = ult >= 0 ? prog(t, tempos[ult], 0.2, rapido) : 1;
  const w = Math.max(420, antes.w + (atual.w - antes.w) * p);
  const h = antes.h + (atual.h - antes.h) * p;
  const esq = CX - Wf / 2;
  const topo = CY - 10 - Hf / 2;
  return (
    <Papel t={t} em={m.de + 0.12} x={esq + w / 2} y={topo + h / 2} w={w} h={h} giro={-1.4} fita varrida={varrida}>
      <div style={{ position: "absolute", left: 50, top: 65 }}>
        <TextoNoTempo linhas={enc.linhas} tamanho={enc.tamanho} t={t} tempos={tempos} alinhar="left" destaque={trechoNoTexto(m.texto, m.destaque)} />
      </div>
    </Papel>
  );
};

// ——— topicos: etiquetas que caem uma a uma ———
const Titulo: React.FC<{ texto?: string; t: number; em: number; y: number; varrida: number }> = ({ texto, t, em, y, varrida }) =>
  texto ? (
    <Papel t={t} em={em} x={CX} y={y} w={Math.min(900, 120 + texto.length * 24)} h={62} giro={-0.8} fundo={cor.kraft} raio={6} varrida={varrida}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 32, color: cor.tinta, whiteSpace: "nowrap" }}>{texto}</div>
    </Papel>
  ) : null;

const posicoesLista = (n: number, comTitulo: boolean, detalhes: boolean[]) => {
  const topo = AREA.y + (comTitulo ? 92 : 14);
  const livre = AREA.y + AREA.h - topo - 6;
  const gap = 16;
  const h = Math.min(170, (livre - gap * (n - 1)) / n);
  return Array.from({ length: n }, (_, i) => ({ y: topo + h / 2 + i * (h + gap), h, det: detalhes[i] }));
};

const ItemDeLista: React.FC<{ item: { texto: string; em: number; detalhe?: string }; i: number; y: number; h: number; t: number; varrida: number; numerado?: boolean; marcador: string }> = ({ item, i, y, h, t, varrida, numerado, marcador }) => {
  const larg = 860;
  const enc = encaixar(item.texto, { largura: larg - 190, max: 58, min: 32, linhas: 2, fonte: { peso: 800 } });
  const det = item.detalhe ? encaixar(item.detalhe, { largura: larg - 190, max: 30, min: 24, linhas: 1, fonte: { peso: 500 } }) : null;
  const dx = [-14, 12, -6, 16, -10][i % 5];
  return (
    <Papel t={t} em={item.em + 0.04} x={CX + dx} y={y} w={larg} h={h} giro={[-1.2, 0.9, -0.6, 1.1, -0.9][i % 5]} raio={10} varrida={varrida}>
      <div style={{ position: "absolute", left: 22, top: h / 2 - 40, width: 80, height: 80, borderRadius: 40, background: cor.cobalto, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 44 }}>
        {numerado ? i + 1 : marcador}
      </div>
      <div style={{ position: "absolute", left: 128, right: 30, top: 0, height: h, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: enc.tamanho, lineHeight: 1.08, color: cor.tinta }}>
          {enc.linhas.map((l, k) => (
            <div key={k}>{l}</div>
          ))}
        </div>
        {det ? <div style={{ fontFamily: fonte, fontWeight: 500, fontSize: det.tamanho, color: cor.tintaSuave, marginTop: 4, ...aparece(t, item.em + 0.3) }}>{det.linhas.join(" ")}</div> : null}
      </div>
    </Papel>
  );
};

export const Topicos: React.FC<P<TTopicos>> = ({ m, t, varrida }) => {
  const pos = posicoesLista(m.itens.length, !!m.titulo, m.itens.map((i) => !!i.detalhe));
  return (
    <>
      <Titulo texto={m.titulo} t={t} em={m.de + 0.1} y={AREA.y + 38} varrida={varrida} />
      {m.itens.map((it, i) => (
        <ItemDeLista key={i} item={it} i={i} y={pos[i].y} h={pos[i].h} t={t} varrida={varrida} marcador="•" />
      ))}
    </>
  );
};

// ——— passos: as mesmas etiquetas, numeradas e ligadas por um barbante ———
export const Passos: React.FC<P<TPassos>> = ({ m, t, varrida }) => {
  const pos = posicoesLista(m.itens.length, !!m.titulo, m.itens.map((i) => !!i.detalhe));
  const xChip = CX - 14 - 860 / 2 + 22 + 40;
  return (
    <>
      <Titulo texto={m.titulo} t={t} em={m.de + 0.1} y={AREA.y + 38} varrida={varrida} />
      <svg style={{ position: "absolute", left: 0, top: 0, opacity: 1 - varrida }} width={QUADRO.w} height={QUADRO.h}>
        {m.itens.slice(1).map((it, i) => {
          const a = pos[i];
          const b = pos[i + 1];
          const p = prog(t, it.em - 0.15, 0.3, desliza);
          if (p <= 0) return null;
          const y1 = a.y + a.h / 2 - 2;
          const y2 = b.y - b.h / 2 + 2;
          return <line key={i} x1={xChip} y1={y1} x2={xChip} y2={y1 + (y2 - y1) * p} stroke={cor.cobalto} strokeWidth={6} strokeLinecap="round" strokeDasharray="1 12" />;
        })}
      </svg>
      {m.itens.map((it, i) => (
        <ItemDeLista key={i} item={it} i={i} y={pos[i].y} h={pos[i].h} t={t} varrida={varrida} numerado marcador="" />
      ))}
    </>
  );
};

// ——— numero: a etiqueta de preço com furo e barbante ———
export const Numero: React.FC<P<TNumero>> = ({ m, t, varrida }) => {
  const p = prog(t, m.em, 0.9, desliza);
  const v = m.valor * p;
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const texto = formatar(m.valor, casas);
  const tam = Math.min(260, Math.floor(560 / Math.max(2.4, texto.length * 0.62 + (m.prefixo?.length ?? 0) * 0.4 + (m.sufixo?.length ?? 0) * 0.4)));
  const rot = encaixar(m.rotulo, { largura: 640, max: 56, min: 32, linhas: 2, fonte: { peso: 800 } });
  return (
    <Papel t={t} em={m.de + 0.1} x={CX} y={CY + 10} w={760} h={600} giro={-2.4} fundo={cor.papel} raio={26} varrida={varrida}>
      <svg style={{ position: "absolute", left: 340, top: -150, overflow: "visible" }} width={80} height={170}>
        <path d="M40 160 C 40 100, 10 70, 40 0" fill="none" stroke={cor.kraft} strokeWidth={7} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: 360, top: 30, width: 40, height: 40, borderRadius: 20, background: cor.mesa, boxShadow: "inset 0 3px 5px rgba(60,38,16,0.5)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: fonte, fontWeight: 800, color: cor.cobalto, lineHeight: 1, whiteSpace: "nowrap" }}>
        {m.prefixo ? <span style={{ fontSize: tam * 0.5, marginRight: tam * 0.08 }}>{m.prefixo}</span> : null}
        <span style={{ fontSize: tam }}>{formatar(v, casas)}</span>
        {m.sufixo ? <span style={{ fontSize: tam * 0.5, marginLeft: tam * 0.08 }}>{m.sufixo}</span> : null}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 120 + tam * 1.12 + 26, textAlign: "center", fontFamily: fonte, fontWeight: 800, fontSize: rot.tamanho, lineHeight: 1.1, color: cor.tinta, ...aparece(t, m.rotuloEm ?? m.em + 0.5) }}>
        {rot.linhas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      {m.ilustrativo ? <div style={{ position: "absolute", right: 28, bottom: 24 }}><Rotulo texto="ilustrativo" fundo={cor.kraft} cor={cor.tinta} tamanho={24} /></div> : null}
    </Papel>
  );
};

// ——— comparacao: duas folhas lado a lado ———
export const Comparacao: React.FC<P<TComparacao>> = ({ m, t, plano, varrida }) => {
  const modo = m.modo ?? "contra";
  const cores = modo === "errado-certo" ? [cor.alerta, cor.certo] : modo === "antes-depois" ? [cor.tintaSuave, cor.cobalto] : [cor.cobalto, cor.tinta];
  const vEm = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7;
  const yBase = CY + (m.titulo ? 30 : 6);
  return (
    <>
      <Titulo texto={m.titulo} t={t} em={m.de + 0.1} y={AREA.y + 38} varrida={varrida} />
      {m.lados.map((l, i) => {
        const x = i === 0 ? CX - 240 : CX + 240;
        const venceu = m.vencedor === i && t >= vEm;
        const perdeu = m.vencedor !== undefined && m.vencedor !== i && t >= vEm;
        const img = imagemDoPlano(plano, l.imagem);
        const comImg = temImagem(img);
        const enc = encaixar(l.texto, { largura: 380, max: 58, min: 32, linhas: 3, fonte: { peso: 800 } });
        const pv = prog(t, vEm, 0.3);
        return (
          <Papel key={i} t={t} em={l.em + 0.04} x={x} y={yBase + (venceu ? -10 * pv : 0)} w={440} h={m.titulo ? 580 : 640} giro={i === 0 ? -2 : 1.8} raio={14} varrida={varrida} style={{ opacity: perdeu ? 1 - 0.4 * pv : undefined, filter: perdeu ? `saturate(${1 - 0.6 * pv})` : undefined }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 70, background: cores[i], borderRadius: "14px 14px 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 34, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase" }}>{l.rotulo}</div>
            {comImg ? (
              <div style={{ position: "absolute", left: 30, right: 30, top: 96, height: 200, borderRadius: 8, overflow: "hidden" }}>
                <Img src={staticFile(img.arquivo)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${(img.foco?.x ?? 0.5) * 100}% ${(img.foco?.y ?? 0.5) * 100}%` }} />
              </div>
            ) : null}
            <div style={{ position: "absolute", left: 30, right: 30, top: comImg ? 316 : 100, bottom: 30, display: "flex", alignItems: "center", fontFamily: fonte, fontWeight: 800, fontSize: enc.tamanho, lineHeight: 1.1, color: cor.tinta }}>
              <div>
                {enc.linhas.map((ln, k) => (
                  <div key={k}>{ln}</div>
                ))}
              </div>
            </div>
            {venceu ? (
              <div style={{ position: "absolute", right: -18, bottom: -18, width: 84, height: 84, borderRadius: 42, background: cor.certo, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.4 + 0.6 * rapidoPop(pv)})`, boxShadow: "0 6px 14px rgba(0,0,0,0.3)" }}>
                <svg width={46} height={46} viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            ) : null}
          </Papel>
        );
      })}
      <Papel t={t} em={Math.max(m.lados[0].em, m.lados[1].em) + 0.1} x={CX} y={yBase + 20} w={92} h={92} raio={46} fundo={cor.tinta} varrida={varrida}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 36, color: "#fff" }}>×</div>
      </Papel>
    </>
  );
};
const rapidoPop = (p: number) => 1 - Math.pow(1 - p, 3) * Math.cos(p * 9) * 0.3;

// ——— grafico: uma folha quadriculada com a forma desenhada a lápis ———
const PALETA = [cor.cobalto, cor.alerta, cor.certo, "#E8A33A", cor.tintaSuave, "#7A55D6"];
export const Grafico: React.FC<P<TGrafico>> = ({ m, t, varrida }) => {
  const W = 880;
  const H = m.titulo ? 560 : 620;
  const dados = m.dados ?? [];
  const unidade = m.unidade ?? "";
  const iniGraf = dados.length ? dados[0].em : (m.tendenciaEm ?? m.de + 0.2);
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const x0 = 70;
  const y0 = H - 120;
  const topo = 80;
  const wInt = W - 140;
  const conteudo = (() => {
    if (dados.length && m.forma === "barras") {
      const bw = Math.min(150, (wInt / dados.length) * 0.62);
      return dados.map((d, i) => {
        const cx = x0 + (wInt / dados.length) * (i + 0.5);
        const p = prog(t, d.em, 0.55, desliza);
        const h = ((y0 - topo) * d.valor) / max * p;
        return (
          <g key={i} opacity={t >= d.em ? 1 : 0}>
            <rect x={cx - bw / 2} y={y0 - h} width={bw} height={h} fill={PALETA[i % PALETA.length]} rx={6} />
            <text x={cx} y={y0 - h - 14} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={36} fill={cor.tinta}>{formatar(d.valor * p, Number.isInteger(d.valor) ? 0 : 1)}{unidade}</text>
            <text x={cx} y={y0 + 46} textAnchor="middle" fontFamily={fonte} fontWeight={700} fontSize={30} fill={cor.tintaSuave}>{d.rotulo}</text>
          </g>
        );
      });
    }
    if (dados.length && m.forma === "linha") {
      const pts = dados.map((d, i) => [x0 + (wInt / Math.max(1, dados.length - 1)) * i, y0 - ((y0 - topo) * d.valor) / max] as const);
      return (
        <g>
          {pts.map((pt, i) => {
            if (i === 0) return null;
            const p = prog(t, dados[i].em - 0.3, 0.35, desliza);
            const [ax, ay] = pts[i - 1];
            return <line key={i} x1={ax} y1={ay} x2={ax + (pt[0] - ax) * p} y2={ay + (pt[1] - ay) * p} stroke={cor.cobalto} strokeWidth={8} strokeLinecap="round" />;
          })}
          {pts.map((pt, i) => (
            <g key={i} opacity={t >= dados[i].em ? 1 : 0}>
              <circle cx={pt[0]} cy={pt[1]} r={13} fill="#fff" stroke={cor.cobalto} strokeWidth={7} />
              <text x={pt[0]} y={pt[1] - 26} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={34} fill={cor.tinta}>{formatar(dados[i].valor, Number.isInteger(dados[i].valor) ? 0 : 1)}{unidade}</text>
              <text x={pt[0]} y={y0 + 46} textAnchor="middle" fontFamily={fonte} fontWeight={700} fontSize={28} fill={cor.tintaSuave}>{dados[i].rotulo}</text>
            </g>
          ))}
        </g>
      );
    }
    if (dados.length && m.forma === "pizza") {
      const soma = dados.reduce((a, d) => a + d.valor, 0) || 1;
      const R = 170;
      const cx = 260;
      const cy = (H + 20) / 2;
      let acc = 0;
      return (
        <g>
          {dados.map((d, i) => {
            const frac = d.valor / soma;
            const p = prog(t, d.em, 0.5, desliza);
            const a0 = acc * Math.PI * 2 - Math.PI / 2;
            acc += frac;
            const a1 = a0 + frac * Math.PI * 2 * p;
            const grande = a1 - a0 > Math.PI ? 1 : 0;
            const dPath = p <= 0 ? "" : `M ${cx} ${cy} L ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} A ${R} ${R} 0 ${grande} 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z`;
            const ly = topo + 30 + i * 62;
            return (
              <g key={i}>
                <path d={dPath} fill={PALETA[i % PALETA.length]} stroke="#fff" strokeWidth={4} />
                <g opacity={t >= d.em ? 1 : 0}>
                  <rect x={500} y={ly} width={34} height={34} rx={6} fill={PALETA[i % PALETA.length]} />
                  <text x={548} y={ly + 28} fontFamily={fonte} fontWeight={800} fontSize={34} fill={cor.tinta}>{d.rotulo}: {formatar(d.valor, Number.isInteger(d.valor) ? 0 : 1)}{unidade}</text>
                </g>
              </g>
            );
          })}
        </g>
      );
    }
    // sem números: a forma qualitativa
    const tend = m.tendencia ?? "sobe";
    const ys = tend === "sobe" ? [0.9, 0.78, 0.62, 0.4, 0.15] : tend === "cai" ? [0.15, 0.4, 0.58, 0.78, 0.92] : [0.6, 0.25, 0.7, 0.2, 0.55];
    const pts = ys.map((f, i) => [x0 + (wInt / 4) * i, topo + (y0 - topo) * f] as const);
    const d = pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
    const p = prog(t, iniGraf, 1.0, desliza);
    return (
      <g>
        <path d={d} fill="none" stroke={tend === "cai" ? cor.alerta : cor.cobalto} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      </g>
    );
  })();
  return (
    <>
      <Titulo texto={m.titulo} t={t} em={m.de + 0.1} y={AREA.y + 38} varrida={varrida} />
      <Papel t={t} em={m.de + 0.08} x={CX} y={CY + (m.titulo ? 40 : 6)} w={W} h={H} giro={-1} raio={12} varrida={varrida} fita>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={40} x2={W - 40} y1={topo + ((y0 - topo) / 8) * i} y2={topo + ((y0 - topo) / 8) * i} stroke="rgba(47,86,224,0.14)" strokeWidth={2} />
          ))}
          <line x1={40} x2={W - 40} y1={y0} y2={y0} stroke={cor.tinta} strokeWidth={4} strokeLinecap="round" />
          {conteudo}
        </svg>
        {!dados.length || m.ilustrativo ? <div style={{ position: "absolute", right: 24, top: 22 }}><Rotulo texto="ilustrativo" fundo={cor.kraft} cor={cor.tinta} tamanho={24} /></div> : null}
      </Papel>
    </>
  );
};

// ——— destaque: a palavra que bate, carimbada num cartão ———
export const Destaque: React.FC<P<TDestaque>> = ({ m, t, varrida }) => {
  const alerta = m.nivel === "alerta";
  const enc = encaixar(alerta ? m.texto.toLocaleUpperCase("pt-BR") : m.texto, { largura: 780, max: 150, min: 64, linhas: 2, fonte: { peso: 800 } });
  const det = m.detalhe ? encaixar(m.detalhe, { largura: 760, max: 44, min: 28, linhas: 2, fonte: { peso: 700 } }) : null;
  const h = enc.linhas.length * enc.tamanho * 1.08 + 120;
  const q = prog(t, m.em, 0.2, rapido);
  return (
    <>
      <Papel t={t} em={m.em} x={CX} y={CY - (det ? 70 : 0)} w={900} h={h} giro={-2} fundo={alerta ? cor.papel : cor.cobalto} raio={14} varrida={varrida} style={{ border: alerta ? `10px solid ${cor.alerta}` : undefined }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: fonte, fontWeight: 800, fontSize: enc.tamanho, lineHeight: 1.08, color: alerta ? cor.alerta : "#fff", transform: t < m.em + 0.2 ? `scale(${1.25 - 0.25 * q})` : undefined }}>
          <div>
            {enc.linhas.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      </Papel>
      {det ? (
        <Papel t={t} em={m.detalheEm ?? m.em + 0.6} x={CX + 20} y={CY - 70 + h / 2 + 90} w={Math.min(900, 160 + (det.linhas[0]?.length ?? 10) * det.tamanho * 0.52)} h={det.linhas.length * det.tamanho * 1.2 + 44} giro={1.4} fundo={cor.kraft} raio={8} varrida={varrida}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: fonte, fontWeight: 700, fontSize: det.tamanho, lineHeight: 1.2, color: cor.tinta }}>
            <div>
              {det.linhas.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        </Papel>
      ) : null}
    </>
  );
};

// ——— definicao: a ficha de dicionário ———
export const Definicao: React.FC<P<TDefinicao>> = ({ m, t, varrida }) => {
  // termo e significado encolhem juntos até a ficha caber na área da mesa (nada vaza)
  let termo = encaixar(m.termo, { largura: 780, max: 130, min: 60, linhas: 2, fonte: { peso: 800 } });
  let sig = encaixar(m.significado, { largura: 780, max: 60, min: 34, linhas: 4, fonte: { peso: 700 } });
  const alturaDaFicha = () => 150 + termo.linhas.length * termo.tamanho * 1.05 + 50 + sig.linhas.length * sig.tamanho * 1.22 + 40;
  for (let k = 0.92; k >= 0.6 && alturaDaFicha() > AREA.h; k -= 0.08) {
    termo = encaixar(m.termo, { largura: 780, max: Math.round(130 * k), min: Math.min(60, Math.round(130 * k)), linhas: 2, fonte: { peso: 800 } });
    sig = encaixar(m.significado, { largura: 780, max: Math.round(60 * k), min: Math.min(34, Math.round(60 * k)), linhas: 4, fonte: { peso: 700 } });
  }
  const hTermo = termo.linhas.length * termo.tamanho * 1.05;
  const hSig = sig.linhas.length * sig.tamanho * 1.22;
  const H = Math.max(520, 150 + hTermo + 50 + hSig + 40);
  const reveal = prog(t, m.significadoEm, 0.5, desliza);
  return (
    <Papel t={t} em={m.em} x={CX} y={CY} w={900} h={H} giro={-1.2} raio={12} varrida={varrida} fita>
      <div style={{ position: "absolute", left: 0, right: 0, top: 96, height: 5, background: cor.alerta, opacity: 0.8 }} />
      <div style={{ position: "absolute", left: 60, top: 26, fontFamily: fonte, fontWeight: 700, fontSize: 28, color: cor.tintaSuave, letterSpacing: "0.06em" }}>O QUE É</div>
      <div style={{ position: "absolute", left: 60, top: 128, fontFamily: fonte, fontWeight: 800, fontSize: termo.tamanho, lineHeight: 1.05, color: cor.cobalto }}>
        {termo.linhas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 60, top: 128 + hTermo + 36, width: 780, fontFamily: fonte, fontWeight: 700, fontSize: sig.tamanho, lineHeight: 1.22, color: cor.tinta, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`, visibility: t >= m.significadoEm ? "visible" : "hidden" }}>
        {sig.linhas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </Papel>
  );
};

// ——— frase: o recado numa folha, palavra por palavra ———
export const Frase: React.FC<P<TFrase>> = ({ m, t, plano, varrida }) => {
  const em = m.em ?? m.de;
  const enc = encaixar(m.texto, { largura: 760, max: 96, min: 46, linhas: 4, fonte: { peso: 800 } });
  const tempos = temposDoTexto(m.texto, em, plano.palavras, m.ate);
  const h = enc.linhas.length * enc.tamanho * 1.14 + 190;
  return (
    <Papel t={t} em={m.de + 0.12} x={CX} y={CY} w={900} h={h} giro={1.2} raio={12} varrida={varrida} fita>
      <div style={{ position: "absolute", left: 40, top: 6, fontFamily: fonte, fontWeight: 800, fontSize: 190, lineHeight: 1, color: cor.cobaltoClaro }}>“</div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 110 }}>
        <TextoNoTempo linhas={enc.linhas} tamanho={enc.tamanho} t={t} tempos={tempos} alinhar="left" destaque={trechoNoTexto(m.texto, m.destaque)} risco={trechoNoTexto(m.texto, m.risco)} riscoEm={m.riscoEm ?? em + 1} />
      </div>
    </Papel>
  );
};

// ——— pergunta: a pergunta e as opções em post-its ———
const POSTITS = ["#FFE680", "#BFE3C6", "#FFC9B8", "#CFD9FF"];
export const Pergunta: React.FC<P<TPergunta>> = ({ m, t, varrida }) => {
  const em = m.em ?? m.de;
  const ops = m.opcoes ?? [];
  const larg = ops.length <= 2 ? 440 : 300;
  const linhasOp = ops.length === 4 ? 2 : ops.length ? 1 : 0;
  const hOp = ops.length <= 2 ? 300 : 210;
  const VAO_OP = 40;
  const VAO_LINHA = 20;
  // a pergunta encolhe até a folha e os post-its caberem juntos na área da mesa (nada vaza)
  const alturaOps = linhasOp ? VAO_OP + linhasOp * hOp + (linhasOp - 1) * VAO_LINHA + 12 : 0;
  let enc = encaixar(m.texto, { largura: 780, max: 100, min: 50, linhas: 3, fonte: { peso: 800 } });
  for (let max = 100; max >= 50 && enc.linhas.length * enc.tamanho * 1.12 + 110 + alturaOps > AREA.h - 20; max -= 6) {
    enc = encaixar(m.texto, { largura: 780, max, min: Math.min(50, max), linhas: 3, fonte: { peso: 800 } });
  }
  const hQ = enc.linhas.length * enc.tamanho * 1.12 + 110;
  const sobra = Math.max(0, AREA.h - 20 - hQ - alturaOps);
  const yQ = ops.length ? AREA.y + 10 + sobra / 2 + hQ / 2 : CY;
  return (
    <>
      <Papel t={t} em={em + 0.1} x={CX} y={yQ} w={900} h={hQ} giro={-1} raio={12} varrida={varrida} fita>
        <div style={{ position: "absolute", right: 36, top: -10, fontFamily: fonte, fontWeight: 800, fontSize: 200, color: cor.cobaltoClaro, lineHeight: 1 }}>?</div>
        <div style={{ position: "absolute", left: 60, right: 60, top: 55, fontFamily: fonte, fontWeight: 800, fontSize: enc.tamanho, lineHeight: 1.12, color: cor.tinta }}>
          {enc.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </Papel>
      {ops.map((o, i) => {
        const e2 = encaixar(o.texto, { largura: larg - 50, max: 48, min: 28, linhas: 3, fonte: { peso: 800 } });
        const cols = ops.length <= 2 ? ops.length : ops.length === 3 ? 3 : 2;
        const col = ops.length === 4 ? i % 2 : i;
        const row = ops.length === 4 ? Math.floor(i / 2) : 0;
        const x = CX + (col - (cols - 1) / 2) * (larg + 36);
        const y = yQ + hQ / 2 + VAO_OP + hOp / 2 + row * (hOp + VAO_LINHA);
        return (
          <Papel key={i} t={t} em={o.em + 0.04} x={x} y={y} w={larg} h={hOp} giro={[-3, 2.5, -2, 3][i % 4]} fundo={POSTITS[i % 4]} raio={4} varrida={varrida}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, fontFamily: fonte, fontWeight: 800, fontSize: e2.tamanho, lineHeight: 1.1, color: cor.tinta }}>
              <div>
                {e2.linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
            </div>
          </Papel>
        );
      })}
    </>
  );
};

// ——— cta: o recado final num cartão com o ícone ———
export const Cta: React.FC<P<TCta>> = ({ m, t, plano, varrida }) => {
  const em = m.em ?? m.de;
  const enc = encaixar(m.texto, { largura: 620, max: 78, min: 40, linhas: 2, fonte: { peso: 800 } });
  const tempos = temposDoTexto(m.texto, em, plano.palavras, m.ate + 0.5);
  const h = Math.max(140, enc.linhas.length * enc.tamanho * 1.12 + 50);
  const pi = prog(t, m.de + 0.2, 0.4, rapido);
  return (
    <Papel t={t} em={m.de + 0.1} x={CX} y={AREA.y + AREA.h - h / 2 - 8} w={940} h={h} giro={-1} raio={14} varrida={varrida} fundo={cor.papel} fita>
      <div style={{ position: "absolute", left: 40, top: h / 2 - 66, width: 132, height: 132, borderRadius: 66, background: cor.cobalto, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * pi}) rotate(${(1 - pi) * -20}deg)`, boxShadow: "0 8px 18px rgba(28,58,174,0.4)" }}>
        <Icone nome={m.icone ?? "salvar"} tamanho={74} />
      </div>
      <div style={{ position: "absolute", left: 210, top: 0, height: h, display: "flex", alignItems: "center" }}>
        <TextoNoTempo linhas={enc.linhas} tamanho={enc.tamanho} t={t} tempos={tempos} alinhar="left" destaque={trechoNoTexto(m.texto, m.destaque)} />
      </div>
    </Papel>
  );
};

export { quebrarLinhas, Fita };
