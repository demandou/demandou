// Painel com lista (ex.: histórico da área de transferência). Abre com o primeiro item já lá;
// os outros entram um a um quando são ditos, cada vaga esperando "a lápis". O selo acende na
// palavra; no fim o mouse escolhe um item antigo e ele é colado.
import { janelaAberta, mistura, Palavras, prog, temposDoTexto } from "../anim";
import { areaAoLadoDaMini, ICONES_DOCK, itemGeom, listaGeom, lugarDoMomento, posDock } from "../geometria";
import { Contador } from "./Listas";
import { corpoQueCabe } from "../medida";
import type { Lista as TipoLista, Palavra, Plano, TipoItem } from "../plano";
import { BARRA_JANELA, cor, mono, sans } from "../tema";
import { Icone, type NomeIcone } from "./Icones";
import { Janela } from "./Janela";

const ICONE_DO_ITEM: Record<TipoItem, NomeIcone> = {
  texto: "texto",
  imagem: "imagem",
  link: "link",
  endereco: "endereco",
  dinheiro: "dinheiro",
  arquivo: "arquivo",
  contato: "contato",
  data: "data",
};

export const Lista: React.FC<{ m: TipoLista; plano: Plano; palavras: Palavra[]; t: number; fim: number }> = ({ m, plano, palavras, t, fim }) => {
  const LISTA = listaGeom(plano, m);
  const icone = m.icone ?? "prancheta";
  const indiceDock = Math.max(0, ICONES_DOCK.indexOf(icone as (typeof ICONES_DOCK)[number]));
  // abre depois que a janela da pessoa saiu do caminho; fecha antes da próxima janela abrir
  const aberta = janelaAberta(t, m.de, fim);
  const tSub = temposDoTexto(m.subtitulo ?? "", palavras, m.de, m.ate, m.de + 0.3);
  const pSelo = m.selo ? prog(t, m.selo.em - 0.05, 0.3) : 0;
  const pEscolhe = m.escolheEm !== undefined ? prog(t, m.escolheEm + 0.02, 0.22) : 0;
  const itens = m.itens.slice(0, 5);

  // sem teclas, o canto ao lado da pessoa minimizada mostra a contagem dos itens
  const lado = !m.teclas?.length && lugarDoMomento(m) === "mini" ? areaAoLadoDaMini(plano) : null;
  const atual = itens.reduce((k, it, i) => (t >= it.em - 0.06 ? i : k), -1);
  const feito = itens.reduce((s, it, i) => s + (i === 0 ? 1 : prog(t, it.em - 0.06, 0.4)), 0);
  return (
    <>
    {lado ? <Contador lado={lado} titulo="Lista" rotulo="Item" atual={atual} n={itens.length} feito={feito} aberta={janelaAberta(t, m.de + 0.15, fim)} origem={posDock(indiceDock)} /> : null}
    <Janela x={LISTA.x} y={LISTA.y} w={LISTA.w} h={LISTA.h} titulo={m.titulo} icone={icone} aberta={aberta} origem={posDock(indiceDock)} fundo={cor.painel}>
      {/* a frase dita + selo */}
      <div style={{ position: "absolute", left: 40, right: 40, top: 22, display: "flex", alignItems: "center", gap: 20, minHeight: 66 }}>
        {m.subtitulo ? (
          <Palavras texto={m.subtitulo} tempos={tSub} t={t} esboco={cor.esboco} style={{ fontFamily: sans, fontWeight: 800, fontSize: 60, color: cor.tinta, lineHeight: 1.06, flex: 1 }} />
        ) : (
          <div style={{ flex: 1 }} />
        )}
      </div>
      {m.selo ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 104,
            fontFamily: sans,
            fontWeight: 800,
            fontSize: 40,
            color: "transparent",
            border: `3px dashed ${cor.esboco}`,
            padding: "3px 17px 5px",
            borderRadius: 30,
            opacity: 1 - pSelo,
            whiteSpace: "nowrap",
          }}
        >
          {m.selo.texto}
        </div>
      ) : null}
      {m.selo ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 104,
            fontFamily: sans,
            fontWeight: 800,
            fontSize: 40,
            color: "#FFFFFF",
            background: cor.violeta,
            padding: "6px 20px 8px",
            borderRadius: 30,
            opacity: pSelo,
            scale: String(mistura(0.86, 1, pSelo)),
            whiteSpace: "nowrap",
          }}
        >
          {m.selo.texto}
        </div>
      ) : null}

      {itens.map((it, i) => {
        const g = itemGeom(i, LISTA);
        // o primeiro item já está no painel quando ele abre
        const p = i === 0 ? 1 : prog(t, it.em - 0.06, 0.32);
        const escolhido = m.escolhe === i ? pEscolhe : 0;
        const tipo = it.tipo ?? "texto";
        return (
          <div key={i} style={{ position: "absolute", left: g.x - LISTA.x, top: g.y - LISTA.y - BARRA_JANELA, width: g.w, height: g.h }}>
            {/* vaga a lápis */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 24,
                border: `3px dashed ${cor.esboco}`,
                display: "flex",
                alignItems: "center",
                gap: 22,
                padding: "0 24px",
                opacity: 1 - p,
              }}
            >
              <div style={{ width: 70, height: 70, borderRadius: 18, background: cor.esbocoClaro }} />
              <div style={{ width: 320 - (i % 2) * 90, height: 24, borderRadius: 12, background: cor.esbocoClaro }} />
            </div>
            {/* item */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 24,
                background: escolhido > 0.5 ? cor.violetaFundo : cor.janela,
                outline: `${escolhido > 0.5 ? 3 : 1.5}px solid ${escolhido > 0.5 ? cor.violeta : cor.linha}`,
                boxShadow: "0 6px 16px rgba(28,20,64,0.07)",
                display: "flex",
                alignItems: "center",
                gap: 22,
                padding: "0 24px",
                opacity: p,
                translate: `0 ${(1 - p) * -28}px`,
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  flexShrink: 0,
                  borderRadius: 18,
                  background: escolhido > 0.5 ? cor.violeta : cor.violetaFundo,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icone nome={escolhido > 0.5 ? (/colad/i.test(m.escolheTexto ?? "") ? "colar" : "check") : (it.icone ?? ICONE_DO_ITEM[tipo])} tamanho={44} cor={escolhido > 0.5 ? "#FFFFFF" : cor.violeta} peso={3.6} />
              </div>
              <div
                style={{
                  flex: 1,
                  fontFamily: tipo === "link" || tipo === "dinheiro" ? mono : sans,
                  fontWeight: tipo === "link" || tipo === "dinheiro" ? 600 : 700,
                  fontSize: corpoQueCabe(it.texto, g.w - 48 - 70 - 22 - (i === 0 && m.primeiro ? 200 : 0) - (m.escolhe === i ? 200 : 0), tipo === "link" || tipo === "dinheiro" ? 44 : 48, 34, { mono: tipo === "link" || tipo === "dinheiro" }),
                  color: cor.tinta,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {it.texto}
              </div>
              {i === 0 && m.primeiro ? (
                <div
                  style={{
                    fontFamily: sans,
                    fontWeight: 800,
                    fontSize: 36,
                    color: cor.tintaSuave,
                    background: cor.barra,
                    outline: `1.5px solid ${cor.linha}`,
                    padding: "4px 16px 6px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.primeiro}
                </div>
              ) : null}
              {m.escolhe === i ? (
                <div
                  style={{
                    fontFamily: sans,
                    fontWeight: 800,
                    fontSize: 36,
                    color: "#FFFFFF",
                    background: cor.violeta,
                    padding: "4px 16px 6px",
                    borderRadius: 20,
                    opacity: escolhido,
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.escolheTexto ?? "Escolhido"}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </Janela>
    </>
  );
};
