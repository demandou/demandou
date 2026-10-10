import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { formatar, prog, useTempo } from "./anim";
import { geoTabela, linhasNorm, linhasNumeradasDoBloco } from "./blocos";
import { BlocoComparacao, BlocoDefinicao, BlocoDestaque, BlocoFrase, BlocoNumero, BlocoPergunta } from "./componentes/Blocos";
import { CelulaCta, CelulaFrase, CelulaPessoa, CelulaTitulo, Formigas } from "./componentes/Celulas";
import { alvoNoTempo, CursorDeCelula } from "./componentes/Cursor";
import { DestaqueDaLinha, DestaqueDoPreencher } from "./componentes/Destaque";
import { GraficoBloco, LadoDados, LadoDaVez, TabelaBloco } from "./componentes/Faixa";
import { Guias } from "./componentes/Guias";
import { Abas, BarraDeFormula, BarraDeStatus, BarraDeTitulo, Cabecalhos, Ferramentas, LinhasDaGrade, linhasNumeradas } from "./componentes/Interface";
import { Tabela } from "./componentes/Tabela";
import { caixaDoLugar, lugaresDosMomentos, RET_TITULO, regioesDoMomento, retDoDestaque } from "./grade";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Linha, Momento, Plano, Preencher } from "./plano";
import {
  abasNoTempo,
  alvosDoCursor,
  arrumarTabela,
  blocoDeBaixoNoTempo,
  completarTempos,
  DURACAO_TROCA,
  ehDaTabela,
  escritaNoTempo,
  escritas,
  fimDoMomento,
  gruposDaTabela,
  ordenar,
  pessoaNoTempo,
  saidasDosMomentos,
  segmentosDaPessoa,
  sons,
  visivelAte,
} from "./roteiro";
import { cor } from "./tema";

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

// tipos com o desenho antigo (o demo aprovado), que cuidam da própria entrada e saída
const LEGADOS = ["abertura", "linha", "preencher", "cta", "celula"];

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const palavras = useMemo(() => corrigirPalavras(planoOriginal.palavras, planoOriginal.correcoes), [planoOriginal]);
  const plano = useMemo(() => completarTempos(comCapa(planoOriginal), palavras), [planoOriginal, palavras]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);

  const ordem = useMemo(() => ordenar(plano), [plano]);
  const lugares = useMemo(() => lugaresDosMomentos(plano), [plano]);
  const segs = useMemo(() => segmentosDaPessoa(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaEscritas = useMemo(() => escritas(plano, palavras, frases), [plano, palavras, frases]);
  const alvos = useMemo(() => alvosDoCursor(plano), [plano]);
  const grupos = useMemo(() => gruposDaTabela(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const saidas = useMemo(() => saidasDosMomentos(plano), [plano]);
  const preencher = useMemo(() => plano.momentos.filter((m): m is Preencher => m.tipo === "preencher"), [plano]);
  const linhasDaTabelaToda = useMemo(() => plano.momentos.filter((m): m is Linha => m.tipo === "linha").sort((a, b) => a.de - b.de), [plano]);

  const pessoa = pessoaNoTempo(t, segs, plano);
  const arr = arrumarTabela(plano, t);
  // as linhas da planilha: as do bloco que está embaixo agora (lista, passos, tabela) ou as da tabela das linhas
  const blocoBaixo = blocoDeBaixoNoTempo(plano, saidas, t);
  const linhas = blocoBaixo ? linhasNumeradasDoBloco(blocoBaixo) : linhasNumeradas(arr);

  // tabela: entra com o primeiro momento de cada grupo; no fim do grupo fica até a pessoa e a célula
  // seguinte passarem por cima, e só então sai (sem quadro "fantasma")
  // (depois de uma lista, passos ou gráfico embaixo, ela só entra quando a área já foi apagada)
  const visivelTabela = Math.max(
    0,
    ...grupos.map((g) => {
      const antes = ordem.filter((m) => m.ate <= g.de + 0.16 && m.ate >= g.de - 0.16 && m.de < g.de).pop();
      const depoisDeOpaco = !!antes && ["topicos", "passos", "tabela", "grafico"].includes(antes.tipo);
      return Math.min(depoisDeOpaco ? prog(t, g.de, 0.3) : prog(t, g.de - 0.1, 0.4), 1 - prog(t, g.ate + DURACAO_TROCA - 0.1, 0.2));
    }),
  );

  // células ao lado da pessoa ficam até a pessoa passar por cima delas na troca seguinte
  const vivo = (m: Momento) => {
    if (t < m.de - 0.1) return false;
    if (!LEGADOS.includes(m.tipo) || (m.tipo === "linha" && !m.destaque)) return t <= visivelAte(saidas.get(m) ?? {});
    return t <= fimDoMomento(m, plano) + (ehDaTabela(m) || m.tipo === "abertura" ? DURACAO_TROCA + 0.1 : 0.05);
  };
  const atual = [...ordem].reverse().find((m) => t >= m.de - 0.05 && t <= fimDoMomento(m, plano));

  // cursor de célula: só aparece dentro de momentos
  const alvo = alvoNoTempo(t, alvos);
  const cursorVisivel = atual ? Math.min(prog(t, atual.de - 0.2, 0.2), 1 - prog(t, fimDoMomento(atual, plano) - 0.1, 0.2)) : 0;
  const escrita = escritaNoTempo(t, listaEscritas);
  const cta = ordem.find((m): m is Extract<Momento, { tipo: "cta" }> => m.tipo === "cta" && (m.icone ?? "salvar") === "salvar");

  // marcas que mexem no total: as das `linha` e as das `tabela` (assinatura)
  const marcasDoVideo = useMemo(
    () => [
      ...ordem.flatMap((m) => (m.tipo === "linha" && m.marca ? [{ em: m.marca.em, valor: m.marca.valor }] : [])),
      ...ordem.flatMap((m) => (m.tipo === "tabela" ? linhasNorm(m).flatMap((l) => (l.marca !== undefined && l.marcaEm !== undefined ? [{ em: l.marcaEm, valor: l.marca }] : [])) : [])),
    ],
    [ordem],
  );
  const ultimaMarca = Math.max(-10, ...marcasDoVideo.map((mk) => mk.em));
  // o Σ da barra de ferramentas acende quando o total recalcula
  const somaAtiva = marcasDoVideo.reduce((a, mk) => (t >= mk.em ? Math.max(a, 1 - prog(t, mk.em, 0.9)) : a), 0);
  // R$, % e o gráfico acendem quando um número é formatado ou um gráfico é desenhado
  const realce = useMemo(() => {
    const moeda: number[] = [];
    const pct: number[] = [];
    const graf: { de: number; ate: number }[] = [];
    for (const m of ordem) {
      if (m.tipo === "numero") {
        if (/\$/.test(m.prefixo ?? "")) moeda.push(m.em);
        if (/%/.test(m.sufixo ?? "")) pct.push(m.em);
      }
      if (m.tipo === "grafico") graf.push({ de: m.de, ate: m.ate });
    }
    return { moeda, pct, graf };
  }, [ordem]);
  const luz = (lista: number[]) => lista.reduce((a, em) => (t >= em ? Math.max(a, 1 - prog(t, em + 0.6, 0.6)) : a), 0);
  const realceAgora = {
    moeda: luz(realce.moeda),
    pct: luz(realce.pct),
    grafico: Math.max(0, ...realce.graf.map((g) => Math.min(prog(t, g.de, 0.3), 1 - prog(t, g.ate, 0.3)))),
  };

  // barra de status: a soma (ou contagem) da coluna 2, como numa planilha de verdade
  const numerica = plano.tabela?.tipo === "numero" || marcasDoVideo.some((mk) => typeof mk.valor === "number");
  const feitas = marcasDoVideo.filter((mk) => t >= mk.em).map((mk) => mk.valor);
  const tabelaNumerica = ordem.find((m): m is Extract<Momento, { tipo: "tabela" }> => m.tipo === "tabela" && m.linhas.some((l) => typeof l.marca === "number"));
  const formatoStatus = tabelaNumerica ? { prefixo: tabelaNumerica.prefixo, casas: tabelaNumerica.casas } : { prefixo: plano.tabela?.prefixo, casas: plano.tabela?.casas };
  const textoStatus = numerica
    ? `Soma: ${formatoStatus.prefixo ? `${formatoStatus.prefixo} ` : ""}${formatar(feitas.reduce<number>((a, v) => a + (typeof v === "number" ? v : 0), 0), formatoStatus.casas ?? 0)}`
    : `Contagem: ${feitas.length}`;

  // formigas em volta do lugar novo da pessoa, em cada troca
  const trocaAtual = [...segs].reverse().find((s) => s.de > -5 && t >= s.de - 0.15 && t <= s.de + DURACAO_TROCA + 0.25);
  const destinoDaTroca = trocaAtual ? caixaDoLugar(plano, trocaAtual.lugar) : null;
  const destaqueAtual = atual ? retDoDestaque(lugares.get(atual) ?? "cheia") : null;

  return (
    <AbsoluteFill style={{ backgroundColor: cor.app }}>
      {/* 1. a grade */}
      <LinhasDaGrade linhas={linhas} subs={blocoBaixo ? [] : arr.linhas.map((l) => l.sub)} />

      {/* 2. a tabela das linhas */}
      <Tabela plano={plano} arr={arr} t={t} palavras={palavras} visivel={visivelTabela} preencher={preencher} />

      {/* 3. células mescladas dos momentos */}
      {ordem.map((m) => {
        if (!vivo(m)) return null;
        const chave = `${m.tipo}-${m.de}`;
        const fim = fimDoMomento(m, plano);
        const lugar = lugares.get(m) ?? "cheia";
        const reg = regioesDoMomento(plano, m, lugar);
        const s = saidas.get(m) ?? {};
        const celula = reg.topo ?? reg.larga;
        const saidaCelula = s.topo ?? s.larga;
        switch (m.tipo) {
          case "abertura":
            return <CelulaTitulo key={chave} m={m} ret={RET_TITULO} t={t} palavras={palavras} fim={fim} />;
          case "linha": {
            const r = retDoDestaque(lugar);
            if (!r) return null;
            if (m.destaque) return <DestaqueDaLinha key={chave} m={m} ret={r} t={t} palavras={palavras} fim={fim} />;
            // sem ilustração: a célula mostra o item da vez, ampliado
            const i = Math.max(0, linhasDaTabelaToda.indexOf(m));
            return (
              <LadoDaVez
                key={chave}
                ret={r}
                t={t}
                de={m.de}
                ate={m.ate}
                palavras={palavras}
                rotulo={plano.tabela?.colunas?.[0]}
                rotuloEm={m.de}
                itens={[{ texto: m.item.texto, em: m.item.em, detalhe: m.detalhe?.texto, detalheEm: m.detalhe?.em, marca: m.marca?.valor ?? (m.marca ? "sim" : undefined), marcaEm: m.marca?.em }]}
                base={i}
                total={Math.min(4, linhasDaTabelaToda.length)}
                modo="lista"
                saida={s.lado}
              />
            );
          }
          case "preencher": {
            const r = retDoDestaque(lugar);
            return r ? <DestaqueDoPreencher key={chave} m={m} ret={r} t={t} palavras={palavras} fim={fim} /> : null;
          }
          case "cta":
            return celula ? <CelulaCta key={chave} m={m} ret={celula} t={t} palavras={palavras} fim={fim} /> : null;
          case "celula":
            return celula ? <CelulaFrase key={chave} m={m} ret={celula} t={t} palavras={palavras} fim={fim} /> : null;
          case "topicos":
          case "passos":
          case "tabela": {
            const geo = geoTabela(plano, m);
            return (
              <div key={chave}>
                <TabelaBloco plano={plano} m={m} geo={geo} t={t} palavras={palavras} saida={s.baixo} />
                {reg.lado ? (
                  <LadoDaVez
                    ret={reg.lado}
                    t={t}
                    de={m.de}
                    ate={m.ate}
                    palavras={palavras}
                    rotulo={m.titulo}
                    itens={linhasNorm(m)}
                    modo={m.tipo === "passos" ? "passos" : "lista"}
                    saida={s.lado}
                    prefixo={m.tipo === "tabela" ? m.prefixo : undefined}
                    casas={m.tipo === "tabela" ? m.casas : undefined}
                  />
                ) : null}
              </div>
            );
          }
          case "grafico":
            return (
              <div key={chave}>
                {reg.baixo ? <GraficoBloco m={m} ret={reg.baixo} t={t} palavras={palavras} saida={s.baixo} /> : null}
                {reg.lado ? <LadoDados m={m} ret={reg.lado} t={t} palavras={palavras} saida={s.lado} /> : null}
              </div>
            );
          case "numero":
            return celula ? <BlocoNumero key={chave} m={m} ret={celula} t={t} palavras={palavras} saida={saidaCelula} /> : null;
          case "destaque":
            return celula ? <BlocoDestaque key={chave} m={m} ret={celula} t={t} palavras={palavras} saida={saidaCelula} /> : null;
          case "frase":
            return celula ? <BlocoFrase key={chave} m={m} ret={celula} t={t} palavras={palavras} saida={saidaCelula} /> : null;
          case "definicao":
            return celula ? <BlocoDefinicao key={chave} m={m} ret={celula} t={t} palavras={palavras} saida={saidaCelula} /> : null;
          case "pergunta":
            return celula ? <BlocoPergunta key={chave} m={m} ret={celula} t={t} palavras={palavras} saida={saidaCelula} /> : null;
          case "comparacao":
            return celula ? <BlocoComparacao key={chave} m={m} ret={celula} t={t} palavras={palavras} saida={saidaCelula} /> : null;
          default:
            return null;
        }
      })}

      {/* 4. cursor de célula (embaixo da pessoa: nunca passa na frente do rosto) */}
      {alvo ? <CursorDeCelula ret={alvo.ret} faixa={alvo.faixa} opacidade={cursorVisivel} /> : null}

      {/* 5. a pessoa: a única cópia do vídeo (com som), montada o vídeo inteiro */}
      <CelulaPessoa c={pessoa} video={plano.video} rosto={plano.rosto} videoAltura={videoAltura} nome={plano.marca.nome} area={plano.marca.area} />
      {trocaAtual && destinoDaTroca ? <Formigas ret={destinoDaTroca} t={t} de={trocaAtual.de - 0.15} ate={trocaAtual.de + DURACAO_TROCA + 0.25} /> : null}

      {/* 6. a moldura da planilha por cima */}
      <Cabecalhos linhas={linhas} ativo={alvo && cursorVisivel > 0.3 ? alvo.ret : null} forca={cursorVisivel} />
      <BarraDeFormula t={t} nome={alvo && cursorVisivel > 0.3 ? alvo.nome : "A1"} escrita={escrita} />
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 176, background: cor.app }}>
        <BarraDeTitulo arquivo={plano.planilha?.arquivo ?? "Planilha"} salvoEm={cta ? (cta.iconeEm ?? cta.em ?? cta.de + 0.4) : undefined} t={t} />
        <Ferramentas somaAtiva={t >= ultimaMarca - 5 ? somaAtiva : 0} realce={realceAgora} />
      </div>
      <Abas t={t} estado={abasNoTempo(plano, t)} />
      <BarraDeStatus texto={textoStatus} ativo={somaAtiva} />

      {guias ? <Guias plano={plano} c={pessoa} destaque={destaqueAtual} /> : null}

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
