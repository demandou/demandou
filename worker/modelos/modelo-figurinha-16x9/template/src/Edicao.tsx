import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { mistura, prog, troca, useTempo } from "./anim";
import { Fileira, Herois } from "./componentes/Album";
import { Comparacao, Definicao, Grafico, Passos, Topicos } from "./componentes/Blocos";
import { Cao, type ReacaoNoTempo } from "./componentes/Cao";
import { Abertura, Cta, Destaque, Especial, Frase, Numero, Pergunta } from "./componentes/Etiquetas";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Folha, Pagina } from "./componentes/Pagina";
import { Pessoa } from "./componentes/Pessoa";
import {
  atrasoDaEtiqueta,
  caixaEspecial,
  cenasDoPlano,
  ehDePagina,
  estadosDaPessoa,
  extrasNoTempo,
  faixaDoPeito,
  fimDe,
  folhasDoPlano,
  ladoDaPagina,
  ladoDoItem,
  ordenar,
  type RoteiroDoItem,
  roteiroDoAlbum,
  TROCA,
  VIRA,
} from "./layout";
import { caixaNoTempo } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Album, Momento, Plano } from "./plano";
import { CAO_ALBUM, ESPECIAL, H, HEROI, MARGEM, zona as zonaPadrao } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal: um toque grave quando um papel cola (etiqueta, figurinha, selo, chamada), uma
// nota curta subindo quando a figurinha descola ou a página vira, o carimbo (grave, com altura
// diferente a cada vez) e duas notas na figurinha especial. Nunca dois sons a menos de 0,45 s.
const sons = (plano: Plano, roteiros: Map<Album, RoteiroDoItem[]>): Som[] => {
  const lista: Som[] = [];
  let n = 0;
  const carimbo = (em: number) => lista.push({ em, arquivo: `sfx/carimbo-${(n++ % 3) + 1}.wav`, volume: 0.42 });
  const cola = (em: number, volume = 0.38) => lista.push({ em, arquivo: "sfx/cola.wav", volume });
  plano.momentos.forEach((m, i) => {
    const antes = plano.momentos[i - 1];
    if (ehDePagina(m) && m.tipo !== "especial" && ehDePagina(antes) && m.de - (antes?.ate ?? 0) <= 1.5)
      lista.push({ em: m.de - VIRA / 2 + 0.05, arquivo: "sfx/descola.wav", volume: 0.3 });
    switch (m.tipo) {
      case "abertura":
        cola(m.de + 0.12, 0.42);
        if (plano.mascote !== "nenhum" && m.caoEm !== undefined) cola(m.caoEm, 0.36);
        break;
      case "album":
        for (const r of roteiros.get(m) ?? []) {
          lista.push({ em: r.descola + 0.05, arquivo: "sfx/descola.wav", volume: 0.34 });
          if (r.carimbo !== null) carimbo(r.carimbo);
        }
        break;
      case "especial":
        lista.push({ em: m.de + 0.2, arquivo: "sfx/especial.wav", volume: 0.4 });
        break;
      case "frase":
        cola(m.de + 0.35, 0.36);
        break;
      case "cta":
        if (m.chamadas?.length) m.chamadas.forEach((c) => cola(c.em, 0.4));
        else {
          cola(m.em ?? m.de + 0.05, 0.4);
          if (m.segunda) cola(m.segunda.em, 0.4);
        }
        break;
      case "numero":
        cola(m.de + 0.1, 0.36);
        lista.push({ em: m.em + 1.1, arquivo: "sfx/especial.wav", volume: 0.3 });
        break;
      case "destaque":
        if (m.nivel === "alerta") carimbo(m.em);
        else lista.push({ em: m.em, arquivo: "sfx/especial.wav", volume: 0.38 });
        break;
      case "pergunta":
        cola(m.de + 0.15, 0.36);
        (m.opcoes ?? []).forEach((o) => cola(o.em, 0.34));
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it) => cola(it.em, 0.36));
        break;
      case "comparacao":
        m.lados.forEach((l) => cola(l.em, 0.36));
        if (m.modo === "errado-certo") carimbo(Math.min(m.lados[1].em - 0.1, m.lados[0].em + 1.1));
        if (m.modo === "errado-certo" || m.vencedor !== undefined) {
          const v = m.modo === "errado-certo" ? 1 : (m.vencedor as 0 | 1);
          carimbo(m.vencedorEm ?? Math.min(m.ate - 0.3, m.lados[v].em + 0.9));
        }
        break;
      case "grafico":
        if (m.dados?.length) m.dados.forEach((d) => cola(d.em, 0.34));
        else cola(m.tendenciaEm ?? m.de + 0.3, 0.34);
        break;
      case "definicao":
        cola(m.em, 0.36);
        lista.push({ em: m.significadoEm - 0.15, arquivo: "sfx/descola.wav", volume: 0.32 });
        break;
    }
  });
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// O cachorro da página do álbum: na ponta do quadro oposta à da pessoa, olhando para a figurinha
// da vez. Fica POR BAIXO da figurinha da pessoa. No quadro deitado a pessoa fica sempre na moldura
// da direita, então ele senta na ponta esquerda do quadro.
const CaoDoAlbum: React.FC<{ plano: Plano; m: Album; roteiro: RoteiroDoItem[]; t: number }> = ({ plano, m, roteiro, t }) => {
  const largura = CAO_ALBUM.largura;
  const altura = largura * (420 / 330);
  // do lado oposto ao da pessoa, encostado na margem (a beirada fica por baixo da figurinha dela)
  const xDe = (lado: "esquerda" | "direita") => (lado === "esquerda" ? HEROI.x + HEROI.w - 16 - largura : HEROI.x + 16);
  let x = xDe(ladoDoItem(m, 0, plano));
  let olhar = ladoDoItem(m, 0, plano) === "esquerda" ? -0.7 : 0.7;
  m.itens.forEach((item, i) => {
    if (i === 0) return;
    const p = prog(t, item.em - 0.2, TROCA, troca);
    x = mistura(x, xDe(ladoDoItem(m, i, plano)), p);
    olhar = mistura(olhar, ladoDoItem(m, i, plano) === "esquerda" ? -0.7 : 0.7, p);
  });
  const reacoes: ReacaoNoTempo[] = [{ em: m.de, r: "atento" }];
  roteiro.forEach((r, i) => {
    reacoes.push({ em: r.item.em + 0.25, r: r.item.reacao ?? (i === 0 ? "querendo" : "curioso") });
    if (r.carimbo !== null) reacoes.push({ em: r.carimbo + 0.02, r: r.tipoCarimbo === "pode" ? "feliz" : "susto" });
  });
  // sentado atrás da figurinha da vez: as patas ficam escondidas pela borda de cima dela
  const y = HEROI.y + CAO_ALBUM.escondido - altura;
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      <Cao t={t} reacoes={reacoes} largura={largura} olhar={olhar} espelhar={olhar > 0} />
    </div>
  );
};

// O que fica colado numa folha: o álbum (fileira, cachorro e figurinhas) ou um bloco de página.
const ConteudoDaFolha: React.FC<{ plano: Plano; m: Momento; t: number; roteiros: Map<Album, RoteiroDoItem[]>; mascote: boolean }> = ({
  plano,
  m,
  t,
  roteiros,
  mascote,
}) => {
  const comum = { palavras: plano.palavras, t, mascote };
  switch (m.tipo) {
    case "album": {
      const roteiro = roteiros.get(m) ?? [];
      const fim = fimDe(m, plano);
      return (
        <>
          <Fileira m={m} roteiro={roteiro} t={t} />
          {mascote && t >= m.de - 0.3 && t <= fim + 0.8 ? <CaoDoAlbum plano={plano} m={m} roteiro={roteiro} t={t} /> : null}
          {t >= m.de - 0.3 && t <= fim + 0.8 ? (
            <Herois m={m} roteiro={roteiro} palavras={plano.palavras} t={t} lados={m.itens.map((_, k) => ladoDoItem(m, k, plano))} />
          ) : null}
        </>
      );
    }
    case "topicos":
      return <Topicos m={m} lado={ladoDaPagina(m, plano)} {...comum} />;
    case "passos":
      return <Passos m={m} lado={ladoDaPagina(m, plano)} {...comum} />;
    case "comparacao":
      return <Comparacao m={m} lado={ladoDaPagina(m, plano)} {...comum} />;
    case "grafico":
      return <Grafico m={m} lado={ladoDaPagina(m, plano)} {...comum} />;
    case "definicao":
      return <Definicao m={m} lado={ladoDaPagina(m, plano)} {...comum} />;
    default:
      return null;
  }
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const mascote = plano.mascote !== "nenhum";
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const cenas = useMemo(() => cenasDoPlano(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano, cenas), [plano, cenas]);
  const folhas = useMemo(() => folhasDoPlano(plano), [plano]);
  const roteiros = useMemo(() => {
    const mapa = new Map<Album, RoteiroDoItem[]>();
    for (const m of plano.momentos) if (m.tipo === "album") mapa.set(m, roteiroDoAlbum(m, fimDe(m, plano)));
    return mapa;
  }, [plano]);
  const listaSons = useMemo(() => sons(plano, roteiros), [plano, roteiros]);

  const caixa = caixaNoTempo(t, estados);
  const extras = extrasNoTempo(t, estados);
  const etiquetas = plano.momentos.filter((m) => !ehDePagina(m) || m.tipo === "especial").filter((m) => t >= m.de - 0.05 && t <= fimDe(m, plano) + 0.4);
  const especial = caixaEspecial(plano);
  // a faixa do peito (etiquetas de quadro cheio): do queixo até a base útil, centrada no rosto
  const faixa = faixaDoPeito(plano);
  // a etiqueta do especial: no quadro da esquerda, um pouco por cima da beirada da figurinha grande,
  // na altura do peito da pessoa
  const areaEspecial = { x: MARGEM, w: ESPECIAL.x + 64 - MARGEM, cy: especial.y + especial.h * 0.56 };

  return (
    <AbsoluteFill>
      {/* 1. a página do álbum e as folhas coladas nela (por trás da pessoa) */}
      <Pagina />
      {folhas.map((f) => (
        <Folha key={`folha-${f.momentos[0].de}`} folha={f} t={t}>
          {(conteudo) => (
            <AbsoluteFill style={{ opacity: conteudo }}>
              {f.momentos.map((m) => (
                <ConteudoDaFolha key={`${m.tipo}-${m.de}`} plano={plano} m={m} t={t} roteiros={roteiros} mascote={mascote} />
              ))}
            </AbsoluteFill>
          )}
        </Folha>
      ))}

      {/* 2. a pessoa: uma caixa só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <Pessoa plano={plano} caixa={caixa} videoAltura={videoAltura} inclinacao={extras.inclinacao} figurinha={extras.figurinha} t={t} />

      {/* 3. etiquetas de quadro cheio e da figurinha especial */}
      {etiquetas.map((m) => {
        const chave = `${m.tipo}-${m.de}`;
        // a etiqueta é puxada para fora um instante antes da fronteira: o que entra cruza só no fim
        const fim = fimDe(m, plano) - 0.04;
        const entra = m.de + atrasoDaEtiqueta(m, plano);
        const comum = { palavras: plano.palavras, t, faixa, fim, entra, mascote };
        switch (m.tipo) {
          case "abertura":
            return <Abertura key={chave} m={m} {...comum} />;
          case "frase":
            return <Frase key={chave} m={m} {...comum} />;
          case "numero":
            return <Numero key={chave} m={m} {...comum} />;
          case "destaque":
            return <Destaque key={chave} m={m} {...comum} />;
          case "pergunta":
            return <Pergunta key={chave} m={m} {...comum} />;
          case "especial":
            return <Especial key={chave} m={m} palavras={plano.palavras} t={t} area={areaEspecial} fim={fim} mascote={mascote} />;
          case "cta":
            return <Cta key={chave} m={m} plano={plano} t={t} faixa={faixa} fim={fim} entra={entra} mascote={mascote} />;
          default:
            return null;
        }
      })}

      <Legendas frases={frases} />
      {guias ? <Guias plano={plano} topo={zona.topo} altura={zona.altura} faixa={faixa} /> : null}

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
