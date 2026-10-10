// Abertura: a barra de busca do sistema sobre a pessoa em tela cheia. O título é digitado
// palavra por palavra no ritmo da fala; no Enter, a linha de resultado aparece e a barra fecha
// enquanto a janela da chamada sai da tela cheia.
import { digitado, mistura, prog, saindo, temposDoTexto } from "../anim";
import { CARTAO_ABERTURA, FUNDO_PEITO, topoDoPeito } from "../geometria";
import { corpoQueCabe, encaixar, trechoNoTexto } from "../medida";
import type { Abertura as TipoAbertura, Palavra, Plano } from "../plano";
import { cor, mono, sans, sombraJanela } from "../tema";
import { Icone } from "./Icones";

export const Abertura: React.FC<{ m: TipoAbertura; plano: Plano; palavras: Palavra[]; t: number }> = ({ m, plano, palavras, t }) => {
  const titulo = (m.texto ?? m.titulo ?? "").trim();
  const inicio = m.em ?? m.de + 0.2;
  const tempos = temposDoTexto(titulo, palavras, Math.min(m.de, inicio - 0.3), m.ate, inicio);
  const enter = m.enterEm ?? (tempos[tempos.length - 1] ?? m.ate - 0.6) + 0.35;
  const palavrasTitulo = titulo.split(/\s+/).filter(Boolean);
  const tecladas = digitado(titulo, tempos, t, 0.02);
  const destaque = trechoNoTexto(titulo, m.destaque);
  // última palavra já começada: o cursor de texto fica depois dela
  const ultimaComecada = tecladas.reduce((acc, w, i) => (w ? i : acc), -1);
  const piscando = t < enter ? Math.floor(t * 2.4) % 2 === 0 || t - (tempos[ultimaComecada] ?? 0) < 0.4 : false;

  const entra = prog(t, m.de - 0.05, 0.4);
  // sai antes de a pessoa encolher (nada fica por cima do que aparece atrás dela)
  const sai = saindo(t, m.ate + 0.08, 0.2);
  if (sai >= 0.999) return null;
  const pEnter = prog(t, enter - 0.03, 0.08) * (1 - prog(t, enter + 0.14, 0.12));
  const pResultado = prog(t, enter + 0.05, 0.32);
  // o texto cabe sempre: mede e reduz até caber no peito (até 3 linhas)
  const topo = topoDoPeito(plano);
  const livre = FUNDO_PEITO - topo - 78 - 138;
  const largura = CARTAO_ABERTURA.w - 40 - 44 - 56 - 26 - 8;
  // (a busca prefere o corpo grande, mesmo que quebre em mais linhas)
  let enc = encaixar(titulo, { largura, max: titulo.length > 44 ? 66 : 74, min: 50, linhas: 3, menosLinhas: false });
  for (let max = enc.tamanho - 4; enc.linhas.length * enc.tamanho * 1.12 > livre && max >= 44; max -= 4) enc = encaixar(titulo, { largura, max, min: 44, linhas: 3, menosLinhas: false });
  const tamanho = enc.tamanho;

  return (
    <div
      style={{
        position: "absolute",
        left: CARTAO_ABERTURA.x,
        top: topo,
        width: CARTAO_ABERTURA.w,
        borderRadius: 38,
        background: "rgba(255,255,255,0.97)",
        boxShadow: sombraJanela,
        outline: `1.5px solid ${cor.linha}`,
        overflow: "hidden",
        opacity: Math.min(Math.min(1, entra * 2.4), 1 - sai),
        scale: String(mistura(0.94, 1, entra) * mistura(1, 0.95, sai)),
        translate: `0 ${(1 - entra) * 30}px`,
      }}
    >
      {/* campo de busca */}
      <div style={{ display: "flex", gap: 26, padding: "40px 44px 38px 40px", alignItems: "flex-start" }}>
        <div style={{ paddingTop: tamanho * 0.18 }}>
          <Icone nome="busca" tamanho={56} cor={cor.violeta} peso={4.2} />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexWrap: "wrap",
            fontFamily: sans,
            fontWeight: 800,
            fontSize: tamanho,
            lineHeight: 1.12,
            letterSpacing: "-0.01em",
            color: cor.tinta,
            minHeight: tamanho * 1.12,
            flexDirection: ultimaComecada >= 0 ? "column" : "row",
          }}
        >
          {/* antes da primeira palavra: o texto de exemplo do campo, apagado */}
          {ultimaComecada < 0 ? <span style={{ color: cor.esboco, fontWeight: 600 }}>Buscar…</span> : null}
          {ultimaComecada < 0 && piscando ? (
            <span style={{ display: "inline-block", width: 6, height: tamanho * 0.86, background: cor.violeta, marginLeft: -2, borderRadius: 3, order: -1 }} />
          ) : null}
          {ultimaComecada >= 0
            ? enc.linhas.map((linha, k) => (
                <div key={k} style={{ display: "flex", width: "100%", whiteSpace: "nowrap" }}>
                  {linha.map((i) => {
                    const parte = tecladas[i];
                    if (!parte) return null;
                    const w = palavrasTitulo[i];
                    return (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", marginRight: "0.25em", color: destaque && i >= destaque[0] && i <= destaque[1] ? cor.violeta : undefined }}>
                        {parte.length >= w.length ? w : parte}
                        {i === ultimaComecada && piscando ? (
                          <span style={{ display: "inline-block", width: 6, height: tamanho * 0.86, background: cor.violeta, marginLeft: 6, borderRadius: 3 }} />
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              ))
            : null}
        </div>
      </div>

      {/* resultado: esboço até o Enter, depois a linha de verdade */}
      <div style={{ borderTop: `1.5px solid ${cor.linha}`, padding: "22px 30px 26px", position: "relative", height: 138 }}>
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 22,
            height: 92,
            borderRadius: 24,
            border: `3px dashed ${cor.esbocoClaro}`,
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "0 22px",
            opacity: 1 - pResultado,
          }}
        >
          <div style={{ width: 60, height: 60, borderRadius: 16, background: cor.esbocoClaro }} />
          <div style={{ width: 380, height: 26, borderRadius: 13, background: cor.esbocoClaro }} />
          <div style={{ flex: 1 }} />
          <div style={{ width: 120, height: 56, borderRadius: 14, border: `3px dashed ${cor.esboco}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icone nome="enter" tamanho={34} cor={cor.esboco} peso={3.6} />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 22,
            height: 92,
            borderRadius: 24,
            background: cor.violetaFundo,
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "0 22px",
            opacity: pResultado,
            translate: `0 ${(1 - pResultado) * 16}px`,
          }}
        >
          <div style={{ width: 60, height: 60, borderRadius: 16, background: cor.violeta, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icone nome={m.icone ?? "globo"} tamanho={42} cor="#FFFFFF" peso={3.4} />
          </div>
          <div style={{ fontFamily: sans, fontWeight: 800, fontSize: corpoQueCabe(m.resultado ?? "Abrir", 600, 48, 34), color: cor.tinta, flex: 1, whiteSpace: "nowrap" }}>{m.resultado ?? "Abrir"}</div>
          {m.contagem ? (
            <div style={{ fontFamily: mono, fontWeight: 800, fontSize: 46, color: cor.violeta, marginRight: 8 }}>{m.contagem}</div>
          ) : null}
        </div>
        {/* tecla Enter do campo: afunda no Enter */}
        <div
          style={{
            position: "absolute",
            right: 52,
            top: 40 + pEnter * 4,
            width: 120,
            height: 56,
            borderRadius: 14,
            background: pEnter > 0.5 ? cor.violeta : cor.tecla,
            boxShadow: `0 ${mistura(6, 2, pEnter)}px 0 ${pEnter > 0.5 ? cor.teclaApertadaLado : cor.teclaLado}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: prog(t, enter - 0.5, 0.2) * (1 - prog(t, enter + 0.22, 0.16)),
          }}
        >
          <Icone nome="enter" tamanho={34} cor="#FFFFFF" peso={3.8} />
        </div>
      </div>
    </div>
  );
};
