import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { temposDoTexto, useTempo } from "./anim";
import { ctaAntigo, temposDoCta } from "./blocos";
import { BlocoDestaque, BlocoPergunta } from "./componentes/Avisos";
import { BlocoComparacao } from "./componentes/Comparacao";
import { BlocoPassos, BlocoTopicos } from "./componentes/Listas";
import { BlocoGrafico, BlocoNumero } from "./componentes/Mostradores";
import { BlocoDefinicao, BlocoFrase } from "./componentes/Notas";
import { encaixar } from "./medida";
import { anteriorComTeclas, janelaNoTempo, roteiroDoMouse, segmentosDaChamada, tempoDoRecorte } from "./cena";
import { Abertura } from "./componentes/Abertura";
import { Cta } from "./componentes/Cta";
import { Cursor } from "./componentes/Cursor";
import { BarraDeMenu, Dock, PapelDeParede } from "./componentes/Desktop";
import { Guias } from "./componentes/Guias";
import { JanelaChamada } from "./componentes/JanelaChamada";
import { Legendas } from "./componentes/Legendas";
import { Lista } from "./componentes/Lista";
import { Navegador } from "./componentes/Navegador";
import { Recorte, VeuDoRecorte } from "./componentes/Recorte";
import { Teclas } from "./componentes/Teclas";
import { APP_DO_TIPO, areaDoMomento, iconeDoTipo, lugarDoMomento, lugares, tecladoDe, telaCheia, TIPOS_DE_JANELA, topoDoCartaoCta } from "./geometria";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, ESCALA, H, QUADRO, W } from "./tema";

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

// O último momento fica até o fim do vídeo quando termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal: um "toc" grave por tecla (a nota sobe a cada tecla do atalho, como um acorde
// que se monta), duas notas quando o atalho dá resultado, e o envio no fechamento.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  for (const m of plano.momentos) {
    if ("teclas" in m && m.teclas) m.teclas.forEach((k, i) => lista.push({ em: k.em - 0.01, arquivo: `sfx/tecla-${Math.min(i, 3) + 1}.wav`, volume: 0.34 }));
    if (m.tipo === "abertura" && m.enterEm !== undefined) lista.push({ em: m.enterEm, arquivo: "sfx/tecla-2.wav", volume: 0.3 });
    if (m.tipo === "navegador" && m.reabreEm !== undefined) lista.push({ em: m.reabreEm, arquivo: "sfx/abre.wav", volume: 0.3 });
    if (m.tipo === "lista" && m.itens[1]) lista.push({ em: m.itens[1].em - 0.04, arquivo: "sfx/abre.wav", volume: 0.26 });
    if (m.tipo === "recorte") lista.push({ em: tempoDoRecorte(m).captura, arquivo: "sfx/captura.wav", volume: 0.32 });
    if (m.tipo === "cta" && ctaAntigo(m)) {
      lista.push({ em: m.salvarEm ?? m.de + 0.4, arquivo: "sfx/salva.wav", volume: 0.3 });
      lista.push({ em: m.enviadoEm ?? m.ate - 0.4, arquivo: "sfx/envia.wav", volume: 0.3 });
    }
    if (m.tipo === "cta" && !ctaAntigo(m)) {
      const { clique } = temposDoCta(m, plano.palavras);
      const icone = m.icone ?? (m.destaque ? "link" : "salvar");
      lista.push({ em: clique, arquivo: icone === "link" || icone === "comentar" ? "sfx/envia.wav" : "sfx/salva.wav", volume: 0.3 });
    }
    // blocos universais: um "toc" por item, subindo de nota, e duas notas no resultado
    const notas = (ems: number[], volume = 0.2) => ems.forEach((em, i) => lista.push({ em: em - 0.02, arquivo: `sfx/tecla-${Math.min(i, 3) + 1}.wav`, volume }));
    if (m.tipo === "topicos" || m.tipo === "passos") notas(m.itens.map((it) => it.em));
    if (m.tipo === "pergunta") notas((m.opcoes ?? []).map((o) => o.em));
    if (m.tipo === "grafico") {
      if (m.dados?.length) notas(m.dados.map((d) => d.em));
      else lista.push({ em: m.tendenciaEm ?? m.de + 0.5, arquivo: "sfx/abre.wav", volume: 0.24 });
    }
    if (m.tipo === "comparacao") {
      notas(m.lados.map((l) => l.em));
      if (m.vencedor !== undefined) lista.push({ em: m.vencedorEm ?? m.lados[m.vencedor].em + 0.8, arquivo: "sfx/abre.wav", volume: 0.28 });
    }
    if (m.tipo === "numero") lista.push({ em: m.em + 1.3, arquivo: "sfx/abre.wav", volume: 0.26 });
    if (m.tipo === "destaque") lista.push({ em: m.em, arquivo: m.nivel === "alerta" ? "sfx/alerta.wav" : "sfx/abre.wav", volume: 0.28 });
    if (m.tipo === "definicao") lista.push({ em: m.significadoEm - 0.1, arquivo: "sfx/abre.wav", volume: 0.24 });
    if (m.tipo === "frase" && m.riscoEm !== undefined) lista.push({ em: m.riscoEm, arquivo: "sfx/tecla-1.wav", volume: 0.3 });
  }
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.2) saida.push(s);
  return saida;
};


export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const L = useMemo(() => lugares(plano), [plano]);
  const segs = useMemo(() => segmentosDaChamada(plano), [plano]);
  const mouse = useMemo(() => roteiroDoMouse(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const ordem = useMemo(() => [...plano.momentos].sort((a, b) => a.de - b.de), [plano]);
  const j = janelaNoTempo(t, segs, L);

  const vivo = (m: Momento, depois = 0.7) => t >= m.de - 0.1 && t <= fimDoMomento(m, plano) + depois;
  const proximoDe = (m: Momento) => {
    const prox = ordem[ordem.indexOf(m) + 1];
    return prox && prox.de - m.ate < 0.3 ? prox : null;
  };
  const anteriorDe = (m: Momento) => {
    const ant = ordem[ordem.indexOf(m) - 1];
    return ant && m.de - ant.ate < 0.3 ? ant : null;
  };
  // Quando a janela de um momento fecha: por trás da janela nova ou da pessoa que cresce para a
  // tela cheia (sem quadro vazio); ou antes, quando o que entra fica por cima dela (teclas, cartão).
  const fimDaJanela = (m: Momento) => {
    const fim = fimDoMomento(m, plano);
    const prox = proximoDe(m);
    if (!prox || telaCheia(lugarDoMomento(prox))) return fim + 0.35;
    const comTeclas = "teclas" in prox && !!prox.teclas?.length;
    if (TIPOS_DE_JANELA.includes(prox.tipo) && !comTeclas) return fim + 0.35;
    return fim - 0.1;
  };
  // Quando um cartão entra: na coluna ao lado do rosto, só depois que a pessoa cobre a tela; no
  // quadro do bloco, depois que a janela anterior fechou.
  const entraDoCartao = (m: Momento) => {
    const ant = anteriorDe(m);
    const antCheia = !ant || telaCheia(lugarDoMomento(ant));
    // (vindo da miniatura, a pessoa leva mais tempo para cobrir a tela)
    if (telaCheia(lugarDoMomento(m))) return m.de + (antCheia || m.de < 0.2 ? 0.08 : ant && lugarDoMomento(ant) === "mini" ? 0.4 : 0.3);
    return m.de + (!ant || ant.tipo === "teclas" || telaCheia(lugarDoMomento(ant)) ? 0.1 : 0.15);
  };
  // As teclas entram depois que a janela da pessoa assentou quando o caminho dela passa pela faixa
  // das teclas (saindo da tela cheia, indo ou voltando da miniatura); entre as janelas do alto, logo.
  const entraDasTeclas = (m: Momento) => {
    const ant = anteriorDe(m);
    const cruza = !ant || telaCheia(lugarDoMomento(ant)) || lugarDoMomento(ant) === "mini" || lugarDoMomento(m) === "mini";
    return m.de + (cruza ? 0.45 : 0.12);
  };
  // e saem logo depois do fim do momento (antes de o que vem depois aparecer no lugar delas)
  const saidaDasTeclas = (m: Momento) => fimDoMomento(m, plano) + 0.06;

  const atual = [...ordem].reverse().find((m) => t >= m.de - 0.05);
  const app = atual && t <= fimDoMomento(atual, plano) ? (atual.tipo === "lista" ? atual.titulo : (APP_DO_TIPO[atual.tipo] ?? "Chamada")) : "Chamada";

  const abertos: Record<string, { de: number; ate: number }[]> = { camera: [{ de: -10, ate: 1e4 }] };
  for (const m of ordem) {
    const icone = iconeDoTipo[m.tipo] ?? null;
    if (!icone) continue;
    const de = m.tipo === "recorte" ? tempoDoRecorte(m).escurece : m.de;
    (abertos[icone] ??= []).push({ de, ate: m.ate });
  }

  // aviso do recorte: fica até o fim do momento seguinte se ele for só de teclas (o "No Mac")
  const avisoAte = (m: Momento) => {
    if (m.tipo !== "recorte") return m.ate;
    if (m.avisoAte !== undefined) return m.avisoAte;
    const prox = ordem[ordem.indexOf(m) + 1];
    return prox && prox.tipo === "teclas" && prox.de - m.ate < 0.3 ? prox.ate : m.ate;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.parede }}>
      {/* o desktop é desenhado na camada lógica (2400×1350) e encolhido para o quadro 1920×1080 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "hidden", transform: `scale(${ESCALA})`, transformOrigin: "0 0" }}>
      {/* 1. o desktop */}
      <PapelDeParede t={t} />
      <BarraDeMenu t={t} app={app} />
      <Dock t={t} abertos={abertos} />

      {/* 2. janelas dos momentos (embaixo da chamada: a pessoa nunca é coberta) */}
      {ordem.map((m) => {
        if (!vivo(m)) return null;
        const chave = `${m.tipo}-${m.de}`;
        const fim = fimDaJanela(m);
        const p = { plano, palavras, t, fim };
        if (m.tipo === "navegador") return <Navegador key={chave} m={m} palavras={palavras} t={t} fim={fim} />;
        if (m.tipo === "lista") return <Lista key={chave} m={m} {...p} />;
        if (m.tipo === "topicos") return <BlocoTopicos key={chave} m={m} {...p} />;
        if (m.tipo === "passos") return <BlocoPassos key={chave} m={m} {...p} />;
        if (m.tipo === "numero") return <BlocoNumero key={chave} m={m} {...p} />;
        if (m.tipo === "grafico") return <BlocoGrafico key={chave} m={m} {...p} />;
        if (m.tipo === "comparacao") return <BlocoComparacao key={chave} m={m} {...p} />;
        if (m.tipo === "definicao") return <BlocoDefinicao key={chave} m={m} {...p} />;
        if (m.tipo === "frase") return <BlocoFrase key={chave} m={m} {...p} />;
        return null;
      })}

      {/* 3. a pessoa: a janela da chamada (a única cópia com som, montada o vídeo inteiro) */}
      <JanelaChamada
        t={t}
        j={j}
        video={plano.video}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        nome={plano.marca.nome}
        area={plano.marca.area}
        palavras={palavras}
      />
      <Legendas frases={frases} j={j} />

      {/* 4. cartões do sistema sobre a pessoa em tela cheia (na coluna ao lado do rosto) */}
      {ordem.map((m) => {
        if (!vivo(m, 0.5)) return null;
        const chave = `c-${m.tipo}-${m.de}`;
        const fim = fimDoMomento(m, plano);
        const entraEm = entraDoCartao(m);
        if (m.tipo === "abertura") return <Abertura key={chave} m={m} plano={plano} palavras={palavras} t={t} />;
        if (m.tipo === "cta") return <Cta key={chave} m={m} plano={plano} palavras={palavras} t={t} fim={fim} topo={topoDoCartaoCta(plano, m)} entraEm={entraEm} />;
        if (m.tipo === "destaque") return <BlocoDestaque key={chave} m={m} plano={plano} palavras={palavras} t={t} fim={fim} entraEm={entraEm} />;
        if (m.tipo === "pergunta") return <BlocoPergunta key={chave} m={m} plano={plano} palavras={palavras} t={t} fim={fim} entraEm={entraEm} />;
        return null;
      })}

      {/* 5. recorte: véu, retângulo, imagem que voa e aviso */}
      {ordem.map((m) =>
        m.tipo === "recorte" && t >= m.de - 0.1 && t <= avisoAte(m) + 0.7 ? <VeuDoRecorte key={`v-${m.de}`} m={m} plano={plano} t={t} /> : null,
      )}
      {ordem.map((m) =>
        m.tipo === "recorte" && t >= m.de - 0.1 && t <= avisoAte(m) + 0.7 ? (
          <Recorte key={`r-${m.de}`} camada="base" m={m} plano={plano} palavras={palavras} t={t} fps={fps} avisoAte={avisoAte(m)} />
        ) : null,
      )}

      {/* 6. as teclas */}
      {ordem.map((m, i) => {
        if (!(m.tipo === "navegador" || m.tipo === "lista" || m.tipo === "recorte" || m.tipo === "teclas") || !vivo(m, 0.6)) return null;
        if (!m.teclas?.length) return null;
        const anterior = m.tipo === "teclas" ? anteriorComTeclas(plano, m) : null;
        const gAnterior = anterior ? tecladoDe(anterior) : undefined;
        // depois de um recorte, as teclas ficam na fila dele (o aviso do recorte continua embaixo)
        const g = anterior?.tipo === "recorte" && gAnterior ? { ...tecladoDe(m), cy: gAnterior.cy } : tecladoDe(m);
        const proximo = ordem[i + 1];
        const continua = !!proximo && proximo.tipo === "teclas" && anteriorComTeclas(plano, proximo) === m;
        return (
          <Teclas
            key={`k-${m.de}`}
            t={t}
            {...g}
            antes={gAnterior}
            teclas={m.teclas}
            anteriores={anterior?.teclas?.map((k) => k.tecla)}
            trocaEm={m.tipo === "teclas" ? m.trocaEm : undefined}
            rotulo={m.rotulo ?? (m.numero ? `Atalho ${m.numero}` : undefined)}
            rotuloEm={m.numeroEm}
            chip={m.tipo === "teclas" ? m.chip : undefined}
            de={m.de}
            ate={fimDoMomento(m, plano)}
            semSaida={continua}
            entraEm={entraDasTeclas(m)}
            regiao={m.tipo === "teclas" ? areaDoMomento(plano, m) : undefined}
            saiEm={saidaDasTeclas(m)}
            descricao={
              m.tipo === "teclas" && m.descricao
                ? {
                    texto: m.descricao,
                    tempos: temposDoTexto(m.descricao, palavras, (m.descricaoEm ?? m.de) - 0.3, m.ate, m.descricaoEm ?? m.de + 0.5),
                  }
                : undefined
            }
          />
        );
      })}

      {/* a imagem do recorte voando passa por cima das teclas */}
      {ordem.map((m) =>
        m.tipo === "recorte" && t >= m.de && t <= m.ate + 1 ? (
          <Recorte key={`rv-${m.de}`} camada="voo" m={m} plano={plano} palavras={palavras} t={t} fps={fps} avisoAte={avisoAte(m)} />
        ) : null,
      )}

      {/* 7. o mouse, por cima de tudo */}
      <Cursor t={t} mouse={mouse} />

      {guias ? <Guias plano={plano} j={j} /> : null}
      </div>

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
