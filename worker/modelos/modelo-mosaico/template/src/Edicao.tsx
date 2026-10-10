import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { limitar, mistura, useTempo } from "./anim";
import { ConteudoDoBloco } from "./componentes/Bloco";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Rodape } from "./componentes/Rodape";
import { estadoDaPeca, etapasDasTrocas, fronteiras, pecasDoVideo, resolverBlocos, resolverGrade, retangulos, retDaPessoa, type Pagina, type Ret } from "./grade";
import { VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import { paginasDoPlano } from "./paginas";
import type { BlocoCompleto, Plano } from "./plano";
import { cor, LIMITE_APP, paleta, RAIO } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons raros e tonais: um "encaixe" grave a cada remontagem do mosaico; uma nota por parte do todo servida,
// por barra ou ponto dito, quando um número termina de contar, quando um lado vence ou o significado se
// encaixa; um deslize para o azeite e um acorde curto no fechamento. Nunca dois colados.
const sons = (paginas: Pagina[], blocos: BlocoCompleto[][], inicio: number[]): Som[] => {
  const lista: Som[] = [];
  const vistos = new Set<string>();
  const nota = (em: number, k: number, volume = 0.4) => lista.push({ em, arquivo: `sfx/nota-${(k % 3) + 1}.wav`, volume });
  paginas.forEach((m, i) => {
    if (inicio[i] > 0.02) lista.push({ em: inicio[i], arquivo: "sfx/encaixe.wav", volume: 0.5 });
    for (const b of blocos[i]) {
      const chave = (x: string) => {
        const k = `${b.id ?? i}-${x}`;
        if (vistos.has(k)) return false;
        vistos.add(k);
        return true;
      };
      if (b.tipo === "prato" || b.tipo === "partes") {
        b.partes.forEach((p, k) => chave(`parte${k}`) && lista.push({ em: p.em + 0.05, arquivo: `sfx/nota-${(k % 3) + 1}.wav`, volume: 0.42 }));
        if (b.talheresEm !== undefined && chave("talheres")) lista.push({ em: b.talheresEm + 0.1, arquivo: "sfx/nota-1.wav", volume: 0.36 });
        if (b.azeite && chave("azeite")) lista.push({ em: b.azeite.em, arquivo: "sfx/azeite.wav", volume: 0.4 });
      }
      if (b.tipo === "grafico" && b.dados && chave("dados")) b.dados.slice(0, 4).forEach((d, k) => nota(d.em + 0.1, k, 0.36));
      if (b.tipo === "numero" && chave("numero")) nota((b.emFim ?? (b.em ?? m.de + 0.2) + 1.2) - 0.05, 2, 0.38);
      if (b.tipo === "comparacao" && b.vencedor !== undefined && chave("vence")) nota(b.vencedorEm ?? Math.max(...b.lados.map((l) => l.em)) + 0.6, 2, 0.4);
      if (b.tipo === "definicao" && chave("def")) nota(b.significadoEm, 1, 0.36);
      if (b.tipo === "cta" && chave("cta")) lista.push({ em: (b.em ?? m.de + 0.1) + 0.12, arquivo: "sfx/fecho.wav", volume: 0.45 });
    }
  });
  // nunca dois sons colados: quando dois caem juntos, fica o de maior prioridade (nota > encaixe)
  const prioridade = (x: Som) => (x.arquivo.includes("encaixe") ? 0 : 1);
  const saida: Som[] = [];
  for (const s of [...lista].sort((a, b) => prioridade(b) - prioridade(a) || a.em - b.em)) {
    if (saida.every((o) => Math.abs(o.em - s.em) > 0.45)) saida.push(s);
  }
  saida.sort((a, b) => a.em - b.em);
  return saida;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  // cada momento vira uma página do mosaico (src/paginas.ts escolhe a grade quando o plano não diz)
  const paginas = useMemo(() => paginasDoPlano(plano), [plano]);
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);

  const f = useMemo(() => fronteiras(plano, paginas), [plano, paginas]);
  const blocos = useMemo(() => resolverBlocos(paginas), [paginas]);
  const { pecas, retsPorMomento } = useMemo(() => pecasDoVideo(paginas, blocos, f), [paginas, blocos, f]);
  const etapas = useMemo(() => etapasDasTrocas(paginas, pecas, retsPorMomento), [paginas, pecas, retsPorMomento]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaSons = useMemo(() => sons(paginas, blocos, f.inicio), [paginas, blocos, f]);

  const estados = pecas
    .map((p) => estadoDaPeca(t, p, f, paginas, etapas))
    .filter((e): e is NonNullable<typeof e> => e !== null)
    // ordem de desenho: quem entra ou sai fica por baixo; entre os assentados, o maior por baixo
    // (numa troca de lugar, o bloco pequeno passa por cima do grande e nunca some)
    .sort((a, b) => a.firmeza - b.firmeza || b.visivel.w * b.visivel.h - a.visivel.w * a.visivel.h);

  // a pessoa: tela cheia nos respiros, um bloco da grade nos momentos
  const pessoa = retDaPessoa(t, paginas, retsPorMomento, f, etapas);
  const r = pessoa.ret;
  const area = (r.w * r.h) / (1080 * 1920);
  // gravação perto da câmera (rosto largo, medido pelo rastreio): menos zoom nos blocos, para a cabeça caber
  const rastro = (plano.rosto as { rastro?: { largura?: number } }).rastro;
  const zoomAuto = rastro?.largura ? limitar(0.25 / rastro.largura, 0.55, 1.15) : 1;
  const zoomPlano = plano.pessoa?.zoom ?? zoomAuto;
  // bloco menor = mais perto do rosto; `pessoa.zoom` ajusta para gravações muito abertas ou fechadas
  const zoomBloco = Math.max(1, limitar(Math.sqrt(0.5 / Math.max(area, 0.01)), 1, 2.5) * zoomPlano);
  const ancoraBloco = plano.pessoa?.ancoraY ?? limitar(0.46 - 0.08 * (r.h / Math.max(r.w, 1) - 0.6), 0.33, 0.46);
  const ancoraCheio = (plano.rosto.y * 1920) / videoAltura;
  const raioPessoa = Math.min(RAIO * (1 - pessoa.cheio), r.w / 2, r.h / 2);

  // página atual (para as guias)
  let atual = -1;
  paginas.forEach((_, i) => {
    if (t >= f.inicio[i] && t < f.fim[i]) atual = i;
  });
  const blocosDaGuia: { letra: string; ret: Ret }[] =
    guias && atual >= 0
      ? Object.entries(retangulos(resolverGrade(paginas[atual])))
          .filter(([l]) => l !== "p")
          .map(([letra, ret]) => ({ letra, ret }))
      : [];

  return (
    <AbsoluteFill style={{ backgroundColor: cor.pagina }}>
      <Rodape t={t} marca={plano.marca} inicios={f.inicio} />
      {estados.map((e) => {
        const v = e.visivel;
        const c = e.conteudo;
        const fundoDepois = paleta[e.corDepois ?? "creme"].fundo;
        const fundoAntes = paleta[e.corAntes ?? "creme"].fundo;
        // cor nova varre o bloco na direção do movimento (sem misturar: verde + tomate não vira marrom)
        const trocaCor = e.pCor < 1 && fundoAntes !== fundoDepois;
        const resto = `${((1 - e.pCor) * 100).toFixed(2)}%`;
        const recorteCor = { baixo: `inset(0 0 ${resto} 0)`, cima: `inset(${resto} 0 0 0)`, direita: `inset(0 ${resto} 0 0)`, esquerda: `inset(0 0 0 ${resto})` }[e.direcaoCor];
        const util = LIMITE_APP - c.y;
        const desenhar = (x: NonNullable<typeof e.depois>) => (
          <div style={{ position: "absolute", inset: 0, opacity: x.opacidade }}>
            <ConteudoDoBloco
              b={x.bloco}
              t={t}
              w={c.w}
              h={c.h}
              util={util}
              pal={paleta[x.bloco.cor ?? "creme"]}
              palavras={plano.palavras}
              janela={x.janela}
              marca={plano.marca}
            />
          </div>
        );
        return (
          <div
            key={e.chave}
            style={{
              position: "absolute",
              left: v.x,
              top: v.y,
              width: Math.max(0, v.w),
              height: Math.max(0, v.h),
              borderRadius: e.raio,
              background: trocaCor ? fundoAntes : fundoDepois,
              overflow: "hidden",
              opacity: limitar(mistura(0, 1, e.firmeza * 4)),
            }}
          >
            {trocaCor ? <div style={{ position: "absolute", inset: 0, background: fundoDepois, clipPath: recorteCor }} /> : null}
            <div style={{ position: "absolute", left: c.x - v.x, top: c.y - v.y, width: c.w, height: c.h }}>
              {e.antes && e.antes.opacidade > 0.001 ? desenhar(e.antes) : null}
              {e.depois && e.depois.opacidade > 0.001 ? desenhar(e.depois) : null}
            </div>
          </div>
        );
      })}

      <VideoNaCaixa
        src={plano.video}
        caixa={{
          ...r,
          raio: raioPessoa,
          zoom: mistura(zoomBloco, 1, pessoa.cheio),
          ancoraY: mistura(ancoraBloco, ancoraCheio, pessoa.cheio),
        }}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro="contrast(1.03) saturate(0.96)"
      />

      <Legendas frases={frases} pessoa={r} />

      {guias ? <Guias plano={plano} pessoa={r} cheio={pessoa.cheio} blocos={blocosDaGuia} /> : null}

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
