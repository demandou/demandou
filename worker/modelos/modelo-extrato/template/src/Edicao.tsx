import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Sequence, staticFile, useVideoConfig } from "remotion";
import { entra, useTempo } from "./anim";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Recibo, tamanhoDosTotais } from "./componentes/Recibo";
import { estadoDaTira, marcos, ordenar, situacao } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Plano } from "./plano";
import { avanco, type Bloco, montarPapeis } from "./recibo";
import { cor, esperarFontes, H, LIMITE_APP, zona as zonaPadrao } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal: duas notas quando um total termina de contar (ou o lado certo ganha o selo),
// um baque grave no carimbo, duas notas descendo quando a tesoura leva o "não" ou a frase é
// riscada e um acorde curto quando o rodapé imprime. Nunca dois sons a menos de 0,45 s.
const sons = (blocos: Bloco[]): Som[] => {
  const lista: Som[] = [];
  for (const b of blocos) {
    const c = b.c;
    if (c.k === "total") {
      if (c.carimbo) lista.push({ em: c.carimbo.em, arquivo: "sfx/carimbo.wav", volume: 0.62 });
      else lista.push({ em: c.contaAte, arquivo: "sfx/total.wav", volume: 0.42 });
    }
    if (c.k === "carimbo") lista.push({ em: c.em, arquivo: "sfx/carimbo.wav", volume: 0.62 });
    if (c.k === "corte" && c.riscaEm !== undefined) lista.push({ em: c.riscaEm, arquivo: "sfx/nao.wav", volume: 0.38 });
    if (c.k === "texto" && Number.isFinite(c.riscoEm) && c.risco.some(Boolean) && c.primeira) lista.push({ em: c.riscoEm, arquivo: "sfx/nao.wav", volume: 0.34 });
    if (c.k === "lado" && (c.marca === "certo" || c.marca === "vence")) lista.push({ em: c.marcaEm, arquivo: "sfx/total.wav", volume: 0.36 });
    if (c.k === "rodape") lista.push({ em: b.em + 0.05, arquivo: "sfx/fim.wav", volume: 0.36 });
  }
  const saida: Som[] = [];
  for (const s of lista.sort((a, b) => a.em - b.em)) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  // o texto do carimbo é medido na fonte carregada: o render espera as fontes antes do primeiro quadro
  const [fontes, setFontes] = useState(false);
  const [espera] = useState(() => delayRender("fontes do cupom"));
  useEffect(() => {
    esperarFontes()
      .catch(() => undefined)
      .then(() => {
        setFontes(true);
        continueRender(espera);
      });
  }, [espera]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `fontes` refaz a medida quando as fontes chegam
  const papeis = useMemo(() => montarPapeis(plano, palavras), [plano, palavras, fontes]);
  const blocos = papeis.rolo.blocos;
  const tamanhoTotal = useMemo(() => tamanhoDosTotais(blocos), [blocos]);
  const tamanhosTiras = useMemo(() => papeis.tiras.map((tira) => tamanhoDosTotais(tira.blocos)), [papeis]);
  const lista = useMemo(() => marcos(plano), [plano]);
  const listaSons = useMemo(() => sons([...blocos, ...papeis.tiras.flatMap((tira) => tira.blocos)]), [blocos, papeis]);
  const cima = (plano.layout ?? "cima") !== "lado";

  const avancoAgora = avanco(t, blocos, entra);
  const agora = situacao(t, lista, plano, avancoAgora);
  const { pessoa, cupom, cruzando, dividido } = agora;

  // legenda: abaixo do queixo no quadro cheio; no pé do cartão (lado) ou da moldura (cima) na tela dividida
  const legendaCheia = { y: zona.topo - 124, esquerda: 50, largura: 980, tamanho: 48 };
  const legendaDividida = cima
    ? { y: LIMITE_APP - 104, esquerda: pessoa.x + 40, largura: pessoa.w - 80, tamanho: 44 }
    : { y: pessoa.y + pessoa.h - 180, esquerda: pessoa.x + 12, largura: pessoa.w - 24, tamanho: 44 };
  const legenda = dividido < 0.5 ? legendaCheia : legendaDividida;

  const recibo = blocos.length ? (
    <Recibo
      t={t}
      blocos={blocos}
      avancoAgora={avancoAgora}
      x={cupom.x}
      linha={cupom.linha}
      escala={cupom.escala}
      rabo={cupom.rabo}
      cruzando={cruzando}
      tamanhoTotal={tamanhoTotal}
    />
  ) : null;
  // o rolo só fica por cima do vídeo na abertura do layout "lado"; no resto, passa por trás da
  // pessoa (nunca cobre o rosto)
  const reciboAtras = !agora.cupomNaFrente;

  // as tiras do quadro cheio: sobem do pé do quadro, na altura do peito, e caem quando o momento acaba
  const tiras = papeis.tiras.map((tira, i) => {
    const e = estadoDaTira(t, tira, papeis.tiras, plano.momentos, plano, zona.topo);
    if (!e.visivel) return null;
    return (
      <Recibo
        key={tira.chave}
        t={t}
        blocos={tira.blocos}
        avancoAgora={avanco(t, tira.blocos, entra)}
        x={e.x}
        linha={e.linha}
        escala={e.escala}
        rabo={e.rabo}
        cruzando={0}
        tamanhoTotal={tamanhosTiras[i]}
        deslocY={e.deslocY}
        limite={e.limite}
      />
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: cor.balcao }}>
      {reciboAtras ? recibo : null}

      {/* a pessoa: uma caixa só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <VideoNaCaixa
        src={plano.video}
        caixa={pessoa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro="contrast(1.03) saturate(0.97)"
        estilo={{
          boxShadow: `0 24px 50px rgba(0,0,0,${0.5 * dividido}), 0 3px 8px rgba(0,0,0,${0.3 * dividido})`,
          scale: String(1 + 0.025 * cruzando),
        }}
      />

      {reciboAtras ? null : recibo}

      {tiras}

      <Legendas frases={frases} {...legenda} />

      {guias ? <Guias plano={plano} legendaY={legendaCheia.y} /> : null}

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
