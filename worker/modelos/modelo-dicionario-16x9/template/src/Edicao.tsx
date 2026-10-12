import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { preciso, prog, saindo, useTempo } from "./anim";
import { Frase } from "./componentes/Frase";
import { Abertura, Cta, FolhaDeBaixo } from "./componentes/Frontispicio";
import { Guias } from "./componentes/Guias";
import { type Aba, Indice } from "./componentes/Indice";
import { Legendas } from "./componentes/Legendas";
import { Papel, SombraDaFolha, Virando } from "./componentes/Pagina";
import { Pessoa } from "./componentes/Pessoa";
import { FrontispicioDoBloco, PaginaDoBloco } from "./componentes/Paginas";
import { Remissao } from "./componentes/Remissao";
import { Verbete } from "./componentes/Verbete";
import {
  areasDoLayout,
  chavesDaPagina,
  ehAssinatura,
  ehFrontispicio,
  estadosDaPessoa,
  fioDoLayout,
  type Folha,
  folhasDo,
  molduraNoTempo,
  topoDoFrontispicio,
  VIRADA,
} from "./layout";
import { caixaNoTempo, CHEIO_16x9 } from "./motor/caixa";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Momento, Palavra, Plano } from "./plano";
import { cor, H } from "./tema";

// Ajuste de segurança antes de desenhar: um momento nunca invade o seguinte.
const comCapa = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordenados.map((m, i) => {
      const proximo = ordenados[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

type Som = { em: number; arquivo: string; volume: number };

// Sons raros e tonais: a página que sobe, a página que vira, o carimbo, a palavra certa e a fita.
// Nunca dois sons colados (0,45 s de intervalo).
const listaDeSons = (plano: Plano, folhas: Folha[]): Som[] => {
  const lista: Som[] = [];
  folhas.forEach((f, i) => lista.push({ em: f.de + 0.02, arquivo: `sfx/folha-${(i % 3) + 1}.wav`, volume: 0.5 }));
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  ordem.forEach((m, i) => {
    const antes = ordem[i - 1];
    // frontispício no meio do vídeo: a folha sobe (ou vira, quando vem de outro frontispício)
    if (ehFrontispicio(m) && m.tipo !== "abertura" && m.tipo !== "cta" && antes) {
      const colado = m.de - antes.ate < 0.3;
      if (colado && ehFrontispicio(antes)) lista.push({ em: m.de + 0.02, arquivo: "sfx/folha-2.wav", volume: 0.45 });
      else lista.push({ em: m.de + 0.05, arquivo: "sfx/abre.wav", volume: 0.3 });
    }
    switch (m.tipo) {
      case "abertura":
        lista.push({ em: m.de + 0.05, arquivo: "sfx/abre.wav", volume: 0.42 });
        break;
      case "verbete": {
        if (m.carimbo) lista.push({ em: m.carimbo.em, arquivo: "sfx/carimbo.wav", volume: 0.62 });
        break;
      }
      case "remissao":
        lista.push({ em: m.palavra.em, arquivo: "sfx/acerto.wav", volume: 0.4 });
        break;
      case "destaque":
        if (m.nivel === "alerta") lista.push({ em: m.em, arquivo: "sfx/carimbo.wav", volume: 0.6 });
        break;
      case "definicao":
        lista.push({ em: m.significadoEm, arquivo: "sfx/acerto.wav", volume: 0.34 });
        break;
      case "comparacao": {
        const v = m.vencedor ?? (m.modo === "errado-certo" ? 1 : undefined);
        if (v !== undefined) lista.push({ em: m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.6, arquivo: "sfx/acerto.wav", volume: 0.34 });
        break;
      }
      case "cta":
        if ((m.icone ?? "salvar") === "salvar") lista.push({ em: m.de + 0.3, arquivo: "sfx/fita.wav", volume: 0.42 });
        else lista.push({ em: (m.em ?? m.de) + 0.1, arquivo: "sfx/acerto.wav", volume: 0.36 });
        break;
    }
  });
  const ordenados = lista.filter((s) => s.em >= 0 && s.em < plano.duracao - 0.1).sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// Uma página inteira do dicionário com o seu momento
const PaginaDe: React.FC<{ folha: Folha; t: number; palavras: Palavra[]; marca: Plano["marca"] }> = ({ folha, t, palavras, marca }) => {
  const m = folha.m;
  const areas = areasDoLayout(folha.layout, !!m.legenda);
  const bilingue = m.tipo === "frase" && !!m.traducao;
  return (
    <Papel guia={folha.guia ?? undefined} numero={folha.numero} fio={fioDoLayout(folha.layout, !!m.legenda)}>
      {m.tipo === "verbete" ? <Verbete m={m} t={t} areas={areas} palavras={palavras} /> : null}
      {m.tipo === "remissao" ? <Remissao m={m} t={t} areas={areas} palavras={palavras} /> : null}
      {bilingue ? <Frase m={m} t={t} areas={areas} palavras={palavras} /> : null}
      {!ehAssinatura(m) && !bilingue ? <PaginaDoBloco m={m} t={t} areas={areas} palavras={palavras} marca={marca} /> : null}
    </Papel>
  );
};

// Páginas que ganham aba no índice de dedo. O exemplo bilíngue continua a página anterior; a remissão
// também, quando vem logo depois de um verbete (é a resposta dele); sozinha, ganha a aba dela.
const temAba = (m: Momento, anterior?: Momento) =>
  !ehFrontispicio(m) && !(m.tipo === "remissao" && anterior?.tipo === "verbete") && !(m.tipo === "frase" && !!m.traducao);

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const folhas = useMemo(() => folhasDo(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const sons = useMemo(() => listaDeSons(plano, folhas), [plano, folhas]);
  const momentos = useMemo(() => [...plano.momentos].sort((a, b) => a.de - b.de), [plano]);
  // palavras já com as correções (para o texto da tela casar com a fala)
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  const caixa = caixaNoTempo(t, estados, CHEIO_16x9);
  const moldura = molduraNoTempo(t, estados);
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const topoF = topoDoFrontispicio(plano);

  // ---------- índice de dedo: uma aba por verbete ----------
  const abas: Aba[] = useMemo(() => {
    // o índice de dedo tem lugar para umas dez abas: com mais páginas, ficam as dos verbetes e definições
    let comAba = momentos.filter((m, i) => temAba(m, momentos[i - 1]));
    if (comAba.length > 10) comAba = comAba.filter((m) => m.tipo === "verbete" || m.tipo === "definicao");
    comAba = comAba.slice(0, 10);
    return comAba.map((m, k) => {
      const prox = comAba[k + 1];
      const fecho = momentos.find((o) => o.de > m.de && ehFrontispicio(o));
      const ate = Math.min(prox ? prox.de : Infinity, fecho ? fecho.de : Infinity, plano.duracao + 1);
      const proprio = m.tipo === "verbete" || m.tipo === "definicao" ? m.aba : undefined;
      const texto = proprio ?? chavesDaPagina(m)[0].replace(/·/g, "").replace(/\s+/g, "").slice(0, 2).toLowerCase();
      return { texto, de: m.de, ate };
    });
  }, [momentos, plano.duracao]);
  const abertura = momentos.find((m) => m.tipo === "abertura");
  const entraEm = abertura && abertura.tipo === "abertura" ? (abertura.numero?.em ?? (abertura.em ?? abertura.de) + 0.2) : (momentos[0]?.de ?? 0);

  // ---------- as páginas (embaixo da pessoa) ----------
  let c = 0;
  folhas.forEach((f, k) => {
    if (f.de <= t) c = k;
  });
  let paginas: React.ReactNode = null;
  if (folhas.length) {
    const atual = folhas[c];
    const anterior = folhas[c - 1];
    if (anterior && atual.colada && t >= atual.de && t < atual.de + VIRADA) {
      const p = prog(t, atual.de, VIRADA, preciso);
      // para a frente: a página de cima sai para a esquerda; para trás: a nova chega por cima
      const angulo = atual.direcao === 1 ? -92 * p : -92 * (1 - p);
      const [deBaixo, deCima] = atual.direcao === 1 ? [atual, anterior] : [anterior, atual];
      paginas = (
        <>
          <PaginaDe folha={deBaixo} t={t} palavras={palavras} marca={plano.marca} />
          <SombraDaFolha angulo={angulo} />
          <Virando angulo={angulo}>
            <PaginaDe folha={deCima} t={t} palavras={palavras} marca={plano.marca} />
          </Virando>
        </>
      );
    } else paginas = <PaginaDe folha={atual} t={t} palavras={palavras} marca={plano.marca} />;
  }

  // ---------- frontispícios (por cima da pessoa) ----------
  // A folha (a coluna de papel da esquerda) sobe pela parte de baixo; no fim, vira como página (para a página seguinte ou para o próximo
  // frontispício, que já está embaixo dela) ou desce, quando vem um respiro só com a pessoa.
  const frontispicios = momentos
    .filter(ehFrontispicio)
    .map((m) => {
      const i = momentos.indexOf(m);
      const prox = momentos[i + 1];
      const ant = momentos[i - 1];
      const vira = !!prox && prox.de - m.ate < 0.3;
      const debaixoDeOutro = !!ant && ehFrontispicio(ant) && m.de - ant.ate < 0.3;
      const ultimo = !prox;
      const fim = ultimo ? plano.duracao + 1 : m.ate;
      if (t < m.de - 0.05 || t > fim + VIRADA) return null;
      const sobe = debaixoDeOutro ? 1 : prog(t, m.de - 0.02, 0.55);
      const desce = vira || ultimo ? 0 : saindo(t, fim, 0.4);
      const angulo = vira && prox ? -92 * prog(t, prox.de, VIRADA, preciso) : 0;
      const y = (1 - sobe + desce) * (H + 60);
      const conteudo = (
        <AbsoluteFill style={{ transform: `translateY(${y}px)` }}>
          <FolhaDeBaixo topo={topoF}>
            {m.tipo === "abertura" ? <Abertura m={m} t={t} topo={topoF} palavras={palavras} marca={plano.marca} /> : null}
            {m.tipo === "cta" ? <Cta m={m} t={t} topo={topoF} palavras={palavras} marca={plano.marca} /> : null}
            {m.tipo !== "abertura" && m.tipo !== "cta" ? <FrontispicioDoBloco m={m} t={t} topo={topoF} palavras={palavras} marca={plano.marca} /> : null}
          </FolhaDeBaixo>
        </AbsoluteFill>
      );
      return angulo < -0.01 ? (
        <Virando key={`f-${m.de}`} angulo={angulo}>
          {conteudo}
        </Virando>
      ) : (
        <AbsoluteFill key={`f-${m.de}`}>{conteudo}</AbsoluteFill>
      );
    })
    // a folha que vira fica por cima da que já está embaixo dela
    .reverse();

  const folhaAtual = folhas[c];
  const regiaoGuias =
    folhaAtual && t >= folhaAtual.de && t < folhaAtual.ate ? areasDoLayout(folhaAtual.layout, !!folhaAtual.m.legenda).conteudo : null;

  return (
    <AbsoluteFill style={{ backgroundColor: cor.papel }}>
      {paginas}

      <Pessoa src={plano.video} caixa={caixa} moldura={moldura} rosto={plano.rosto} videoAltura={videoAltura} />

      {frontispicios}

      <Indice abas={abas} t={t} entraEm={entraEm} />

      <Legendas frases={frases} />

      {guias ? <Guias plano={plano} caixa={caixa} regiao={regiaoGuias} topoFrontispicio={topoF} /> : null}

      {plano.sfx === false
        ? null
        : sons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
