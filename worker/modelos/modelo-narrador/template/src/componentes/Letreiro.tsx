// O letreiro do Narrador: datas, lugares e capítulos, como num documentário.
// Um traço vermelhão se desenha e o `sub` entra em versalete ("EXPOSIÇÃO UNIVERSAL"); depois o
// `texto` sobe linha a linha de trás de uma máscara, em serifa grande ("Paris, 1889"), e um fio
// marfim corre embaixo dele. "alto": no terço de cima, sobre a imagem. "baixo": sobre a pessoa,
// entre o queixo e a legenda. Depois de entrar, o texto fica simples (sem máscara).
import { encaixar, larguraTexto } from "../medida";
import { cobreATela } from "../camera";
import type { Letreiro as TLetreiro, Plano } from "../plano";
import { COR, FONTE, MARGEM, SERIFA, SOMBRA_LEVE, SOMBRA_TEXTO, medidas, prog, suave } from "../tema";

export const Letreiro: React.FC<{ plano: Plano; m: TLetreiro; t: number }> = ({ plano, m, t }) => {
  if (t < m.de - 0.1 || t >= m.ate) return null;
  const sobreImagem = plano.momentos.some((x) => cobreATela(x) && m.de >= x.de - 0.2 && m.de < x.ate);
  const posicao = m.posicao ?? (sobreImagem ? "alto" : "baixo");
  const alto = posicao === "alto";
  const largura = 1080 - MARGEM * 2;
  const fit = encaixar(m.texto, { largura, max: alto ? 132 : 96, min: 56, linhas: 2, fonte: { serifa: true, peso: 600 } });
  const lh = Math.round(fit.tamanho * 1.08);
  const subTam = alto ? 30 : 27;
  const temSub = !!m.sub?.trim();
  const topo = alto ? 300 : medidas(plano).textoTopo;
  const ySub = topo;
  const yTexto = topo + (temSub ? subTam + 26 : 0);
  const subEm = m.subEm ?? m.de;
  const sai = prog(t, m.ate - 0.3, 0.3, suave);
  const larguraFio = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { serifa: true, peso: 600, exato: true })));

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai, transform: `translateY(${-sai * 10}px)` }}>
      {temSub ? (
        <div style={{ position: "absolute", left: MARGEM, top: ySub, height: subTam * 1.3, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 46 * prog(t, subEm - 0.1, 0.4), height: 3, background: COR.vermelhao, boxShadow: SOMBRA_LEVE }} />
          <div
            style={{
              fontFamily: FONTE,
              fontWeight: 700,
              fontSize: subTam,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: COR.marfim,
              opacity: prog(t, subEm, 0.4),
              transform: prog(t, subEm, 0.4) >= 1 ? undefined : `translateX(${(1 - prog(t, subEm, 0.4)) * -14}px)`,
              textShadow: SOMBRA_TEXTO,
            }}
          >
            {m.sub}
          </div>
        </div>
      ) : null}
      {fit.linhas.map((linha, i) => {
        const e = prog(t, m.em + i * 0.12, 0.55);
        if (e <= 0) return null;
        const pronta = e >= 1;
        const texto = (
          <div
            style={{
              fontFamily: SERIFA,
              fontWeight: 600,
              fontSize: fit.tamanho,
              lineHeight: `${lh}px`,
              height: lh,
              whiteSpace: "nowrap",
              color: COR.marfim,
              textShadow: SOMBRA_TEXTO,
              transform: pronta ? undefined : `translateY(${(1 - e) * lh * 0.9}px)`,
            }}
          >
            {linha}
          </div>
        );
        return (
          <div key={i} style={{ position: "absolute", left: MARGEM, top: yTexto + i * lh, width: largura + 40, height: lh + 24, overflow: pronta ? "visible" : "hidden" }}>
            {texto}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: MARGEM,
          top: yTexto + fit.linhas.length * lh + 14,
          width: larguraFio * prog(t, m.em + 0.2, 0.8),
          height: 2,
          background: COR.marfim,
          opacity: 0.8,
          boxShadow: SOMBRA_LEVE,
        }}
      />
    </div>
  );
};
