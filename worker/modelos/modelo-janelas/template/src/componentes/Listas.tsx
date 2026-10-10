// Tópicos e passos: janelas do desktop que se preenchem na fala.
// Tópicos = uma nota com vagas tracejadas; cada item ocupa a sua quando é dito e o mouse o seleciona.
// Passos = um assistente com etapas numeradas ligadas por uma linha que avança, e a barra de
// progresso "Etapa 2 de 3" ao lado da pessoa minimizada.
import { janelaAberta, limitar, mistura, prog, temposDoTexto } from "../anim";
import { geoLista, geoProgresso, type Linha } from "../blocos";
import { areaAoLadoDaMini, ICONES_DOCK, iconeDoTipo, lugarDoMomento, posDock } from "../geometria";
import type { Palavra, Passos, Plano, Topicos } from "../plano";
import { TextoFalado } from "../texto";
import { BARRA_JANELA, cor, mono, sans } from "../tema";
import { Icone } from "./Icones";
import { Janela } from "./Janela";

const origemDe = (tipo: Topicos["tipo"] | Passos["tipo"]) => posDock(Math.max(0, ICONES_DOCK.indexOf(iconeDoTipo[tipo] ?? "nota")));

// item da vez: o último que já foi dito
const daVez = (itens: { em: number }[], t: number) => itens.reduce((k, it, i) => (t >= it.em - 0.06 ? i : k), -1);

// Vaga "a lápis": o item ainda não foi dito
const Vaga: React.FC<{ l: Linha; i: number; opacidade: number; redonda?: boolean }> = ({ l, i, opacidade, redonda }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 24,
      border: `3px dashed ${cor.esboco}`,
      display: "flex",
      alignItems: "center",
      gap: 22,
      padding: "0 22px",
      opacity: opacidade,
    }}
  >
    <div style={{ width: l.marca, height: l.marca, borderRadius: redonda ? l.marca / 2 : 18, background: cor.esbocoClaro, flexShrink: 0 }} />
    <div style={{ width: 360 - (i % 2) * 110, height: 24, borderRadius: 12, background: cor.esbocoClaro }} />
  </div>
);

const Titulo: React.FC<{ g: ReturnType<typeof geoLista>; m: Topicos | Passos; palavras: Palavra[]; t: number }> = ({ g, m, palavras, t }) => {
  if (!g.titulo || !m.titulo) return null;
  const tempos = temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.3);
  return (
    <div style={{ position: "absolute", left: 40, top: g.tituloY - g.janela.y - BARRA_JANELA }}>
      <TextoFalado enc={g.titulo} tempos={tempos} t={t} cor={cor.tinta} esboco={cor.esboco} alturaLinha={1.06} />
    </div>
  );
};

const TextoDoItem: React.FC<{ l: Linha; t: number; em: number; detalheEm?: number; destaque: boolean }> = ({ l, t, em, detalheEm, destaque }) => {
  const pDetalhe = prog(t, detalheEm !== undefined ? detalheEm - 0.06 : em + 0.25, 0.3);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, minWidth: 0 }}>
      <TextoFalado enc={l.texto} t={t} cor={cor.tinta} alturaLinha={1.08} fonte={{ peso: destaque ? 800 : 700 }} />
      {l.detalhe ? (
        <div style={{ opacity: pDetalhe, translate: `0 ${(1 - pDetalhe) * 10}px` }}>
          <TextoFalado enc={l.detalhe} t={t} cor={cor.tintaSuave} alturaLinha={1.1} fonte={{ peso: 600 }} />
        </div>
      ) : null}
    </div>
  );
};


// A janelinha ao lado da pessoa minimizada: "2/3", "Etapa 2 de 3" e a barra que enche
export const Contador: React.FC<{
  lado: { x: number; y: number; w: number; h: number };
  titulo: string;
  rotulo: string;
  atual: number;
  n: number;
  feito: number;
  aberta: number;
  origem: { x: number; y: number };
}> = ({ lado, titulo, rotulo, atual, n, feito, aberta, origem }) => (
  <Janela x={lado.x} y={lado.y} w={lado.w} h={lado.h} titulo={titulo} aberta={aberta} origem={origem}>
    <div style={{ position: "absolute", left: 34, right: 34, top: 26, bottom: 30, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: mono, fontWeight: 800, lineHeight: 1 }}>
        <span style={{ fontSize: 132, color: atual >= 0 ? cor.violeta : cor.esboco }}>{Math.max(0, atual + 1)}</span>
        <span style={{ fontSize: 64, color: cor.tintaSuave }}>/{n}</span>
      </div>
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 40, color: atual >= 0 ? cor.tinta : cor.esboco }}>{`${rotulo} ${Math.max(1, atual + 1)} de ${n}`}</div>
      <div style={{ height: 22, borderRadius: 11, background: cor.esbocoClaro, overflow: "hidden" }}>
        <div style={{ width: `${(feito / Math.max(1, n)) * 100}%`, height: "100%", borderRadius: 11, background: cor.violeta }} />
      </div>
    </div>
  </Janela>
);

export const BlocoTopicos: React.FC<{ m: Topicos; plano: Plano; palavras: Palavra[]; t: number; fim: number }> = ({ m, plano, palavras, t, fim }) => {
  const g = geoLista(plano, m);
  const aberta = janelaAberta(t, m.de, fim);
  const atual = daVez(m.itens, t);
  const lado = lugarDoMomento(m) === "mini" ? areaAoLadoDaMini(plano) : null;
  const feito = m.itens.reduce((s, it) => s + prog(t, it.em - 0.06, 0.4), 0);
  return (
    <>
    {lado ? <Contador lado={lado} titulo="Lista" rotulo="Item" atual={atual} n={g.linhas.length} feito={feito} aberta={janelaAberta(t, m.de + 0.15, fim)} origem={origemDe("topicos")} /> : null}
    <Janela x={g.janela.x} y={g.janela.y} w={g.janela.w} h={g.janela.h} titulo="Notas" icone="nota" aberta={aberta} origem={origemDe("topicos")} fundo={cor.painel}>
      <Titulo g={g} m={m} palavras={palavras} t={t} />
      {g.linhas.map((l, i) => {
        const it = m.itens[i];
        const p = prog(t, it.em - 0.06, 0.32);
        const selecionado = i === atual ? prog(t, it.em + 0.08, 0.16) * (1 - (m.itens[i + 1] ? prog(t, m.itens[i + 1].em + 0.08, 0.16) : 0)) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: l.x - g.janela.x, top: l.y - g.janela.y - BARRA_JANELA, width: l.w, height: l.h }}>
            <Vaga l={l} i={i} opacidade={1 - p} />
            {p > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 24,
                  background: selecionado > 0.5 ? cor.violetaFundo : cor.janela,
                  outline: `${mistura(1.5, 3, selecionado)}px solid ${selecionado > 0.5 ? cor.violeta : cor.linha}`,
                  boxShadow: "0 6px 16px rgba(28,20,64,0.07)",
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "0 22px",
                  opacity: p,
                  translate: `0 ${(1 - p) * -24}px`,
                }}
              >
                <div
                  style={{
                    width: l.marca,
                    height: l.marca,
                    flexShrink: 0,
                    borderRadius: 18,
                    background: selecionado > 0.5 ? cor.violeta : cor.violetaFundo,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {it.icone ? (
                    <Icone nome={it.icone} tamanho={l.marca * 0.6} cor={selecionado > 0.5 ? "#FFFFFF" : cor.violeta} peso={3.6} />
                  ) : (
                    <div style={{ width: l.marca * 0.26, height: l.marca * 0.26, borderRadius: "50%", background: selecionado > 0.5 ? "#FFFFFF" : cor.violeta }} />
                  )}
                </div>
                <TextoDoItem l={l} t={t} em={it.em} detalheEm={it.detalheEm} destaque={selecionado > 0.5} />
              </div>
            ) : null}
          </div>
        );
      })}
    </Janela>
    </>
  );
};

export const BlocoPassos: React.FC<{ m: Passos; plano: Plano; palavras: Palavra[]; t: number; fim: number }> = ({ m, plano, palavras, t, fim }) => {
  const g = geoLista(plano, m);
  const aberta = janelaAberta(t, m.de, fim);
  const n = g.linhas.length;
  const atual = daVez(m.itens, t);
  // progresso contínuo: cresce até a etapa dita (0 → n)
  const feito = m.itens.reduce((s, it) => s + prog(t, it.em - 0.06, 0.4), 0);
  const lado = geoProgresso(plano, m);
  return (
    <>
      <Janela x={g.janela.x} y={g.janela.y} w={g.janela.w} h={g.janela.h} titulo="Passo a passo" icone="etapas" aberta={aberta} origem={origemDe("passos")} fundo={cor.painel}>
        <Titulo g={g} m={m} palavras={palavras} t={t} />
        {/* o fio que liga as etapas: tracejado, enche de violeta até a etapa dita */}
        {g.linhas.slice(0, -1).map((l, i) => {
          const prox = g.linhas[i + 1];
          const cx = l.x - g.janela.x + 22 + l.marca / 2;
          const y1 = l.y - g.janela.y - BARRA_JANELA + l.h / 2 + l.marca / 2;
          const y2 = prox.y - g.janela.y - BARRA_JANELA + prox.h / 2 - prox.marca / 2;
          const enche = limitar(feito - (i + 1));
          return (
            <div key={`f${i}`}>
              <div style={{ position: "absolute", left: cx - 2, top: y1, width: 4, height: y2 - y1, borderLeft: `4px dashed ${cor.esboco}` }} />
              <div style={{ position: "absolute", left: cx - 3, top: y1, width: 6, height: (y2 - y1) * enche, background: cor.violeta, borderRadius: 3 }} />
            </div>
          );
        })}
        {g.linhas.map((l, i) => {
          const it = m.itens[i];
          const p = prog(t, it.em - 0.06, 0.32);
          const agora = i === atual;
          const passou = atual > i;
          const top = l.y - g.janela.y - BARRA_JANELA;
          return (
            <div key={i} style={{ position: "absolute", left: l.x - g.janela.x, top, width: l.w, height: l.h }}>
              {/* número da etapa: esboço → violeta (a da vez) → grafite com ✓ (as que passaram) */}
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  top: (l.h - l.marca) / 2,
                  width: l.marca,
                  height: l.marca,
                  borderRadius: "50%",
                  border: p < 0.5 ? `3px dashed ${cor.esboco}` : "none",
                  background: p < 0.5 ? cor.painel : agora ? cor.violeta : cor.tecla,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: mono,
                  fontWeight: 800,
                  fontSize: l.marca * 0.46,
                  color: p < 0.5 ? cor.esboco : "#FFFFFF",
                  scale: String(mistura(0.9, 1, p)),
                }}
              >
                {passou ? <Icone nome="check" tamanho={l.marca * 0.56} cor="#FFFFFF" peso={5} /> : i + 1}
              </div>
              {/* a etapa: vaga a lápis até ser dita */}
              <div style={{ position: "absolute", left: 22 + l.marca + 22, right: 0, top: 0, bottom: 0 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: "10px 0",
                    borderRadius: 22,
                    border: `3px dashed ${cor.esboco}`,
                    opacity: 1 - p,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 24px",
                  }}
                >
                  <div style={{ width: 340 - (i % 2) * 100, height: 24, borderRadius: 12, background: cor.esbocoClaro }} />
                </div>
                {p > 0.001 ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: "6px 0",
                      borderRadius: 22,
                      background: agora ? cor.janela : "transparent",
                      outline: agora ? `3px solid ${cor.violeta}` : "none",
                      boxShadow: agora ? "0 6px 16px rgba(28,20,64,0.08)" : "none",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 24px",
                      opacity: p,
                      translate: `${(1 - p) * 24}px 0`,
                    }}
                  >
                    <TextoDoItem l={{ ...l, w: l.w - l.marca - 44 }} t={t} em={it.em} detalheEm={it.detalheEm} destaque={agora} />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </Janela>
      {lado ? <Contador lado={lado} titulo="Progresso" rotulo="Etapa" atual={atual} n={n} feito={feito} aberta={janelaAberta(t, m.de + 0.15, fim)} origem={origemDe("passos")} /> : null}
    </>
  );
};
