import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { useTempo } from "./anim";
import { Abertura } from "./componentes/Abertura";
import { DefinicaoTv, DestaqueTv, NumeroTv, PerguntaTv } from "./componentes/Artes";
import { Cabecalho } from "./componentes/Cabecalho";
import { CaixaTv } from "./componentes/CaixaTv";
import { Cta } from "./componentes/Cta";
import { Frase } from "./componentes/Frase";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Placar } from "./componentes/Placar";
import { Prancheta } from "./componentes/Prancheta";
import { Resumo } from "./componentes/Resumo";
import { Vinheta } from "./componentes/Vinheta";
import { ehDica, estadosDaPessoa, inicioVisual, type Janela, janelaAtiva, janelasDaPrancheta, naCaixa, naPrancheta, ordenar } from "./layout";
import { caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, H, zona as zonaPadrao } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal: um "vum" grave quando a prancheta entra, duas notas de placar na vinheta,
// um toque surdo de bola no passe e um mais forte no chute, uma nota curta quando uma zona acende
// (subindo de altura a cada zona) e o fecho do fim. Nunca dois sons a menos de 0,45 s.
const sons = (plano: Plano, janelas: Janela[]): Som[] => {
  const lista: Som[] = [];
  let nota = 0;
  const acende = () => `sfx/acende-${(nota++ % 3) + 1}.wav`;
  for (const m of plano.momentos) {
    if (m.tipo === "abertura") lista.push({ em: Math.max(0, m.de + 0.25), arquivo: "sfx/placar.wav", volume: 0.42 });
    if (m.tipo === "resumo") {
      m.itens.forEach((i) => lista.push({ em: i.em + 0.15, arquivo: acende(), volume: 0.3 }));
      if (m.resultado) lista.push({ em: m.resultado.em + 0.95, arquivo: "sfx/placar.wav", volume: 0.36 });
    }
    if (m.tipo === "numero") lista.push({ em: m.em, arquivo: "sfx/placar.wav", volume: 0.36 });
    if (m.tipo === "destaque") lista.push({ em: m.em, arquivo: acende(), volume: 0.34 });
    if (m.tipo === "definicao") lista.push({ em: m.significadoEm, arquivo: acende(), volume: 0.3 });
    if (m.tipo === "pergunta") (m.opcoes ?? []).forEach((o) => lista.push({ em: o.em + 0.1, arquivo: acende(), volume: 0.28 }));
    if (m.tipo === "cta") lista.push({ em: m.ate - 0.6, arquivo: "sfx/fim.wav", volume: 0.4 });
  }
  for (const j of janelas) {
    const { dica } = j;
    if (j.universal) {
      const u = j.universal;
      lista.push({ em: j.entra + 0.05, arquivo: "sfx/vum.wav", volume: 0.4 });
      if (u.tipo === "topicos" || u.tipo === "passos") u.itens.forEach((i) => lista.push({ em: i.em, arquivo: u.tipo === "passos" ? "sfx/toque.wav" : acende(), volume: 0.34 }));
      if (u.tipo === "comparacao") {
        u.lados.forEach((l) => lista.push({ em: l.em, arquivo: acende(), volume: 0.3 }));
        if (u.vencedorEm !== undefined) lista.push({ em: u.vencedorEm, arquivo: "sfx/placar.wav", volume: 0.36 });
      }
      if (u.tipo === "grafico") (u.dados ?? []).forEach((d) => lista.push({ em: d.em, arquivo: acende(), volume: 0.28 }));
      continue;
    }
    if (j.entra - dica.de > 0.3) {
      const vinheta = inicioVisual(dica.de, janelas.filter((o) => o !== j));
      lista.push({ em: vinheta + 0.08, arquivo: "sfx/placar.wav", volume: 0.42 });
    }
    lista.push({ em: j.entra + 0.05, arquivo: "sfx/vum.wav", volume: 0.42 });
    // ações que já tinham acontecido quando a prancheta entra (o passe que trouxe a bola) não soam
    for (const a of (dica.campo?.acoes ?? []).filter((x) => x.em >= j.entra)) {
      if (a.tipo === "passe") lista.push({ em: a.em + 0.05, arquivo: "sfx/toque.wav", volume: 0.5 });
      if (a.tipo === "chute") lista.push({ em: a.em + 0.03, arquivo: "sfx/chute.wav", volume: 0.5 });
      if (a.tipo === "destaque" || a.tipo === "espaco") lista.push({ em: a.em + 0.05, arquivo: acende(), volume: 0.3 });
    }
    if (dica.gol && dica.campo) lista.push({ em: dica.gol.em + 0.05, arquivo: "sfx/vum.wav", volume: 0.3 });
    for (const a of dica.gol?.acoes ?? []) {
      if (a.tipo === "zona") lista.push({ em: a.em + 0.05, arquivo: acende(), volume: 0.32 });
      if (a.tipo === "chute") lista.push({ em: a.em + 0.03, arquivo: "sfx/chute.wav", volume: 0.5 });
      if (a.tipo === "origem") lista.push({ em: a.em + 0.05, arquivo: "sfx/toque.wav", volume: 0.4 });
    }
  }
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
const fimDe = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const janelas = useMemo(() => janelasDaPrancheta(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano, janelas), [plano, janelas]);
  const listaSons = useMemo(() => sons(plano, janelas), [plano, janelas]);

  const caixa = caixaNoTempo(t, estados);
  const ativa = janelaAtiva(t, janelas);
  // o placar e a vinheta contam só as dicas (os blocos de prancheta não têm número)
  const dicas = janelas.filter((j) => !j.universal);
  const presenca = naCaixa(t, janelas);
  // as artes de quadro cheio só valem enquanto a pessoa está em quadro cheio (ou saindo dele)
  const artes = plano.momentos.filter((m) => !naPrancheta(m) && t >= m.de - 0.05 && t <= fimDe(m, plano) + 0.2);
  const ultimo = plano.momentos[plano.momentos.length - 1];
  const fimDoPlacar = ultimo && ultimo.tipo === "cta" ? plano.duracao + 1 : plano.duracao + 1;

  return (
    <AbsoluteFill style={{ backgroundColor: cor.tv }}>
      {/* 1. a prancheta da dica (por trás da pessoa: aparece quando ela encolhe) */}
      {ativa ? <Prancheta janela={ativa} t={t} palavras={plano.palavras} /> : null}
      {ativa ? <Cabecalho janela={ativa} palavras={plano.palavras} t={t} /> : null}

      {/* 2. a pessoa: uma caixa só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.02)" />
      <CaixaTv caixa={caixa} presenca={presenca} marca={plano.marca} />

      {/* 3. artes de quadro cheio, na altura do peito */}
      {dicas.map((j) => (
        <Vinheta key={`v-${j.numero}`} janela={j} janelas={janelas} total={dicas.length} t={t} topo={zona.topo} />
      ))}
      {artes.map((m0) => {
        const chave = `${m0.tipo}-${m0.de}`;
        // a arte sai um instante depois do fim, cruzando com a que entra (nenhum quadro sem arte)
        const fim = fimDe(m0, plano) + 0.06;
        // e só entra quando a pessoa já cobriu a prancheta
        const m = { ...m0, de: inicioVisual(m0.de, janelas) };
        switch (m.tipo) {
          case "abertura":
            return <Abertura key={chave} m={m} palavras={plano.palavras} t={t} topo={zona.topo} fim={fim} />;
          case "numero":
            return <NumeroTv key={chave} m={m} palavras={plano.palavras} t={t} topo={zona.topo} fim={fim} altura={zona.altura} />;
          case "destaque":
            return <DestaqueTv key={chave} m={m} palavras={plano.palavras} t={t} topo={zona.topo} fim={fim} altura={zona.altura} />;
          case "definicao":
            return <DefinicaoTv key={chave} m={m} palavras={plano.palavras} t={t} topo={zona.topo} fim={fim} altura={zona.altura} />;
          case "pergunta":
            return <PerguntaTv key={chave} m={m} palavras={plano.palavras} t={t} topo={zona.topo} fim={fim} altura={zona.altura} />;
          case "resumo":
            return <Resumo key={chave} m={m} palavras={plano.palavras} t={t} topo={zona.topo} fim={fim} />;
          case "frase":
            return <Frase key={chave} m={m} palavras={plano.palavras} t={t} topo={zona.topo} fim={fim} />;
          case "cta":
            return <Cta key={chave} m={m} marca={plano.marca} palavras={plano.palavras} t={t} topo={zona.topo} fim={fim} />;
          default:
            return null;
        }
      })}

      {/* 4. a moldura da transmissão: placar de dicas e legenda */}
      {dicas.length > 1 ? <Placar t={t} janelas={dicas} fim={fimDoPlacar} /> : null}
      <Legendas frases={frases} />

      {guias ? <Guias plano={plano} topo={zona.topo} /> : null}

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
