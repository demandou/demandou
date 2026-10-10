// O miolo dos cartões da pilha: cada bloco da mesa e do cronograma vira um cartão de papel algodão
// com o cabeçalho em caligrafia, o filete com o losango azul e o conteúdo escrito a lápis, que ganha
// tinta quando é dito. Tudo é medido para caber no miolo do cartão (692 × 426 px).
import { limitar, mistura, pena, prog, temposDoTexto, Traco } from "../anim";
import { E, type Encaixe, encaixar, type Estilo, largura, type Pedaco, pedeGravado, separar } from "../medida";
import type { Comparacao, Grafico, Item, Marco, Palavra, Passos, Topicos } from "../plano";
import { cor, formatar, gravado, MIOLO, romano, TAM } from "../tema";
import { Icone, Losango } from "./Icones";
import { Selo } from "./Selo";
import { TextoEscrito } from "./Texto";

const pedacos = (ws: string[], estilo: (w: string, i: number) => Estilo): Pedaco[] => ws.map((w, i) => ({ w, e: estilo(w, i) }));
const estiloTexto = (w: string): Estilo => (pedeGravado(w) ? { ...E.numero, escala: 0.8, entrelinha: 1.08 } : { ...E.texto, entrelinha: 1.08 });

// ——— cabeçalho: caligrafia (ou letra gravada, se tiver algarismo ou símbolo) e o filete ———
type Cabecalho = { ps: Pedaco[]; enc: Encaixe; altura: number; gap: number };

const medirCabecalho = (txt: string | undefined, max = TAM.cabecalhoCartao): Cabecalho | null => {
  const ws = separar(txt ?? "");
  if (!ws.length) return null;
  const gravadoTodo = pedeGravado(txt ?? "");
  const ps = pedacos(ws, () => (gravadoTodo ? { ...E.numero, entrelinha: 1.12 } : { ...E.caligrafia, entrelinha: 1.12 }));
  const maxCorpo = gravadoTodo ? Math.min(72, max) : max;
  let enc = encaixar(ps, { largura: MIOLO.w, max: maxCorpo, min: gravadoTodo ? 48 : 62, linhas: 1, gap: 0.22 });
  if (enc.linhas.length > 1 || enc.largura > MIOLO.w) enc = encaixar(ps, { largura: MIOLO.w, max: gravadoTodo ? 56 : 72, min: gravadoTodo ? 40 : 56, linhas: 2, gap: 0.22 });
  return { ps, enc, altura: enc.altura + 30, gap: 0.22 };
};

const CabecalhoDoCartao: React.FC<{ c: Cabecalho; tempos: number[]; t: number; pousou: number }> = ({ c, tempos, t, pousou }) => {
  const pFilete = prog(t, pousou - 0.1, 0.6, pena);
  return (
    <>
      <TextoEscrito ps={c.ps} enc={c.enc} tempos={tempos} t={t} cor={cor.tinta} esboco={cor.lapis} gap={c.gap} dur={0.42} />
      <svg width={420} height={26} viewBox="-210 -13 420 26" style={{ marginTop: 4, overflow: "visible", flexShrink: 0 }}>
        <Traco d="M-200 0 H-16" p={pFilete} cor={cor.tinta} largura={1.6} opacity={0.6} />
        <Traco d="M200 0 H16" p={pFilete} cor={cor.tinta} largura={1.6} opacity={0.6} />
        <path d="M0 -8 L8 0 L0 8 L-8 0 Z" fill={cor.cera} opacity={pFilete} />
      </svg>
    </>
  );
};

const Miolo: React.FC<{ children: React.ReactNode; padding?: string }> = ({ children, padding = "40px 64px 36px" }) => (
  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding }}>{children}</div>
);

// ——— lista de itens (marco, tópicos, passos): marcador + texto (+ detalhe), cada um no seu `em` ———
type Marcador = { tipo: "icone"; nome: NonNullable<Item["icone"]> } | { tipo: "losango" } | { tipo: "numeral"; texto: string } | { tipo: "nenhum" };

type LinhaMedida = { ps: Pedaco[]; enc: Encaixe; psD?: Pedaco[]; encD?: Encaixe };

const medirLista = (itens: Item[], larguraTexto: (corpo: number) => number, disponivel: number, base: number) => {
  const medir = (corpo: number): LinhaMedida[] =>
    itens.map((it) => {
      const ps = pedacos(separar(it.texto), estiloTexto);
      const enc = encaixar(ps, { largura: larguraTexto(corpo), max: corpo, min: corpo, linhas: 2, gap: 0.24, equilibrar: false });
      if (!it.detalhe) return { ps, enc };
      const psD = pedacos(separar(it.detalhe), () => ({ ...E.italico, entrelinha: 1.08 }));
      const cd = Math.max(32, Math.round(corpo * 0.78));
      const encD = encaixar(psD, { largura: larguraTexto(corpo), max: cd, min: cd, linhas: 2, gap: 0.24, equilibrar: false });
      return { ps, enc, psD, encD };
    });
  const altura = (ls: LinhaMedida[], gap: number) => ls.reduce((s, l) => s + l.enc.altura + (l.encD ? l.encD.altura + 2 : 0), 0) + Math.max(0, ls.length - 1) * gap;
  const cabe = (ls: LinhaMedida[], corpo: number, gap: number) =>
    altura(ls, gap) <= disponivel && ls.every((l) => l.enc.tamanho >= corpo && l.enc.linhas.length <= 2 && l.enc.largura <= larguraTexto(corpo) + 1 && (!l.encD || l.encD.tamanho >= (l.encD.tamanho ?? 0)));
  // 1º: o corpo desce até o mínimo legível (44 px) com o respiro normal entre os itens;
  // 2º: o respiro diminui; 3º (lista cheia demais): o corpo desce mais um pouco. Nunca vaza.
  for (const [gap, minimo] of [
    [itens.length >= 3 ? 18 : 28, TAM.minTexto],
    [8, TAM.minTexto],
    [6, 34],
  ] as const) {
    for (let corpo = base; corpo >= minimo; corpo -= 2) {
      const ls = medir(corpo);
      if (cabe(ls, corpo, gap)) return { corpo, linhas: ls, gap };
    }
  }
  return { corpo: 34, linhas: medir(34), gap: 6 };
};

const ListaDoCartao: React.FC<{
  itens: Item[];
  marcadores: Marcador[];
  t: number;
  palavras: Palavra[];
  ate: number;
  disponivel: number;
  base: number;
  // o marcador ganha a cor de cera quando o item é dito (numerais dos passos)
  marcadorTamanho: (corpo: number) => number;
}> = ({ itens, marcadores, t, palavras, ate, disponivel, base, marcadorTamanho }) => {
  const maxW = 660;
  const temMarcador = marcadores.some((m) => m.tipo !== "nenhum");
  const larguraTexto = (corpo: number) => maxW - (temMarcador ? marcadorTamanho(corpo) + 26 : 0);
  const { corpo, linhas, gap } = medirLista(itens, larguraTexto, disponivel, base);
  const lado = marcadorTamanho(corpo);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap, maxWidth: maxW, marginTop: 4 }}>
      {itens.map((it, i) => {
        const proximo = itens[i + 1]?.em ?? ate;
        const tempos = temposDoTexto(it.texto, palavras, it.em - 0.25, Math.max(proximo, it.em + 0.6), it.em);
        const fimItem = Math.max(it.em, ...tempos);
        const tD = it.detalhe ? temposDoTexto(it.detalhe, palavras, it.em, Math.max(proximo, it.em + 1.2), fimItem + 0.2) : [];
        const pM = prog(t, it.em - 0.05, 0.55, pena);
        const mk = marcadores[i];
        const l = linhas[i];
        return (
          <div key={`${it.texto}-${i}`} style={{ display: "flex", alignItems: "center", gap: 26 }}>
            {mk.tipo === "icone" ? <Icone nome={mk.nome} tamanho={lado} p={pM} /> : null}
            {mk.tipo === "losango" ? (
              <div style={{ width: lado, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                <Losango tamanho={Math.round(corpo * 0.42)} p={pM} />
              </div>
            ) : null}
            {mk.tipo === "numeral" ? (
              <div
                style={{
                  width: lado,
                  flexShrink: 0,
                  textAlign: "center",
                  fontFamily: gravado,
                  fontWeight: 600,
                  fontSize: corpo * 0.86,
                  lineHeight: 1,
                  color: t >= it.em - 0.05 ? cor.cera : cor.lapis,
                }}
              >
                {mk.texto}
              </div>
            ) : null}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <TextoEscrito ps={l.ps} enc={l.enc} tempos={tempos} t={t} cor={cor.tinta} esboco={cor.lapis} alinhar="flex-start" gap={0.24} dur={0.36} />
              {l.psD && l.encD ? <TextoEscrito ps={l.psD} enc={l.encD} tempos={tD} t={t} cor={cor.tintaSuave} esboco={cor.lapis} alinhar="flex-start" gap={0.24} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BASE_POR_QUANTIDADE = [70, 70, 64, 60, 54, 48];
const ICONE_POR_QUANTIDADE = [88, 88, 78, 72, 64, 58];

// ——— marco: o cabeçalho por extenso e os itens com ícone ———
export const CartaoMarco: React.FC<{ m: Marco; numero: string; t: number; palavras: Palavra[]; pousou: number }> = ({ m, numero, t, palavras, pousou }) => {
  const itens = m.itens.slice(0, 4);
  const titulo = m.extenso ?? [m.numero ?? numero, m.unidade].filter(Boolean).join(" ");
  const cab = medirCabecalho(titulo);
  const numeroEm = m.numeroEm ?? m.de + 0.15;
  const tempos = cab ? temposDoTexto(titulo, palavras, m.de, m.ate, numeroEm) : [];
  const n = Math.max(1, itens.length);
  const disponivel = MIOLO.h - (cab?.altura ?? 0) - 8;
  return (
    <Miolo>
      {cab ? <CabecalhoDoCartao c={cab} tempos={tempos} t={t} pousou={pousou} /> : null}
      <ListaDoCartao
        itens={itens}
        marcadores={itens.map((it) => (it.icone ? { tipo: "icone", nome: it.icone } : { tipo: "losango" }))}
        t={t}
        palavras={palavras}
        ate={m.ate}
        disponivel={disponivel}
        base={BASE_POR_QUANTIDADE[n] ?? 48}
        marcadorTamanho={() => ICONE_POR_QUANTIDADE[n] ?? 58}
      />
    </Miolo>
  );
};

// ——— tópicos: a lista sem ordem (ícone ou losango azul em cada item) ———
export const CartaoTopicos: React.FC<{ m: Topicos; t: number; palavras: Palavra[]; pousou: number }> = ({ m, t, palavras, pousou }) => {
  const itens = m.itens.slice(0, 5);
  const cab = medirCabecalho(m.titulo);
  const tempos = cab && m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1) : [];
  const n = Math.max(1, itens.length);
  const comIcone = itens.some((it) => it.icone);
  return (
    <Miolo>
      {cab ? <CabecalhoDoCartao c={cab} tempos={tempos} t={t} pousou={pousou} /> : null}
      <ListaDoCartao
        itens={itens}
        marcadores={itens.map((it) => (it.icone ? { tipo: "icone", nome: it.icone } : { tipo: "losango" }))}
        t={t}
        palavras={palavras}
        ate={m.ate}
        disponivel={MIOLO.h - (cab?.altura ?? 0) - 8}
        base={BASE_POR_QUANTIDADE[n] ?? 48}
        marcadorTamanho={(c) => (comIcone ? (ICONE_POR_QUANTIDADE[n] ?? 58) : Math.round(c * 0.6))}
      />
    </Miolo>
  );
};

// ——— passos: a sequência numerada em romanos (os mesmos da fita) ———
export const CartaoPassos: React.FC<{ m: Passos; t: number; palavras: Palavra[]; pousou: number }> = ({ m, t, palavras, pousou }) => {
  const itens = m.itens.slice(0, 5);
  const cab = medirCabecalho(m.titulo);
  const tempos = cab && m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1) : [];
  const n = Math.max(1, itens.length);
  return (
    <Miolo>
      {cab ? <CabecalhoDoCartao c={cab} tempos={tempos} t={t} pousou={pousou} /> : null}
      <ListaDoCartao
        itens={itens}
        marcadores={itens.map((_, i) => ({ tipo: "numeral", texto: romano(i + 1) }))}
        t={t}
        palavras={palavras}
        ate={m.ate}
        disponivel={MIOLO.h - (cab?.altura ?? 0) - 8}
        base={BASE_POR_QUANTIDADE[n] ?? 48}
        marcadorTamanho={(c) => Math.round(c * 0.86 * (n >= 4 ? 1.9 : n === 3 ? 1.75 : 1.2))}
      />
    </Miolo>
  );
};

// ——— comparação: dois lados no mesmo cartão, o filete no meio, o lacre pequeno no vencedor ———
export const CartaoComparacao: React.FC<{ m: Comparacao; t: number; palavras: Palavra[]; pousou: number }> = ({ m, t, palavras, pousou }) => {
  const cab = medirCabecalho(m.titulo, 80);
  const tCab = cab && m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1) : [];
  const disponivel = MIOLO.h - (cab?.altura ?? 0) - 10;
  const col = (MIOLO.w - 70) / 2;
  const vencedorEm = m.vencedor !== undefined ? (m.vencedorEm ?? m.lados[m.vencedor].em + 0.5) : 1e6;
  const pV = prog(t, vencedorEm - 0.22, 0.5);
  const perdedor = m.vencedor === undefined ? -1 : 1 - m.vencedor;
  // o mesmo corpo nos dois lados (o maior que cabe nos dois)
  const medirLado = (corpo: number) =>
    m.lados.map((l) => encaixar(pedacos(separar(l.texto), estiloTexto), { largura: col, max: corpo, min: corpo, linhas: 3, gap: 0.24 }));
  let corpo = 76;
  let encs = medirLado(corpo);
  const alturaRotulo = 52;
  while (corpo > TAM.minTexto && encs.some((e) => e.tamanho < corpo || e.linhas.length > 3 || e.largura > col + 1 || e.altura + alturaRotulo > disponivel - 20)) {
    corpo -= 2;
    encs = medirLado(corpo);
  }
  const pFio = prog(t, pousou - 0.1, 0.7, pena);
  const sinal = m.modo === "antes-depois" ? "seta" : m.modo === "errado-certo" ? "nada" : "x";
  return (
    <Miolo>
      {cab ? <CabecalhoDoCartao c={cab} tempos={tCab} t={t} pousou={pousou} /> : null}
      <div style={{ flex: 1, width: MIOLO.w, display: "flex", alignItems: "stretch", marginTop: 6, position: "relative" }}>
        {m.lados.map((l, i) => {
          const ws = separar(l.texto);
          const tempos = temposDoTexto(l.texto, palavras, l.em - 0.25, (i === 0 ? m.lados[1].em : m.ate) + 0.1, l.em);
          const rot = l.rotulo.toUpperCase();
          const corpoRot = Math.max(TAM.minRotulo, Math.min(38, col / Math.max(0.01, largura(rot, 1, { ...E.gravado, caixaAlta: false }))));
          const dito = t >= l.em - 0.05;
          const perde = i === perdedor;
          const errado = perde && m.modo === "errado-certo";
          const pRisco = errado ? prog(t, vencedorEm, 0.6, (x) => x) : 0;
          return (
            <div key={i} style={{ width: col, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", order: i === 0 ? 0 : 2 }}>
              <div
                style={{
                  fontFamily: gravado,
                  fontWeight: 600,
                  fontSize: corpoRot,
                  letterSpacing: "0.14em",
                  color: dito ? cor.tintaSuave : cor.lapis,
                  whiteSpace: "nowrap",
                  opacity: perde ? mistura(1, 0.6, pV) : 1,
                }}
              >
                {rot}
              </div>
              <div style={{ opacity: perde && !errado ? mistura(1, 0.55, pV) : 1 }}>
                <TextoEscrito
                  ps={pedacos(ws, estiloTexto)}
                  enc={encs[i]}
                  tempos={tempos}
                  t={t}
                  cor={errado && pRisco > 0.5 ? cor.tintaSuave : cor.tinta}
                  esboco={cor.lapis}
                  gap={0.24}
                  risco={errado ? { indices: new Set(ws.map((_, k) => k)), p: pRisco, cor: cor.alerta } : undefined}
                />
              </div>
              {m.vencedor === i ? (
                <div style={{ position: "absolute", right: -18, top: -14, width: 0, height: 0 }}>
                  <Selo cx={0} cy={0} diametro={78} p={limitar((t - (vencedorEm - 0.22)) / 0.5)} semente={2.9 + i} />
                </div>
              ) : null}
            </div>
          );
        })}
        {/* o filete do meio, com o sinal da comparação */}
        <div style={{ width: 70, order: 1, position: "relative" }}>
          <svg width={70} height="100%" viewBox="0 0 70 300" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Traco d="M35 10 V120" p={pFio} cor={cor.tinta} largura={1.6} opacity={0.55} vectorEffect="non-scaling-stroke" />
            <Traco d="M35 180 V290" p={pFio} cor={cor.tinta} largura={1.6} opacity={0.55} vectorEffect="non-scaling-stroke" />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <svg width={56} height={56} viewBox="-28 -28 56 56" style={{ overflow: "visible", opacity: prog(t, m.lados[1].em - 0.3, 0.4) }}>
              {sinal === "x" ? <path d="M-11 -11 L11 11 M11 -11 L-11 11" stroke={cor.cera} strokeWidth={4.5} strokeLinecap="round" /> : null}
              {sinal === "seta" ? <path d="M-14 0 H12 M2 -10 L13 0 L2 10" fill="none" stroke={cor.cera} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
              {sinal === "nada" ? <path d="M0 -8 L8 0 L0 8 L-8 0 Z" fill={cor.cera} /> : null}
            </svg>
          </div>
        </div>
      </div>
    </Miolo>
  );
};

// ——— gráfico: barras de cetim, linha a pena, anel; ou a tendência a pena, ilustrativa ———
const PALETA = [cor.fita, cor.cera, cor.tintaSuave, cor.ceraBrilho, cor.fitaBrilho, cor.linhoLapis];

const valorTexto = (v: number, unidade?: string) => {
  const casas = Number.isInteger(v) ? 0 : Math.abs(v) < 10 ? 1 : 0;
  const num = formatar(v, casas);
  if (!unidade) return num;
  return unidade === "%" ? `${num}%` : `${num} ${unidade}`;
};

const Etiqueta: React.FC<{ texto: string; p: number }> = ({ texto, p }) => (
  <div style={{ fontFamily: gravado, fontWeight: 600, fontSize: TAM.minRotulo, letterSpacing: "0.16em", color: cor.tintaSuave, opacity: p, whiteSpace: "nowrap" }}>{texto}</div>
);

export const CartaoGrafico: React.FC<{ m: Grafico; t: number; palavras: Palavra[]; pousou: number }> = ({ m, t, palavras, pousou }) => {
  const cab = medirCabecalho(m.titulo, 80);
  const tCab = cab && m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1) : [];
  const dados = (m.dados ?? []).slice(0, 6);
  const ilustrativo = m.ilustrativo || !dados.length;
  const altura = MIOLO.h - (cab?.altura ?? 0) - 6;
  const w = MIOLO.w;
  let corpo: React.ReactNode = null;
  if (dados.length && m.forma === "barras") corpo = <Barras dados={dados} t={t} w={w} h={altura} unidade={m.unidade} />;
  else if (dados.length && m.forma === "pizza") corpo = <Anel dados={dados} t={t} w={w} h={altura} />;
  else if (dados.length) corpo = <Linha dados={dados} t={t} w={w} h={altura} unidade={m.unidade} />;
  else corpo = <Tendencia tendencia={m.tendencia ?? "sobe"} em={m.tendenciaEm ?? m.de + 0.3} t={t} w={w} h={altura} pousou={pousou} />;
  return (
    <Miolo>
      {cab ? <CabecalhoDoCartao c={cab} tempos={tCab} t={t} pousou={pousou} /> : null}
      <div style={{ position: "relative", width: w, height: altura, marginTop: 4 }}>
        {corpo}
        {ilustrativo || (m.unidade && m.forma !== "barras" && m.forma !== "linha") ? (
          <div style={{ position: "absolute", right: 0, top: 0, display: "flex", gap: 18 }}>
            {ilustrativo ? <Etiqueta texto="ILUSTRATIVO" p={prog(t, pousou, 0.5)} /> : null}
          </div>
        ) : null}
      </div>
    </Miolo>
  );
};

type Dado = { rotulo: string; valor: number; em: number };

// barras horizontais de fita de cetim, cada uma cresce quando o seu número é dito
const Barras: React.FC<{ dados: Dado[]; t: number; w: number; h: number; unidade?: string }> = ({ dados, t, w, h, unidade }) => {
  const n = dados.length;
  const max = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-9);
  const passo = (h - 20) / n;
  const corpoRot = Math.max(34, Math.min(50, passo * 0.5));
  const colRot = Math.min(w * 0.4, Math.max(...dados.map((d) => largura(d.rotulo, corpoRot, E.texto))) + 10);
  const espessura = Math.min(52, passo * 0.52);
  const corpoVal = Math.max(34, Math.min(46, passo * 0.46));
  const larguraVal = Math.max(...dados.map((d) => largura(valorTexto(d.valor, unidade), corpoVal, E.numero))) + 20;
  const barraMax = w - colRot - larguraVal - 10;
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {dados.map((d, i) => {
        const y = 20 + passo * (i + 0.5);
        const p = prog(t, d.em - 0.05, 0.8);
        const comp = Math.max(6, (Math.abs(d.valor) / max) * barraMax) * p;
        const dito = t >= d.em - 0.05;
        return (
          <g key={`${d.rotulo}-${i}`}>
            <text x={colRot - 14} y={y + corpoRot * 0.34} textAnchor="end" fontFamily={E.texto.familia} fontWeight={600} fontSize={corpoRot} fill={dito ? cor.tinta : cor.lapis}>
              {d.rotulo}
            </text>
            <line x1={colRot} x2={colRot + barraMax} y1={y} y2={y} stroke={cor.lapis} strokeWidth={2} strokeDasharray="2 8" />
            {comp > 0.5 ? (
              <>
                <rect x={colRot} y={y - espessura / 2} width={comp} height={espessura} rx={3} fill={i % 2 ? cor.fitaBrilho : cor.fita} />
                <rect x={colRot} y={y - espessura / 2 + espessura * 0.18} width={comp} height={espessura * 0.12} fill="#F3D9CB" opacity={0.25} />
              </>
            ) : null}
            <text x={colRot + comp + 14} y={y + corpoVal * 0.36} fontFamily={gravado} fontWeight={600} fontSize={corpoVal} fill={cor.tinta} opacity={prog(t, d.em + 0.3, 0.4)}>
              {valorTexto(d.valor, unidade)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// linha a pena: cada ponto entra quando é dito, o traço corre até ele
const Linha: React.FC<{ dados: Dado[]; t: number; w: number; h: number; unidade?: string }> = ({ dados, t, w, h, unidade }) => {
  const n = dados.length;
  const vals = dados.map((d) => d.valor);
  const min = Math.min(0, ...vals);
  const max = Math.max(...vals, min + 1e-9);
  const corpoRot = Math.max(34, Math.min(42, (w / n) * 0.2));
  const corpoVal = 36;
  const topo = corpoVal + 20;
  const base = h - corpoRot - 22;
  const xs = dados.map((_, i) => (n === 1 ? w / 2 : 40 + (i * (w - 80)) / (n - 1)));
  const ys = vals.map((v) => base - ((v - min) / (max - min)) * (base - topo));
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <line x1={0} x2={w} y1={base} y2={base} stroke={cor.tinta} strokeWidth={3} opacity={0.55} />
      {[0.33, 0.66].map((f) => (
        <line key={f} x1={0} x2={w} y1={base - f * (base - topo)} y2={base - f * (base - topo)} stroke={cor.lapis} strokeWidth={2} strokeDasharray="2 9" />
      ))}
      {dados.map((d, i) => {
        if (i === 0) return null;
        const p = prog(t, d.em - 0.25, 0.6, pena);
        return <Traco key={`s${i}`} d={`M${xs[i - 1]} ${ys[i - 1]} L${xs[i]} ${ys[i]}`} p={p} cor={cor.fita} largura={6} />;
      })}
      {dados.map((d, i) => {
        const p = prog(t, d.em - 0.05, 0.4);
        const dito = t >= d.em - 0.05;
        return (
          <g key={`p${i}`}>
            <path d={`M${xs[i]} ${ys[i] - 11} L${xs[i] + 11} ${ys[i]} L${xs[i]} ${ys[i] + 11} L${xs[i] - 11} ${ys[i]} Z`} fill={cor.cera} opacity={p} />
            <text x={xs[i]} y={ys[i] - 22} textAnchor="middle" fontFamily={gravado} fontWeight={600} fontSize={corpoVal} fill={cor.tinta} opacity={p}>
              {valorTexto(d.valor, unidade)}
            </text>
            <text x={xs[i]} y={base + corpoRot + 8} textAnchor="middle" fontFamily={E.texto.familia} fontWeight={600} fontSize={corpoRot} fill={dito ? cor.tinta : cor.lapis}>
              {d.rotulo}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// anel (pizza): cada fatia se desenha quando é dita; a legenda ao lado com a porcentagem
const Anel: React.FC<{ dados: Dado[]; t: number; w: number; h: number }> = ({ dados, t, w, h }) => {
  const total = dados.reduce((s, d) => s + Math.abs(d.valor), 0) || 1;
  const r = Math.min(h * 0.4, 150);
  const cx = r + 30;
  const cy = h / 2;
  let acum = 0;
  const corpoLeg = Math.max(34, Math.min(44, (h / dados.length) * 0.4));
  return (
    <>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.lapis} strokeWidth={2} strokeDasharray="2 8" />
        {dados.map((d, i) => {
          const f = Math.abs(d.valor) / total;
          const ini = acum;
          acum += f;
          const p = prog(t, d.em - 0.05, 0.8);
          return (
            <circle
              key={`f${i}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={PALETA[i % PALETA.length]}
              strokeWidth={44}
              pathLength={1}
              strokeDasharray={`${Math.max(0, f * p - 0.004)} 1`}
              strokeDashoffset={-ini}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: cx + r + 60, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
        {dados.map((d, i) => {
          const dito = t >= d.em - 0.05;
          const pct = Math.round((Math.abs(d.valor) / total) * 100);
          return (
            <div key={`l${i}`} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <svg width={22} height={22} viewBox="-11 -11 22 22" style={{ flexShrink: 0 }}>
                <path d="M0 -9 L9 0 L0 9 L-9 0 Z" fill={dito ? PALETA[i % PALETA.length] : cor.lapis} />
              </svg>
              <div style={{ fontFamily: E.texto.familia, fontWeight: 600, fontSize: corpoLeg, color: dito ? cor.tinta : cor.lapis, lineHeight: 1.05 }}>
                {d.rotulo} <span style={{ fontFamily: gravado, fontSize: corpoLeg * 0.86, color: cor.tintaSuave }}>{dito ? `${pct}%` : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// tendência (sem números ditos): uma curva a pena que se desenha na direção dita
const Tendencia: React.FC<{ tendencia: "sobe" | "cai" | "oscila"; em: number; t: number; w: number; h: number; pousou: number }> = ({ tendencia, em, t, w, h, pousou }) => {
  const topo = 56;
  const base = h - 30;
  const pontos: [number, number][] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    let y: number;
    if (tendencia === "sobe") y = 0.08 + 0.78 * f + 0.07 * Math.sin(f * 11) * (1 - f * 0.4);
    else if (tendencia === "cai") y = 0.86 - 0.74 * f + 0.07 * Math.sin(f * 11) * (1 - f * 0.4);
    else y = 0.45 + 0.26 * Math.sin(f * 9.5) + 0.05 * Math.sin(f * 23);
    pontos.push([20 + f * (w - 60), base - limitar(y) * (base - topo)]);
  }
  const d = `M${pontos.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L")}`;
  const p = prog(t, em, 1.6, pena);
  const k = Math.min(n, Math.round(p * n));
  const [px, py] = pontos[k];
  const pGrade = prog(t, pousou - 0.2, 0.6);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <line x1={0} x2={w} y1={base} y2={base} stroke={cor.tinta} strokeWidth={3} opacity={0.55 * pGrade} />
      {[0.33, 0.66].map((f) => (
        <line key={f} x1={0} x2={w} y1={base - f * (base - topo)} y2={base - f * (base - topo)} stroke={cor.lapis} strokeWidth={2} strokeDasharray="2 9" opacity={pGrade} />
      ))}
      <path d={d} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" opacity={pGrade} />
      <Traco d={d} p={p} cor={cor.fita} largura={7} />
      {p > 0.01 ? <path d={`M${px} ${py - 13} L${px + 13} ${py} L${px} ${py + 13} L${px - 13} ${py} Z`} fill={cor.cera} /> : null}
    </svg>
  );
};
