import { corre, limitar, mistura, prog, saindo } from "../anim";
import { Cota, Dedo, EscalaDeLuz, JANELA, Janela, Plaquinha, Regador, Regua, SolNoArco } from "../desenhos/Acessorios";
import { ALVOS_VASO, BASE, SUPERFICIE, Vaso } from "../desenhos/Vaso";
import { CABECALHO, type Prancha, TOPO_DESENHO, VIAGEM } from "../layout";
import type { Acao, Alvo, Figura as FiguraT, Momento, Palavra } from "../plano";
import { cor, serif } from "../tema";
import { Cabecalho } from "./Cabecalho";
import { type CaixaDaEtiqueta, Etiqueta, medidaDaEtiqueta } from "./Etiqueta";

// Onde o vaso fica em cada vista (coordenadas da prancha: centro do vaso e borda de cima; escala)
const VASO_NA_VISTA = { x: 540, y: 1046, s: 1 };
// Detalhe da terra: a superfície da terra vai para y = 820 e tudo cresce 1,9×
const MERGULHO = { s: 1.9, y: 820 };
// Na janela: o vaso menor, apoiado no piso, perto da janela; ao se afastar, vai para a direita
const VASO_NA_JANELA = { perto: 562, longe: 790, s: 0.84 };
// Detalhe da terra (coordenadas da tela, depois do mergulho)
const DEDO = { x: 612, fundo: MERGULHO.y + 304 };
const UMIDA = { x: 600, y: MERGULHO.y + 280 };
// Linha de etiquetas embaixo do vaso (acima da interface do app)
const LINHA_DE_BAIXO = 1506;

const acoesDe = (ms: Momento[]) =>
  ms.flatMap((m) => (m.tipo === "figura" ? (m.acoes ?? []) : [])).sort((a, b) => a.em - b.em);
const primeira = (acoes: { em: number; acao: Acao }[], nome: Acao) => acoes.find((a) => a.acao === nome)?.em;


// meia-largura externa do vaso (coordenadas locais) na altura y
const meiaExterna = (y: number) => (y <= 56 ? 270 : 250 - 60 * ((y - 56) / 364));

export const FiguraNaPrancha: React.FC<{
  prancha: Prancha;
  t: number;
  palavras: Palavra[];
  totalFiguras: number;
  fimDe: (m: Momento) => number;
  proximaChegada: number;
}> = ({ prancha, t, palavras, totalFiguras, fimDe, proximaChegada }) => {
  const ms = prancha.momentos as FiguraT[];
  const acoes = acoesDe(ms);
  const m0 = ms[0];
  const chegada = prancha.chegada;
  // o desenho ganha tinta quando a prancha chega (antes disso, só o esboço a lápis); a aguada vem atrás
  const inicioTinta = Math.max(chegada + 0.18, m0.de - 0.2);
  const tinta = prog(t, inicioTinta, 0.85, (x) => x);
  const aguada = prog(t, inicioTinta + 0.55, 0.6);
  const quando = (nome: Acao) => primeira(acoes, nome);
  const p = (nome: Acao, dur: number, atraso = 0, easing = corre) => {
    const em = quando(nome);
    return em === undefined ? 0 : prog(t, em + atraso, dur, easing);
  };

  const janela = prancha.vista === "janela";
  // detalhe da terra: a prancha começou no detalhe ou mergulhou nele vindo de um vaso
  const detalhe = prancha.vista === "terra" || prancha.mergulho !== undefined;
  const mergulho = detalhe ? (prancha.mergulho !== undefined ? prog(t, prancha.mergulho, 0.9, corre) : 1) : 0;

  // ---- estado do vaso ----
  const furo = p("furo", 0.45, 0.05);
  const escoa = p("furo", 1.1, 0.3);
  const nivelAlto = p("encharcar", 1.2, 0.15);
  const nivelFundo = p("acumular", 1.0, 0.1);
  const agua = Math.max(0, nivelAlto * 0.86 + nivelFundo * 0.3 - escoa * 0.86);
  const umida = p("umida", 0.9, -0.1);
  const seca = p("seca", 0.9);
  const dia = p("esperar", 1.3, 0.05);
  const tomTerra = p("regar", 0.9, 0.35) * 0.4 + umida * 0.35 - seca * 0.6 - dia * 0.25;

  // com 3 etiquetas ou mais, o vaso fica um pouco menor e mais alto: abre duas linhas de etiquetas embaixo
  const compacto = prancha.vista === "vaso" && (m0.etiquetas?.length ?? 0) >= 3;
  const vista = compacto ? { x: 540, y: VASO_NA_VISTA.y - 70, s: 0.82 } : VASO_NA_VISTA;
  const dyRegador = compacto ? -100 : 0;
  const s = janela ? VASO_NA_JANELA.s : mistura(vista.s, MERGULHO.s, mergulho);
  // o ponto da superfície da terra vai até y = 780 enquanto cresce
  const supY = mistura(vista.y + SUPERFICIE, MERGULHO.y, mergulho);
  const afasta = p("afastar", 0.85, 0.05);
  const aproxima = p("aproximar", 0.85, 0.05);
  const xJanela = mistura(mistura(VASO_NA_JANELA.perto, VASO_NA_JANELA.longe, afasta), VASO_NA_JANELA.perto, aproxima);
  const vasoT = janela
    ? { x: xJanela, y: JANELA.piso - BASE * VASO_NA_JANELA.s, s }
    : { x: vista.x, y: supY - SUPERFICIE * s, s };
  const local = (a: { x: number; y: number }) => ({ x: vasoT.x + a.x * vasoT.s, y: vasoT.y + a.y * vasoT.s });
  const longeDaLuz = janela ? afasta * (1 - aproxima) : 0;

  const estado = {
    lapis: 1,
    tinta,
    aguada,
    agua,
    podre: p("apodrecer", 1.1),
    murcho: Math.max(p("murchar", 0.9), p("amarelar", 0.7) * 0.35, longeDaLuz * 0.2),
    palido: Math.max(p("amarelar", 0.7), p("murchar", 0.9) * 0.7, longeDaLuz * 0.55) * (1 - aproxima),
    folhas: 1 - 0.72 * mergulho,
    espelho: prancha.indice > 1 && prancha.indice % 2 === 1,
    broto: p("brotar", 0.9),
    semFuro: p("semFuro", 0.5),
    furo,
    escorre: quando("furo") === undefined ? 0 : t - ((quando("furo") as number) + 0.3),
    tomTerra,
    t,
    escala: vasoT.s,
    id: `p${prancha.indice}`,
  };

  // ---- regador ----
  const emRegar = quando("regar");
  const regadorEntra = emRegar === undefined ? 0 : prog(t, emRegar - 0.35, 0.55);
  const inclina = emRegar === undefined ? 0 : prog(t, emRegar + 0.15, 0.45);
  const despeja = emRegar === undefined ? 0 : prog(t, emRegar + 0.4, 0.4, (x) => x) * (1 - prog(t, emRegar + 2.4, 0.4));
  const regadorSai = emRegar === undefined ? 0 : prog(t, emRegar + 2.6, 0.5);

  // ---- detalhe da terra ----
  const emDedo = quando("dedo");
  const dedo = emDedo === undefined ? 0 : prog(t, emDedo - 0.05, 1.0, corre);
  const dedoY = mistura(DEDO.fundo - 440, DEDO.fundo, dedo);
  const emEsperar = quando("esperar");
  const textoEsperar = acoes.find((a) => a.acao === "esperar")?.texto ?? "+1 dia";
  const cotaFim = xJanela - 200 * VASO_NA_JANELA.s - 24;

  // ---- etiquetas ----
  const pontoDoAlvo = (alvo: Alvo): { x: number; y: number } => {
    if (alvo === "dedo") return { x: DEDO.x + 40, y: dedoY - 330 };
    if (alvo === "umida") return { x: UMIDA.x - 150, y: UMIDA.y + 30 };
    if (alvo === "sol") return { x: 460, y: MERGULHO.y - 100 };
    if (alvo === "regador") return { x: 150, y: 760 + dyRegador };
    if (alvo === "janela") return { x: JANELA.x + JANELA.w / 2, y: JANELA.y + 420 };
    if (alvo === "luz") return { x: 470, y: 1100 };
    if (alvo === "regua") return { x: (JANELA.x + JANELA.w + 14 + cotaFim) / 2, y: 1430 };
    const a = ALVOS_VASO[alvo] ?? ALVOS_VASO.terra;
    const espelhado = estado.espelho && (alvo === "folha" || alvo === "caule");
    return local(espelhado ? { x: -a.x, y: a.y } : a);
  };

  // Lugar da etiqueta: ao lado do desenho, na altura do ponto, se couber; senão na linha de baixo do
  // vaso, que tem duas vagas (esquerda e direita); com as duas tomadas, no alto, ao lado das folhas
  // (do lado oposto ao oval). No detalhe ampliado (a terra ocupa a largura toda) ela fica por cima da
  // terra, perto do ponto. `W` e `H` = tamanho medido da etiqueta.
  // cada linha de baixo: vaga da esquerda e da direita, e onde a etiqueta de cada lado começa/termina
  const vagasDeBaixo = Array.from({ length: compacto ? 2 : 1 }, () => ({ esquerda: false, direita: false, fimEsquerda: 524, inicioDireita: 556 }));
  let vagasDoAlto = 0;
  const lugarDaEtiqueta = (alvo: Alvo, ponto: { x: number; y: number }, W: number, H: number, lado?: "esquerda" | "direita"): CaixaDaEtiqueta => {
    if (janela && alvo === "regua") return { x: ponto.x, y: ponto.y - 120, alinhar: "centro" };
    if (detalhe && mergulho > 0.5) {
      const l = lado ?? (ponto.x > 540 ? "direita" : "esquerda");
      const y = Math.min(1480, Math.max(TOPO_DESENHO + 50, ponto.y));
      return l === "direita"
        ? { x: Math.min(1030 - W, ponto.x + 90), y, alinhar: "inicio" }
        : { x: Math.max(50 + W, ponto.x - 90), y, alinhar: "fim" };
    }
    // limites do desenho na altura do ponto
    const yLocal = (ponto.y - vasoT.y) / vasoT.s;
    const dentroDoVaso = yLocal >= 0 && yLocal <= BASE;
    const L = dentroDoVaso ? vasoT.x - meiaExterna(yLocal) * vasoT.s : vasoT.x - 330 * vasoT.s;
    const R = dentroDoVaso ? vasoT.x + meiaExterna(yLocal) * vasoT.s : vasoT.x + 350 * vasoT.s;
    const preferido = lado ?? (ponto.x >= vasoT.x ? "direita" : "esquerda");
    const y = Math.min(1440, Math.max(TOPO_DESENHO + 50, ponto.y));
    // ao lado do desenho só com folga (16 px) até a margem; senão, a linha de baixo
    if (preferido === "direita" && R + 40 + W + 16 <= 1030) return { x: R + 40, y, alinhar: "inicio" };
    if (preferido === "esquerda" && L - 40 - W - 16 >= 50) return { x: L - 40, y, alinhar: "fim" };
    const baseVaso = vasoT.y + BASE * vasoT.s;
    const outro = preferido === "direita" ? "esquerda" : "direita";
    for (let linha = 0; linha < vagasDeBaixo.length; linha++) {
      const vagas = vagasDeBaixo[linha];
      const ladoBaixo = !vagas[preferido] ? preferido : !vagas[outro] ? outro : null;
      if (!ladoBaixo) continue;
      vagas[ladoBaixo] = true;
      const yBaixo = Math.min(Math.max(compacto ? 0 : LINHA_DE_BAIXO, baseVaso + 52) + linha * 86, 1556 - H / 2);
      // com uma só ocupada, a etiqueta fica perto do ponto; a segunda encosta na primeira sem cobrir
      if (ladoBaixo === "direita") {
        const x = Math.min(1030 - W, Math.max(vagas.esquerda ? vagas.fimEsquerda + 24 : 50, ponto.x - 40));
        vagas.inicioDireita = x;
        return { x, y: yBaixo, alinhar: "inicio" };
      }
      const x = Math.max(50 + W, Math.min(vagas.direita ? vagas.inicioDireita - 24 : 1030, ponto.x + 40));
      vagas.fimEsquerda = x;
      return { x, y: yBaixo, alinhar: "fim" };
    }
    // no alto, ao lado das folhas, do lado oposto ao oval (o oval fica à direita nas figuras de vaso)
    const yAlto = TOPO_DESENHO + 60 + vagasDoAlto * (H + 16);
    vagasDoAlto++;
    return { x: 50, y: yAlto, alinhar: "inicio" };
  };

  // as etiquetas, em ordem; uma etiqueta que cairia em cima de outra (da mesma prancha) desce ou sobe
  const ocupadas: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const retangulo = (c: CaixaDaEtiqueta, w: number, h: number) => {
    const x0 = c.alinhar === "inicio" ? c.x : c.alinhar === "fim" ? c.x - w : c.x - w / 2;
    return { x0, x1: x0 + w, y0: c.y - h / 2, y1: c.y + h / 2 };
  };
  const cruza = (a: { x0: number; x1: number; y0: number; y1: number }) =>
    ocupadas.some((b) => a.x0 < b.x1 + 12 && b.x0 < a.x1 + 12 && a.y0 < b.y1 + 10 && b.y0 < a.y1 + 10);
  // etiquetas que podem ir para a linha de baixo têm no máximo meia linha de largura (quebram em 2 linhas)
  const LARGURA_ETIQUETA = 470;
  const etiquetas = ms.flatMap((m, mi) =>
    (m.etiquetas ?? []).map((e, i) => {
      const ponto = pontoDoAlvo(e.alvo);
      const medida = medidaDaEtiqueta(e.texto, LARGURA_ETIQUETA);
      let caixa = lugarDaEtiqueta(e.alvo, ponto, medida.largura, medida.altura, e.lado);
      for (let tentativa = 0; tentativa < 8 && cruza(retangulo(caixa, medida.largura, medida.altura)); tentativa++) {
        const passo = (medida.altura + 14) * (tentativa % 2 === 0 ? 1 : -1) * (Math.floor(tentativa / 2) + 1);
        caixa = { ...caixa, y: Math.min(1490, Math.max(TOPO_DESENHO + 50, caixa.y + passo)) };
      }
      ocupadas.push(retangulo(caixa, medida.largura, medida.altura));
      return { e, ponto, caixa, numero: i + 1, m, mi };
    }),
  );

  // recorte: no detalhe ampliado, o desenho não sobe no cabeçalho
  const clipId = `corte-${prancha.indice}`;

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`${clipId}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset={TOPO_DESENHO / 1920} stopColor="#fff" stopOpacity={1 - mergulho} />
            <stop offset={(TOPO_DESENHO + 110) / 1920} stopColor="#fff" stopOpacity={1} />
          </linearGradient>
          <mask id={clipId} maskUnits="userSpaceOnUse" x={-200} y={0} width={1480} height={1920}>
            <rect x={-200} y={0} width={1480} height={1920} fill={`url(#${clipId}-g)`} />
          </mask>
        </defs>

        {janela ? (
          <>
            <Janela tinta={tinta} aguada={aguada} lapis={1} luz={aguada * (1 - longeDaLuz * 0.3)} alcance={1 - longeDaLuz * 0.6} />
            <Regua de={JANELA.x + JANELA.w + 10} ate={1030} y={JANELA.piso + 30} p={prog(t, inicioTinta + 0.3, 0.8)} />
            <Cota
              de={JANELA.x + JANELA.w + 14}
              ate={cotaFim}
              y={1430}
              p={quando("afastar") === undefined ? 0 : prog(t, (quando("afastar") as number) + 0.5, 0.5)}
            />
            <EscalaDeLuz y={672} p={prog(t, inicioTinta + 0.35, 0.7)} marca={xJanela} marcaVisivel={prog(t, inicioTinta + 0.8, 0.3)} familia={serif} />
          </>
        ) : null}

        <g mask={detalhe ? `url(#${clipId})` : undefined}>
          <g transform={`translate(${vasoT.x} ${vasoT.y}) scale(${vasoT.s})`}>
            <Vaso {...estado} />
          </g>
        </g>

        {!janela && emRegar !== undefined ? (
          <g opacity={1 - regadorSai}>
            <Regador x={150} y={831 + dyRegador} entrada={regadorEntra} inclina={inclina} t={t} despeja={despeja} />
          </g>
        ) : null}

        {/* detalhe da terra: umidade, dedo, sol, plaquinha */}
        {detalhe ? (
          <g opacity={mergulho}>
            {umida > 0.01 ? (
              <g style={{ mixBlendMode: "multiply" }}>
                <ellipse
                  cx={UMIDA.x}
                  cy={UMIDA.y}
                  rx={270 * (0.3 + 0.7 * umida)}
                  ry={200 * (0.3 + 0.7 * umida)}
                  fill={cor.terraUmida}
                  opacity={umida * 0.55 * (1 - dia * 0.6)}
                  filter="url(#aquarela)"
                />
                <ellipse cx={UMIDA.x + 20} cy={UMIDA.y + 10} rx={160 * umida} ry={120 * umida} fill={cor.terraUmida} opacity={umida * 0.4 * (1 - dia * 0.6)} filter="url(#aquarela)" />
                {[
                  [-150, -40],
                  [-70, 80],
                  [100, -80],
                  [160, 50],
                  [-20, 140],
                  [50, -140],
                  [-200, 60],
                ].map(([dx, dy], i) => {
                  const q = limitar(umida * 2 - i * 0.12) * (1 - dia);
                  const x = UMIDA.x + dx;
                  const y = UMIDA.y + dy;
                  return q > 0 ? (
                    <path
                      key={i}
                      d={`M ${x} ${y - 16} C ${x + 9} ${y - 3} ${x + 11} ${y + 8} ${x} ${y + 12} C ${x - 11} ${y + 8} ${x - 9} ${y - 3} ${x} ${y - 16} Z`}
                      fill={cor.agua}
                      stroke={cor.aguaTinta}
                      strokeWidth={2.4}
                      opacity={q}
                    />
                  ) : null;
                })}
              </g>
            ) : null}
            {emEsperar !== undefined ? (
              <SolNoArco de={190} ate={740} y={MERGULHO.y - 44} altura={50} p={dia} aparece={prog(t, emEsperar - 0.15, 0.35)} />
            ) : null}
            <g mask={`url(#${clipId})`}>
              <Dedo x={DEDO.x} y={dedoY} p={dedo} />
            </g>
            {emEsperar !== undefined ? (
              <>
                <Plaquinha x={896} y={MERGULHO.y + 74} p={prog(t, emEsperar + 0.45, 0.5)} texto={textoEsperar} familia={serif} />
              </>
            ) : null}
          </g>
        ) : null}
      </svg>

      {/* cabeçalhos: cada momento no seu lugar (o do vaso sai quando a câmera mergulha) */}
      {ms.map((m, i) => {
        const segundo = i > 0;
        const lugar = !segundo && ms.length > 1 ? "canto" : detalhe ? "lado" : "canto";
        // o segundo cabeçalho só aparece depois que o oval passou por cima do lugar dele
        const chegou = segundo ? (prancha.mergulho ?? m.de) + 0.66 : chegada;
        // o cabeçalho do vaso sai antes de o oval passar por cima dele
        const fim = i < ms.length - 1 ? (prancha.mergulho ?? m.ate) + 0.2 : Math.max(fimDe(m), proximaChegada + 0.5);
        const saida = i < ms.length - 1 ? saindo(t, fim, 0.24) : 0;
        // o cabeçalho que chega com a câmera só aparece depois que o oval assentou (nunca passa por baixo dele)
        const entra = segundo ? prog(t, chegou - 0.1, 0.45) : chegada > 0.05 ? prog(t, chegada + VIAGEM * 0.8, 0.32) : 1;
        if (entra <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: entra, translate: `${(1 - entra) * 50}px 0` }}>
            <Cabecalho
              area={CABECALHO[lugar]}
              rotulo={m.rotulo ?? (m.numero ? `Fig. ${m.numero}` : detalhe && (segundo || ms.length === 1) ? "Detalhe" : "Figura")}
              titulo={m.titulo}
              destaque={m.destaque}
              apoio={m.apoio}
              indice={m.numero && totalFiguras > 1 ? { total: totalFiguras, atual: m.numero } : undefined}
              palavras={palavras}
              de={Math.max(m.de, segundo ? chegou - 0.1 : m.de)}
              ate={m.ate}
              chegada={segundo ? chegou - 0.1 : chegada}
              t={t}
              saida={saida}
            />
          </div>
        );
      })}

      {etiquetas.map(({ e, ponto, caixa, numero, m, mi }, k) => {
        const fimEtiqueta = mi < ms.length - 1 ? (prancha.mergulho ?? m.ate) : Infinity;
        const s2 = mi < ms.length - 1 ? saindo(t, fimEtiqueta + 0.3, 0.25) : 0;
        return <Etiqueta key={k} ponto={ponto} caixa={caixa} numero={numero} texto={e.texto} erro={e.erro} em={e.em} t={t} saida={s2} larguraMax={LARGURA_ETIQUETA} />;
      })}
    </>
  );
};
