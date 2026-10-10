// O modelo Case: um relatório de case que se monta enquanto a pessoa fala. Em cima, a FOLHA (o
// cabeçalho fixo e as páginas, por onde a câmera desce); embaixo, a pessoa numa moldura larga.
// Só cortes secos; a cor da pessoa nunca muda.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  paginaAbertura,
  paginaComparacao,
  paginaDefinicao,
  paginaDestaque,
  paginaFechamento,
  paginaFrase,
  paginaGrafico,
  paginaLista,
  paginaNumero,
} from "./componentes/Blocos";
import { paginaFicha, paginasDoCase } from "./componentes/Case";
import { paginaDepoimento } from "./componentes/Depoimento";
import { FundoDaMoldura, Mesa, Tarja } from "./componentes/Estudio";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { Folha, type Pagina } from "./componentes/Relatorio";
import { ordenar, prepararLayout } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import type { Plano } from "./plano";
import { cor } from "./tema";

// Cada momento vira uma ou mais páginas do relatório. Uma `pergunta` sem opções seguida de um `cta`
// divide a mesma página (PRÓXIMO PASSO).
export const paginasDoPlano = (plano: Plano): Pagina[] => {
  const ordem = ordenar(plano);
  const lista: Pagina[] = [];
  for (let i = 0; i < ordem.length; i++) {
    const m = ordem[i];
    switch (m.tipo) {
      case "case":
        lista.push(...paginasDoCase(m, plano));
        break;
      case "ficha":
        lista.push(paginaFicha(m, plano));
        break;
      case "depoimento":
        lista.push(paginaDepoimento(m, plano));
        break;
      case "pergunta": {
        const prox = ordem[i + 1];
        if (!m.opcoes?.length && prox?.tipo === "cta" && Math.abs(prox.de - m.ate) <= 0.3) {
          lista.push(paginaFechamento(plano, prox, m));
          i++;
        } else lista.push(paginaFechamento(plano, null, m));
        break;
      }
      case "cta":
        lista.push(paginaFechamento(plano, m, null));
        break;
      case "abertura":
        lista.push(paginaAbertura(m, plano));
        break;
      case "topicos":
      case "passos":
        lista.push(paginaLista(m, plano));
        break;
      case "numero":
        lista.push(paginaNumero(m, plano));
        break;
      case "comparacao":
        lista.push(paginaComparacao(m, plano));
        break;
      case "grafico":
        lista.push(paginaGrafico(m, plano));
        break;
      case "destaque":
        lista.push(paginaDestaque(m, plano));
        break;
      case "definicao":
        lista.push(paginaDefinicao(m, plano));
        break;
      case "frase":
        lista.push(paginaFrase(m, plano));
        break;
    }
  }
  return lista.sort((a, b) => a.chegada - b.chegada);
};

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais, raros e bem abaixo da voz: uma nota de marimba por item marcado (subindo), um deslize
// grave quando a barra cai (ou sobe), duas notas no resultado, um toque duplo na mensagem, um
// brilho curto nas estrelas e um "pop" no enviar.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number, nome: string, volume: number) => lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "case":
        (m.mudancas?.itens ?? []).forEach((it, i) => s(it.em, `marca-${(i % 4) + 1}`, 0.2));
        if (m.resultado) {
          const r = m.resultado;
          const mov = r.movimentoEm ?? (r.depoisEm ?? r.em + 0.5) + 0.3;
          s(mov, r.direcao === "cai" ? "queda" : "subida", 0.2);
          if (r.relacao) s(r.relacaoEm ?? mov + 0.6, "resultado", 0.26);
        }
        break;
      case "depoimento":
        s(m.textoEm ?? m.em + 0.3, "mensagem", 0.22);
        if (m.estrelas) s(m.estrelasEm ?? (m.textoEm ?? m.em + 0.3) + 0.5, "estrela", 0.16);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it, i) => s(it.em, `marca-${(i % 4) + 1}`, 0.16));
        break;
      case "comparacao":
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "resultado", 0.22);
        break;
      case "grafico":
        (m.dados ?? []).forEach((d, i) => s(d.em, `marca-${(i % 4) + 1}`, 0.14));
        break;
      case "numero":
      case "destaque":
        s(m.em, "marca-1", 0.18);
        break;
      case "cta": {
        const em = m.em ?? m.de;
        if ((m.icone ?? "comentar") === "comentar" && m.destaque) s((m.destaqueEm ?? em + 0.5) + [...m.destaque].length * 0.07 + 0.18, "envio", 0.2);
        else s(m.destaqueEm ?? em + 0.5, "envio", 0.2);
        break;
      }
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.1);
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const paginas = useMemo(() => paginasDoPlano(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const bloqueios = useMemo(() => faixasSemLegenda(plano).map((f) => f.de), [plano]);
  const lay = useMemo(() => prepararLayout(plano), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const caixa = lay.caixa(t);
  const fimTarja = Math.min(3.6, plano.duracao);

  return (
    <AbsoluteFill style={{ backgroundColor: cor.mesa }}>
      <Mesa />
      <Folha t={t} plano={plano} paginas={paginas} />
      <FundoDaMoldura />
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      <Tarja t={t} plano={plano} de={0.2} ate={fimTarja} />
      <Legenda t={t} frases={frases} bloqueios={bloqueios} y={lay.yLegenda} />
      {guias ? <Guias plano={plano} caixa={caixa} t={t} lay={lay} /> : null}
      {plano.sfx === false
        ? null
        : listaDeSons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
