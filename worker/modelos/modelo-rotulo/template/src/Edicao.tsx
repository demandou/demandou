import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { prog, temposDoTexto, useTempo } from "./anim";
import { Ficha } from "./componentes/Ficha";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Lupa } from "./componentes/Lupa";
import { Marcas } from "./componentes/Marcas";
import { ImpressaoDoRotulo } from "./componentes/Rotulo";
import { ANTES, caixaDaPessoa, cameraNoTempo, geometriaDaFicha, lupaNoTempo, nivelDoRotulo, noRotulo, ordenar, planejarLeitura } from "./layout";
import { useMedidor } from "./medida";
import { VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Palavra, Plano } from "./plano";
import { cor, ROTULO_PADRAO } from "./tema";

// Sons raros e tonais: um por batida importante, nunca dois a menos de 0,42 s.
const sons = (momentos: Momento[], palavras: Palavra[]) => {
  const lista: { em: number; arquivo: string; volume: number }[] = [];
  const doRotulo = momentos.filter(noRotulo);
  const comTaca = momentos.some((o) => (o.tipo === "teor" || o.tipo === "medidor") && !!o.taca);
  momentos.forEach((m, i) => {
    const antes = momentos[i - 1];
    const mudaLayout = (antes ? noRotulo(antes) : false) !== noRotulo(m) && m.de > 0.05;
    if (mudaLayout) lista.push({ em: m.de - ANTES, arquivo: "sfx/vum.wav", volume: 0.55 });
    if (m.tipo === "abertura" && m.selo) lista.push({ em: m.selo.em, arquivo: "sfx/selo.wav", volume: 0.4 });
    // a lupa chega a um campo: uma nota curta que sobe de altura a cada campo
    if (noRotulo(m)) {
      const n = doRotulo.indexOf(m) % 4;
      if (m.tipo === "ano" || m.tipo === "numero") lista.push({ em: m.em, arquivo: "sfx/rolo.wav", volume: 0.45 });
      else lista.push({ em: m.de + 0.35, arquivo: `sfx/lente-${n + 1}.wav`, volume: 0.45 });
    }
    switch (m.tipo) {
      case "origem":
        if (m.regiao) lista.push({ em: m.regiao.em + 0.1, arquivo: "sfx/pino.wav", volume: 0.4 });
        break;
      case "teor":
        if (m.taca) lista.push({ em: m.taca.em, arquivo: "sfx/derrama.wav", volume: 0.42 });
        lista.push({ em: m.medidor.cheioEm, arquivo: "sfx/cheio.wav", volume: 0.42 });
        break;
      case "medidor":
        if (m.taca) lista.push({ em: m.taca.em, arquivo: "sfx/derrama.wav", volume: 0.42 });
        lista.push({ em: m.cheioEm, arquivo: "sfx/cheio.wav", volume: 0.42 });
        break;
      case "destaque":
        // o carimbo bate
        lista.push({ em: m.em, arquivo: "sfx/selo.wav", volume: 0.45 });
        break;
      case "definicao":
        lista.push({ em: m.significadoEm, arquivo: "sfx/pino.wav", volume: 0.36 });
        break;
      case "comparacao":
        if (m.vencedorEm !== undefined) lista.push({ em: m.vencedorEm, arquivo: "sfx/pino.wav", volume: 0.38 });
        break;
      case "grafico": {
        const em = m.dados?.length ? m.dados[0].em : m.de + 0.4;
        lista.push({ em, arquivo: "sfx/derrama.wav", volume: 0.36 });
        break;
      }
      case "frase":
        if (m.risco && m.riscoEm !== undefined) lista.push({ em: m.riscoEm, arquivo: "sfx/pino.wav", volume: 0.36 });
        break;
      case "cta": {
        // a fita de "salvar" desce na primeira palavra; o acorde vem quando ela assenta
        const texto = m.linhas?.length ? m.linhas.join(" ") : (m.texto ?? "");
        const tempos = temposDoTexto(texto, palavras, m.em ?? m.de, m.ate);
        const em = m.em ?? tempos[0] ?? m.de;
        lista.push({ em: Math.max(em, m.de + 0.3) + 0.3, arquivo: "sfx/acorde.wav", volume: 0.4 });
        // na última palavra: o brinde (bebida) ou o lacre que carimba o rótulo
        const ultima = tempos[tempos.length - 1] ?? m.de;
        lista.push(comTaca ? { em: ultima + 0.33, arquivo: "sfx/brinde.wav", volume: 0.42 } : { em: ultima + 0.2, arquivo: "sfx/selo.wav", volume: 0.42 });
        break;
      }
      default:
        break;
    }
  });
  const ordem = lista.sort((a, b) => a.em - b.em);
  const final: typeof ordem = [];
  for (const s of ordem) if (!final.length || s.em - final[final.length - 1].em >= 0.42) final.push(s);
  return final.filter((s) => s.em >= 0);
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: original, guias }) => {
  // logo depois do cortar o plano ainda não tem rótulo: usa o de reserva para não quebrar
  const plano = useMemo(() => ({ ...original, rotulo: original.rotulo ? { ...original.rotulo, nome: original.rotulo.nome ?? "" } : ROTULO_PADRAO }), [original]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const medir = useMedidor();
  const momentos = useMemo(() => ordenar(plano), [plano]);
  const leitura = useMemo(() => planejarLeitura(momentos, plano.rotulo), [momentos, plano.rotulo]);
  const frases = useMemo(() => montarFrases({ ...plano, momentos }), [plano, momentos]);
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const geo = geometriaDaFicha(plano);
  const legendaY = (plano.zona?.topo ?? 970) + 30;

  const q = nivelDoRotulo(t, momentos);
  const cam = cameraNoTempo(t, momentos, leitura, plano.rotulo, medir, geo.y);
  const { caixa, oval } = caixaDaPessoa(q, plano, cam);
  const lupa = lupaNoTempo(t, momentos, leitura, plano.rotulo, medir);
  const naCamera: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})` };
  const campoAtual = [...momentos].reverse().find((m) => noRotulo(m) && t >= m.de - 0.1 && t < m.ate);
  // a linha-guia desce da lupa até a ficha só nas linhas largas (nos cartuchos ela cruzaria o rótulo)
  const largo = lupa ? lupa.vaga === "linha" || lupa.vaga === "nome" : false;
  const guia = campoAtual && largo ? prog(t, campoAtual.de + 0.55, 0.4) * (1 - prog(t, campoAtual.ate - 0.3, 0.2)) : 0;
  const listaDeSons = useMemo(() => sons(momentos, plano.palavras), [momentos, plano.palavras]);

  return (
    <AbsoluteFill style={{ backgroundColor: cor.vidro }}>
      {/* vidro da garrafa: um reflexo vertical discreto */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, ${cor.vidro} 0%, ${cor.vidroBrilho} 2.2%, ${cor.vidro} 3.6%, ${cor.vidro} 96%, ${cor.vidroBrilho} 97.6%, ${cor.vidro} 100%)`,
        }}
      />
      {/* o rótulo impresso, atrás da pessoa */}
      <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, q * 6), filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.55))" }}>
        <div style={naCamera}>
          <ImpressaoDoRotulo plano={plano} medir={medir} />
        </div>
      </div>

      {/* os números dos campos já lidos ficam impressos no rótulo (por baixo da pessoa) */}
      <div style={naCamera}>
        <Marcas leitura={leitura} plano={plano} t={t} medir={medir} presenca={Math.max(0, q * 1.4 - 0.4)} />
      </div>

      {/* a pessoa: do quadro cheio ao camafeu */}
      <VideoNaCaixa
        src={plano.video}
        caixa={caixa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro="contrast(1.03) saturate(0.96)"
        estilo={{ borderRadius: `${(caixa.w / 2) * oval}px / ${(caixa.h / 2) * oval}px` }}
      />

      {lupa ? <Lupa estado={lupa} camera={cam} plano={plano} medir={medir} parte="cabo" guia={guia} fichaTopo={geo.y} /> : null}

      <Ficha momentos={momentos} leitura={leitura} plano={plano} t={t} medir={medir} geo={geo} nivel={q} />

      {lupa ? <Lupa estado={lupa} camera={cam} plano={plano} medir={medir} parte="lente" numero={lupa.numero} guia={guia} fichaTopo={geo.y} /> : null}

      <Legendas frases={frases} y={legendaY} t={t} />

      {guias ? <Guias plano={plano} ficha={geo} legendaY={legendaY} /> : null}

      {plano.sfx === false
        ? null
        : listaDeSons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.round(s.em * fps)} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
