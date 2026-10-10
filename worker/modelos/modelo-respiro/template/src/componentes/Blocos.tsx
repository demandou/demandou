// Blocos universais do Respiro (além da abertura e do fechamento, que ficam em Momentos.tsx):
// topicos, passos, numero, comparacao, grafico, destaque, definicao, frase e pergunta.
// Todos são escritos no papel do diário (serifada + escrita à mão), com a forma de damasco do
// respiro quando o bloco pede (número, destaque, comparação). Todo texto é medido e cabe.
import { ar, formaOrganica, limitar, mistura, prog, saindo, temposDoTexto, Traco } from "../anim";
import type { Orbe, Retangulo } from "../layout";
import { type Encaixe, encaixar, formatarNumero } from "../medida";
import type {
  Comparacao as TComparacao,
  Definicao as TDefinicao,
  Destaque as TDestaque,
  Frase as TFrase,
  Grafico as TGrafico,
  Item,
  Numero as TNumero,
  Palavra,
  Pergunta as TPergunta,
} from "../plano";
import { duracaoDaContagem } from "../respiro";
import { cor, mao, serif } from "../tema";
import { caixa } from "./Momentos";
import { Escrita, FONTE_MAO, FONTE_SERIF, Serifa } from "./Texto";

type Props<M> = { m: M; t: number; fim: number; area: Retangulo; palavras: Palavra[]; livreEm: number };

// ---------- peças comuns ----------

type Linha = { texto: Encaixe; det?: Encaixe; h: number };

// Altura das linhas de uma lista: o corpo desce (de `maxTam` até `minTam`) até a lista caber em `disp`.
const linhasDe = (itens: { texto: string; detalhe?: string }[], largura: number, disp: number, maxTam = 92, minTam = 48, folga = 16) => {
  let saida: Linha[] = [];
  for (let max = maxTam; max >= minTam - 4; max -= 4) {
    saida = itens.map((it) => {
      const texto = encaixar(it.texto, { largura, max: Math.max(minTam, max), min: minTam, linhas: it.detalhe ? 1 : 2, fonte: FONTE_MAO(600) });
      const det = it.detalhe ? encaixar(it.detalhe, { largura, max: Math.min(52, Math.max(36, max * 0.56)), min: 34, linhas: 1, fonte: FONTE_MAO(500) }) : undefined;
      const h = Math.max(72, texto.linhas.length * texto.tamanho * 1.06 + (det ? det.tamanho * 1.08 + 2 : 0));
      return { texto, det, h };
    });
    const total = saida.reduce((s, l) => s + l.h, 0) + folga * Math.max(0, itens.length - 1);
    if (total <= disp) break;
  }
  return saida;
};

const tituloDe = (titulo: string | undefined, largura: number, max = 96) =>
  titulo ? encaixar(titulo, { largura, max, min: 56, linhas: 2, fonte: FONTE_SERIF(400) }) : undefined;
const alturaTitulo = (e?: Encaixe) => (e ? e.linhas.length * e.tamanho * 1.08 : 0);

// Marcador de um item: anel a lápis que vira uma bolinha de damasco (e respira) quando o item é dito
const Bolinha: React.FC<{ t: number; em: number; tam?: number }> = ({ t, em, tam = 76 }) => {
  const cheia = prog(t, em, 0.5);
  const respira = cheia > 0.99 ? 1 + 0.07 * Math.sin(((t - em) * 2 * Math.PI) / 3.4) : 1;
  const c = tam / 2;
  const r = tam * 0.37;
  return (
    <svg width={tam} height={tam} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" opacity={1 - cheia * 0.6} />
      <circle cx={c} cy={c} r={r * cheia * respira} fill={cor.damasco} />
      {cheia > 0.02 ? <circle cx={c} cy={c} r={r * cheia * respira} fill="none" stroke={cor.tinta} strokeWidth={3.2} opacity={cheia} /> : null}
    </svg>
  );
};

const tempoDe = (texto: string, palavras: Palavra[], em: number, livreEm: number) => temposDoTexto(texto, palavras, em - 0.3, em + 3.2, Math.max(em, livreEm));

// ---------- topicos (e o antigo `lista`) ----------
export const Topicos: React.FC<Props<{ de: number; ate: number; titulo?: string; enfase?: string; itens: Item[] }>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.55);
  const itens = m.itens.slice(0, 5);
  const tit = tituloDe(m.titulo, area.w);
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate, livreEm) : [];
  const larg = area.w - 100;
  const disp = area.h - alturaTitulo(tit) - (tit ? 28 : 0) - 24;
  const linhas = linhasDe(itens, larg, disp);
  return (
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 12 }}>
      {tit ? (
        <Serifa texto={m.titulo as string} tempos={temposTitulo} t={t} encaixe={tit} linha={1.08} grifo={m.enfase} grifoEm={m.enfase ? temposTitulo[temposTitulo.length - 1] + 0.2 : undefined} />
      ) : null}
      <div style={{ marginTop: tit ? 24 : 0 }}>
        {itens.map((it, i) => {
          const tempos = tempoDe(it.texto, palavras, it.em, livreEm);
          const temposDet = it.detalhe ? tempoDe(it.detalhe, palavras, it.em + 0.3, livreEm) : [];
          const l = linhas[i];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", minHeight: l.h, marginBottom: i < itens.length - 1 ? 16 : 0 }}>
              <div style={{ marginRight: 22 }}>
                <Bolinha t={t} em={it.em} />
              </div>
              <div>
                <Escrita texto={it.texto} tempos={tempos} t={t} encaixe={l.texto} linha={1.04} />
                {it.detalhe && l.det ? <Escrita texto={it.detalhe} tempos={temposDet} t={t} encaixe={l.det} cor={cor.tintaSuave} peso={500} linha={1.05} estilo={{ marginTop: 2 }} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- passos ----------
// Estações numeradas numa linha a lápis, de cima para baixo; o ponto de damasco anda de uma para
// a outra quando cada passo é dito, e a linha ganha tinta atrás dele.
export const Passos: React.FC<Props<{ de: number; ate: number; titulo?: string; itens: Item[] }>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.55);
  const itens = m.itens.slice(0, 5);
  const tit = tituloDe(m.titulo, area.w);
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate, livreEm) : [];
  const larg = area.w - 150;
  const disp = area.h - alturaTitulo(tit) - (tit ? 28 : 0) - 24;
  const linhas = linhasDe(itens, larg, disp, 88, 48, 20);
  // centro vertical de cada estação, dentro da coluna
  const ys: number[] = [];
  let acc = 0;
  linhas.forEach((l) => {
    ys.push(acc + l.h / 2);
    acc += l.h + 20;
  });
  const alturaLista = Math.max(1, acc - 20);
  const X = 38;
  const segmento = (k: number) => `M ${X} ${ys[k]} L ${X} ${ys[k + 1]}`;
  const prof = (k: number) => prog(t, itens[k + 1].em - 0.6, 0.6, ar);
  return (
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 12 }}>
      {tit ? <Serifa texto={m.titulo as string} tempos={temposTitulo} t={t} encaixe={tit} linha={1.08} /> : null}
      <div style={{ position: "relative", marginTop: tit ? 24 : 0, height: alturaLista }}>
        <svg width={area.w} height={alturaLista} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {ys.slice(0, -1).map((_, k) => (
            <g key={k}>
              <path d={segmento(k)} stroke={cor.lapis} strokeWidth={3.5} strokeDasharray="2 12" strokeLinecap="round" />
              <Traco d={segmento(k)} p={prof(k)} cor={cor.tinta} largura={5.5} />
            </g>
          ))}
          {ys.map((y, k) => {
            const chegou = prog(t, itens[k].em, 0.45);
            return (
              <g key={k}>
                <circle cx={X} cy={y} r={34} fill={cor.papel} stroke={cor.lapis} strokeWidth={3} />
                <circle cx={X} cy={y} r={34 * chegou} fill={cor.damasco} />
                {chegou > 0.02 ? <circle cx={X} cy={y} r={34 * chegou} fill="none" stroke={cor.tinta} strokeWidth={3.5} /> : null}
                <text x={X} y={y + 15} textAnchor="middle" fontFamily={serif} fontWeight={500} fontSize={44} fill={chegou > 0.5 ? cor.tinta : cor.lapis}>
                  {k + 1}
                </text>
              </g>
            );
          })}
          {/* o ponto que anda entre as estações */}
          {ys.slice(0, -1).map((y, k) => {
            const p = prof(k);
            if (p <= 0.01 || p >= 0.99) return null;
            const py = mistura(y, ys[k + 1], p);
            return (
              <g key={`p${k}`} opacity={Math.sin(Math.PI * p)}>
                <circle cx={X} cy={py} r={15} fill={cor.damasco} />
                <circle cx={X} cy={py} r={15} fill="none" stroke={cor.tinta} strokeWidth={3} />
              </g>
            );
          })}
        </svg>
        {itens.map((it, i) => {
          const l = linhas[i];
          const tempos = tempoDe(it.texto, palavras, it.em, livreEm);
          const temposDet = it.detalhe ? tempoDe(it.detalhe, palavras, it.em + 0.3, livreEm) : [];
          return (
            <div key={i} style={{ position: "absolute", left: 100, top: ys[i] - l.h / 2, height: l.h, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Escrita texto={it.texto} tempos={tempos} t={t} encaixe={l.texto} linha={1.04} />
              {it.detalhe && l.det ? <Escrita texto={it.detalhe} tempos={temposDet} t={t} encaixe={l.det} cor={cor.tintaSuave} peso={500} linha={1.05} estilo={{ marginTop: 2 }} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- numero ----------
// O rótulo se escreve na coluna ao lado da pessoa...
export const NotaDoNumero: React.FC<Props<TNumero>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.5);
  const rotuloEm = m.rotuloEm ?? m.em;
  const enc = encaixar(m.rotulo, { largura: area.w - 10, max: 112, min: 52, linhas: 3, fonte: FONTE_MAO(700) });
  const tempos = temposDoTexto(m.rotulo, palavras, rotuloEm - 0.4, m.ate, Math.max(livreEm, rotuloEm - 0.1));
  return (
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: area.h * 0.12 }}>
      <Escrita texto={m.rotulo} tempos={tempos} t={t} encaixe={enc} peso={700} alinhar="center" linha={1.02} />
      {m.ilustrativo ? (
        <div style={{ fontFamily: mao, fontWeight: 600, fontSize: 48, color: cor.tintaSuave, marginTop: 14, opacity: prog(t, rotuloEm + 0.3, 0.5) }}>(ilustrativo)</div>
      ) : null}
    </div>
  );
};

const casasDe = (m: TNumero) => m.casas ?? Math.min(2, (String(m.valor).split(".")[1] ?? "").length);
export const textoDoNumero = (m: TNumero, valor: number) => {
  const pre = m.prefixo ? (/[A-Za-z$]$/.test(m.prefixo) ? `${m.prefixo} ` : m.prefixo) : "";
  const suf = m.sufixo ? (/^[A-Za-zÀ-ú]/.test(m.sufixo) ? ` ${m.sufixo}` : m.sufixo) : "";
  return `${pre}${formatarNumero(valor, casasDe(m))}${suf}`;
};

// ...e o número conta dentro da forma, que enche junto (a forma vem de Forma.tsx; o ar, de respiro.ts)
export const NumeroNaForma: React.FC<{ m: TNumero; orbe: Orbe; t: number; fim: number }> = ({ m, orbe, t, fim }) => {
  const entra = prog(t, m.em - 0.45, 0.45);
  const sai = saindo(t, fim, 0.45);
  if (entra <= 0.01 || sai >= 0.99 || orbe.rMax < 10) return null;
  const p = prog(t, m.em, duracaoDaContagem(m), ar);
  const final = textoDoNumero(m, m.valor);
  const largura = 470;
  const enc = encaixar(final, { largura, max: 190, min: 64, linhas: 1, fonte: FONTE_SERIF(500) });
  const atual = textoDoNumero(m, m.valor * p);
  return (
    <div
      style={{
        position: "absolute",
        left: orbe.cx - largura / 2,
        top: orbe.cy - 130,
        width: largura,
        height: 260,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: serif,
        fontWeight: 500,
        fontSize: enc.tamanho,
        lineHeight: 1,
        color: cor.tinta,
        fontVariantNumeric: "lining-nums tabular-nums",
        whiteSpace: "nowrap",
        opacity: Math.min(entra, 1 - sai),
        translate: `0 ${((1 - entra) * 24).toFixed(1)}px`,
      }}
    >
      {atual}
    </div>
  );
};

// ---------- comparacao ----------
// Duas formas lado a lado, cada uma com o seu texto. A que vence enche; a outra esvazia e fica a lápis.
export const Comparacao: React.FC<Props<TComparacao>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.55);
  const R = 232;
  const tit = tituloDe(m.titulo, area.w - 60, 84);
  const titH = tit ? alturaTitulo(tit) + 22 : 0;
  const topo = area.y + titH;
  const cy = topo + (area.y + area.h - topo) / 2;
  const centros = [area.x + area.w * 0.25, area.x + area.w * 0.75];
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate, livreEm) : [];
  const ultimaEm = Math.max(m.lados[0].em, m.lados[1].em);
  const venceEm = m.vencedorEm ?? ultimaEm + 1.1;
  const modo = m.modo ?? "contra";
  // como cada lado respira: aparece no `em`, e no fim um enche e o outro esvazia
  const arDo = (i: number) => {
    const entra = prog(t, m.lados[i].em, 1.0, ar);
    if (m.vencedor === undefined) return entra * (0.7 + 0.12 * Math.sin(t * 1.4 + i * 2));
    const decide = prog(t, venceEm, 1.0, ar);
    const alvo = m.vencedor === i ? 1 : 0.18;
    return entra * mistura(0.62, alvo, decide);
  };
  const perde = (i: number) => (m.vencedor === undefined || m.vencedor === i ? 0 : prog(t, venceEm, 0.9));
  const tamanhoInterno = R * 2 * 0.72;
  return (
    <div style={{ position: "absolute", inset: 0, ...(s <= 0.001 ? {} : { opacity: 1 - s, filter: `blur(${(s * 10).toFixed(2)}px)` }) }}>
      {tit ? (
        <div style={{ position: "absolute", left: area.x + 30, top: area.y + 8, width: area.w - 60, display: "flex", justifyContent: "center" }}>
          <Serifa texto={m.titulo as string} tempos={temposTitulo} t={t} encaixe={tit} alinhar="center" linha={1.08} />
        </div>
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {[0, 1].map((i) => {
          const k = ar(prog(t, Math.max(livreEm, m.lados[i].em - 0.7), 0.6));
          const a = arDo(i);
          const r = R * (0.62 + 0.4 * a) * (0.9 + 0.1 * k);
          const apaga = perde(i);
          return (
            <g key={i}>
              {/* o lugar a lápis (já está ali antes de o lado ser dito) */}
              <circle cx={centros[i]} cy={cy} r={R * 0.96} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 11" strokeLinecap="round" opacity={k * (1 - 0.5 * a)} />
              {a > 0.02 ? (
                <g opacity={1 - 0.45 * apaga}>
                  <path d={formaOrganica(centros[i], cy, r * 1.1, t, 0.3 + i, 1.2)} fill={cor.damascoClaro} />
                  <path d={formaOrganica(centros[i], cy, r, t * 1.1, 2.1 + i, 1)} fill={cor.damascoMedio} />
                  <path d={formaOrganica(centros[i], cy, r * 0.72, t * 1.25, 4.4 + i, 0.9)} fill={cor.damasco} />
                </g>
              ) : null}
            </g>
          );
        })}
        {/* o sinal entre as duas: × (contra) ou uma seta (antes e depois, errado e certo) */}
        {(() => {
          const p = prog(t, ultimaEm - 0.2, 0.6);
          const x = (centros[0] + centros[1]) / 2;
          const d = modo === "contra" ? `M ${x - 26} ${cy - 26} L ${x + 26} ${cy + 26} M ${x + 26} ${cy - 26} L ${x - 26} ${cy + 26}` : `M ${x - 34} ${cy} L ${x + 34} ${cy} M ${x + 12} ${cy - 22} L ${x + 36} ${cy} L ${x + 12} ${cy + 22}`;
          return <Traco d={d} p={p} cor={cor.tinta} largura={7} />;
        })()}
      </svg>
      {m.lados.map((lado, i) => {
        const apaga = perde(i);
        const encRot = encaixar(lado.rotulo, { largura: tamanhoInterno - 40, max: 56, min: 36, linhas: 1, fonte: FONTE_MAO(600) });
        const encTxt = encaixar(lado.texto, { largura: tamanhoInterno, max: 78, min: 40, linhas: 3, fonte: FONTE_SERIF(500) });
        const temposRot = temposDoTexto(lado.rotulo, palavras, lado.em - 0.4, m.ate, Math.max(livreEm + 0.3, lado.em - 0.35));
        const temposTxt = temposDoTexto(lado.texto, palavras, lado.em - 0.4, m.ate, Math.max(livreEm + 0.5, lado.em - 0.05));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: centros[i] - tamanhoInterno / 2,
              top: cy - 150,
              width: tamanhoInterno,
              height: 300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: 1 - 0.2 * apaga,
            }}
          >
            <Escrita texto={lado.rotulo} tempos={temposRot} t={t} encaixe={encRot} cor={apaga > 0.5 ? cor.lapis : cor.tintaSuave} alinhar="center" linha={1.05} />
            <Serifa texto={lado.texto} tempos={temposTxt} t={t} encaixe={encTxt} cor={apaga > 0.5 ? cor.tintaSuave : cor.tinta} alinhar="center" linha={1.06} estilo={{ marginTop: 6 }} />
          </div>
        );
      })}
    </div>
  );
};

// ---------- grafico ----------
const CORES_FATIAS = [cor.damasco, cor.damascoMedio, cor.tintaSuave, cor.grifo, cor.lapis, cor.damascoClaro];

export const Grafico: React.FC<Props<TGrafico>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.55);
  const tit = tituloDe(m.titulo, area.w, 84);
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate, livreEm) : [];
  const topo = alturaTitulo(tit) + (tit ? 36 : 12);
  const W = area.w;
  const H = Math.max(260, area.h - topo - 24);
  const dados = (m.dados ?? []).slice(0, 6);
  const comDados = dados.length >= 2;
  const maxV = Math.max(1, ...dados.map((d) => d.valor));
  const fmt = (v: number) => `${formatarNumero(v, Number.isInteger(v) ? 0 : 1)}${m.unidade ? ` ${m.unidade}` : ""}`;
  const base = H - 92; // linha de base dentro da área do gráfico
  const altMax = base - 60;
  const colW = W / Math.max(1, dados.length);

  let corpo: React.ReactNode = null;
  if (comDados && m.forma === "barras") {
    corpo = (
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <line x1={0} y1={base} x2={W} y2={base} stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.1, 0.9, ar);
          const bw = Math.min(150, colW * 0.62);
          const x = colW * i + (colW - bw) / 2;
          const h = Math.max(6, (d.valor / maxV) * altMax) * p;
          const encRot = encaixar(d.rotulo, { largura: colW - 12, max: 44, min: 30, linhas: 2, fonte: FONTE_MAO(600) });
          return (
            <g key={i}>
              <rect x={x} y={base - (d.valor / maxV) * altMax} width={bw} height={(d.valor / maxV) * altMax} rx={26} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" opacity={0.7 * (1 - p)} />
              {p > 0.01 ? (
                <>
                  <rect x={x} y={base - h} width={bw} height={h} rx={Math.min(26, h / 2)} fill={cor.damasco} />
                  <rect x={x} y={base - h} width={bw} height={h} rx={Math.min(26, h / 2)} fill="none" stroke={cor.tinta} strokeWidth={3.5} />
                </>
              ) : null}
              <text x={x + bw / 2} y={base - h - 16} textAnchor="middle" fontFamily={serif} fontWeight={500} fontSize={Math.min(60, colW * 0.34)} fill={cor.tinta} opacity={prog(t, d.em + 0.3, 0.4)}>
                {fmt(d.valor * p)}
              </text>
              <foreignObject x={colW * i} y={base + 14} width={colW} height={90}>
                <div style={{ textAlign: "center", fontFamily: mao, fontWeight: 600, fontSize: encRot.tamanho, lineHeight: 1.02, color: cor.tintaSuave, opacity: prog(t, d.em - 0.2, 0.4) }}>
                  {encRot.linhas.map((l, k) => (
                    <div key={k}>{l.join(" ")}</div>
                  ))}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    );
  } else if (comDados && m.forma === "linha") {
    const xs = dados.map((_, i) => colW * i + colW / 2);
    const ys = dados.map((d) => base - (d.valor / maxV) * altMax);
    const trecho = (i: number) => `M ${xs[i]} ${ys[i]} L ${xs[i + 1]} ${ys[i + 1]}`;
    corpo = (
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <line x1={0} y1={base} x2={W} y2={base} stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
        {dados.slice(0, -1).map((_, i) => (
          <g key={i}>
            <path d={trecho(i)} stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" opacity={0.7} />
            <Traco d={trecho(i)} p={prog(t, dados[i + 1].em - 0.55, 0.65, ar)} cor={cor.tinta} largura={6.5} />
          </g>
        ))}
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.1, 0.5);
          const encRot = encaixar(d.rotulo, { largura: colW - 12, max: 44, min: 30, linhas: 2, fonte: FONTE_MAO(600) });
          return (
            <g key={i}>
              <circle cx={xs[i]} cy={ys[i]} r={22 * p} fill={cor.damasco} />
              {p > 0.02 ? <circle cx={xs[i]} cy={ys[i]} r={22 * p} fill="none" stroke={cor.tinta} strokeWidth={3.5} /> : null}
              <text x={xs[i]} y={ys[i] - 36} textAnchor="middle" fontFamily={serif} fontWeight={500} fontSize={Math.min(56, colW * 0.34)} fill={cor.tinta} opacity={prog(t, d.em + 0.1, 0.4)}>
                {fmt(d.valor)}
              </text>
              <foreignObject x={colW * i} y={base + 14} width={colW} height={90}>
                <div style={{ textAlign: "center", fontFamily: mao, fontWeight: 600, fontSize: encRot.tamanho, lineHeight: 1.02, color: cor.tintaSuave, opacity: prog(t, d.em - 0.2, 0.4) }}>
                  {encRot.linhas.map((l, k) => (
                    <div key={k}>{l.join(" ")}</div>
                  ))}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    );
  } else if (comDados && m.forma === "pizza") {
    const soma = dados.reduce((a, d) => a + d.valor, 0) || 1;
    const R = Math.min(H * 0.36, W * 0.24);
    const cx = W * 0.3;
    const cy = H / 2 - 10;
    const circ = 2 * Math.PI * R;
    let acc = 0;
    const fatias = dados.map((d) => {
      const de = acc;
      acc += d.valor / soma;
      return { de, frac: d.valor / soma };
    });
    const colunaX = W * 0.58;
    const linhaH = Math.min(96, (H - 40) / dados.length);
    corpo = (
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
        {fatias.map((f, i) => {
          const p = prog(t, dados[i].em - 0.1, 0.8, ar);
          const compr = f.frac * circ * p;
          return compr > 0.5 ? (
            <g key={i} transform={`rotate(${-90 + f.de * 360} ${cx} ${cy})`}>
              <circle cx={cx} cy={cy} r={R} fill="none" stroke={CORES_FATIAS[i % CORES_FATIAS.length]} strokeWidth={R * 0.62} strokeDasharray={`${compr} ${circ}`} />
              <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.papel} strokeWidth={R * 0.62 + 2} strokeDasharray={`3 ${circ}`} />
            </g>
          ) : null;
        })}
        {dados.map((d, i) => {
          const p = prog(t, d.em, 0.45);
          const y = cy - (dados.length * linhaH) / 2 + i * linhaH + linhaH / 2;
          const encRot = encaixar(`${d.rotulo} · ${fmt(d.valor)}`, { largura: W - colunaX - 56, max: 54, min: 32, linhas: 2, fonte: FONTE_MAO(600) });
          return (
            <g key={i} opacity={p}>
              <circle cx={colunaX} cy={y} r={17} fill={CORES_FATIAS[i % CORES_FATIAS.length]} stroke={cor.tinta} strokeWidth={3} />
              <foreignObject x={colunaX + 36} y={y - linhaH / 2} width={W - colunaX - 40} height={linhaH}>
                <div style={{ height: "100%", display: "flex", alignItems: "center", fontFamily: mao, fontWeight: 600, fontSize: encRot.tamanho, lineHeight: 1.02, color: cor.tinta }}>
                  <div>
                    {encRot.linhas.map((l, k) => (
                      <div key={k}>{l.join(" ")}</div>
                    ))}
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    );
  } else {
    // sem números ditos: só a forma da tendência, e a etiqueta "ilustrativo"
    const tendencia = m.tendencia ?? "sobe";
    const x0 = 30;
    const x1 = W - 30;
    const yAlto = 70;
    const yBaixo = base - 20;
    const pontos: [number, number][] = [];
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const v = tendencia === "sobe" ? Math.pow(u, 1.5) * 0.92 + 0.04 + 0.05 * Math.sin(u * 14) * u : tendencia === "cai" ? 1 - (Math.pow(u, 1.4) * 0.92 + 0.04) + 0.05 * Math.sin(u * 14) * (1 - u) : 0.5 + 0.32 * Math.sin(u * 3 * Math.PI) * (0.55 + 0.45 * u);
      pontos.push([mistura(x0, x1, u), mistura(yBaixo, yAlto, limitar(v))]);
    }
    const d = `M ${pontos.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")}`;
    const comeco = m.tendenciaEm ?? m.de + 0.7;
    const p = prog(t, comeco, 1.8, ar);
    const ponta = pontos[Math.min(N, Math.round(p * N))];
    corpo = (
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <line x1={x0} y1={base} x2={x1} y2={base} stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
        <line x1={x0} y1={yAlto - 20} x2={x0} y2={base} stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
        <path d={d} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 11" strokeLinecap="round" opacity={0.7 * (1 - p)} />
        <Traco d={d} p={p} cor={cor.tinta} largura={7} />
        {p > 0.005 ? (
          <g>
            <circle cx={ponta[0]} cy={ponta[1]} r={22} fill={cor.damasco} />
            <circle cx={ponta[0]} cy={ponta[1]} r={22} fill="none" stroke={cor.tinta} strokeWidth={3.5} />
          </g>
        ) : null}
        <text x={x1} y={base + 62} textAnchor="end" fontFamily={mao} fontWeight={600} fontSize={52} fill={cor.tintaSuave} opacity={prog(t, comeco + 0.3, 0.6)}>
          (ilustrativo)
        </text>
      </svg>
    );
  }
  return (
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column" }}>
      {tit ? <Serifa texto={m.titulo as string} tempos={temposTitulo} t={t} encaixe={tit} linha={1.08} estilo={{ marginBottom: 24 }} /> : <div style={{ height: 12 }} />}
      <div style={{ position: "relative", height: H }}>{corpo}</div>
    </div>
  );
};

// ---------- destaque ----------
// Dentro da forma grande: a frase curta. "chave": a forma enche quando a frase é dita (e a frase ganha
// grifo); "alerta": a forma perde o ar e a frase é sublinhada de tinta.
export const Destaque: React.FC<Props<TDestaque>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.5);
  // o alerta esvazia a forma: o texto cabe na forma já murcha
  const largura = m.nivel === "alerta" ? 400 : 470;
  const enc = encaixar(m.texto, { largura, max: 96, min: 52, linhas: 3, fonte: FONTE_SERIF(500) });
  const detEnc = m.detalhe ? encaixar(m.detalhe, { largura, max: 60, min: 38, linhas: 2, fonte: FONTE_MAO(600) }) : undefined;
  const tempos = temposDoTexto(m.texto, palavras, m.em - 0.4, m.ate, Math.max(livreEm, m.em - 0.05));
  const detEm = m.detalheEm ?? m.em + 0.5;
  const temposDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, detEm - 0.4, m.ate, Math.max(livreEm, detEm - 0.05)) : [];
  const fimTexto = tempos[tempos.length - 1] + 0.12;
  const alerta = m.nivel === "alerta";
  const centro = { x: area.x + area.w / 2, y: area.y + area.h / 2 };
  return (
    <div style={{ position: "absolute", left: centro.x - 300, top: centro.y - 230, width: 600, height: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...(s <= 0.001 ? {} : { opacity: 1 - s, filter: `blur(${(s * 10).toFixed(2)}px)` }) }}>
      <Serifa texto={m.texto} tempos={tempos} t={t} encaixe={enc} alinhar="center" linha={1.06} grifo={alerta ? undefined : m.texto} grifoEm={alerta ? undefined : fimTexto} sublinhar={alerta ? m.texto : undefined} sublinharEm={alerta ? fimTexto : undefined} corSublinhado={cor.tinta} />
      {m.detalhe && detEnc ? <Escrita texto={m.detalhe} tempos={temposDet} t={t} encaixe={detEnc} cor={cor.tintaSuave} alinhar="center" linha={1.05} estilo={{ marginTop: 16 }} /> : null}
    </div>
  );
};

// ---------- definicao ----------
export const Definicao: React.FC<Props<TDefinicao>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.55);
  const termoEnc = encaixar(m.termo, { largura: area.w - 40, max: 124, min: 64, linhas: 2, fonte: FONTE_SERIF(500) });
  const sigEnc = encaixar(m.significado, { largura: area.w - 80, max: 88, min: 48, linhas: 3, fonte: FONTE_MAO(600) });
  const temposTermo = temposDoTexto(m.termo, palavras, m.em - 0.4, m.ate, Math.max(livreEm, m.em - 0.05));
  const temposSig = temposDoTexto(m.significado, palavras, m.significadoEm - 0.4, m.ate, Math.max(livreEm, m.significadoEm - 0.05));
  const seta = prog(t, m.significadoEm - 0.55, 0.55, ar);
  const alturaSeta = 96;
  return (
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 12 }}>
      <Serifa
        texto={m.termo}
        tempos={temposTermo}
        t={t}
        encaixe={termoEnc}
        peso={500}
        linha={1.05}
        sublinhar={m.termo}
        sublinharEm={temposTermo[temposTermo.length - 1] + 0.15}
        estilo={{ paddingBottom: 6 }}
      />
      {/* o traço que desce do termo até o significado */}
      <svg width={220} height={alturaSeta} style={{ marginLeft: 40, overflow: "visible" }}>
        <path d={`M 20 6 C 20 50, 90 40, 90 ${alturaSeta - 20}`} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" opacity={1 - seta * 0.5} />
        <Traco d={`M 20 6 C 20 50, 90 40, 90 ${alturaSeta - 20}`} p={seta} cor={cor.tinta} largura={5} />
        <Traco d={`M 70 ${alturaSeta - 38} L 90 ${alturaSeta - 16} L 110 ${alturaSeta - 38}`} p={prog(t, m.significadoEm - 0.1, 0.25)} cor={cor.tinta} largura={5} />
      </svg>
      <Escrita texto={m.significado} tempos={temposSig} t={t} encaixe={sigEnc} cor={cor.tinta} linha={1.04} />
    </div>
  );
};

// ---------- frase ----------
export const Frase: React.FC<Props<TFrase>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.55);
  const enc = encaixar(m.texto, { largura: area.w - 40, max: 104, min: 56, linhas: 4, fonte: FONTE_SERIF(400) });
  const comeco = Math.max(livreEm, m.em !== undefined ? m.em - 0.1 : 0);
  const tempos = temposDoTexto(m.texto, palavras, m.em !== undefined ? m.em - 0.1 : m.de, m.ate, comeco);
  const aspas = prog(t, comeco - 0.05, 0.6);
  return (
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 16 }}>
      <div style={{ fontFamily: serif, fontWeight: 600, fontSize: 190, lineHeight: 0.7, height: 96, color: cor.damasco, opacity: aspas, translate: `0 ${((1 - aspas) * 14).toFixed(1)}px` }}>“</div>
      <Serifa
        texto={m.texto}
        tempos={tempos}
        t={t}
        encaixe={enc}
        italico
        linha={1.1}
        grifo={m.destaque}
        grifoEm={m.destaque ? tempos[tempos.length - 1] + 0.15 : undefined}
        risco={m.risco}
        riscoEm={m.riscoEm}
      />
    </div>
  );
};

// ---------- pergunta ----------
export const Pergunta: React.FC<Props<TPergunta>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.55);
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const comeco = Math.max(livreEm, m.em !== undefined ? m.em - 0.1 : 0);
  const enc = encaixar(m.texto, { largura: area.w - 20, max: 100, min: 56, linhas: opcoes.length ? 2 : 3, fonte: FONTE_SERIF(400) });
  const tempos = temposDoTexto(m.texto, palavras, m.em !== undefined ? m.em - 0.1 : m.de, m.ate, comeco);
  const disp = area.h - alturaTitulo(enc) - 100;
  const linhas = linhasDe(opcoes.map((o) => ({ texto: o.texto })), area.w - 100, disp, 80, 48, 14);
  const ponto = prog(t, comeco - 0.1, 0.5);
  return (
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 12 }}>
      <Serifa texto={m.texto} tempos={tempos} t={t} encaixe={enc} linha={1.08} />
      {opcoes.length ? (
        <div style={{ marginTop: 26 }}>
          {opcoes.map((o, i) => {
            const tm = tempoDe(o.texto, palavras, o.em, livreEm);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", minHeight: linhas[i].h, marginBottom: i < opcoes.length - 1 ? 14 : 0 }}>
                <div style={{ marginRight: 22 }}>
                  <Bolinha t={t} em={o.em} />
                </div>
                <Escrita texto={o.texto} tempos={tm} t={t} encaixe={linhas[i].texto} linha={1.04} />
              </div>
            );
          })}
        </div>
      ) : (
        // sem opções: uma interrogação à mão pulsa embaixo, como quem espera a resposta
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 18, opacity: ponto }}>
          <svg width={92} height={92}>
            <circle cx={46} cy={46} r={36 + 3 * Math.sin(t * 2.2)} fill={cor.damasco} />
            <circle cx={46} cy={46} r={36 + 3 * Math.sin(t * 2.2)} fill="none" stroke={cor.tinta} strokeWidth={3.5} />
            <text x={46} y={64} textAnchor="middle" fontFamily={mao} fontWeight={700} fontSize={60} fill={cor.tinta}>
              ?
            </text>
          </svg>
        </div>
      )}
    </div>
  );
};
