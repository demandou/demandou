// A página de papel dos blocos universais, na linguagem do funil: grafite sobre papel, pontos que
// são pessoas (caem e assentam), divisas finas, selos de etapa, esboço a lápis antes da fala, o
// laranja só para o problema e o verde só para o conserto. O conteúdo fica na coluna da esquerda;
// a pessoa fica na moldura à direita (aula 9 do curso). O layout está em ../pagina.ts, em px lógicos
// (a camada da página é encolhida pela ESCALA de tema.ts).
import { apuracao, limitar, mistura, Palavras, prog, queda, saindo, temposDoTexto, Traco, troca } from "../anim";
import {
  type Cabecalho,
  direitaDaLinha,
  fileirasDasBarras,
  gradeDaPizza,
  layoutComparacao,
  layoutDefinicao,
  layoutGrafico,
  layoutPassos,
  layoutTopicos,
  legendaDaPizza,
  type Linha,
  PAGINA,
  PONTO_BARRA,
  PONTO_TOPICO,
  TUBO,
  unidadeDasBarras,
  yDosPontosDaLinha,
} from "../pagina";
import type { Comparacao, Definicao, Grafico, Item, Momento, Palavra, Passos, Topicos } from "../plano";
import { caber, cor, fonte, formatar, medir, PH, PW } from "../tema";
import { compacto } from "./Cartoes";
import { Icone } from "./Icones";

type Props<M> = { m: M; palavras: Palavra[]; t: number; entra: number; sai: number };

// ——— peças comuns ———

// A folha da página. A troca (apagar, subir, cortina) é feita por fora (troca.ts); aqui `entra` só
// marca quando os desenhos internos começam (divisas, contornos).
const Folha: React.FC<{ t: number; entra: number; sai: number; children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0, fontFamily: fonte }}>{children}</div>
);

// Texto montado palavra por palavra, já quebrado em linhas (vem do layout)
const Texto: React.FC<{
  linhas: string[][];
  texto: string;
  tamanho: number;
  palavras: Palavra[];
  de: number;
  ate: number;
  inicio: number;
  t: number;
  peso?: number;
  cor?: string;
  fantasma?: number;
  entrelinha?: number;
  corDe?: (i: number) => string | undefined;
  style?: React.CSSProperties;
}> = ({ linhas, texto, tamanho, palavras, de, ate, inicio, t, peso = 800, cor: c = cor.grafite, fantasma = 0.22, entrelinha = 1.06, corDe, style }) => {
  const tempos = temposDoTexto(texto, palavras, de, ate, inicio);
  let base = 0;
  return (
    <div style={{ fontSize: tamanho, fontWeight: peso, lineHeight: entrelinha, letterSpacing: "-0.015em", color: c, ...style }}>
      {linhas.map((l, i) => {
        const b = base;
        base += l.length;
        return <Palavras key={i} palavras={l} tempos={tempos} base={b} t={t} fantasma={fantasma} corDe={corDe} style={{ whiteSpace: "nowrap", flexWrap: "nowrap" }} />;
      })}
    </div>
  );
};

// Etiqueta "ILUSTRATIVO" no alto, à esquerda (a mesma da tela do funil)
export const EtiquetaDaPagina: React.FC<{ texto?: string; p: number; nota?: string }> = ({ texto, p, nota }) => (
  <div style={{ position: "absolute", left: PAGINA.esquerda, top: PAGINA.etiquetaY, display: "flex", alignItems: "center", gap: 18, opacity: p, translate: `${(1 - p) * -20}px 0` }}>
    {texto ? <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        height: 56,
        padding: "0 22px 0 18px",
        borderRadius: 28,
        border: `2.5px solid ${cor.grafite}`,
        color: cor.grafite,
        fontSize: 32,
        fontWeight: 800,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <svg width={14} height={14}>
        <circle cx={7} cy={7} r={6} fill={cor.grafite} />
      </svg>
      {texto}
    </div> : null}
    {nota ? (
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 34, fontWeight: 600, color: cor.grafiteSuave, whiteSpace: "nowrap" }}>
        <svg width={26} height={26}>
          <circle cx={13} cy={13} r={9} fill={cor.grafite} />
        </svg>
        = {nota}
      </div>
    ) : null}
  </div>
);

// Título da página, na largura toda, montado na fala
const TituloDaPagina: React.FC<{ cab: Cabecalho; texto?: string; palavras: Palavra[]; de: number; ate: number; t: number }> = ({ cab, texto, palavras, de, ate, t }) => {
  if (!cab.titulo || !texto) return null;
  return (
    <div style={{ position: "absolute", left: PAGINA.esquerda, top: cab.titulo.y }}>
      <Texto linhas={cab.titulo.linhas} texto={texto} tamanho={cab.titulo.tamanho} palavras={palavras} de={de - 0.3} ate={ate} inicio={de - 0.15} t={t} entrelinha={1.06} />
    </div>
  );
};

// Divisa fina entre linhas (como as do funil), que se desenha da esquerda para a direita
const Divisa: React.FC<{ y: number; x1: number; x2: number; p: number }> = ({ y, x1, x2, p }) => (
  <div style={{ position: "absolute", left: x1, top: y - 1.25, width: (x2 - x1) * p, height: 2.5, background: cor.fio }} />
);

// A mesma divisa, em pé (entre as duas colunas da comparação), desenhada de cima para baixo
const DivisaEmPe: React.FC<{ x: number; y1: number; y2: number; p: number }> = ({ x, y1, y2, p }) => (
  <div style={{ position: "absolute", left: x - 1.25, top: y1, width: 2.5, height: Math.max(0, (y2 - y1) * p), background: cor.fio }} />
);

// O "selo" do funil: uma pílula com ícone e texto curto em caixa-alta
const Selo: React.FC<{ texto: string; icone: "seta" | "alerta" | "check"; tipo: "neutro" | "alerta" | "conserto" | "esboco"; p: number; tamanho?: number }> = ({
  texto,
  icone,
  tipo,
  p,
  tamanho = 32,
}) => {
  const fundo = tipo === "alerta" ? cor.alerta : tipo === "conserto" ? cor.conserto : tipo === "neutro" ? cor.grafite : "transparent";
  const borda = tipo === "alerta" ? cor.alerta : tipo === "conserto" ? cor.conserto : tipo === "neutro" ? cor.grafite : cor.lapis;
  const c = tipo === "esboco" ? cor.lapis : cor.branco;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: tamanho * 1.6,
        padding: `0 ${tamanho * 0.6}px 0 ${tamanho * 0.42}px`,
        borderRadius: tamanho * 0.8,
        background: fundo,
        border: `2.5px ${tipo === "esboco" ? "dashed" : "solid"} ${borda}`,
        color: c,
        fontSize: tamanho,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        transformOrigin: "left center",
        scale: String(mistura(0.85, 1, p)),
      }}
    >
      <Icone nome={icone} tamanho={tamanho * 0.95} cor={c} traco={2.8} />
      {texto}
    </div>
  );
};

// O ponto (pessoa) que cai do alto e assenta, com um anel que se abre ao pousar
const PontoQueCai: React.FC<{ x: number; y: number; d: number; em: number; t: number; corDoPonto?: string; altura?: number }> = ({
  x,
  y,
  d,
  em,
  t,
  corDoPonto = cor.grafite,
  altura = 150,
}) => {
  const c = prog(t, em - 0.05, 0.55, queda);
  const anel = prog(t, em + 0.45, 0.5);
  return (
    <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      {/* esboço a lápis: o lugar do ponto, tracejado */}
      <circle cx={x} cy={y} r={d / 2 - 1.5} fill="none" stroke={cor.lapis} strokeWidth={2.5} strokeDasharray="5 5" opacity={1 - c} />
      {c > 0 ? <circle cx={x} cy={y - (1 - c) * altura} r={d / 2} fill={corDoPonto} opacity={limitar(c * 4)} /> : null}
      {anel > 0 && anel < 1 ? <circle cx={x} cy={y} r={d / 2 + 4 + 14 * anel} fill="none" stroke={corDoPonto} strokeWidth={2.5} opacity={0.5 * (1 - anel)} /> : null}
    </svg>
  );
};

const proximoEm = (itens: { em: number }[], k: number, fim: number) => itens[k + 1]?.em ?? fim;

// ——— tópicos: linhas da página, cada uma com um ponto que cai ———

export const PaginaTopicos: React.FC<Props<Topicos>> = ({ m, palavras, t, entra, sai }) => {
  const { cab, linhas } = layoutTopicos(m);
  return (
    <Folha t={t} entra={entra} sai={sai}>
      <TituloDaPagina cab={cab} texto={m.titulo} palavras={palavras} de={m.de} ate={m.itens[0]?.em ?? m.ate} t={t} />
      {linhas.map((l, k) => (
        <ItemDaLinha key={k} l={l} it={m.itens[k]} k={k} palavras={palavras} t={t} entra={entra} ate={proximoEm(m.itens, k, m.ate)} marcador="ponto" />
      ))}
    </Folha>
  );
};

const ItemDaLinha: React.FC<{
  l: Linha;
  it: Item;
  k: number;
  palavras: Palavra[];
  t: number;
  entra: number;
  ate: number;
  marcador: "ponto" | "nenhum";
}> = ({ l, it, k, palavras, t, entra, ate, marcador }) => {
  const direita = direitaDaLinha(l.topo);
  const ativo = t >= it.em - 0.05;
  return (
    <>
      {k > 0 ? <Divisa y={l.topo} x1={PAGINA.esquerda} x2={direita} p={prog(t, entra + 0.1 + 0.08 * k, 0.5, troca)} /> : null}
      {marcador === "ponto" ? <PontoQueCai x={PAGINA.esquerda + PONTO_TOPICO / 2} y={l.yTexto} d={PONTO_TOPICO} em={it.em} t={t} altura={180} /> : null}
      <div style={{ position: "absolute", left: l.x, top: l.yTexto - (l.tamanho * 1.06) / 2 }}>
        <Texto linhas={l.linhas} texto={it.texto} tamanho={l.tamanho} palavras={palavras} de={it.em - 0.3} ate={ate} inicio={it.em - 0.06} t={t} />
      </div>
      {l.detalhe && it.detalhe ? (
        <div style={{ position: "absolute", left: l.x, top: l.detalhe.y, opacity: ativo ? 1 : 0.9 }}>
          <Texto
            linhas={l.detalhe.linhas}
            texto={it.detalhe}
            tamanho={l.detalhe.tamanho}
            palavras={palavras}
            de={it.em}
            ate={ate}
            inicio={it.em + 0.25}
            t={t}
            peso={600}
            cor={cor.grafiteSuave}
            fantasma={0.3}
            entrelinha={1.12}
          />
        </div>
      ) : null}
    </>
  );
};

// ——— passos: o gargalo do funil como um tubo; um ponto desce seção a seção ———

export const PaginaPassos: React.FC<Props<Passos>> = ({ m, palavras, t, entra, sai }) => {
  const { cab, linhas } = layoutPassos(m);
  const n = linhas.length;
  const topo = linhas[0].topo + 6;
  const fundo = linhas[n - 1].fundo - 6;
  const x0 = TUBO.x;
  const x1 = TUBO.x + TUBO.largura;
  const desenho = prog(t, entra, 0.8, troca);
  // onde o ponto está: ele cai de seção em seção e pousa no número do passo dito (o número fica
  // branco sobre ele); os passos já ditos ficam com o número em grafite
  const repouso = (k: number) => linhas[k].yTexto;
  let yPonto = topo - 80;
  let alfa = 0;
  for (let k = 0; k < n; k++) {
    const c = prog(t, m.itens[k].em - 0.05, 0.6, queda);
    if (c <= 0) break;
    const de = k === 0 ? topo - 80 : repouso(k - 1);
    yPonto = mistura(de, repouso(k), c);
    alfa = 1;
  }
  const xc = (x0 + x1) / 2;
  return (
    <Folha t={t} entra={entra} sai={sai}>
      <TituloDaPagina cab={cab} texto={m.titulo} palavras={palavras} de={m.de} ate={m.itens[0]?.em ?? m.ate} t={t} />
      <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={x0} y={topo} width={TUBO.largura} height={fundo - topo} fill={cor.miolo} opacity={prog(desenho, 0.1, 0.5)} />
        {linhas.slice(1).map((l, k) => (
          <line key={k} x1={x0} y1={l.topo} x2={x0 + TUBO.largura * prog(desenho, 0.3 + 0.1 * k, 0.4)} y2={l.topo} stroke={cor.fio} strokeWidth={2.5} />
        ))}
        {/* a seção da vez ganha um tom */}
        {linhas.map((l, k) => {
          const ativa = t >= m.itens[k].em - 0.05 && (k === n - 1 || t < m.itens[k + 1].em - 0.05);
          return ativa ? <rect key={k} x={x0 + 2} y={Math.max(topo, l.topo) + 2} width={TUBO.largura - 4} height={Math.min(fundo, l.fundo) - Math.max(topo, l.topo) - 4} fill={cor.grafite} opacity={0.07} /> : null;
        })}
        <Traco d={`M ${x0} ${topo} L ${x0} ${fundo}`} p={prog(desenho, 0, 0.85)} cor={cor.grafite} largura={4.5} />
        <Traco d={`M ${x1} ${topo} L ${x1} ${fundo}`} p={prog(desenho, 0, 0.85)} cor={cor.grafite} largura={4.5} />
        <Traco d={`M ${x0} ${fundo} L ${x1} ${fundo}`} p={prog(desenho, 0.82, 0.18)} cor={cor.grafite} largura={4.5} />
        <Traco d={`M ${x0 - 20} ${topo - 10} L ${x0} ${topo}`} p={prog(desenho, 0, 0.2)} cor={cor.grafite} largura={4.5} />
        <Traco d={`M ${x1 + 20} ${topo - 10} L ${x1} ${topo}`} p={prog(desenho, 0, 0.2)} cor={cor.grafite} largura={4.5} />
        {alfa > 0 ? <circle cx={xc} cy={yPonto} r={38} fill={cor.grafite} /> : null}
      </svg>
      {linhas.map((l, k) => {
        const it = m.itens[k];
        const aceso = prog(t, it.em - 0.05, 0.3);
        // o ponto está pousado neste número (a seção da vez, depois da queda)
        const pousado = alfa > 0 && Math.abs(yPonto - l.yTexto) < 26;
        return (
          <div key={`n-${k}`}>
            <div
              style={{
                position: "absolute",
                left: x0,
                width: TUBO.largura,
                top: l.yTexto - 29,
                textAlign: "center",
                fontSize: 56,
                fontWeight: 800,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                color: pousado ? cor.branco : aceso > 0.5 ? cor.grafite : cor.lapis,
                scale: String(1 + 0.08 * Math.sin(Math.PI * aceso)),
              }}
            >
              {k + 1}
            </div>
            <ItemDaLinha l={l} it={it} k={k} palavras={palavras} t={t} entra={entra} ate={proximoEm(m.itens, k, m.ate)} marcador="nenhum" />
          </div>
        );
      })}
    </Folha>
  );
};

// ——— comparação: dois lados, lado a lado, com o selo de cada lado e a divisa em pé entre eles ———

export const PaginaComparacao: React.FC<Props<Comparacao>> = ({ m, palavras, t, entra, sai }) => {
  const { cab, lados, separadorX, separadorTopo, separadorBase } = layoutComparacao(m);
  const modo = m.modo ?? "contra";
  const vencedorEm = m.vencedor !== undefined ? (m.vencedorEm ?? m.lados[m.vencedor].em + 0.7) : undefined;
  const veredito = vencedorEm !== undefined ? prog(t, vencedorEm, 0.4) : 0;
  const segundo = prog(t, m.lados[1].em - 0.05, 0.4);
  return (
    <Folha t={t} entra={entra} sai={sai}>
      <TituloDaPagina cab={cab} texto={m.titulo} palavras={palavras} de={m.de} ate={m.lados[0].em} t={t} />
      {lados.map((l, k) => {
        const lado = m.lados[k];
        const dito = prog(t, lado.em - 0.08, 0.35);
        const errado = modo === "errado-certo" && k === 0;
        const certo = modo === "errado-certo" && k === 1;
        const perdeu = m.vencedor !== undefined && m.vencedor !== k ? veredito : 0;
        const ganhou = m.vencedor === k ? veredito : 0;
        // antes x depois: o "antes" fica para trás quando o "depois" é dito
        const atras = modo === "antes-depois" && k === 0 ? segundo : 0;
        const apaga = Math.max(perdeu * 0.55, atras * 0.5);
        const tipoSelo = dito < 0.5 ? "esboco" : errado ? "alerta" : certo || (ganhou > 0.5 && modo === "errado-certo") ? "conserto" : "neutro";
        const icone = errado ? "alerta" : certo || ganhou > 0.5 ? "check" : "seta";
        const ate = k === 0 ? m.lados[1].em : m.ate;
        const larguraTexto = Math.max(...l.linhas.map((ws) => medir(ws.join(" "), l.tamanho)));
        return (
          <div key={k} style={{ opacity: 1 - apaga }}>
            <div style={{ position: "absolute", left: l.x, top: l.rotuloY }}>
              <Selo texto={lado.rotulo} icone={icone} tipo={tipoSelo} p={dito} tamanho={38} />
            </div>
            <div style={{ position: "absolute", left: l.x, top: l.textoY }}>
              <Texto linhas={l.linhas} texto={lado.texto} tamanho={l.tamanho} palavras={palavras} de={lado.em - 0.4} ate={ate} inicio={lado.em - 0.06} t={t} />
            </div>
            {/* errado: um risco laranja logo depois de ser dito */}
            {errado
              ? l.linhas.map((ws, i) => (
                  <div
                    key={`r${i}`}
                    style={{
                      position: "absolute",
                      left: l.x - 6,
                      top: l.textoY + l.tamanho * 1.06 * i + l.tamanho * 0.56,
                      width: (medir(ws.join(" "), l.tamanho) + 12) * prog(t, m.lados[1].em - 0.05 + i * 0.12, 0.4),
                      height: Math.max(7, l.tamanho * 0.09),
                      borderRadius: 6,
                      background: cor.alerta,
                    }}
                  />
                ))
              : null}
            {/* o vencedor ganha um sublinhado grosso (verde no certo, grafite nos outros) */}
            {ganhou > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: l.x,
                  top: l.fundo + 8,
                  width: larguraTexto * ganhou,
                  height: 8,
                  borderRadius: 4,
                  background: modo === "errado-certo" ? cor.conserto : cor.grafite,
                }}
              />
            ) : null}
          </div>
        );
      })}
      {/* entre os lados: a divisa em pé com o símbolo (× contra; seta antes-depois e errado-certo) */}
      <DivisaEmPe x={separadorX} y1={separadorTopo + 130} y2={separadorBase} p={prog(t, entra + 0.2, 0.6, troca)} />
      <div
        style={{
          position: "absolute",
          left: separadorX - 50,
          top: separadorTopo,
          width: 100,
          height: 100,
          borderRadius: 50,
          border: `3px solid ${segundo > 0.5 ? cor.grafite : cor.lapis}`,
          background: cor.papel,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: prog(t, entra + 0.15, 0.4),
        }}
      >
        {modo === "contra" ? (
          <svg width={44} height={44} viewBox="0 0 34 34">
            <Traco d="M 6 6 L 28 28" p={prog(t, entra + 0.3, 0.3)} cor={segundo > 0.5 ? cor.grafite : cor.lapis} largura={4.5} />
            <Traco d="M 28 6 L 6 28" p={prog(t, entra + 0.45, 0.3)} cor={segundo > 0.5 ? cor.grafite : cor.lapis} largura={4.5} />
          </svg>
        ) : (
          <div style={{ rotate: "-90deg", display: "flex" }}>
            <Icone nome="seta" tamanho={56} cor={segundo > 0.5 ? cor.grafite : cor.lapis} traco={2.6} p={prog(t, m.lados[1].em - 0.3, 0.4)} />
          </div>
        )}
      </div>
    </Folha>
  );
};

// ——— definição: o termo passa por um funil pequeno e sai como significado ———

export const PaginaDefinicao: React.FC<Props<Definicao>> = ({ m, palavras, t, entra, sai }) => {
  const d = layoutDefinicao(m);
  const f = d.funil;
  const boca = f.largura;
  const bico = Math.round(boca * 0.16);
  const xc = f.x + boca / 2;
  const yBico = f.y + f.altura * 0.66;
  const yFim = f.y + f.altura;
  const desenho = prog(t, entra, 0.8, troca);
  const enche = prog(t, m.em + 0.05, 0.8);
  const passa = prog(t, m.significadoEm - 0.1, 1.0);
  // os pontos que enchem a boca quando o termo é dito (assentam de baixo para cima, como no funil)
  const passo = Math.max(34, Math.round(boca / 12));
  const raio = Math.round(passo * 0.36);
  const naBoca: { x: number; y: number }[] = [];
  const filas = Math.max(3, Math.min(8, Math.floor((f.altura * 0.62 - 30) / (passo * 0.92))));
  for (let fila = 0; fila < filas; fila++) {
    const y = yBico - 18 - fila * passo * 0.92 - raio;
    if (y - raio < f.y + 6) break;
    const larguraAqui = bico + (boca - bico) * ((yBico - y) / (yBico - f.y)) - 2 * raio - 24;
    const cabe = Math.max(1, Math.floor(larguraAqui / passo));
    for (let i = 0; i < cabe; i++) naBoca.push({ x: xc - ((cabe - 1) * passo) / 2 + i * passo, y });
  }
  // os três mais perto do eixo, na fila de baixo, passam pelo bico até o significado
  // os três mais perto do bico passam (o de baixo primeiro)
  const passam = [...naBoca].sort((a, b) => Math.hypot(a.x - xc, a.y - yBico) - Math.hypot(b.x - xc, b.y - yBico)).slice(0, 3);
  const paredeE = `M ${xc - boca / 2} ${f.y} L ${xc - bico / 2} ${yBico} L ${xc - bico / 2} ${yFim}`;
  const paredeD = `M ${xc + boca / 2} ${f.y} L ${xc + bico / 2} ${yBico} L ${xc + bico / 2} ${yFim}`;
  return (
    <Folha t={t} entra={entra} sai={sai}>
      <div style={{ position: "absolute", left: d.termo.x, top: d.termo.y }}>
        <Texto linhas={d.termo.linhas} texto={m.termo} tamanho={d.termo.tamanho} palavras={palavras} de={m.em - 0.4} ate={m.significadoEm} inicio={m.em - 0.06} t={t} entrelinha={1.02} />
      </div>
      <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`${paredeE} L ${xc + bico / 2} ${yFim} L ${xc + bico / 2} ${yBico} L ${xc + boca / 2} ${f.y} Z`} fill={cor.miolo} opacity={prog(desenho, 0.2, 0.5)} />
        <Traco d={paredeE} p={prog(desenho, 0, 0.9)} cor={cor.grafite} largura={4.5} />
        <Traco d={paredeD} p={prog(desenho, 0, 0.9)} cor={cor.grafite} largura={4.5} />
        <Traco d={`M ${xc - boca / 2 - 22} ${f.y - 10} L ${xc - boca / 2} ${f.y}`} p={prog(desenho, 0, 0.2)} cor={cor.grafite} largura={4.5} />
        <Traco d={`M ${xc + boca / 2 + 22} ${f.y - 10} L ${xc + boca / 2} ${f.y}`} p={prog(desenho, 0, 0.2)} cor={cor.grafite} largura={4.5} />
        {naBoca.map((p, i) => {
          const chega = limitar((enche - i * (0.6 / naBoca.length)) * 3);
          if (chega <= 0) return null;
          const desce = passam.indexOf(p);
          if (desce >= 0) {
            const q = limitar((passa - desce * 0.14) / 0.72);
            const x = mistura(p.x, xc, Math.min(1, q * 2.2));
            // assentam empilhados no fundo do bico
            const y = mistura(p.y, yFim - raio - 6 - desce * (2 * raio + 5), queda(q));
            return <circle key={i} cx={x} cy={y - (1 - chega) * 60} r={raio} fill={cor.grafite} opacity={chega * (q >= 0.98 ? 1 - limitar((passa - 0.95) * 10) * 0 : 1)} />;
          }
          // os que não passam ficam pelo caminho e apagam
          return <circle key={i} cx={p.x} cy={p.y - (1 - chega) * 60} r={raio} fill={cor.grafite} opacity={chega * mistura(1, 0.17, passa)} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: d.significado.x, top: d.significado.y }}>
        <Texto
          linhas={d.significado.linhas}
          texto={m.significado}
          tamanho={d.significado.tamanho}
          palavras={palavras}
          de={m.significadoEm - 0.3}
          ate={m.ate}
          inicio={m.significadoEm - 0.06}
          t={t}
          peso={700}
        />
      </div>
    </Folha>
  );
};

// ——— gráfico: feito de pontos ———

export const PaginaGrafico: React.FC<Props<Grafico>> = (props) => {
  const { m, palavras, t, entra, sai } = props;
  const l = layoutGrafico(m);
  const comDados = !!m.dados?.length;
  const ilustrativo = !!m.ilustrativo || !comDados;
  let nota: string | undefined;
  let corpo: React.ReactNode = null;
  if (comDados && m.forma === "barras") {
    const r = BarrasDePontos(props);
    nota = r.nota;
    corpo = r.corpo;
  } else if (comDados && m.forma === "pizza") corpo = <GradeDePontos {...props} />;
  else if (comDados) corpo = <LinhaDePontos {...props} />;
  else if (m.forma === "barras") corpo = <ColunasDeTendencia {...props} />;
  else corpo = <CurvaDeTendencia {...props} />;
  return (
    <Folha t={t} entra={entra} sai={sai}>
      {ilustrativo || nota ? <EtiquetaDaPagina texto={ilustrativo ? "Ilustrativo" : undefined} p={prog(t, entra + 0.15, 0.4)} nota={nota} /> : null}
      <TituloDaPagina cab={l.cab} texto={m.titulo} palavras={palavras} de={m.de} ate={m.dados?.[0]?.em ?? m.tendenciaEm ?? m.ate} t={t} />
      {corpo}
    </Folha>
  );
};

const comUnidade = (v: number, unidade?: string) => {
  const u = unidade?.trim();
  if (!u) return compacto(v);
  if (u === "%") return `${compacto(v)}%`;
  if (/^(R\$|US\$|€|£)$/.test(u)) return `${u} ${compacto(v)}`;
  return compacto(v);
};

// barras: uma fileira de pontos por dado; cada ponto vale um número redondo (o último pode ser parcial)
const BarrasDePontos = ({ m, palavras, t, entra }: Props<Grafico>) => {
  const dados = m.dados ?? [];
  const fileiras = fileirasDasBarras(m);
  const larguraMin = Math.min(...fileiras.map((f) => f.largura));
  const cabem = Math.max(4, Math.floor((larguraMin + PONTO_BARRA.passo - PONTO_BARRA.d) / PONTO_BARRA.passo));
  const maior = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-6);
  const unidade = REDONDO(maior, cabem);
  const nota = comUnidade(unidade, m.unidade) + (m.unidade && m.unidade !== "%" && !/^(R\$|US\$|€|£)$/.test(m.unidade.trim()) ? ` ${m.unidade}` : "");
  const corpo = (
    <>
      {fileiras.map((f, k) => {
        const d = dados[k];
        const conta = prog(t, d.em - 0.03, 0.8, apuracao);
        const quantos = Math.abs(d.valor) / unidade;
        const vagas = Math.ceil(quantos - 1e-9);
        const ate = dados[k + 1]?.em ?? m.ate;
        const r = PONTO_BARRA.d / 2;
        return (
          <div key={k}>
            {k > 0 ? <Divisa y={f.topo} x1={PAGINA.esquerda} x2={PAGINA.esquerda + f.largura} p={prog(t, entra + 0.1 + 0.08 * k, 0.5, troca)} /> : null}
            <div style={{ position: "absolute", left: PAGINA.esquerda, top: f.rotuloY, width: f.largura, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Texto linhas={f.rotulo.linhas} texto={d.rotulo} tamanho={f.rotulo.tamanho} palavras={palavras} de={d.em - 0.4} ate={ate} inicio={d.em - 0.06} t={t} peso={700} />
              <span style={{ fontSize: 46, fontWeight: 800, color: t >= d.em - 0.03 ? cor.grafite : cor.lapis, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {t >= d.em - 0.03 ? comUnidade(d.valor * conta, m.unidade) : "—"}
              </span>
            </div>
            <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
              {Array.from({ length: vagas }, (_, v) => {
                const cx = PAGINA.esquerda + r + v * PONTO_BARRA.passo;
                const cy = f.pontosY;
                const chega = limitar((conta * quantos - v) * 1.4);
                const fracao = Math.min(1, quantos - v);
                return (
                  <g key={v}>
                    <circle cx={cx} cy={cy} r={r - 1.5} fill="none" stroke={cor.lapis} strokeWidth={2.5} strokeDasharray="5 5" opacity={1 - chega} />
                    {chega > 0 ? (
                      fracao >= 0.999 ? (
                        <circle cx={cx} cy={cy - (1 - queda(chega)) * 40} r={r} fill={cor.grafite} opacity={limitar(chega * 3)} />
                      ) : (
                        <g opacity={limitar(chega * 3)}>
                          <circle cx={cx} cy={cy} r={r - 1.5} fill={cor.branco} stroke={cor.grafite} strokeOpacity={0.7} strokeWidth={3} />
                          <path d={fatia(cx, cy, r, 0, fracao)} fill={cor.grafite} />
                        </g>
                      )
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>
        );
      })}
    </>
  );
  return { nota, corpo };
};

const REDONDO = (maior: number, cabem: number) => unidadeDasBarras(maior, cabem);

const fatia = (x: number, y: number, r: number, a: number, b: number) => {
  const ang = (f: number) => -Math.PI / 2 + f * 2 * Math.PI;
  const [x0, y0] = [x + r * Math.cos(ang(a)), y + r * Math.sin(ang(a))];
  const [x1, y1] = [x + r * Math.cos(ang(b)), y + r * Math.sin(ang(b))];
  return `M ${x} ${y} L ${x0} ${y0} A ${r} ${r} 0 ${b - a > 0.5 ? 1 : 0} 1 ${x1} ${y1} Z`;
};

// linha: pontos ligados por um traço, cada um no seu `em`, com o valor em cima e o rótulo embaixo
const LinhaDePontos: React.FC<Props<Grafico>> = ({ m, t, entra }) => {
  const dados = m.dados ?? [];
  const l = layoutGrafico(m);
  const ys = yDosPontosDaLinha(m);
  const n = dados.length;
  const x0 = l.esquerda + 40;
  const x1 = l.direita - 40;
  const xs = dados.map((_, k) => (n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * k) / (n - 1)));
  const baseY = l.base - 90;
  const slot = n > 1 ? (x1 - x0) / (n - 1) : x1 - x0;
  return (
    <>
      <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={l.esquerda} y1={baseY} x2={l.esquerda + (l.direita - l.esquerda) * prog(t, entra + 0.1, 0.6, troca)} y2={baseY} stroke={cor.grafite} strokeWidth={4} />
        {dados.map((d, k) => {
          if (k === 0) return null;
          const p = prog(t, d.em - 0.1, 0.5, troca);
          return <Traco key={`s${k}`} d={`M ${xs[k - 1]} ${ys[k - 1]} L ${xs[k]} ${ys[k]}`} p={p} cor={cor.grafite} largura={5} />;
        })}
        {dados.map((d, k) => {
          const p = prog(t, d.em - 0.05, 0.45, queda);
          return (
            <g key={`p${k}`}>
              <line x1={xs[k]} y1={baseY} x2={xs[k]} y2={ys[k]} stroke={cor.fio} strokeWidth={2.5} strokeDasharray="6 7" opacity={prog(t, entra + 0.2, 0.4)} />
              <circle cx={xs[k]} cy={ys[k]} r={15} fill="none" stroke={cor.lapis} strokeWidth={2.5} strokeDasharray="5 5" opacity={1 - p} />
              {p > 0 ? <circle cx={xs[k]} cy={ys[k] - (1 - p) * 60} r={17} fill={cor.grafite} opacity={limitar(p * 3)} /> : null}
            </g>
          );
        })}
      </svg>
      {dados.map((d, k) => {
        const p = prog(t, d.em - 0.05, 0.6, apuracao);
        const rot = caber(d.rotulo, Math.max(90, slot - 8), 36, 30, 2, 600);
        return (
          <div key={`t${k}`}>
            <div
              style={{
                position: "absolute",
                left: xs[k],
                top: ys[k] - 78,
                translate: "-50% 0",
                fontSize: 44,
                fontWeight: 800,
                color: p > 0 ? cor.grafite : cor.lapis,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {p > 0 ? comUnidade(d.valor * p, m.unidade) : "—"}
            </div>
            <div
              style={{
                position: "absolute",
                left: xs[k],
                top: baseY + 18,
                translate: "-50% 0",
                width: Math.max(90, slot - 8),
                textAlign: "center",
                fontSize: rot.tamanho,
                fontWeight: 600,
                lineHeight: 1.1,
                color: t >= d.em - 0.05 ? cor.grafiteSuave : cor.lapis,
              }}
            >
              {rot.linhas.map((ws, i) => (
                <div key={i}>{ws.join(" ")}</div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

// pizza: uma grade de 100 pontos; cada fatia enche os seus pontos quando é dita (sem cores novas:
// grafite cheio, anel grafite, lápis)
const ESTILOS = [
  { cheio: cor.grafite, anel: false },
  { cheio: cor.branco, anel: true },
  { cheio: "rgba(31,32,35,0.34)", anel: false },
  { cheio: "rgba(31,32,35,0.62)", anel: false },
];
const GradeDePontos: React.FC<Props<Grafico>> = ({ m, palavras, t, entra }) => {
  const dados = m.dados ?? [];
  const l = layoutGrafico(m);
  const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
  // partes de 100, somando exatamente 100
  const brutas = dados.map((d) => (Math.max(0, d.valor) / total) * 100);
  const partes = brutas.map(Math.floor);
  let falta = 100 - partes.reduce((s, x) => s + x, 0);
  [...brutas.keys()].sort((a, b) => brutas[b] - partes[b] - (brutas[a] - partes[a])).forEach((k) => {
    if (falta > 0) {
      partes[k]++;
      falta--;
    }
  });
  const inicio: number[] = [];
  partes.reduce((s, x, k) => {
    inicio[k] = s;
    return s + x;
  }, 0);
  const g = gradeDaPizza(m);
  const passo = g.passo;
  const r = g.r;
  const legenda = legendaDaPizza(m);
  const ys = legenda.ys;
  const pct = (v: number) => (m.unidade === "%" || Math.abs(total - 100) < 1.5 ? `${formatar(v, Number.isInteger(v) ? 0 : 1)}%` : comUnidade(v, m.unidade));
  return (
    <>
      <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 100 }, (_, i) => {
          const k = partes.findIndex((_, j) => i >= inicio[j] && i < inicio[j] + partes[j]);
          const cx = g.x + passo / 2 + (i % 10) * passo;
          const cy = g.topo + passo / 2 + Math.floor(i / 10) * passo;
          const d = dados[k];
          const chega = d ? limitar((t - (d.em - 0.05) - ((i - inicio[k]) / Math.max(1, partes[k])) * 0.6) / 0.2) : 0;
          const estilo = ESTILOS[Math.min(ESTILOS.length - 1, Math.max(0, k))];
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r - 1.5} fill="none" stroke={cor.lapis} strokeWidth={2} strokeDasharray="4 5" opacity={(1 - chega) * prog(t, entra + 0.1 + (i % 10) * 0.02, 0.3)} />
              {chega > 0 ? (
                <circle cx={cx} cy={cy} r={(estilo.anel ? r - 1.5 : r) * mistura(0.5, 1, chega)} fill={estilo.cheio} stroke={estilo.anel ? cor.grafite : "none"} strokeWidth={3.5} opacity={chega} />
              ) : null}
            </g>
          );
        })}
      </svg>
      {dados.map((d, k) => {
        const estilo = ESTILOS[Math.min(ESTILOS.length - 1, k)];
        const p = prog(t, d.em - 0.05, 0.5);
        const largura = direitaDaLinha(ys[k] - 30) - legenda.x - 70 - 150;
        const rot = caber(d.rotulo, largura, 44, 34, 1, 700);
        return (
          <div key={k} style={{ position: "absolute", left: legenda.x, top: ys[k] - 30, width: direitaDaLinha(ys[k] - 30) - legenda.x, display: "flex", alignItems: "center", gap: 20 }}>
            <svg width={40} height={40} style={{ flexShrink: 0 }}>
              <circle cx={20} cy={20} r={estilo.anel ? 15 : 17} fill={estilo.cheio} stroke={estilo.anel ? cor.grafite : "none"} strokeWidth={3.5} opacity={0.35 + 0.65 * p} />
            </svg>
            <div style={{ flex: 1 }}>
              <Texto linhas={rot.linhas} texto={d.rotulo} tamanho={rot.tamanho} palavras={palavras} de={d.em - 0.4} ate={dados[k + 1]?.em ?? m.ate} inicio={d.em - 0.06} t={t} peso={700} />
            </div>
            <span style={{ fontSize: 46, fontWeight: 800, color: p > 0 ? cor.grafite : cor.lapis, fontVariantNumeric: "tabular-nums" }}>{p > 0 ? pct(d.valor) : "—"}</span>
          </div>
        );
      })}
    </>
  );
};

// tendência (sem números ditos): uma curva que se desenha com um ponto na ponta
const CURVAS: Record<"sobe" | "cai" | "oscila", [number, number][]> = {
  sobe: [[0, 0.12], [0.18, 0.26], [0.32, 0.2], [0.5, 0.46], [0.66, 0.4], [0.82, 0.68], [1, 0.9]],
  cai: [[0, 0.9], [0.18, 0.74], [0.32, 0.8], [0.5, 0.54], [0.66, 0.6], [0.82, 0.32], [1, 0.1]],
  oscila: [[0, 0.45], [0.17, 0.75], [0.33, 0.3], [0.5, 0.7], [0.67, 0.28], [0.83, 0.66], [1, 0.42]],
};
const CurvaDeTendencia: React.FC<Props<Grafico>> = ({ m, t, entra }) => {
  const l = layoutGrafico(m);
  const forma = CURVAS[m.tendencia ?? "sobe"];
  const x0 = l.esquerda + 20;
  const x1 = l.direita - 10;
  const topo = l.topo + 60;
  const baseY = l.base - 60;
  const pts = forma.map(([fx, fy]) => [x0 + (x1 - x0) * fx, baseY - (baseY - topo) * fy] as [number, number]);
  const d = `M ${pts.map(([x, y]) => `${x} ${y}`).join(" L ")}`;
  const fim = (m.tendenciaEm ?? m.de + (m.ate - m.de) * 0.5) + 0.7;
  const p = prog(t, entra + 0.3, Math.max(0.8, fim - entra - 0.3), troca);
  // a ponta: onde o traço está agora
  const comprimentos = pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]));
  const total = comprimentos.reduce((s, c) => s + c, 0);
  let resto = p * total;
  let ponta = pts[0];
  for (let i = 0; i < comprimentos.length; i++) {
    if (resto <= comprimentos[i]) {
      const f = resto / comprimentos[i];
      ponta = [mistura(pts[i][0], pts[i + 1][0], f), mistura(pts[i][1], pts[i + 1][1], f)];
      break;
    }
    resto -= comprimentos[i];
    ponta = pts[i + 1];
  }
  const passou = (k: number) => {
    const ate = comprimentos.slice(0, k).reduce((s, c) => s + c, 0);
    return p * total >= ate - 1;
  };
  return (
    <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={l.esquerda} y1={baseY + 30} x2={l.esquerda + (l.direita - l.esquerda) * prog(t, entra + 0.1, 0.6, troca)} y2={baseY + 30} stroke={cor.grafite} strokeWidth={4} />
      <line x1={l.esquerda} y1={baseY + 30} x2={l.esquerda} y2={baseY + 30 - (baseY - topo + 60) * prog(t, entra + 0.1, 0.6, troca)} stroke={cor.grafite} strokeWidth={4} />
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={l.esquerda} x2={l.direita} y1={baseY - (baseY - topo) * f} y2={baseY - (baseY - topo) * f} stroke={cor.fio} strokeWidth={2} strokeDasharray="6 8" opacity={prog(t, entra + 0.2 + i * 0.1, 0.4)} />
      ))}
      {/* a área sob a curva, um tom acima do papel, revelada junto com o traço */}
      <defs>
        <clipPath id={`area-${Math.round(m.de * 100)}`}>
          <rect x={x0 - 4} y={0} width={Math.max(0, ponta[0] - x0 + 4)} height={PH} />
        </clipPath>
      </defs>
      <path
        d={`${d} L ${pts[pts.length - 1][0]} ${baseY + 30} L ${pts[0][0]} ${baseY + 30} Z`}
        fill={cor.grafite}
        opacity={0.07}
        clipPath={`url(#area-${Math.round(m.de * 100)})`}
      />
      <Traco d={d} p={p} cor={cor.grafite} largura={8} />
      {pts.map(([x, y], k) => (k > 0 && k < pts.length - 1 && passou(k) ? <circle key={k} cx={x} cy={y} r={13} fill={cor.grafite} /> : null))}
      {p > 0.01 ? (
        <>
          <circle cx={ponta[0]} cy={ponta[1]} r={24} fill={cor.grafite} />
          <circle cx={ponta[0]} cy={ponta[1]} r={24 + 14 * ((t * 1.6) % 1)} fill="none" stroke={cor.grafite} strokeWidth={3} opacity={0.5 * (1 - ((t * 1.6) % 1))} />
        </>
      ) : null}
    </svg>
  );
};

// barras sem números: colunas de pontos que crescem uma depois da outra, na tendência dita
const ALTURAS: Record<"sobe" | "cai" | "oscila", number[]> = {
  sobe: [3, 4, 6, 7, 9, 11],
  cai: [11, 9, 7, 6, 4, 3],
  oscila: [6, 9, 5, 10, 6, 9],
};
const ColunasDeTendencia: React.FC<Props<Grafico>> = ({ m, t, entra }) => {
  const l = layoutGrafico(m);
  const alturas = ALTURAS[m.tendencia ?? "sobe"];
  const passo = 40;
  const largura = l.direita - l.esquerda;
  const coluna = largura / alturas.length;
  const baseY = l.base - 40;
  const fim = (m.tendenciaEm ?? m.de + (m.ate - m.de) * 0.5) + 0.6;
  const dur = Math.max(1, fim - entra - 0.3);
  return (
    <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={l.esquerda} y1={baseY + 26} x2={l.esquerda + largura * prog(t, entra + 0.1, 0.6, troca)} y2={baseY + 26} stroke={cor.grafite} strokeWidth={4} />
      {alturas.map((h, c) => {
        const inicio = entra + 0.3 + (dur * c) / alturas.length;
        return Array.from({ length: h }, (_, i) => {
          const chega = prog(t, inicio + i * 0.05, 0.3, queda);
          const cx = l.esquerda + coluna * (c + 0.5);
          const cy = baseY - i * passo;
          return (
            <g key={`${c}-${i}`}>
              <circle cx={cx} cy={cy} r={14} fill="none" stroke={cor.lapis} strokeWidth={2} strokeDasharray="4 5" opacity={(1 - chega) * prog(t, entra + 0.1, 0.4)} />
              {chega > 0 ? <circle cx={cx} cy={cy - (1 - chega) * 40} r={16} fill={cor.grafite} opacity={limitar(chega * 3)} /> : null}
            </g>
          );
        });
      })}
    </svg>
  );
};

export const ehPagina = (m: Momento) => ["topicos", "passos", "comparacao", "grafico", "definicao"].includes(m.tipo);
