import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { prog, useTempo } from "./anim";
import { CartaoCta, CartaoDestaque, CartaoFrase, CartaoGancho, CartaoNumero, CartaoPergunta, type Zona } from "./componentes/Cartoes";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { PaginaComparacao, PaginaDefinicao, PaginaGrafico, PaginaPassos, PaginaTopicos } from "./componentes/Pagina";
import { TelaDoFunil } from "./componentes/TelaDoFunil";
import { type Historia, historias } from "./funil";
import { estadosDaPessoa, noBloco, ordenar, trechosDaPagina, zoomDoQuadroCheio } from "./layout";
import { caixaNoTempo, CHEIO_16x9, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import { ehTelaDoFunil, type Momento, naPagina, type Plano } from "./plano";
import { PAGINA } from "./pagina";
import { BASE_CARTAO, cor, ESCALA, fonte, H, LARGURA_CARTAO, LEGENDA_Y, logico, MARGEM, PH, PW, W, zona as zonaPadrao } from "./tema";
import { type Estilo, estiloDaJanela, fimDe, type Janela, janelasDaPagina, tempoDoCartao } from "./troca";

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal: um "vum" grave quando a página abre, uma gota por etapa/item que entra (no
// funil, cada vez mais grave: o fluxo afina), duas notas descendo no alerta, duas subindo no
// conserto e um fecho no fim. Nunca dois sons a menos de 0,4 s.
const sons = (plano: Plano, lista: { historia: Historia; momentos: Momento[] }[]): Som[] => {
  const s: Som[] = [];
  const gota = (em: number, k: number) => s.push({ em, arquivo: `sfx/gota-${(k % 4) + 1}.wav`, volume: 0.34 });
  for (const trecho of trechosDaPagina(plano)) s.push({ em: trecho.de, arquivo: "sfx/abre.wav", volume: 0.42 });
  for (const { historia: h } of lista) {
    s.push({ em: h.funil.etapas[0].em + 0.05, arquivo: "sfx/gota-1.wav", volume: 0.36 });
    for (const x of h.transferencias) {
      if (x.particulas.length === 0 || h.consertos.some((c) => Math.abs(c.em - x.inicio) < 0.05 || (x.inicio > c.em && x.inicio - c.em < 2))) continue;
      s.push({ em: x.inicio + 0.75, arquivo: `sfx/gota-${Math.min(4, x.para + 1)}.wav`, volume: 0.36 });
    }
    for (const a of h.alertas) s.push({ em: a.em + 0.02, arquivo: "sfx/alerta.wav", volume: 0.42 });
    for (const c of h.consertos) s.push({ em: c.em + 0.05, arquivo: "sfx/conserto.wav", volume: 0.4 });
  }
  for (const m of plano.momentos) {
    switch (m.tipo) {
      case "topicos":
      case "passos":
        m.itens.forEach((it, k) => gota(it.em + 0.35, k));
        break;
      case "grafico":
        (m.dados ?? []).forEach((d, k) => gota(d.em + 0.3, k));
        break;
      case "comparacao":
        if (m.modo === "errado-certo") {
          s.push({ em: m.lados[0].em + 0.2, arquivo: "sfx/alerta.wav", volume: 0.38 });
          s.push({ em: m.lados[1].em + 0.2, arquivo: "sfx/conserto.wav", volume: 0.38 });
        } else m.lados.forEach((l, k) => gota(l.em + 0.2, k));
        break;
      case "definicao":
        gota(m.em + 0.3, 0);
        gota(m.significadoEm + 0.4, 2);
        break;
      case "numero":
        gota(m.em + 0.9, 1);
        break;
      case "destaque":
        if (m.nivel === "alerta") s.push({ em: m.em + 0.3, arquivo: "sfx/alerta.wav", volume: 0.4 });
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o, k) => gota(o.em + 0.1, k));
        break;
      case "cta":
        s.push({ em: m.de + 0.35, arquivo: "sfx/fim.wav", volume: 0.36 });
        break;
      default:
        break;
    }
  }
  const ordenados = s.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const x of ordenados) if (!saida.length || x.em - saida[saida.length - 1].em > 0.4) saida.push(x);
  return saida;
};

// Fundo da página: papel cinza-quente com uma grade de pontos bem leve (papel de gráfico).
const Fundo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: cor.papel }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="grade" width={36} height={36} patternUnits="userSpaceOnUse">
          <circle cx={18} cy={18} r={1.6} fill={cor.grafite} opacity={0.09} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#grade)" />
    </svg>
  </AbsoluteFill>
);

// A camada lógica (px do vertical) encolhida pela ESCALA até o quadro deitado: a página e os
// cartões são desenhados nela, com os mesmos corpos de letra e traços do vertical.
const CamadaLogica: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH, transform: `scale(${ESCALA})`, transformOrigin: "0 0" }}>{children}</div>
);

// Uma página na tela, com a troca dela (apagar, subir, cortina com a régua grafite)
const Camada: React.FC<{ estilo: Estilo; children: React.ReactNode }> = ({ estilo, children }) => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: estilo.opacidade < 0.999 ? estilo.opacidade : undefined,
        translate: estilo.desloca ? `0 ${estilo.desloca}px` : undefined,
        clipPath:
          estilo.corteEmbaixo !== undefined || estilo.corteEmCima !== undefined
            ? `inset(${estilo.corteEmCima ?? 0}px 0 ${estilo.corteEmbaixo ?? 0}px 0)`
            : undefined,
      }}
    >
      {children}
    </div>
    {estilo.regua !== undefined ? (
      <div
        style={{
          position: "absolute",
          left: PAGINA.esquerda - 24,
          width: PAGINA.direita - PAGINA.esquerda + 48,
          top: estilo.regua - 2,
          height: 4,
          borderRadius: 2,
          background: cor.grafite,
          opacity: 0.85,
        }}
      />
    ) : null}
  </>
);

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  // a faixa dos cartões (px lógicos): uma fileira larga centrada no rosto, da base até o queixo
  const larguraCartao = Math.min(LARGURA_CARTAO, W - 2 * MARGEM);
  const esquerdaCartao = Math.min(W - MARGEM - larguraCartao, Math.max(MARGEM, plano.rosto.x * W - larguraCartao / 2));
  const zonaCartao: Zona = {
    esquerda: logico(esquerdaCartao),
    largura: logico(larguraCartao),
    base: logico(BASE_CARTAO),
    // logo abaixo do queixo (o `topo` da zona fica 60 px abaixo dele); no mínimo 240 px de faixa
    topoMin: logico(Math.min(zona.topo - 50, BASE_CARTAO - 240)),
  };
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const lista = useMemo(() => historias(plano.momentos), [plano]);
  const historiaDe = useMemo(() => {
    const mapa = new Map<Momento, Historia>();
    for (const { historia, momentos } of lista) for (const m of momentos) mapa.set(m, historia);
    return (m: Momento) => mapa.get(m);
  }, [lista]);
  const janelas = useMemo(
    () => janelasDaPagina(plano, (a, b) => ehTelaDoFunil(a) && ehTelaDoFunil(b) && historiaDe(a) !== undefined && historiaDe(a) === historiaDe(b)),
    [plano, historiaDe],
  );
  const estados = useMemo(() => estadosDaPessoa(plano), [plano]);
  const listaSons = useMemo(() => sons(plano, lista), [plano, lista]);
  const trechos = useMemo(() => trechosDaPagina(plano), [plano]);

  const caixa0 = caixaNoTempo(t, estados, CHEIO_16x9);
  const bloco = noBloco(caixa0);
  const caixa = { ...caixa0, zoom: (caixa0.zoom ?? 1) * (1 + (zoomDoQuadroCheio(t, plano) - 1) * (1 - bloco)) };

  // a página aparece enquanto a pessoa não cobre tudo
  const aberta = bloco > 0.001 ? 1 : 0;

  // o funil: visível nas janelas dos seus momentos (o funil e o conserto dele são a mesma tela)
  const funis = lista
    .map(({ historia, momentos }) => {
      let estilo: Estilo | null = null;
      for (const m of momentos) {
        const j = janelas.get(m);
        const e = j ? estiloDaJanela(t, j) : null;
        if (e && (!estilo || e.opacidade > estilo.opacidade)) estilo = e;
      }
      return { historia, momentos, estilo };
    })
    .filter((f): f is { historia: Historia; momentos: Momento[]; estilo: Estilo } => f.estilo !== null);

  // as outras páginas
  const paginas = plano.momentos
    .filter((m) => naPagina(m) && !ehTelaDoFunil(m))
    .map((m) => {
      const j = janelas.get(m) as Janela;
      return { m, j, estilo: estiloDaJanela(t, j) };
    })
    .filter((x) => x.estilo !== null);

  // momentos de quadro cheio (cartões)
  const cartoes = plano.momentos.filter((m) => !naPagina(m) && t >= m.de - 0.5 && t <= fimDe(m, plano) + 0.4);

  // legenda: na área segura de baixo, no quadro cheio e na página
  const yLegenda = () => LEGENDA_Y;

  return (
    <AbsoluteFill style={{ backgroundColor: cor.papel, fontFamily: fonte }}>
      <Fundo />
      <CamadaLogica>
      {aberta
        ? funis.map((f) => (
            <Camada key={`f-${f.historia.funil.de}`} estilo={f.estilo}>
              <TelaDoFunil h={f.historia} momentos={f.momentos} palavras={plano.palavras} t={t} aberta={aberta} />
            </Camada>
          ))
        : null}
      {aberta
        ? paginas.map(({ m, j, estilo }) => {
            const chave = `${m.tipo}-${m.de}`;
            const props = { palavras: plano.palavras, t, entra: j.entrada === "fundo" ? j.entra - 0.3 : j.entra, sai: j.sai };
            const pagina =
              m.tipo === "topicos" ? (
                <PaginaTopicos m={m} {...props} />
              ) : m.tipo === "passos" ? (
                <PaginaPassos m={m} {...props} />
              ) : m.tipo === "comparacao" ? (
                <PaginaComparacao m={m} {...props} />
              ) : m.tipo === "grafico" ? (
                <PaginaGrafico m={m} {...props} />
              ) : m.tipo === "definicao" ? (
                <PaginaDefinicao m={m} {...props} />
              ) : null;
            return (
              <Camada key={chave} estilo={estilo as Estilo}>
                {pagina}
              </Camada>
            );
          })
        : null}
      </CamadaLogica>

      {/* a pessoa: uma caixa só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.02)" />
      {videoAltura < H ? (
        <div
          style={{
            position: "absolute",
            left: caixa.x,
            top: caixa.y + caixa.h * 0.74,
            width: caixa.w,
            height: caixa.h * 0.26 + 1,
            background: `linear-gradient(to bottom, rgba(232,230,225,0), ${cor.papel})`,
            opacity: 1 - bloco,
          }}
        />
      ) : null}

      {/* contorno da moldura e etiqueta com o nome */}
      {bloco > 0.02 ? (
        <div
          style={{
            position: "absolute",
            left: caixa.x,
            top: caixa.y,
            width: caixa.w,
            height: caixa.h,
            borderRadius: caixa.raio,
            boxShadow: `inset 0 0 0 3px rgba(31,32,35,${0.9 * bloco})`,
          }}
        >
          {plano.marca.nome ? (
            <div
              style={{
                position: "absolute",
                left: 14,
                bottom: 14,
                maxWidth: caixa.w - 28,
                padding: "6px 14px 8px",
                borderRadius: 12,
                background: cor.grafite,
                color: cor.branco,
                fontSize: 32,
                fontWeight: 800,
                lineHeight: 1.05,
                opacity: prog(bloco, 0.7, 0.3),
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {plano.marca.nome}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* cartões de quadro cheio, na altura do peito (numa fileira larga) */}
      <CamadaLogica>
      {cartoes.map((m) => {
        const chave = `${m.tipo}-${m.de}`;
        const tempo = tempoDoCartao(m, plano, trechos);
        const props = { palavras: plano.palavras, t, zona: zonaCartao, entra: tempo.entra, fim: tempo.fim };
        if (m.tipo === "gancho" || m.tipo === "abertura") return <CartaoGancho key={chave} m={m} {...props} entra={tempo.vemDaPagina ? tempo.entra : undefined} />;
        if (m.tipo === "numero") return <CartaoNumero key={chave} m={m} {...props} />;
        if (m.tipo === "destaque") return <CartaoDestaque key={chave} m={m} {...props} />;
        if (m.tipo === "frase") return <CartaoFrase key={chave} m={m} {...props} />;
        if (m.tipo === "pergunta") return <CartaoPergunta key={chave} m={m} {...props} />;
        if (m.tipo === "cta") return <CartaoCta key={chave} m={m} {...props} marca={plano.marca} />;
        return null;
      })}
      </CamadaLogica>

      <Legendas frases={frases} y={yLegenda} />

      {guias ? <Guias plano={plano} zona={zona} legendaY={LEGENDA_Y} /> : null}

      {plano.sfx === false
        ? null
        : listaSons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
