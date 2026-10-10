// Os blocos de texto do caderno (universais): `destaque`, `definicao`, `frase` e `pergunta`.
// Com a foto no topo, a folha tem a linha impressa e o texto grande embaixo; com a foto num canto,
// o cabeçalho ao lado dela ganha o sinal do bloco desenhado à mão (o "!" do alerta, as aspas, o "?")
// e o texto vai para o corpo da folha. Tudo escrito à mão na fala, medido para caber.
import { caneta, limitar, prog } from "../anim";
import { Impresso } from "../componentes/Cabecalho";
import type { Regiao } from "../layout";
import type { Definicao, Destaque, Frase, Pergunta } from "../plano";
import { duracaoEscrita, PalavraAMao } from "../tinta/Escrita";
import { Definicoes, Esboco, Seta, Traco } from "../tinta/Tinta";
import { cor, H, mao, W } from "../tema";
import type { PropsFigura } from "./comum";
import { prepararTexto, TextoAMao } from "./texto";
import { LinhaImpressa } from "./Topo";

// A folha de um bloco de texto: onde vai o texto e onde vai o sinal (no cabeçalho ou acima do texto)
const folhaDeTexto = (areas: PropsFigura<unknown>["areas"], t: number, revela: number, rotulo?: string, opCabecalho = 1) => {
  if (areas.cabecalho) {
    const c = areas.cabecalho;
    return {
      lado: true,
      elemento: (
        <div style={{ position: "absolute", left: c.x, top: c.y, width: c.w, display: "flex", flexDirection: "column", alignItems: c.x > 540 ? "flex-end" : "flex-start", opacity: opCabecalho }}>
          {rotulo ? <Impresso texto={rotulo} larguraMax={c.w} estilo={{ marginTop: 18 }} /> : null}
          {rotulo ? <div style={{ width: "100%", height: 3, background: cor.tinta, opacity: 0.55, marginTop: 14 }} /> : null}
        </div>
      ),
      // o sinal ocupa o cabeçalho, embaixo da linha impressa
      sinal: { x: c.x, y: c.y + 96, w: c.w, h: c.h - 96 } as Regiao,
      corpo: areas.corpo,
    };
  }
  const a = areas.corpo;
  return {
    lado: false,
    elemento: <LinhaImpressa a={a} t={t} revela={revela} esquerda={rotulo} />,
    sinal: null as Regiao | null,
    corpo: { x: a.x, y: a.y + 76, w: a.w, h: a.h - 76 } as Regiao,
  };
};

// Triângulo de alerta com "!" (vermelhão) ou asterisco de anotação importante (azul), à mão
const Sinal: React.FC<{ tipo: "alerta" | "chave"; cx: number; cy: number; s: number; p: number; id: string }> = ({ tipo, cx, cy, s, p, id }) => {
  if (tipo === "alerta") {
    const tri = `M ${cx} ${cy - s * 0.58} L ${cx + s * 0.62} ${cy + s * 0.48} L ${cx - s * 0.62} ${cy + s * 0.48} Z`;
    return (
      <g filter={`url(#${id}-mao)`}>
        <Esboco d={tri} opacidade={1 - p} />
        <path d={tri} fill={cor.vermelho} opacity={0.16 * p} />
        <Traco d={tri} p={limitar(p * 1.4)} cor={cor.vermelho} largura={Math.max(6, s * 0.06)} />
        <Traco d={`M ${cx} ${cy - s * 0.22} L ${cx} ${cy + s * 0.14}`} p={limitar(p * 3 - 1.6)} cor={cor.vermelho} largura={Math.max(8, s * 0.085)} />
        {p > 0.85 ? <circle cx={cx} cy={cy + s * 0.31} r={Math.max(5, s * 0.05)} fill={cor.vermelho} /> : null}
      </g>
    );
  }
  const bracos = [0, 60, 120].map((g) => {
    const a = (g * Math.PI) / 180;
    return `M ${cx - Math.cos(a) * s * 0.45} ${cy - Math.sin(a) * s * 0.45} L ${cx + Math.cos(a) * s * 0.45} ${cy + Math.sin(a) * s * 0.45}`;
  });
  return (
    <g filter={`url(#${id}-mao)`}>
      {bracos.map((d, i) => (
        <Traco key={i} d={d} p={limitar(p * 3 - i)} cor={cor.azul} largura={Math.max(7, s * 0.08)} />
      ))}
    </g>
  );
};

const caixaAMao = (x: number, y: number, w: number, h: number) => `M ${x + 6} ${y + 2} L ${x + w} ${y - 3} L ${x + w + 4} ${y + h} L ${x - 2} ${y + h + 4} Z`;

// ---------- destaque ----------
export const NotaDestaque: React.FC<PropsFigura<Destaque>> = ({ m, t, areas, palavras, chegada, revela, opCabecalho, rotulo, id }) => {
  const folha = folhaDeTexto(areas, t, revela, rotulo, opCabecalho);
  const alerta = (m.nivel ?? "alerta") === "alerta";
  const a = folha.corpo;
  const inicio = Math.max(chegada + 0.3, revela);
  const sinalNoTopo = !folha.lado;
  const s = sinalNoTopo ? 104 : Math.min(folha.sinal?.h ?? 200, 230);
  const margem = 50;
  const texto = prepararTexto({ texto: m.texto, larguraMax: a.w - 2 * margem, max: folha.lado ? 120 : 112, min: 68, linhas: 3, palavras, de: m.de, ate: m.ate, inicio, em: m.em, cor: alerta ? cor.vermelho : cor.tinta });
  const detalhe = m.detalhe
    ? prepararTexto({ texto: m.detalhe, larguraMax: a.w - 2 * margem, max: 60, min: 44, linhas: 2, palavras, de: m.detalheEm ?? texto.fim, ate: m.ate + 0.3, inicio: Math.max(texto.fim + 0.2, inicio), em: m.detalheEm, cor: cor.tintaSuave })
    : null;
  const espacoSinal = sinalNoTopo ? s + 34 : 0;
  const alturaConteudo = espacoSinal + texto.altura + (detalhe ? detalhe.altura + 24 : 0);
  const topo = a.y + Math.max(20, (a.h - alturaConteudo) / 2);
  const yTexto = topo + espacoSinal + 26;
  const pSinal = prog(t, Math.max(m.em, inicio) - 0.1, 0.55, caneta);
  const pCaixa = prog(t, texto.fim + 0.15, 0.55, caneta);
  const caixa = caixaAMao(a.x + 14, yTexto - 34, a.w - 28, texto.altura + (detalhe ? detalhe.altura + 24 : 0) + 56);
  const cSinal = folha.sinal ? { x: folha.sinal.x + folha.sinal.w / 2, y: folha.sinal.y + folha.sinal.h / 2 } : { x: W / 2, y: topo + s / 2 };
  return (
    <>
      {folha.elemento}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        <Sinal tipo={alerta ? "alerta" : "chave"} cx={cSinal.x} cy={cSinal.y} s={s} p={pSinal} id={id} />
        <Esboco d={caixa} opacidade={1 - pCaixa} />
        <g filter={`url(#${id}-mao)`}>
          <Traco d={caixa} p={pCaixa} cor={alerta ? cor.vermelho : cor.azul} largura={5} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: a.x + margem, top: yTexto, width: a.w - 2 * margem }}>
        <TextoAMao pronto={texto} t={t} alinhar="center" />
        {detalhe ? (
          <div style={{ marginTop: 24 }}>
            <TextoAMao pronto={detalhe} t={t} alinhar="center" />
          </div>
        ) : null}
      </div>
    </>
  );
};

// ---------- definição ----------
export const NotaDefinicao: React.FC<PropsFigura<Definicao>> = ({ m, t, areas, palavras, chegada, revela, opCabecalho, rotulo, id }) => {
  const folha = folhaDeTexto(areas, t, revela, rotulo, opCabecalho);
  const inicio = Math.max(chegada + 0.3, revela);
  const a = folha.corpo;
  // o termo: no cabeçalho (foto no canto) ou no alto do corpo (foto no topo)
  const regTermo: Regiao = folha.sinal ?? { x: a.x, y: a.y, w: a.w, h: 200 };
  const termo = prepararTexto({ texto: m.termo, larguraMax: regTermo.w - 10, max: folha.lado ? 110 : 128, min: 64, linhas: folha.lado ? 3 : 2, palavras, de: m.em - 0.3, ate: m.significadoEm, inicio, em: m.em });
  const regSig: Regiao = folha.lado ? { x: a.x + 40, y: a.y + 150, w: a.w - 80, h: a.h - 190 } : { x: a.x, y: a.y + 10 + termo.altura + 130, w: a.w, h: a.h - termo.altura - 150 };
  const opcoesSig = { texto: m.significado, larguraMax: regSig.w, min: 56, linhas: 3, palavras, de: m.significadoEm - 0.3, ate: m.ate + 0.3, inicio: Math.max(inicio, termo.inicio + 0.3), em: m.significadoEm, cor: cor.azul };
  // o significado cabe na largura e na altura que sobra (nunca desce até a legenda)
  const sig0 = prepararTexto({ ...opcoesSig, max: folha.lado ? 104 : 96 });
  const sig = sig0.altura <= regSig.h ? sig0 : prepararTexto({ ...opcoesSig, max: Math.max(56, Math.floor(regSig.h / (sig0.linhas.length * 1.12))) });
  const alinharTermo = folha.lado ? (regTermo.x > 540 ? "flex-end" : "flex-start") : "center";
  const yTermo = folha.lado ? regTermo.y + Math.max(0, (regTermo.h - termo.altura) / 2 - 10) : regTermo.y + 10;
  // sublinhado ondulado do termo, quando ele termina de ser escrito
  const larguraTermo = Math.min(regTermo.w, termo.corpo * 0.5 * Math.max(...termo.linhas.map((l) => l.map((p) => p.w).join(" ").length)));
  const xSub0 = alinharTermo === "center" ? regTermo.x + regTermo.w / 2 - larguraTermo / 2 : alinharTermo === "flex-end" ? regTermo.x + regTermo.w - larguraTermo : regTermo.x;
  const ySub = yTermo + termo.altura + 4;
  const dSub = `M ${xSub0} ${ySub} C ${xSub0 + larguraTermo * 0.3} ${ySub - 12}, ${xSub0 + larguraTermo * 0.6} ${ySub + 12}, ${xSub0 + larguraTermo} ${ySub - 4}`;
  const ySig = folha.lado ? regSig.y + Math.max(0, (regSig.h - sig.altura) / 2) : regSig.y + 10;
  const pSeta = prog(t, Math.max(m.significadoEm, inicio) - 0.35, 0.4, caneta);
  const deSeta = folha.lado ? { x: xSub0 + larguraTermo / 2, y: ySub + 30 } : { x: W / 2 - 30, y: ySub + 20 };
  const ateSeta = { x: folha.lado ? a.x + a.w / 2 : W / 2 + 10, y: ySig - 14 };
  return (
    <>
      {folha.elemento}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        <Traco d={dSub} p={prog(t, termo.fim + 0.3, 0.45, caneta)} cor={cor.azul} largura={9} opacidade={0.9} />
        <Esboco d={`M ${deSeta.x} ${deSeta.y} L ${ateSeta.x} ${ateSeta.y}`} opacidade={1 - pSeta} />
        <Seta de={deSeta} ate={ateSeta} p={pSeta} curva={folha.lado ? 0.12 : 0.18} largura={6} ponta={24} />
      </svg>
      <div style={{ position: "absolute", left: regTermo.x, top: yTermo, width: regTermo.w }}>
        <TextoAMao pronto={termo} t={t} alinhar={alinharTermo} />
      </div>
      <div style={{ position: "absolute", left: regSig.x, top: ySig, width: regSig.w }}>
        <TextoAMao pronto={sig} t={t} alinhar="center" />
      </div>
    </>
  );
};

// Aspas desenhadas à mão (azul): duas gotas com cauda; `fecha` gira 180°
const Aspas: React.FC<{ x: number; y: number; s: number; p: number; fecha?: boolean }> = ({ x, y, s, p, fecha }) => {
  if (p <= 0.001) return null;
  const gota = (cx: number) => {
    const r = s * 0.17;
    const cy = y + s * 0.62;
    const cauda = `M ${cx - r * 0.9} ${cy - r * 0.2} Q ${cx - r * 1.1} ${y + s * 0.12} ${cx + r * 1.3} ${y}`;
    return (
      <g key={cx}>
        <circle cx={cx} cy={cy} r={r} fill={cor.azul} opacity={limitar(p * 2)} />
        <Traco d={cauda} p={limitar(p * 2 - 0.4)} cor={cor.azul} largura={s * 0.13} />
      </g>
    );
  };
  const w = s * 0.95;
  return <g transform={fecha ? `rotate(180 ${x + w / 2} ${y + s / 2})` : undefined}>{[x + s * 0.22, x + s * 0.68].map(gota)}</g>;
};

export const NotaFrase: React.FC<PropsFigura<Frase>> = ({ m, t, areas, palavras, chegada, revela, opCabecalho, rotulo, id }) => {
  const folha = folhaDeTexto(areas, t, revela, rotulo, opCabecalho);
  const inicio = Math.max(chegada + 0.3, revela);
  const a = folha.corpo;
  const margem = folha.lado ? 20 : 112;
  const texto = prepararTexto({ texto: m.texto, larguraMax: a.w - 2 * margem, max: 120, min: 68, linhas: 3, palavras, de: m.de, ate: m.ate, inicio, em: m.em, destaque: m.destaque, risco: m.risco, riscoEm: m.riscoEm });
  const yTexto = a.y + Math.max(30, (a.h - texto.altura) / 2);
  const pAbre = prog(t, texto.inicio - 0.15, 0.4, caneta);
  const pFecha = prog(t, texto.fim + 0.25, 0.4, caneta);
  // no cabeçalho (foto no canto): aspas grandes; com a foto no topo: nas margens do texto
  const s = folha.lado && folha.sinal ? Math.min(220, folha.sinal.h * 0.75) : 78;
  const xAbre = folha.lado && folha.sinal ? (folha.sinal.x > 540 ? folha.sinal.x + folha.sinal.w - s : folha.sinal.x) : a.x;
  const yAbre = folha.lado && folha.sinal ? folha.sinal.y + 24 : yTexto + 6;
  return (
    <>
      {folha.elemento}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        <Esboco d={`M ${xAbre} ${yAbre + s * 0.6} L ${xAbre + s * 0.4} ${yAbre + s * 0.6}`} opacidade={1 - pAbre} />
        <Aspas x={xAbre} y={yAbre} s={s} p={pAbre} />
        {!folha.lado ? <Aspas x={a.x + a.w - s} y={yTexto + texto.altura - s - 6} s={s} p={pFecha} fecha /> : null}
      </svg>
      <div style={{ position: "absolute", left: a.x + margem, top: yTexto, width: a.w - 2 * margem }}>
        <TextoAMao pronto={texto} t={t} alinhar="center" />
      </div>
    </>
  );
};

// ---------- pergunta ----------
export const NotaPergunta: React.FC<PropsFigura<Pergunta>> = ({ m, t, areas, palavras, chegada, revela, opCabecalho, rotulo, id }) => {
  const folha = folhaDeTexto(areas, t, revela, rotulo, opCabecalho);
  const inicio = Math.max(chegada + 0.3, revela);
  const a = folha.corpo;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const n = opcoes.length;
  const corpoMax = n === 0 ? 120 : folha.lado ? 96 : 84;
  const fimTexto = opcoes[0]?.em ?? m.ate;
  const texto = prepararTexto({ texto: m.texto, larguraMax: a.w - 20, max: corpoMax, min: 60, linhas: 3, palavras, de: m.de, ate: fimTexto, inicio, em: m.em });
  const caixinha = n > 2 ? 54 : 62;
  const larguraOp = a.w - caixinha - 50;
  const corpoOp = Math.min(...opcoes.map((o) => prepararTexto({ texto: o.texto, larguraMax: larguraOp, max: n > 2 ? 62 : 70, min: 44, linhas: 2, palavras, de: o.em, ate: o.em + 1, inicio }).corpo), 70);
  const ops = opcoes.map((o, i) => {
    const pronto = prepararTexto({ texto: o.texto, larguraMax: larguraOp, max: corpoOp, min: Math.min(corpoOp, 44), linhas: 2, palavras, de: o.em - 0.1, ate: opcoes[i + 1]?.em ?? m.ate, inicio, em: o.em });
    return { o, pronto, altura: Math.max(caixinha, pronto.altura) };
  });
  const vaoOp = 30;
  const alturaOps = ops.reduce((s, x) => s + x.altura + vaoOp, 0);
  const total = texto.altura + (n ? 50 + alturaOps : 0);
  // o "?" grande: no cabeçalho (foto no canto) ou à esquerda do texto
  const semSinal = !folha.lado;
  const topo = a.y + Math.max(semSinal ? 20 : 40, (a.h - total) / 2);
  let y = topo + texto.altura + 50;
  const linhas = ops.map((x) => {
    const yy = y;
    y += x.altura + vaoOp;
    return { ...x, y: yy };
  });
  const pPonto = prog(t, texto.inicio - 0.1, 0.5, caneta);
  const corpoSinal = folha.sinal ? Math.min(300, folha.sinal.h) : 0;
  return (
    <>
      {folha.elemento}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        {linhas.map((l, i) => {
          const p = prog(t, Math.max(l.o.em, inicio) - 0.15, 0.4, caneta);
          const x = a.x + 10;
          const yy = l.y + (Math.min(l.pronto.corpo * 1.12, l.altura) - caixinha) / 2;
          const d = caixaAMao(x, yy, caixinha, caixinha);
          return (
            <g key={i}>
              <Esboco d={d} opacidade={1 - p} />
              <g filter={`url(#${id}-mao)`}>
                <Traco d={d} p={p} largura={5} />
              </g>
            </g>
          );
        })}
      </svg>
      {folha.sinal ? (
        <div style={{ position: "absolute", left: folha.sinal.x, top: folha.sinal.y + 22, width: folha.sinal.w, display: "flex", justifyContent: folha.sinal.x > 540 ? "flex-end" : "flex-start", lineHeight: 1 }}>
          <PalavraAMao texto="?" corpo={corpoSinal} p={pPonto} cor={cor.azul} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: a.x + 10, top: topo, width: a.w - 20 }}>
        <TextoAMao pronto={texto} t={t} alinhar={n ? "flex-start" : "center"} />
      </div>
      {linhas.map((l, i) => (
        <div key={i} style={{ position: "absolute", left: a.x + caixinha + 40, top: l.y, width: larguraOp }}>
          <TextoAMao pronto={l.pronto} t={t} />
        </div>
      ))}
      {/* sem opções e sem cabeçalho: um "?" à mão grande, embaixo, para a página não ficar só com texto */}
      {semSinal && n === 0 ? (
        <div style={{ position: "absolute", left: 0, width: W, top: topo + texto.altura + 10, display: "flex", justifyContent: "center", fontFamily: mao }}>
          <PalavraAMao texto="?" corpo={150} p={prog(t, texto.fim + 0.2, duracaoEscrita("?"), caneta)} cor={cor.azul} />
        </div>
      ) : null}
    </>
  );
};
