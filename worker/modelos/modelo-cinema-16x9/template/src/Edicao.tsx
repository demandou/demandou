import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { PalavrasCtx, prog, saindo, useTempo } from "./anim";
import { NaBarra, NaJanela } from "./componentes/Barras";
import { Abertura, Comparacao, Definicao, Destaque, Numero, Pergunta } from "./componentes/Blocos";
import { Cabeca } from "./componentes/Cabeca";
import { Cartela, ehNumerico } from "./componentes/Cartela";
import { Creditos } from "./componentes/Creditos";
import { Fala } from "./componentes/Fala";
import { Frase, linhasDaFrase, TAMANHO_MAX } from "./componentes/Frase";
import { Grafico } from "./componentes/Grafico";
import { Grao } from "./componentes/Grao";
import { Guias } from "./componentes/Guias";
import { Letreiro } from "./componentes/Letreiro";
import { Lista } from "./componentes/Lista";
import { Narracao } from "./componentes/Narracao";
import { abertura, alvoDoBloco, caixaDoEstado, centroDaNarracao, gatilhosDoCabecalho, linhaDaJanela, lugarDaFrase, queixoNaTela } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor } from "./tema";

// O último momento fica até o fim do vídeo quando são os créditos ou quando termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "creditos" || m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// Um momento nunca invade o seguinte (termina quando o próximo começa).
const semSobreposicao = (plano: Plano): Plano => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordem.map((m, i) => {
      const proximo = ordem[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

const alturaDaFrase = (m: Extract<Momento, { tipo: "frase" }>) => linhasDaFrase(m).linhas.length * TAMANHO_MAX * 1.06;

// Som raro e tonal: um grave quando as barras apertam num letreiro, abertura ou número (ou a tela
// fecha numa cartela), uma nota quando a hora ou o número pousa, um acorde longo e grave sob cada
// frase-chave (cada uma um tom abaixo), duas notas descendo no alerta, um sopro grave quando a
// janela desce para a cartela alta e um acorde nos créditos.
const sons = (plano: Plano) => {
  const lista: { em: number; arquivo: string; volume: number }[] = [];
  let frases = 0;
  for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
    if (m.tipo === "cartela" || m.tipo === "letreiro" || m.tipo === "abertura") {
      lista.push({ em: Math.max(0, m.de), arquivo: "sfx/fecha.wav", volume: 0.2 });
      if ((m.tipo === "cartela" || m.tipo === "letreiro") && ehNumerico(m.titulo)) {
        const inicio = m.tituloEm ?? m.de + 0.2;
        const pousa = Math.max(inicio + 0.5, m.pousaEm ?? inicio + 1.05);
        lista.push({ em: Math.max(0, pousa - 0.1), arquivo: "sfx/pousa.wav", volume: 0.3 });
      }
    }
    if (m.tipo === "numero") {
      lista.push({ em: Math.max(0, m.de), arquivo: "sfx/fecha.wav", volume: 0.16 });
      lista.push({ em: Math.max(0, m.em + 1.05), arquivo: "sfx/pousa.wav", volume: 0.3 });
    }
    if (m.tipo === "frase") lista.push({ em: Math.max(0, m.de - 0.1), arquivo: `sfx/frase-${(frases++ % 2) + 1}.wav`, volume: 0.22 });
    if (m.tipo === "destaque") {
      if (m.nivel === "chave") lista.push({ em: Math.max(0, m.em - 0.1), arquivo: `sfx/frase-${(frases++ % 2) + 1}.wav`, volume: 0.2 });
      else lista.push({ em: Math.max(0, m.em - 0.05), arquivo: "sfx/alerta.wav", volume: 0.26 });
    }
    if (m.tipo === "definicao") lista.push({ em: Math.max(0, m.significadoEm - 0.05), arquivo: "sfx/pousa.wav", volume: 0.2 });
    if (m.tipo === "comparacao") lista.push({ em: Math.max(0, m.lados[1].em - 0.05), arquivo: "sfx/pousa.wav", volume: 0.2 });
    if (m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "grafico") lista.push({ em: Math.max(0, m.de), arquivo: "sfx/desce.wav", volume: 0.22 });
    if (m.tipo === "creditos" || m.tipo === "cta") lista.push({ em: m.de + 0.2, arquivo: "sfx/fim.wav", volume: 0.32 });
  }
  // dois sons a menos de 0,35 s um do outro viram um só (o primeiro)
  return lista.sort((a, b) => a.em - b.em).filter((s, i, todos) => i === 0 || s.em - todos[i - 1].em > 0.35);
};

// Quanto cada bloco escurece a imagem enquanto dura (os de barra que falam "sobre" o rosto).
const ESCURO: Partial<Record<Momento["tipo"], number>> = {
  letreiro: 0.72,
  abertura: 0.72,
  numero: 0.5,
  destaque: 0.55,
  definicao: 0.3,
  comparacao: 0.3,
  pergunta: 0.4,
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => semSobreposicao(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(1080, plano.videoAltura ?? 1080);

  const estadoEm = useMemo(() => linhaDaJanela(plano), [plano]);
  const gatilhos = useMemo(() => gatilhosDoCabecalho(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const ordem = useMemo(() => [...plano.momentos].sort((a, b) => a.de - b.de), [plano]);

  const estado = estadoEm(t);
  const caixa = caixaDoEstado(estado);
  const centro = centroDaNarracao(estado);
  const ativos = ordem.filter((m) => t >= m.de - 0.1 && t <= fimDoMomento(m, plano));

  // a imagem escurece sob as frases-chave, os letreiros e os blocos de barra (o rosto continua visível)
  const escuro = Math.max(
    0,
    ...ordem.map((m) => {
      const presenca = Math.min(prog(t, m.de - 0.2, 0.9), 1 - saindo(t, m.ate + 0.4, 0.7));
      if (m.tipo === "letreiro" || m.tipo === "abertura") return 0.72 * (m.de <= 0.15 ? 1 - saindo(t, m.ate + 0.4, 0.7) : presenca);
      if (m.tipo === "frase") {
        const sobreAImagem = !lugarDaFrase(plano, estadoEm, m.de, m.ate, alturaDaFrase(m)).naBarra;
        return (sobreAImagem ? 1 : 0.62) * presenca;
      }
      const e = ESCURO[m.tipo];
      return e ? e * (m.de <= 0.15 ? 1 - saindo(t, m.ate + 0.4, 0.7) : presenca) : 0;
    }),
  );
  // no alerta, a imagem esfria: perde o calor da gradação e fica quase sem cor
  const frio = Math.max(
    0,
    ...ordem.map((m) => (m.tipo === "destaque" && m.nivel !== "chave" ? Math.min(prog(t, m.em - 0.15, 0.7), 1 - saindo(t, m.ate + 0.5, 0.8)) : 0)),
  );
  const filtro = `contrast(${(1.08 + 0.06 * frio).toFixed(3)}) saturate(${(0.8 - 0.62 * frio).toFixed(3)}) sepia(${(0.14 * (1 - frio)).toFixed(3)}) brightness(${(0.96 - 0.06 * frio).toFixed(3)})`;
  // com a tela aberta, a base da imagem escurece para a narração ler
  const degrade = abertura(estado);

  // cabeçalho de capítulo: o da última cartela/letreiro que já passou (sem `cabeca`, continua o
  // anterior). Não fica parado: aparece ~3 s depois de cada aperto das barras (e depois de uma
  // cartela que devolve a tela apertada) e some.
  let cabeca = "";
  for (const m of ordem) {
    if ((m.tipo === "cartela" || m.tipo === "letreiro") && m.ate <= t + 0.05 && m.cabeca !== undefined) cabeca = m.cabeca;
  }
  // um bloco que escreve nas barras não divide a barra de cima com o cabeçalho
  const emFixo = ativos.some((m) => alvoDoBloco(m) !== null);
  const entradaDoCabecalho = Math.max(0, ...gatilhos.map((g) => Math.min(prog(t, g + 0.25, 0.9), 1 - saindo(t, g + 3.6, 0.8))));

  return (
    <PalavrasCtx.Provider value={palavras}>
      <AbsoluteFill style={{ backgroundColor: cor.preto }}>
        {/* o vídeo fica sempre montado, mesmo com a tela fechada numa cartela: é ele que traz a voz */}
        <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro={filtro} />
        {caixa.h > 1 && caixa.w > 1 ? (
          <>
            {/* gradação quente (ou fria, no alerta), vinheta e escurecimento: só dentro da janela */}
            <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "#B97A36", mixBlendMode: "soft-light", opacity: 0.26 * (1 - frio) }} />
              {frio > 0 ? <div style={{ position: "absolute", inset: 0, background: "#5E6E7E", mixBlendMode: "soft-light", opacity: 0.4 * frio }} /> : null}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse 75% 62% at 50% 42%, rgba(11,8,6,0) 55%, rgba(11,8,6,0.62) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "38%",
                  background: "linear-gradient(to bottom, rgba(11,8,6,0), rgba(11,8,6,0.82))",
                  opacity: degrade,
                }}
              />
              <div style={{ position: "absolute", inset: 0, background: "rgba(9,6,4,1)", opacity: 0.58 * escuro }} />
            </div>
          </>
        ) : null}

        {!emFixo && entradaDoCabecalho > 0 ? (
          <Cabeca texto={cabeca} topoJanela={estado.topo} alturaJanela={caixa.h} esqJanela={estado.esq} entrada={entradaDoCabecalho} />
        ) : null}

        {ativos.map((m) => {
          const chave = `${m.tipo}-${m.de}`;
          const primeira = m.de <= 0.15;
          // o conteúdo fica onde as barras assentam (não acompanha as barras se mexendo); as barras
          // e a moldura de agora recortam o texto, como uma cortina
          const assentado = estadoEm(Math.min(m.ate, m.de + 1.1));
          const comum = { estado, assentado, primeira, marca: plano.marca };
          switch (m.tipo) {
            case "cartela":
              return <Cartela key={chave} m={m} primeira={primeira} />;
            case "letreiro":
              return <Letreiro key={chave} m={m} primeira={primeira} estado={estado} />;
            case "frase": {
              const lugar = lugarDaFrase(plano, estadoEm, m.de, m.ate, alturaDaFrase(m));
              // na barra de baixo, a frase só aparece dentro da barra (nunca sobre a janela que ainda se move)
              return lugar.naBarra ? (
                <NaBarra key={chave} lado="baixo" estado={estado}>
                  <Frase m={m} lugar={lugar} />
                </NaBarra>
              ) : (
                // sobre a imagem, a frase só aparece dentro da janela (nunca sobre o preto das barras se abrindo)
                <NaJanela key={chave} estado={estado}>
                  <Frase m={m} lugar={lugar} />
                </NaJanela>
              );
            }
            case "fala":
              // a fala fica parada onde a barra vai assentar (não acompanha as barras se mexendo)
              return <Fala key={chave} m={m} centro={centroDaNarracao(estadoEm(Math.min(m.ate, m.de + 1.0)))} />;
            case "creditos":
            case "cta":
              return <Creditos key={chave} m={m} marca={plano.marca} estado={estado} />;
            case "abertura":
              return <Abertura key={chave} m={m} {...comum} />;
            case "numero":
              return <Numero key={chave} m={m} {...comum} />;
            case "destaque":
              return <Destaque key={chave} m={m} {...comum} />;
            case "definicao":
              return <Definicao key={chave} m={m} {...comum} />;
            case "comparacao":
              return <Comparacao key={chave} m={m} {...comum} />;
            case "pergunta":
              return <Pergunta key={chave} m={m} {...comum} />;
            case "topicos":
            case "passos":
              return <Lista key={chave} m={m} estado={estado} primeira={primeira} />;
            case "grafico":
              return <Grafico key={chave} m={m} estado={estado} primeira={primeira} />;
            default:
              return null;
          }
        })}

        <Narracao frases={frases} centro={centro} baseNoTempo={(x) => estadoEm(x).base} />

        {plano.grao === false ? null : <Grao esq={caixa.x} topo={caixa.y} largura={caixa.w} altura={caixa.h} />}

        {guias ? <Guias plano={plano} estado={estado} queixo={queixoNaTela(estado, plano)} /> : null}

        {plano.sfx === false
          ? null
          : listaDeSons.map((s) => (
              <Sequence key={`${s.arquivo}-${s.em}`} from={Math.round(s.em * fps)} layout="none">
                <Audio src={staticFile(s.arquivo)} volume={s.volume} />
              </Sequence>
            ))}
      </AbsoluteFill>
    </PalavrasCtx.Provider>
  );
};
