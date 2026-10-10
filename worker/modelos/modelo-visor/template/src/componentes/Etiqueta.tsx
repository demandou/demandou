// Rótulo de vidro fumê de cada ajuste: "AJUSTE 01" (acende quando o número é dito), o título e uma
// segunda linha. O texto inteiro já espera "a lápis" e cada palavra ganha corpo quando é dita.
import { Palavras, prog, saindo, temposDoTexto } from "../anim";
import type { NomeIcone, Palavra } from "../plano";
import { cor, mono, sans } from "../tema";
import { Icone } from "./Icones";

export const vidro: React.CSSProperties = {
  background: cor.vidro,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderRadius: 22,
  border: "1.5px solid rgba(243,244,241,0.14)",
};

export const Etiqueta: React.FC<{
  t: number;
  de: number;
  ate: number;
  palavras: Palavra[];
  rotulo?: string;
  rotuloEm?: number;
  titulo?: string;
  detalhe?: string;
  // posição: canto de cima à esquerda (topo) ou canto de baixo à esquerda (base)
  x: number;
  y: number;
  ancora: "topo" | "base";
  larguraMax?: number;
  tamanhoTitulo?: number;
  // a segunda linha rola para esta nota quando ela é dita (o cartão não muda de tamanho)
  troca?: { texto: string; em: number; icone?: NomeIcone };
  // painel de tamanho fixo (lugar "topo"): ocupa a caixa inteira e mostra o ícone da ação embaixo
  painel?: { w: number; h: number; icone: IconeDaAcao; acaoEm: number; acaoAte: number };
}> = ({ t, de, ate, palavras, rotulo, rotuloEm, titulo, detalhe, x, y, ancora, larguraMax = 900, tamanhoTitulo = 72, troca, painel }) => {
  const entra = prog(t, de, 0.4);
  const sai = saindo(t, ate, 0.3);
  const temposTitulo = titulo ? temposDoTexto(titulo, palavras, de, ate) : [];
  const fimTitulo = temposTitulo[temposTitulo.length - 1] ?? de;
  const temposDetalhe = detalhe ? temposDoTexto(detalhe, palavras, fimTitulo, ate, fimTitulo + 0.2) : [];
  const acende = prog(t, rotuloEm ?? de, 0.3);
  const rola = troca ? prog(t, troca.em - 0.12, 0.35) : 0;
  const temposTroca = troca ? temposDoTexto(troca.texto, palavras, troca.em - 0.2, ate, troca.em) : [];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        ...(ancora === "topo" ? { top: y } : { bottom: 1920 - y }),
        maxWidth: painel ? undefined : larguraMax,
        width: painel?.w,
        height: painel?.h,
        boxSizing: "border-box",
        padding: painel ? "26px 30px" : "18px 28px 20px",
        opacity: entra * (1 - sai),
        translate: `0 ${(1 - entra) * (ancora === "topo" ? -24 : 24) - sai * 12}px`,
        ...vidro,
      }}
    >
      {rotulo ? (
        <div
          style={{
            fontFamily: mono,
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: "0.14em",
            color: acende > 0.5 ? cor.acento : cor.apagado,
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 6,
          }}
        >
          <span style={{ width: 12, height: 12, borderRadius: 6, background: cor.acento, opacity: acende, scale: String(0.4 + 0.6 * acende) }} />
          {rotulo}
        </div>
      ) : null}
      {titulo ? (
        <Palavras
          texto={titulo}
          tempos={temposTitulo}
          t={t}
          esboco={cor.lapis}
          style={{ fontFamily: sans, fontWeight: 700, fontSize: tamanhoTitulo, lineHeight: 1.08, color: cor.branco, letterSpacing: "-0.01em" }}
        />
      ) : null}
      {detalhe || troca ? (
        <div style={{ display: "grid", overflow: "hidden", marginTop: 6, paddingBottom: 4 }}>
          {detalhe ? (
            <div style={{ gridArea: "1 / 1", translate: `0 ${-rola * 110}%`, opacity: 1 - rola }}>
              <Palavras
                texto={detalhe}
                tempos={temposDetalhe}
                t={t}
                esboco={cor.lapis}
                style={{ fontFamily: sans, fontWeight: 500, fontSize: 44, lineHeight: 1.2, color: "rgba(243,244,241,0.88)" }}
              />
            </div>
          ) : null}
          {troca ? (
            <div style={{ gridArea: "1 / 1", translate: `0 ${(1 - rola) * 110}%`, opacity: rola, display: "flex", alignItems: "flex-start", gap: 14 }}>
              {troca.icone ? <Icone nome={troca.icone} tamanho={48} cor={cor.acento} p={prog(t, troca.em - 0.05, 0.7)} espessura={3.4} style={{ flexShrink: 0, marginTop: 2 }} /> : null}
              <Palavras
                texto={troca.texto}
                tempos={temposTroca}
                t={t}
                style={{ fontFamily: sans, fontWeight: 600, fontSize: 44, lineHeight: 1.2, color: cor.branco, ...(painel ? {} : { whiteSpace: "nowrap", flexWrap: "nowrap" }) }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {painel ? (
        <div style={{ position: "absolute", right: 30, bottom: 28, width: 128, height: 128 }}>
          <Icone nome={painel.icone} tamanho={128} cor={cor.lapis} espessura={2.6} style={{ position: "absolute", left: 0, top: 0 }} />
          <Icone
            nome={painel.icone}
            tamanho={128}
            cor={cor.acento}
            p={prog(t, painel.acaoEm, Math.max(0.4, painel.acaoAte - painel.acaoEm))}
            espessura={2.8}
            style={{ position: "absolute", left: 0, top: 0 }}
          />
        </div>
      ) : null}
    </div>
  );
};

export type IconeDaAcao = "camiseta" | "grade" | "alvo" | "sol" | "nivel";

// Selo com ícone que se desenha quando a frase é dita
export const Nota: React.FC<{
  t: number;
  em: number;
  ate: number;
  palavras: Palavra[];
  texto: string;
  icone?: NomeIcone;
  x: number;
  y: number;
  // o selo se alinha pela direita (x = borda direita) ou pelo centro (x = centro)
  alinhar?: "direita" | "centro" | "esquerda";
}> = ({ t, em, ate, palavras, texto, icone, x, y, alinhar = "direita" }) => {
  const entra = prog(t, em - 0.1, 0.35);
  const sai = saindo(t, ate, 0.3);
  if (entra <= 0 || sai >= 1) return null;
  const tempos = temposDoTexto(texto, palavras, em - 0.2, ate, em);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        ...(alinhar === "direita" ? { right: 1080 - x } : alinhar === "esquerda" ? { left: x } : { left: x, translate: "-50% 0" }),
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 26px 14px 20px",
        opacity: entra * (1 - sai),
        scale: String(0.94 + 0.06 * entra),
        ...vidro,
        borderRadius: 40,
      }}
    >
      {icone ? <Icone nome={icone} tamanho={46} cor={cor.acento} p={prog(t, em - 0.05, 0.7)} espessura={3.2} /> : null}
      <Palavras texto={texto} tempos={tempos} t={t} style={{ fontFamily: sans, fontWeight: 600, fontSize: 40, color: cor.branco, whiteSpace: "nowrap", flexWrap: "nowrap" }} />
    </div>
  );
};
