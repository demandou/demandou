// O conteúdo da ficha em cada momento. Cada ficha desenha dentro de uma caixa w×h (coordenadas
// locais da ficha). Tudo já nasce escrito "a lápis" e ganha tinta quando é dito.
import { Escrita, firme, indicesDoDestaque, misturaCor, mistura, prog, temposDoTexto, tracado } from "../anim";
import type { Medidor } from "../medida";
import { PAISES, pontoNoMapa } from "../mapas";
import type { Abertura, Ano, CampoMomento, Cta, Nota, Origem, Palavra, Plano, Teor, Variedade } from "../plano";
import { caixaAlta, cor, display, LIQUIDOS, numerosAlinhados, TAM, texto } from "../tema";
import { encaixar, larguraDaLinha, linhasQueCabem, quebrar, tamanhoQueCabe } from "../texto";
import { Brinde, CachoPequeno, DesenhoDaVariedade, IconeFechamento, Lacre, Taca } from "./Desenhos";

export const CABECALHO = 100;
export const MARGEM = 40;

// `titulo`: o cabeçalho já resolvido (o do plano, o nome do campo lido ou o padrão do tipo);
// `largTitulo`: a largura livre para ele (o índice de campos ocupa a direita do cabeçalho)
export type Props<M> = { m: M; plano: Plano; t: number; w: number; h: number; medir: Medidor; numero?: number; titulo: string; largTitulo: number };

// ---------- peças comuns ----------

// Cabeçalho: número do campo (o mesmo da lupa) e o título em caixa alta
export const Cabecalho: React.FC<{ numero?: number; titulo: string; t: number; de: number; corTitulo?: string; largura?: number; medir?: Medidor }> = ({
  numero,
  titulo,
  t,
  de,
  corTitulo = cor.tinta,
  largura,
  medir,
}) => {
  const p = prog(t, de + 0.15, 0.45);
  // o título encolhe (até 30 px) para não encostar no índice de campos
  let tam = TAM.cabecalho;
  if (largura && medir) {
    const livre = largura - (numero ? 78 : 0);
    while (tam > 30 && medir(titulo, { familia: texto, tamanho: tam, caixaAlta: true, espaco: 0.14 }) > livre) tam -= 1;
  }
  return (
    <div style={{ position: "absolute", left: MARGEM, top: 26, height: 60, display: "flex", alignItems: "center", gap: 18 }}>
      {numero ? (
        <svg width={60} height={60} style={{ flexShrink: 0 }}>
          <circle cx={30} cy={30} r={27} fill={cor.vinho} />
          <text x={30} y={42} textAnchor="middle" fontFamily={display} fontSize={36} fill={cor.papel} style={numerosAlinhados}>
            {numero}
          </text>
        </svg>
      ) : null}
      <div style={{ ...caixaAlta(tam, 0.14), color: misturaCor(cor.lapis, corTitulo, p), whiteSpace: "nowrap", maxWidth: largura ? largura - (numero ? 78 : 0) : undefined, overflow: "hidden", textOverflow: "ellipsis" }}>{titulo}</div>
    </div>
  );
};

// Várias linhas que ganham tinta palavra por palavra, casadas com a fala a partir de `de`
export const Linhas: React.FC<{
  linhas: string[];
  palavras: Palavra[];
  de: number;
  ate?: number;
  t: number;
  estilo: React.CSSProperties;
  destaque?: string;
  corDestaque?: string;
  italicoNoDestaque?: boolean;
  alturaDaLinha?: number;
  alinhar?: "flex-start" | "center" | "flex-end";
}> = ({ linhas, palavras, de, ate, t, estilo, destaque, corDestaque = cor.vinho, italicoNoDestaque = true, alturaDaLinha = 1.12, alinhar = "flex-start" }) => {
  const todas = linhas.join(" ").split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(todas.join(" "), palavras, de, ate);
  const grifo = indicesDoDestaque(todas, destaque);
  const tam = Number(estilo.fontSize ?? 48);
  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar }}>
      {linhas.map((l, li) => {
        const ws = l.split(/\s+/).filter(Boolean);
        const ini = k;
        k += ws.length;
        return (
          <div key={li} style={{ height: tam * alturaDaLinha, display: "flex", alignItems: "center", position: "relative" }}>
            <Escrita
              palavras={ws}
              tempos={tempos.slice(ini, ini + ws.length)}
              t={t}
              estilo={estilo}
              tintaDe={(i) => (grifo.has(ini + i) ? corDestaque : (estilo.color as string) ?? cor.tinta)}
              italicoDe={(i) => (grifo.has(ini + i) && italicoNoDestaque) || estilo.fontStyle === "italic"}
            />
          </div>
        );
      })}
    </div>
  );
};

const Rotulinho: React.FC<{ texto: string; t: number; em: number; x: number; y: number }> = ({ texto: tx, t, em, x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, ...caixaAlta(32, 0.14), color: misturaCor(cor.lapis, cor.tintaSuave, prog(t, em, 0.35)), lineHeight: 1 }}>{tx}</div>
);

// ---------- abertura ----------

export const FichaAbertura: React.FC<Props<Abertura>> = ({ m, plano, t, w, h, medir, titulo, largTitulo }) => {
  const selo = m.selo;
  const raio = 62;
  const largura = w - MARGEM * 2;
  const fonte = { familia: texto };
  // `texto` (bloco universal): quebra sozinho, até 96 px, e deixa a coluna do mostrador livre à direita;
  // `linhas` (as quebras escritas no plano): o jeito do exemplo
  const livreDoPlano = !m.linhas?.length;
  const { linhas, tamanho: tam } = livreDoPlano
    ? (() => {
        const larg = selo ? largura - raio * 2 - 76 : largura;
        const r3 = encaixar(m.texto ?? "", larg, medir, fonte, 96, TAM.tituloMin, 3);
        return r3.linhas.length <= 3 ? r3 : encaixar(m.texto ?? "", larg, medir, fonte, 64, 48, 4);
      })()
    : linhasQueCabem(m.linhas ?? [], largura, medir, fonte, TAM.titulo, TAM.tituloMin, 3);
  const passo = tam * 1.12;
  const alturaLinhas = linhas.length * passo;
  const topo = CABECALHO + Math.max(12, (h - CABECALHO - 20 - alturaLinhas) / 2);
  // o mostrador fica à direita da última linha que deixa espaço livre
  const livre = linhas.map((l) => MARGEM + larguraDaLinha(l, medir, { familia: texto, tamanho: tam }) < w - MARGEM - raio * 2 - 56);
  const ultimaLivre = livreDoPlano ? linhas.length - 1 : livre.lastIndexOf(true);
  const minimo = !livreDoPlano && ultimaLivre > 0 && !livre[ultimaLivre - 1] ? topo + passo * ultimaLivre + raio + 24 : 0;
  const ySelo = livreDoPlano
    ? Math.min(topo + alturaLinhas / 2, h - 30 - raio - 18)
    : Math.min(Math.max(topo + passo * (ultimaLivre + 0.5), minimo), h - 30 - raio - 18);
  const livreDesde = ultimaLivre;
  return (
    <>
      <Cabecalho titulo={m.rotulo ?? titulo} t={t} de={m.de - 0.6} corTitulo={cor.vinho} largura={largTitulo} medir={medir} />
      <div style={{ position: "absolute", left: MARGEM, top: topo }}>
        <Linhas
          linhas={linhas}
          palavras={plano.palavras}
          de={m.em ?? m.de}
          ate={m.ate}
          t={t}
          estilo={{ fontFamily: texto, fontSize: tam, color: cor.tinta, ...numerosAlinhados }}
          destaque={m.destaque}
        />
      </div>
      {selo && livreDesde >= 0 && ySelo >= minimo ? <Selo selo={selo} t={t} cx={w - MARGEM - raio - 24} cy={ySelo} r={raio} /> : null}
    </>
  );
};

// Mostrador redondo com o número e N marcas que se acendem em sequência (ex.: os 10 segundos)
const Selo: React.FC<{ selo: NonNullable<Abertura["selo"]>; t: number; cx: number; cy: number; r: number }> = ({ selo, t, cx, cy, r }) => {
  const n = Math.max(3, Math.min(12, selo.marcas ?? (Number(selo.valor) >= 3 && Number(selo.valor) <= 12 ? Number(selo.valor) : 12)));
  const p = prog(t, selo.em - 0.05, 0.3);
  const ponteiro = prog(t, selo.em + 0.1, 1.0, (x) => x);
  const a0 = -Math.PI / 2 + ponteiro * Math.PI * 2;
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <circle cx={cx} cy={cy} r={r} fill={cor.papel} stroke={misturaCor(cor.lapis, cor.vinho, p)} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r - 9} fill="none" stroke={misturaCor(cor.lapis, cor.tinta, p)} strokeWidth={1.5} />
      {Array.from({ length: n }, (_, k) => {
        const a = -Math.PI / 2 + (k / n) * Math.PI * 2;
        const acesa = prog(t, selo.em + 0.1 + (k / n) * 1.0, 0.1);
        return (
          <line
            key={k}
            x1={cx + Math.cos(a) * (r + 8)}
            y1={cy + Math.sin(a) * (r + 8)}
            x2={cx + Math.cos(a) * (r + 22)}
            y2={cy + Math.sin(a) * (r + 22)}
            stroke={misturaCor(cor.lapis, cor.vinho, acesa)}
            strokeWidth={6}
            strokeLinecap="round"
          />
        );
      })}
      {ponteiro > 0 && ponteiro < 1 ? (
        <line x1={cx} y1={cy} x2={cx + Math.cos(a0) * (r - 14)} y2={cy + Math.sin(a0) * (r - 14)} stroke={cor.vinho} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      ) : null}
      <text x={cx} y={cy + r * 0.3} textAnchor="middle" fontFamily={display} fontSize={r * 0.95} fill={misturaCor(cor.lapis, cor.vinho, p)} style={numerosAlinhados}>
        {selo.valor}
      </text>
    </svg>
  );
};

// ---------- origem: mapa do país com a região ----------

const RosaDosVentos: React.FC<{ p: number }> = ({ p }) => (
  <g opacity={0.4 + 0.6 * p}>
    <circle cx={50} cy={50} r={30} fill="none" stroke={cor.tinta} strokeWidth={1.2} />
    <path d="M50 8 L56 50 L50 92 L44 50 Z" fill={cor.vinho} />
    <path d="M8 50 L50 44 L92 50 L50 56 Z" fill={cor.tinta} />
  </g>
);

export const FichaOrigem: React.FC<Props<Origem>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  // a frase de apoio ocupa a largura toda, no pé da ficha; mapa e nomes dividem o resto
  const nota = m.nota ? encaixar(m.nota.texto, w - 2 * MARGEM, medir, { familia: texto, italico: true }, TAM.nota + 2, TAM.notaMin, 2) : null;
  const alturaNota = nota ? nota.linhas.length * nota.tamanho * 1.12 + 18 : 0;
  const area = h - CABECALHO - 24 - alturaNota;
  const S = Math.min(330, area - 8);
  const pais = m.pais.mapa ? PAISES[m.pais.mapa] : undefined;
  const pPais = prog(t, m.pais.em - 0.05, 0.9);
  const tintaPais = prog(t, m.pais.em, 0.4);
  const pReg = m.regiao ? prog(t, m.regiao.em, 0.5) : 0;
  const ponto = pais && m.regiao?.lat !== undefined && m.regiao?.lon !== undefined ? pontoNoMapa(pais, m.regiao.lat, m.regiao.lon) : null;
  const x0 = MARGEM + S + 56;
  const larg = w - MARGEM - x0;
  const tamValor = tamanhoQueCabe([m.pais.texto, m.regiao?.texto ?? ""], larg, medir, { familia: texto }, 66, 48);
  const bloco = (m.regiao ? 2 : 1) * (32 + 8 + tamValor * 1.1) + (m.regiao ? 16 : 0);
  const yBloco = CABECALHO + 4 + (area - bloco) / 2;
  const passo = 32 + 8 + tamValor * 1.1 + 16;
  const topoMapa = CABECALHO + 4 + (area - S) / 2;
  const yNota = h - 24 - alturaNota + 18;
  const pRegra = m.nota ? prog(t, m.nota.em - 0.3, 0.5) : 0;
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      {/* mapinha */}
      <svg width={S} height={S} viewBox="-6 -6 112 112" style={{ position: "absolute", left: MARGEM, top: topoMapa, overflow: "visible" }}>
        {/* moldura do mapa: só os cantos marcados, como numa carta */}
        <path d="M-4 8 L-4 -4 L8 -4 M92 -4 L104 -4 L104 8 M104 92 L104 104 L92 104 M8 104 L-4 104 L-4 92" fill="none" stroke={cor.tintaSuave} strokeWidth={1.1} />
        {pais ? (
          <>
            <path d={pais.d} fill={cor.vinhoClaro} fillOpacity={prog(t, m.pais.em + 0.3, 0.6)} stroke="none" />
            <path d={pais.d} fill="none" stroke={cor.lapis} strokeWidth={1} strokeDasharray="1.6 2" opacity={1 - tintaPais} />
            <path d={pais.d} fill="none" stroke={cor.tinta} strokeWidth={1.45} strokeLinejoin="round" pathLength={1} {...tracado(pPais)} opacity={pPais > 0 ? 1 : 0} />
          </>
        ) : (
          <RosaDosVentos p={tintaPais} />
        )}
        {ponto && m.regiao ? (
          <g>
            <circle cx={ponto.x} cy={ponto.y} r={3.2 * pReg} fill={cor.vinho} />
            <circle cx={ponto.x} cy={ponto.y} r={4.5 + 5.5 * pReg} fill="none" stroke={cor.vinho} strokeWidth={1.1} opacity={pReg} />
          </g>
        ) : null}
        {/* norte */}
        <g transform="translate(100 6)" opacity={0.5 + 0.5 * tintaPais}>
          <path d="M0 -6 L3 4 L0 2 L-3 4 Z" fill={cor.tinta} />
        </g>
      </svg>
      {/* país e região */}
      <Rotulinho texto="País" t={t} em={m.pais.em} x={x0} y={yBloco} />
      <div style={{ position: "absolute", left: x0, top: yBloco + 40 }}>
        <Linhas linhas={[m.pais.texto]} palavras={plano.palavras} de={m.pais.em - 0.05} t={t} alturaDaLinha={1.1} estilo={{ fontFamily: texto, fontSize: tamValor, color: cor.tinta }} />
      </div>
      {m.regiao ? (
        <>
          <Rotulinho texto="Região" t={t} em={m.regiao.em} x={x0} y={yBloco + passo} />
          <div style={{ position: "absolute", left: x0, top: yBloco + passo + 40 }}>
            <Linhas
              linhas={[m.regiao.texto]}
              palavras={plano.palavras}
              de={m.regiao.em - 0.05}
              t={t}
              alturaDaLinha={1.1}
              estilo={{ fontFamily: texto, fontSize: tamValor, fontStyle: "italic", color: cor.vinho }}
            />
          </div>
        </>
      ) : null}
      {m.nota && nota ? (
        <>
          <svg width={w} height={4} style={{ position: "absolute", left: 0, top: yNota - 14 }}>
            <line x1={MARGEM} x2={MARGEM + (w - 2 * MARGEM) * Math.max(0.0001, pRegra)} y1={2} y2={2} stroke={misturaCor(cor.lapis, cor.tinta, pRegra)} strokeWidth={2} strokeDasharray="3 7" />
          </svg>
          <div style={{ position: "absolute", left: MARGEM, top: yNota }}>
            <Linhas
              linhas={nota.linhas}
              palavras={plano.palavras}
              de={m.nota.em - 0.05}
              ate={m.ate}
              t={t}
              estilo={{ fontFamily: texto, fontSize: nota.tamanho, fontStyle: "italic", color: cor.tinta }}
              destaque={m.nota.destaque}
            />
          </div>
        </>
      ) : null}
    </>
  );
};

// ---------- variedade: desenho a traço + exemplos ----------

export const FichaVariedade: React.FC<Props<Variedade>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const corpo = h - CABECALHO - 24;
  const larguraDesenho = Math.min(330, corpo * 1.0);
  const pDesenho = prog(t, m.em - 0.1, 1.5, (x) => x);
  const tintaDesenho = prog(t, m.em, 0.3);
  const noRotulo =
    m.noRotulo ?? m.itens.findIndex((i) => i.texto.trim().toLowerCase() === (plano.rotulo.destaque ?? plano.rotulo.campos?.[2]?.valor ?? "").trim().toLowerCase());
  const cheio = noRotulo >= 0 ? prog(t, m.itens[noRotulo].em + 0.1, 0.6) : prog(t, m.em + 1, 0.6);
  const x0 = MARGEM + larguraDesenho + 40;
  const larg = w - MARGEM - x0;
  // cada item em até 2 linhas, no maior tamanho que couber — e, juntos, na altura do corpo
  const conector = m.conector ?? "ou";
  const montar = (k: number) => {
    const bs = m.itens.slice(0, 3).map((it, i) => {
      const destaque = i === noRotulo;
      const max = Math.round((destaque ? 72 : 62) * k);
      const r = encaixar(it.texto, larg, medir, { familia: texto, italico: destaque }, Math.max(44, max), 44, 2);
      return { ...r, it, destaque };
    });
    const alturaConector = Math.round(54 * Math.max(0.8, k));
    const altura = bs.reduce((s, b) => s + b.linhas.length * b.tamanho * 1.1, 0) + (bs.length - 1) * alturaConector;
    return { blocos: bs, alturaConector, altura };
  };
  let escolha = montar(1);
  for (let k = 0.95; k >= 0.6 && escolha.altura > corpo - 8; k -= 0.05) escolha = montar(k);
  const { blocos, alturaConector, altura } = escolha;
  let y = CABECALHO + Math.max(8, (corpo - altura) / 2);
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      <div style={{ position: "absolute", left: MARGEM, top: CABECALHO + (corpo - (larguraDesenho * 300) / 320) / 2 }}>
        <DesenhoDaVariedade desenho={m.desenho ?? "cacho"} p={pDesenho} tinta={tintaDesenho} cheio={cheio} largura={larguraDesenho} />
      </div>
      {blocos.map((b, i) => {
        const topo = y;
        y += b.linhas.length * b.tamanho * 1.1;
        const meio = i < blocos.length - 1 ? y : null;
        if (meio !== null) y += alturaConector;
        const pGrifo = b.destaque ? prog(t, b.it.em + 0.35, 0.45) : 0;
        const largUltima = medir(b.linhas[b.linhas.length - 1], { familia: texto, tamanho: b.tamanho, italico: b.destaque });
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x0, top: topo }}>
              <Linhas
                linhas={b.linhas}
                palavras={plano.palavras}
                de={b.it.em - 0.05}
                t={t}
                alturaDaLinha={1.1}
                estilo={{ fontFamily: texto, fontSize: b.tamanho, color: b.destaque ? cor.vinho : cor.tinta, fontStyle: b.destaque ? "italic" : "normal" }}
              />
              {b.destaque ? (
                <svg width={largUltima + 20} height={20} style={{ position: "absolute", left: 0, top: b.linhas.length * b.tamanho * 1.1 - 6, overflow: "visible" }}>
                  <path d={`M 2 8 C ${largUltima * 0.4} 2 ${largUltima * 0.7} 14 ${largUltima + 8} 6`} fill="none" stroke={cor.vinho} strokeWidth={5} strokeLinecap="round" pathLength={1} {...tracado(pGrifo)} opacity={pGrifo > 0 ? 1 : 0} />
                </svg>
              ) : null}
            </div>
            {meio !== null ? (
              <div style={{ position: "absolute", left: x0, top: meio + 2, height: alturaConector - 4, display: "flex", alignItems: "center" }}>
                <Linhas
                  linhas={[conector]}
                  palavras={plano.palavras}
                  de={b.it.em}
                  ate={m.itens[i + 1].em + 0.2}
                  t={t}
                  estilo={{ fontFamily: texto, fontSize: 44, fontStyle: "italic", color: cor.tintaSuave }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// ---------- ano: o número rola e a régua marca o ano ----------

export const FichaAno: React.FC<Props<Ano>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const valor = m.valor ?? plano.rotulo.ano ?? plano.rotulo.campos?.[0]?.valor ?? "";
  const tam = TAM.numeroGrande;
  const tinta = prog(t, m.em, 0.25);
  const corNumero = misturaCor(cor.lapis, cor.tinta, tinta);
  const larguraAno = medir(valor, { familia: display, tamanho: tam });
  const x0 = MARGEM + larguraAno + 48;
  const larg = w - MARGEM - x0;
  const nota = m.nota ? encaixar(m.nota.texto, larg, medir, { familia: texto, italico: true }, 54, TAM.notaMin, 2) : null;
  // régua de anos
  const ano = Number(valor.replace(/\D/g, ""));
  const temRegua = Number.isFinite(ano) && ano > 1000;
  const anos = temRegua ? Array.from({ length: 7 }, (_, i) => ano - 4 + i) : [];
  const reguaY = h - 96;
  const xDe = (a: number) => MARGEM + 40 + ((a - anos[0]) / (anos.length - 1)) * (w - 2 * MARGEM - 80);
  const pRegua = prog(t, m.de + 0.3, 0.8);
  const marcaEm = m.marcaEm ?? (m.nota ? temposDoTexto(m.nota.texto, plano.palavras, m.nota.em, m.ate).slice(-1)[0] : m.em + 1);
  // na palavra "safra" os anos correm (ano − 4 → ano) e o marcador anda junto pela régua
  const pConta = prog(t, m.em, 1.1, (x) => 1 - (1 - x) * (1 - x));
  const pMarcador = pConta;
  const xMarcador = temRegua ? mistura(xDe(anos[0]), xDe(ano), pMarcador) : 0;
  const anoMostrado = temRegua && pConta > 0 && pConta < 1 ? String(Math.round(mistura(anos[0], ano, pConta))) : valor;
  const pCacho = prog(t, marcaEm, 0.5);
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      <div style={{ position: "absolute", left: MARGEM, top: CABECALHO + 8, fontFamily: display, fontSize: tam, lineHeight: 1, display: "flex", ...numerosAlinhados }}>
        <span style={{ color: corNumero }}>{anoMostrado}</span>
      </div>
      {m.nota && nota ? (
        <div style={{ position: "absolute", left: x0, top: CABECALHO + 8 + tam * 0.52 - (nota.linhas.length * nota.tamanho * 1.12) / 2 }}>
          <Linhas
            linhas={nota.linhas}
            palavras={plano.palavras}
            de={m.nota.em - 0.05}
            ate={m.ate}
            t={t}
            estilo={{ fontFamily: texto, fontSize: nota.tamanho, fontStyle: "italic", color: cor.tinta }}
            destaque={m.nota.destaque}
          />
        </div>
      ) : null}
      {temRegua ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={xDe(anos[0]) - 24} x2={xDe(anos[anos.length - 1]) + 24} y1={reguaY} y2={reguaY} stroke={misturaCor(cor.lapis, cor.tinta, pRegua)} strokeWidth={3.5} />
          {anos.map((a) => {
            const x = xDe(a);
            const atingido = pMarcador > 0 && x <= xMarcador + 1;
            return (
              <g key={a}>
                <line x1={x} x2={x} y1={reguaY - 14} y2={reguaY + 14} stroke={misturaCor(cor.lapis, cor.tinta, pRegua)} strokeWidth={3} />
                <text
                  x={x}
                  y={reguaY + 52}
                  textAnchor="middle"
                  fontFamily={texto}
                  fontSize={34}
                  fill={a === ano ? misturaCor(cor.lapis, cor.vinho, pMarcador) : misturaCor(cor.lapis, cor.tintaSuave, atingido ? 1 : pRegua * 0.7)}
                  style={numerosAlinhados}
                >
                  {a}
                </text>
              </g>
            );
          })}
          {pMarcador > 0 ? (
            <g>
              <line x1={xDe(anos[0])} x2={xMarcador} y1={reguaY} y2={reguaY} stroke={cor.vinho} strokeWidth={6} strokeLinecap="round" />
              <path d={`M ${xMarcador} ${reguaY - 12} L ${xMarcador + 12} ${reguaY} L ${xMarcador} ${reguaY + 12} L ${xMarcador - 12} ${reguaY} Z`} fill={cor.vinho} />
            </g>
          ) : null}
          {pCacho > 0 && !m.valor && !plano.rotulo.campos ? <CachoPequeno x={xDe(ano)} y={reguaY - 44 - (1 - pCacho) * 40} escala={1.15} opacidade={pCacho} /> : null}
          {/* fora do vinho, um alfinete marca o ano */}
          {pCacho > 0 && (m.valor || plano.rotulo.campos) ? (
            <g opacity={pCacho} transform={`translate(${xDe(ano)} ${reguaY - 30 - (1 - pCacho) * 36})`}>
              <line x1={0} x2={0} y1={-34} y2={6} stroke={cor.tinta} strokeWidth={3} strokeLinecap="round" />
              <circle cx={0} cy={-40} r={13} fill={cor.vinho} stroke={cor.tinta} strokeWidth={2.5} />
            </g>
          ) : null}
        </svg>
      ) : null}
    </>
  );
};

// ---------- teor: o número conta, o medidor enche, a taça se enche ----------

export const FichaTeor: React.FC<Props<Teor>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const doRotulo = Number(((plano.rotulo.teor ?? plano.rotulo.campos?.[1]?.valor ?? "").match(/[\d.,]+/)?.[0] ?? "0").replace(",", "."));
  const valor = m.valor ?? doRotulo;
  const unidade = m.unidade ?? "%";
  const casas = Number.isInteger(valor) ? 0 : 1;
  const pConta = prog(t, m.em, 1.0);
  const tinta = prog(t, m.em, 0.2);
  const mostrado = (valor * pConta).toFixed(casas).replace(".", ",");
  const larguraTaca = 214;
  const xTaca = w - MARGEM - larguraTaca + 6;
  const larguraMedidor = xTaca - MARGEM - 60;
  const medidorY = h - 64;
  const pMedidor = prog(t, m.medidor.em, 0.35);
  const pCheio = prog(t, m.medidor.cheioEm, 0.9);
  const nivelMedidor = m.medidor.nivel * pCheio + 0.18 * prog(t, m.medidor.em + 0.1, 0.5) * (1 - pCheio);
  const liquido = LIQUIDOS[m.taca?.liquido ?? "tinto"];
  const pTaca = prog(t, m.de + 0.2, 1.0);
  const pEnche = m.taca ? prog(t, m.taca.em, 1.2) : 0;
  const corLiquido = misturaCor(liquido.claro, liquido.escuro, Math.max(0.15, pCheio));
  const onda = 1 - prog(t, (m.taca?.em ?? 0) + 0.6, 1.2);
  const pSubida = m.subida ? prog(t, m.subida.em, 0.5) : 0;
  const larguraNumero =
    medir(String(valor).replace(".", ","), { familia: display, tamanho: TAM.numeroGrande }) + 6 + medir(unidade, { familia: display, tamanho: 88 });
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      <div
        style={{
          position: "absolute",
          left: MARGEM,
          top: CABECALHO + 4,
          fontFamily: display,
          fontSize: TAM.numeroGrande,
          lineHeight: 1,
          color: misturaCor(cor.lapis, cor.tinta, tinta),
          display: "flex",
          alignItems: "baseline",
          ...numerosAlinhados,
        }}
      >
        <span>{pConta > 0 ? mostrado : String(valor).replace(".", ",")}</span>
        <span style={{ fontSize: 88, marginLeft: 6, color: misturaCor(cor.lapis, cor.vinho, tinta) }}>{unidade}</span>
      </div>
      {m.subida ? (
        <div style={{ position: "absolute", left: MARGEM + larguraNumero + 28, top: CABECALHO + 4 + TAM.numeroGrande * 0.62 - 34, display: "flex", alignItems: "center", gap: 12 }}>
          <svg width={36} height={60} style={{ overflow: "visible" }}>
            <path d="M18 56 L18 6 M4 20 L18 4 L32 20" fill="none" stroke={misturaCor(cor.lapis, cor.vinho, pSubida)} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} {...(pSubida > 0 ? tracado(pSubida) : {})} />
          </svg>
          <Linhas linhas={[m.subida.texto]} palavras={plano.palavras} de={m.subida.em - 0.05} t={t} estilo={{ fontFamily: texto, fontSize: TAM.nota, fontStyle: "italic", color: cor.tinta }} />
        </div>
      ) : null}
      {/* medidor de corpo */}
      <div style={{ position: "absolute", left: MARGEM, top: medidorY - 58, width: larguraMedidor, display: "flex", justifyContent: "space-between" }}>
        <span style={{ ...caixaAlta(32, 0.12), color: misturaCor(cor.lapis, cor.tintaSuave, pMedidor) }}>{m.medidor.de}</span>
        <span style={{ ...caixaAlta(32, 0.12), color: misturaCor(cor.lapis, misturaCor(cor.tinta, cor.vinho, pCheio), pMedidor) }}>{m.medidor.ate}</span>
      </div>
      <svg width={larguraMedidor} height={40} style={{ position: "absolute", left: MARGEM, top: medidorY - 6, overflow: "visible" }}>
        <rect x={0} y={4} width={larguraMedidor} height={24} rx={12} fill={cor.papelEscuro} stroke={misturaCor(cor.lapis, cor.tinta, pMedidor)} strokeWidth={3} strokeDasharray={pMedidor > 0.5 ? undefined : "6 8"} />
        {nivelMedidor > 0.001 ? <rect x={3} y={7} width={Math.max(18, (larguraMedidor - 6) * nivelMedidor)} height={18} rx={9} fill={cor.vinho} /> : null}
        {/* marcas de quarto */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={larguraMedidor * f} x2={larguraMedidor * f} y1={-6} y2={2} stroke={misturaCor(cor.lapis, cor.tinta, pMedidor)} strokeWidth={2.5} />
        ))}
      </svg>
      {/* taça */}
      <div style={{ position: "absolute", left: xTaca, top: CABECALHO + 2 }}>
        <Taca p={pTaca} tinta={prog(t, m.de + 0.2, 0.6)} nivel={0.58 * pEnche} liquido={corLiquido} largura={larguraTaca} onda={onda * pEnche} />
      </div>
    </>
  );
};

// ---------- campo (e nota): a lupa lê um campo; a ficha mostra o valor e a linha-guia até o número ----------

export const FichaNota: React.FC<Props<Nota | CampoMomento> & { valorPadrao?: string }> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo, valorPadrao }) => {
  const larg = w - MARGEM * 2;
  const valorDito = m.valor ?? (valorPadrao ? { em: m.de + 0.3, texto: valorPadrao } : undefined);
  const valor = valorDito ? encaixar(valorDito.texto, larg - 90, medir, { familia: texto }, TAM.titulo, 56, 2) : null;
  const apoio = (m.linhas ?? []).slice(0, 2).map((l) => ({ l, r: encaixar(l.texto, larg, medir, { familia: texto, italico: true }, TAM.nota + 4, TAM.notaMin, 2) }));
  const alturaValor = valor ? valor.linhas.length * valor.tamanho * 1.12 : 0;
  const altura = alturaValor + apoio.reduce((s2, a) => s2 + a.r.linhas.length * a.r.tamanho * 1.12 + 18, 0);
  const topo = CABECALHO + Math.max(16, (h - CABECALHO - 24 - altura) / 2);
  // linha-guia: do fim do valor até o número do campo, como numa prancha de anatomia
  const fimValor = valor ? MARGEM + larguraDaLinha(valor.linhas[valor.linhas.length - 1], medir, { familia: texto, tamanho: valor.tamanho }) + 22 : 0;
  const yGuia = topo + alturaValor - (valor ? valor.tamanho * 0.42 : 0);
  const pGuia = valorDito ? prog(t, valorDito.em + 0.25, 0.6) : 0;
  const xFim = w - MARGEM - 26;
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      <div style={{ position: "absolute", left: MARGEM, top: topo, display: "flex", flexDirection: "column", gap: 18 }}>
        {valorDito && valor ? (
          <Linhas linhas={valor.linhas} palavras={plano.palavras} de={valorDito.em - 0.05} t={t} estilo={{ fontFamily: texto, fontSize: valor.tamanho, color: cor.tinta }} />
        ) : null}
        {apoio.map(({ l, r }, i) => (
          <Linhas key={i} linhas={r.linhas} palavras={plano.palavras} de={l.em - 0.05} ate={m.ate} t={t} estilo={{ fontFamily: texto, fontSize: r.tamanho, fontStyle: "italic", color: cor.tinta }} />
        ))}
      </div>
      {valor && numero && xFim - fimValor > 60 ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={fimValor} x2={xFim - 30} y1={yGuia} y2={yGuia} stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
          {pGuia > 0 ? (
            <line x1={fimValor} x2={mistura(fimValor, xFim - 30, pGuia)} y1={yGuia} y2={yGuia} stroke={cor.vinho} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
          ) : null}
          <circle cx={xFim} cy={yGuia} r={24} fill={pGuia >= 1 ? cor.vinho : cor.papel} stroke={misturaCor(cor.lapis, cor.vinho, pGuia)} strokeWidth={3} />
          <text x={xFim} y={yGuia + 11} textAnchor="middle" fontFamily={display} fontSize={32} fill={pGuia >= 1 ? cor.papel : misturaCor(cor.lapis, cor.vinho, pGuia)} style={numerosAlinhados}>
            {numero}
          </text>
        </svg>
      ) : null}
    </>
  );
};

// ---------- fechamento ----------

export const FichaCta: React.FC<Props<Cta>> = ({ m, plano, t, w, h, medir }) => {
  const icone = m.icone ?? "salvar";
  const larguraIcone = icone === "salvar" ? 120 : 160;
  // o brinde só quando o vídeo tem taça (bebida); nos outros assuntos, o lacre do rótulo
  const comTaca = plano.momentos.some((o) => (o.tipo === "teor" || o.tipo === "medidor") && !!o.taca);
  // à direita fica a coluna do ícone e do brinde
  const LARGURA_TACA = 104;
  const larguraBrinde = LARGURA_TACA * 2 + 40;
  const larg = w - MARGEM * 2 - Math.max(larguraIcone, larguraBrinde) - 24;
  const { linhas, tamanho: tam } = m.linhas?.length
    ? linhasQueCabem(m.linhas, larg, medir, { familia: texto }, 92, 64, 3)
    : (() => {
        const r3 = encaixar(m.texto ?? "", larg, medir, { familia: texto }, 92, 56, 3);
        return r3.linhas.length <= 3 ? r3 : encaixar(m.texto ?? "", larg, medir, { familia: texto }, 60, 44, 4);
      })();
  const altura = linhas.length * tam * 1.12;
  const em = m.em ?? temposDoTexto(linhas.join(" "), plano.palavras, m.de, m.ate)[0];
  const inicio = m.em ?? m.de;
  const pIcone = prog(t, em, 0.7);
  const topoLinhas = CABECALHO + Math.max(10, (h - CABECALHO - 24 - altura) / 2);
  // o grifo vinho se desenha sob o trecho em destaque quando a última palavra dele é dita
  const grifo = (() => {
    if (!m.destaque) return null;
    const alvo = m.destaque.toLowerCase();
    const li = linhas.findIndex((l) => l.toLowerCase().includes(alvo));
    if (li < 0) return null;
    const linha = linhas[li];
    const ws = linha.split(/\s+/);
    const dw = m.destaque.split(/\s+/);
    const i0 = ws.findIndex((_, i) => dw.every((d, k) => (ws[i + k] ?? "").toLowerCase() === d.toLowerCase()));
    if (i0 < 0) return null;
    const f = { familia: texto, tamanho: tam };
    const fi = { ...f, italico: true };
    const x = ws.slice(0, i0).reduce((s2, p) => s2 + medir(p, f) + tam * 0.26, 0);
    const largura = dw.reduce((s2, p, k) => s2 + medir(p, fi) + (k ? tam * 0.26 : 0), 0);
    return { x, y: (li + 1) * tam * 1.12 - 8, largura };
  })();
  const tempos = temposDoTexto(linhas.join(" "), plano.palavras, inicio, m.ate);
  const ultima = tempos[tempos.length - 1] ?? m.de;
  const pGrifo = prog(t, ultima + 0.3, 0.5);
  // na última palavra: as taças brindam e a fita balança uma vez
  const pBrinde = prog(t, ultima - 0.05, 0.95, (x) => x);
  const balanco = 7 * Math.sin(Math.PI * prog(t, ultima + 0.25, 0.8, (x) => x));
  const comLiquido = plano.momentos.find((o) => (o.tipo === "teor" || o.tipo === "medidor") && !!o.taca) as Teor | undefined;
  const liquido = LIQUIDOS[comLiquido?.taca?.liquido ?? "tinto"];
  const iniciais = (plano.marca.nome || plano.rotulo.nome || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const marca = [plano.marca.nome, plano.marca.area].filter(Boolean).join(" · ");
  const linhasAssinatura = marca ? quebrar(marca, larg, medir, { familia: texto, tamanho: TAM.assinatura, italico: true }) : [];
  return (
    <>
      <Cabecalho titulo={marca || "Até a próxima"} t={t} de={m.de - 0.2} corTitulo={cor.vinho} />
      <div style={{ position: "absolute", left: MARGEM, top: topoLinhas }}>
        <Linhas linhas={linhas} palavras={plano.palavras} de={m.em ?? m.de} ate={m.ate} t={t} estilo={{ fontFamily: texto, fontSize: tam, color: cor.tinta }} destaque={m.destaque} />
        {grifo ? (
          <svg width={grifo.largura + 20} height={20} style={{ position: "absolute", left: grifo.x, top: grifo.y, overflow: "visible" }}>
            <path
              d={`M 2 8 C ${grifo.largura * 0.4} 2 ${grifo.largura * 0.7} 14 ${grifo.largura + 8} 6`}
              fill="none"
              stroke={cor.vinho}
              strokeWidth={5}
              strokeLinecap="round"
              pathLength={1}
              {...tracado(pGrifo)}
              opacity={pGrifo > 0 ? 1 : 0}
            />
          </svg>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: w - MARGEM - larguraIcone,
          top: icone === "salvar" ? -2 : CABECALHO + 26,
          transformOrigin: `${larguraIcone / 2}px 0px`,
          rotate: icone === "salvar" ? `${balanco}deg` : "0deg",
        }}
      >
        <IconeFechamento icone={icone} p={pIcone} t={t} em={em} />
      </div>
      {comTaca ? (
        <div style={{ position: "absolute", left: w - MARGEM - larguraBrinde + 6, top: h - 30 - (LARGURA_TACA * 400) / 260 - 30 }}>
          <Brinde p={pBrinde} tinta={prog(t, em, 0.3)} nivel={0.5 * prog(t, em + 0.15, 0.8)} liquido={misturaCor(liquido.claro, liquido.escuro, 0.75)} largura={LARGURA_TACA} />
        </div>
      ) : (
        // o lacre: carimba o rótulo na última palavra
        <div style={{ position: "absolute", left: w - MARGEM - 200 + 10, top: h - 30 - 190 }}>
          <Lacre p={prog(t, ultima - 0.05, 0.3, firme)} tinta={prog(t, em, 0.3)} iniciais={iniciais} tamanho={180} />
        </div>
      )}
      {void linhasAssinatura}
    </>
  );
};
