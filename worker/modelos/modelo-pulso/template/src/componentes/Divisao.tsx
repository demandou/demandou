// A divisão (a maioria × uma parte): embaixo do card da pessoa, uma barra de casas. As casas da parte
// maior enchem em cascata enquanto a porcentagem conta; na parte menor, as últimas casas enchem na
// outra cor e a barra se divide (abre um vão entre as duas partes). Sem porcentagem dita
// (`ilustrativo`), a barra mostra a proporção de exemplo com a etiqueta, e os rótulos crescem.
import { Digitos, Linhas, prog, temposDoTexto } from "../anim";
import type { Geo } from "../layout";
import { encaixar, LETREIRO, larguraTexto, SANS } from "../medida";
import type { Divisao as DivisaoT, Palavra, Parte } from "../plano";
import { cor, letreiro, mostrador, sans, zonaCor } from "../tema";

const X = 120;
const LARGURA = 840;
const VAO = 26;

export const casasDe = (m: DivisaoT) => Math.max(4, Math.min(20, Math.round(m.casas ?? 10)));
// as porcentagens (sem `pct`: 70/30 de exemplo)
export const pctDas = (m: DivisaoT): [number, number] => {
  const [a, b] = m.partes;
  const pa = a?.pct ?? (b?.pct !== undefined ? 100 - b.pct : 70);
  const pb = b?.pct ?? 100 - pa;
  return [pa, pb];
};
// quantas casas cada parte ocupa (a maior arredonda para cima se precisar)
export const casasDasPartes = (m: DivisaoT) => {
  const n = casasDe(m);
  const [pa] = pctDas(m);
  const ca = Math.max(1, Math.min(n - 1, Math.round((pa / 100) * n)));
  return [ca, n - ca];
};
// quando cada casa enche
export const temposDasCasas = (m: DivisaoT) => {
  const [ca, cb] = casasDasPartes(m);
  const [a, b] = m.partes;
  const ia = a.encheEm ?? a.em - 0.6;
  const passoA = ca > 1 ? Math.max(0.06, (a.em - ia) / (ca - 1)) : 0;
  const ib = b ? (b.encheEm ?? b.em) : 1e4;
  return [...Array.from({ length: ca }, (_, i) => ia + i * passoA), ...Array.from({ length: cb }, (_, i) => ib + i * 0.12)];
};

export const Divisao: React.FC<{ m: DivisaoT; t: number; palavras: Palavra[]; geo: Geo }> = ({ m, t, palavras, geo }) => {
  const n = casasDe(m);
  const [ca] = casasDasPartes(m);
  const tempos = temposDasCasas(m);
  const [a, b] = m.partes as [Parte, Parte | undefined];
  const [pctTotalA, pctTotalB] = pctDas(m);
  const za = zonaCor(a.zona);
  const zb = zonaCor(b?.zona ?? 4);
  const comPct = !m.ilustrativo && a.pct !== undefined;

  // altura disponível embaixo do card: a barra e os números encolhem quando o card é mais alto
  const topo = geo.abaixoCartao + 4;
  const espaco = 1520 - topo;
  const compacto = espaco < 600;
  const topoBarra = topo + 66;
  const altBarra = compacto ? 130 : 170;
  // a barra começa inteira e se divide quando a parte menor entra
  const divide = b ? prog(t, b.em, 0.45) : 0;
  const larguraCasa = (LARGURA - VAO - (n - 1) * 12) / n;
  const xCasa = (i: number) => X + i * (larguraCasa + 12) + (i >= ca ? VAO * divide : 0);
  const fimA = xCasa(ca - 1) + larguraCasa;
  const iniB = xCasa(ca);

  // porcentagens: contam junto com as casas que encheram
  const cheias = (de: number, ate: number) => tempos.slice(de, ate).filter((tc) => prog(t, tc, 0.26) > 0.5).length;
  const pctA = Math.round((cheias(0, ca) / ca) * pctTotalA);
  const pctB = b ? Math.round((cheias(ca, n) / Math.max(1, n - ca)) * pctTotalB) : 0;
  const temposA = temposDoTexto(a.texto, palavras, m.de, m.ate, a.textoEm ?? a.encheEm ?? a.em - 0.6);
  const temposB = b ? temposDoTexto(b.texto, palavras, b.em - 0.2, m.ate, b.textoEm ?? b.em + 0.3) : [];
  // etiqueta do canto (o nome antigo `zona` vira "Zona N")
  const etiqueta = m.etiqueta ?? (m.zona ? { texto: `Zona ${m.zona.numero}`, em: m.zona.em, zona: m.zona.numero } : undefined);
  const chip = etiqueta ? prog(t, etiqueta.em, 0.3) : 0;
  const zc = zonaCor(etiqueta?.zona ?? a.zona);
  const ilustrativo = m.ilustrativo || a.pct === undefined;
  const tamPct = compacto ? 120 : 150;
  const topoPct = topoBarra + altBarra + 40;
  // rótulos das partes: cada um na sua metade, até 2 linhas
  const meia = (LARGURA - 40) / 2;
  const maxRot = comPct ? 50 : 60;
  const encA = encaixar(a.texto, { largura: meia, max: maxRot, min: 38, linhas: 2, fonte: SANS });
  const encB = b ? encaixar(b.texto, { largura: meia, max: maxRot, min: 38, linhas: 2, fonte: SANS }) : null;
  const tamRot = Math.min(encA.tamanho, encB?.tamanho ?? encA.tamanho);
  const lhRot = Math.round(tamRot * 1.14);
  const linhasA = encaixar(a.texto, { largura: meia, max: tamRot, min: tamRot, linhas: 2, fonte: SANS }).linhas;
  const linhasB = b ? encaixar(b.texto, { largura: meia, max: tamRot, min: tamRot, linhas: 2, fonte: SANS }).linhas : [];
  const topoRot = comPct ? topoPct + tamPct + 10 : topoPct;
  const fimRot = topoRot + Math.max(linhasA.length, linhasB.length) * lhRot;
  // letreiro e etiqueta dividem a linha de cima
  const rotulo = m.rotulo?.trim() ?? "";
  const largChip = etiqueta ? larguraTexto(etiqueta.texto, 32, LETREIRO) + 54 : 0;
  const tamLetreiro = rotulo ? Math.max(26, Math.min(32, Math.floor((32 * (LARGURA - largChip - 20)) / Math.max(1, larguraTexto(rotulo, 32, LETREIRO))))) : 32;
  const unidade = m.unidade?.trim();

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* letreiro e a etiqueta */}
      <div style={{ position: "absolute", left: X, width: LARGURA, top: topo, height: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ ...letreiro, fontSize: tamLetreiro, color: cor.tintaSuave, whiteSpace: "nowrap" }}>{rotulo}</span>
        {etiqueta ? (
          <div
            style={{
              ...letreiro,
              fontSize: 32,
              height: 54,
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              color: chip > 0.5 ? "#FFFFFF" : cor.esbocoTexto,
              background: chip > 0.01 ? zc.cor : "transparent",
              border: `3px ${chip > 0.01 ? "solid" : "dashed"} ${chip > 0.01 ? zc.cor : cor.esboco}`,
              scale: String(0.9 + 0.1 * Math.max(chip, 0.0001) + (1 - chip) * 0.1),
            }}
          >
            {etiqueta.texto}
          </div>
        ) : null}
      </div>

      {/* a barra de casas */}
      {Array.from({ length: n }, (_, i) => {
        const enche = prog(t, tempos[i], 0.26);
        const corCasa = i < ca ? za.cor : zb.cor;
        return (
          <div key={i} style={{ position: "absolute", left: xCasa(i), top: topoBarra, width: larguraCasa, height: altBarra }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 16, border: `3px dashed ${cor.esboco}`, opacity: 1 - enche }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${enche * 100}%`, borderRadius: 16, background: corCasa }} />
          </div>
        );
      })}

      {/* chaves embaixo de cada parte */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {(() => {
          const y = topoBarra + altBarra + 18;
          const pa = prog(t, a.em, 0.4);
          const pb = b ? prog(t, b.em + 0.15, 0.4) : 0;
          return (
            <>
              <line x1={X} x2={X + (fimA - X) * pa} y1={y} y2={y} stroke={za.cor} strokeWidth={5} strokeLinecap="round" />
              {b ? <line x1={960 - (960 - iniB) * pb} x2={960} y1={y} y2={y} stroke={zb.cor} strokeWidth={5} strokeLinecap="round" /> : null}
            </>
          );
        })()}
      </svg>

      {/* porcentagens (quando ditas) */}
      {comPct ? (
        <>
          <div style={{ position: "absolute", left: X, top: topoPct, fontFamily: mostrador, fontWeight: 700, color: pctA > 0 ? za.texto : cor.esboco, lineHeight: `${tamPct}px` }}>
            <Digitos texto={`${pctA}%`} tamanho={tamPct} style={{ fontSize: tamPct }} casa={0.58} />
          </div>
          {b ? (
            <div style={{ position: "absolute", right: 120, top: topoPct + tamPct * 0.2, fontFamily: mostrador, fontWeight: 700, color: pctB > 0 ? zb.texto : cor.esboco, lineHeight: `${tamPct * 0.8}px` }}>
              <Digitos texto={`${pctB}%`} tamanho={tamPct * 0.8} style={{ fontSize: tamPct * 0.8 }} casa={0.58} />
            </div>
          ) : null}
        </>
      ) : null}
      {/* rótulos */}
      <Linhas
        linhas={linhasA}
        tempos={temposA}
        t={t}
        x={X + 4}
        y={topoRot}
        largura={meia}
        alturaLinha={lhRot}
        estilo={{ fontFamily: sans, fontWeight: 700, fontSize: tamRot, color: comPct ? cor.tinta : za.texto }}
        esboco={cor.esboco}
      />
      {b ? (
        <Linhas
          linhas={linhasB}
          tempos={temposB}
          t={t}
          x={960 - meia}
          y={topoRot}
          largura={meia}
          alturaLinha={lhRot}
          alinhar="right"
          estilo={{ fontFamily: sans, fontWeight: 700, fontSize: tamRot, color: comPct ? cor.tinta : zb.texto }}
          esboco={cor.esboco}
        />
      ) : null}

      {/* legenda da barra (o que é cada casa) e a etiqueta "ilustrativo" */}
      {unidade && fimRot + 30 + 44 <= 1520 ? (
        <div
          style={{
            position: "absolute",
            left: X,
            top: fimRot + 30,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: sans,
            fontSize: 36,
            fontWeight: 600,
            color: cor.tintaSuave,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ width: 24, height: 38, borderRadius: 7, background: prog(t, tempos[0], 0.2) > 0.5 ? za.cor : cor.esboco }} />
          {unidade}
        </div>
      ) : null}
      {ilustrativo && fimRot + 30 + 50 <= 1520 ? (
        <div
          style={{
            ...letreiro,
            fontSize: 28,
            position: "absolute",
            right: 120,
            top: fimRot + 30,
            color: cor.tintaFraca,
            border: `3px solid ${cor.esboco}`,
            borderRadius: 999,
            padding: "8px 18px 7px",
            whiteSpace: "nowrap",
          }}
        >
          ilustrativo
        </div>
      ) : null}
    </div>
  );
};
