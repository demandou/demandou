// Momento `acordes`: os diagramas (1 a 4) numa grade abaixo da janela. Todos nascem a lápis
// (cifra apagada, grade tracejada); cada um ganha tinta quando o acorde é dito. O acorde em curso
// fica azul; os já tocados, marfim. Se um `compasso` vem logo em seguida com os mesmos acordes,
// os diagramas e as cifras viajam para os compassos (veja Passagem.tsx) em vez de sumir.
import { cifraNaTela, formaDoAcorde, nomeDoAcorde } from "../acordes";
import { prog } from "../anim";
import { lugaresDosAcordes, TAMANHO_CIFRA } from "../geometria";
import type { Acordes as TAcordes } from "../plano";
import { cor, fonte, titulo } from "../tema";
import type { Area } from "./Cena";
import { Diagrama } from "./Diagrama";

// a cifra centrada num ponto (com o nome falado pendurado à direita, se houver)
export const CifraNoLugar: React.FC<{
  cifra: string;
  cx: number;
  topo: number;
  cor: string;
  nome?: string;
  opacidadeNome?: number;
  subida?: number;
  // largura livre à direita da cifra para o nome (px); nome comprido quebra em duas linhas menores
  larguraNome?: number;
  tamanho?: number;
}> = ({ cifra, cx, topo, cor: tinta, nome, opacidadeNome = 1, subida = 0, larguraNome = 400, tamanho = TAMANHO_CIFRA }) => {
  const cabe = (nome ?? "").length * 0.5 * 36 <= larguraNome;
  return (
  <div style={{ position: "absolute", left: cx - 300, top: topo, width: 600, display: "flex", justifyContent: "center" }}>
    <div style={{ position: "relative", ...titulo, fontSize: tamanho, lineHeight: 1.05, color: tinta, translate: `0 ${subida}px` }}>
      {cifraNaTela(cifra)}
      {nome ? (
        <div
          style={{
            position: "absolute",
            left: "100%",
            bottom: 9,
            marginLeft: 14,
            fontFamily: fonte,
            fontWeight: 600,
            fontSize: cabe ? 36 : 32,
            lineHeight: 1.05,
            letterSpacing: 0,
            whiteSpace: cabe ? "nowrap" : "normal",
            width: cabe ? undefined : Math.max(120, larguraNome),
            color: cor.marfimSuave,
            opacity: opacidadeNome,
            translate: `${(1 - opacidadeNome) * -12}px 0`,
          }}
        >
          {nome}
        </div>
      ) : null}
    </div>
  </div>
  );
};

// largura aproximada da cifra na tela (para saber quanto sobra para o nome)
export const larguraDaCifra = (cifra: string) => cifra.length * 0.62 * TAMANHO_CIFRA;

export const Acordes: React.FC<{
  m: TAcordes;
  t: number;
  area: Area;
  // a partir daqui os diagramas e as cifras são desenhados pela passagem para os compassos
  entregaEm?: number;
}> = ({ m, t, area, entregaEm }) => {
  const lista = m.acordes.slice(0, 4);
  const lugares = lugaresDosAcordes(lista.length, area);
  const emCurso = lista.reduce((k, a, i) => (t >= a.em - 0.02 ? i : k), -1);
  const entregue = entregaEm !== undefined && t >= entregaEm;
  // a passagem leva cifra e diagrama; o nome e o cartão somem rápido
  const somem = entregaEm !== undefined ? 1 - prog(t, entregaEm, 0.18) : 1;

  return (
    <>
      {lista.map((a, i) => {
        const forma = formaDoAcorde(a);
        const l = lugares[i];
        const dito = prog(t, a.em - 0.04, 0.3);
        const ativo = i === emCurso;
        const corCifra = dito <= 0 ? cor.lapisForte : ativo ? cor.azul : cor.marfim;
        const larguraCartao = Math.max(l.medida.largura + 70, 320);
        // espaço à direita da cifra até a borda da célula
        const livre = l.celula.x + l.celula.w - (l.cx + larguraDaCifra(a.cifra) / 2) - 24;
        // acorde sem diagrama conhecido (fora do dicionário e sem `forma`): a cifra grande e o nome, sem
        // inventar digitação; nada de cartão vazio
        if (!forma)
          return (
            <div
              key={`${a.cifra}-${i}`}
              style={{
                position: "absolute",
                left: l.celula.x - area.x,
                top: l.celula.y - area.y,
                width: l.celula.w,
                height: l.celula.h,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: entregue ? somem : 1,
              }}
            >
              <div
                style={{
                  padding: "26px 40px",
                  borderRadius: 28,
                  background: ativo && dito > 0 ? cor.azulFundo : "transparent",
                  border: dito > 0 ? "none" : `3px dashed ${cor.lapis}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ ...titulo, fontSize: Math.min(120, l.celula.h * 0.32), color: corCifra, translate: `0 ${(1 - dito) * 10}px` }}>
                  {cifraNaTela(a.cifra)}
                </div>
                <div style={{ fontFamily: fonte, fontWeight: 600, fontSize: 40, color: cor.marfimSuave, opacity: dito, textAlign: "center" }}>
                  {a.nome ?? nomeDoAcorde(a.cifra)}
                </div>
              </div>
            </div>
          );
        return (
          <div key={`${a.cifra}-${i}`}>
            {/* cartão do acorde em curso */}
            <div
              style={{
                position: "absolute",
                left: l.cx - area.x - larguraCartao / 2,
                top: l.topoCifra - area.y - 8,
                width: larguraCartao,
                height: l.dy - l.topoCifra + l.medida.altura + 16,
                borderRadius: 28,
                background: cor.azulFundo,
                opacity: (ativo ? dito : 0) * somem,
              }}
            />
            {entregue ? (
              <CifraNoLugar
                cifra={a.cifra}
                cx={l.cx - area.x}
                topo={l.topoCifra - area.y}
                cor="transparent"
                nome={forma?.nome ?? a.nome}
                opacidadeNome={dito * somem}
                larguraNome={livre}
              />
            ) : (
              <>
                <CifraNoLugar
                  cifra={a.cifra}
                  cx={l.cx - area.x}
                  topo={l.topoCifra - area.y}
                  cor={corCifra}
                  nome={forma?.nome ?? a.nome}
                  opacidadeNome={dito}
                  subida={(1 - dito) * 10}
                  larguraNome={livre}
                />
                {forma ? (
                  <div style={{ position: "absolute", left: l.dx - area.x, top: l.dy - area.y }}>
                    <Diagrama forma={forma} t={t} em={a.em} escala={l.escala} ativo={ativo || dito <= 0 ? 1 : 0} />
                  </div>
                ) : null}
              </>
            )}
          </div>
        );
      })}
    </>
  );
};
