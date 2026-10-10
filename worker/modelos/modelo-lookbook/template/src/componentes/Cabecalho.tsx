// Cabeçalho corrido da revista (fixo no topo, sobre o papel): o nome do lookbook à esquerda
// e, à direita, o fólio do momento — "Nº 01 / 03" numa peça, o `folio` da colagem,
// a área da marca no resto. Um fio fino separa o cabeçalho da página.
import { prog } from "../anim";
import type { Momento, Plano } from "../plano";
import { cor, MARGEM, rotulo } from "../tema";

type Folio = { de: number; texto: string; numero?: string };

const folioDe = (m: Momento, plano: Plano, total: number): Folio => {
  if (m.tipo === "peca" && m.numero) return { de: m.de, texto: ` / ${String(m.total ?? total).padStart(2, "0")}`, numero: `Nº ${String(m.numero).padStart(2, "0")}` };
  if (m.tipo === "colagem") return { de: m.de, texto: m.folio ?? plano.marca.area };
  if ((m.tipo === "capa" || m.tipo === "abertura") && m.rotulo) return { de: m.de, texto: m.rotulo };
  return { de: m.de, texto: plano.marca.area };
};

export const Cabecalho: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const total = plano.momentos.filter((m) => m.tipo === "peca").length;
  // o fechamento não troca o fólio (a etiqueta já traz a assinatura)
  const folios: Folio[] = [
    { de: -1, texto: plano.marca.area },
    ...[...plano.momentos]
      .filter((m) => m.tipo !== "cta")
      .sort((a, b) => a.de - b.de)
      .map((m) => folioDe(m, plano, total)),
  ];
  let i = 0;
  for (let k = 0; k < folios.length; k++) if (folios[k].de <= t) i = k;
  const atual = folios[i];
  const anterior = i > 0 ? folios[i - 1] : null;
  const p = prog(t, atual.de, 0.45);
  const mesmo = anterior && anterior.texto === atual.texto && anterior.numero === atual.numero;
  const Texto: React.FC<{ f: Folio }> = ({ f }) => (
    <span style={{ whiteSpace: "nowrap" }}>
      {f.numero ? <span style={{ color: cor.indigo }}>{f.numero}</span> : null}
      {f.texto}
    </span>
  );
  return (
    <>
      <div style={{ position: "absolute", left: MARGEM, top: 46, ...rotulo, letterSpacing: "0.34em", color: cor.tinta }}>{plano.cabecalho ?? "Lookbook"}</div>
      <div style={{ position: "absolute", right: MARGEM, top: 46, width: 600, height: 40, overflow: "hidden", ...rotulo, color: cor.grafite, textAlign: "right" }}>
        {anterior && !mesmo && p < 1 ? (
          <div style={{ translate: `0 ${-p * 110}%`, opacity: 1 - p }}>
            <Texto f={anterior} />
          </div>
        ) : null}
        <div style={{ position: anterior && !mesmo && p < 1 ? "absolute" : "static", right: 0, top: 0, translate: `0 ${mesmo ? 0 : (1 - p) * 110}%` }}>
          <Texto f={atual} />
        </div>
      </div>
      <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: 98, height: 2, background: "rgba(23,22,20,0.55)" }} />
    </>
  );
};
