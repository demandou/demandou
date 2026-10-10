// Comparação: o visor mostra a cena já ajustada; o obturador dispara (piscar suave), a foto encolhe
// para o cartão DEPOIS e uma cópia voa para a galeria; a foto antiga entra como ANTES; na palavra
// "compara" a grade cobre as duas — o centro do ANTES é riscado e o ponto forte do DEPOIS acende.
import { Easing } from "remotion";
import { desliza, limitar, mistura, prog } from "../anim";
import { estadoAntes, estadoDepois, type Ret } from "../layout";
import type { Comparar as TipoComparar, Plano } from "../plano";
import { comAlfa, cor, mono, sans } from "../tema";
import { Cena } from "./Cena";
import { vidro } from "./Etiqueta";
import { Icone } from "./Icones";
import { LINHA_OBTURADOR } from "./Visor";

const mix = (a: Ret, b: Ret, p: number): Ret => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  w: mistura(a.w, b.w, p),
  h: mistura(a.h, b.h, p),
});

const Selo: React.FC<{ texto: string; destaque?: boolean; p: number; legenda?: string }> = ({ texto, destaque, p, legenda }) => (
  <>
  {legenda ? (
    <div style={{ position: "absolute", left: 18, bottom: 18, right: 18, padding: "10px 22px", fontFamily: sans, fontWeight: 600, fontSize: 40, lineHeight: 1.12, color: cor.branco, opacity: p, ...vidro, borderRadius: 22 }}>{legenda}</div>
  ) : null}
  <div
    style={{
      position: "absolute",
      left: 18,
      top: 18,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 18px",
      fontFamily: mono,
      fontWeight: 600,
      fontSize: 34,
      letterSpacing: "0.12em",
      color: destaque ? cor.acento : cor.branco,
      opacity: p,
      translate: `0 ${(1 - p) * -10}px`,
      ...vidro,
      borderRadius: 26,
    }}
  >
    {destaque ? <Icone nome="check" tamanho={34} cor={cor.acento} espessura={4} /> : null}
    {texto}
  </div>
  </>
);

export const Comparar: React.FC<{ m: TipoComparar; t: number; plano: Plano; r: Ret }> = ({ m, t, plano, r }) => {
  const d = m.disparoEm;
  const meio = 16;
  const slotA: Ret = { x: r.x, y: r.y, w: r.w, h: (r.h - meio) / 2 };
  const slotB: Ret = { x: r.x, y: r.y + (r.h + meio) / 2, w: r.w, h: (r.h - meio) / 2 };
  const encolhe = prog(t, d + 0.12, 0.5, desliza);
  const vivo = mix(r, slotB, encolhe);
  const rotuloDepois = prog(t, d + 0.45, 0.3);
  const antes = prog(t, m.antesEm - 0.05, 0.45);
  const grade = prog(t, m.compararEm - 0.1, 0.45, Easing.out(Easing.cubic));
  const resultado = prog(t, m.compararEm + 0.12, 0.3);
  // o visor ao vivo já tem a grade (ela foi ligada num ajuste antes); senão, entra junto com a do ANTES
  const gradeViva = plano.momentos.some((o) => o.tipo === "cena" && (o.acao === "tercos" || o.gradeEm !== undefined) && o.de < m.de) ? 1 : grade;
  const espera = prog(t, d + 0.5, 0.3) * (1 - antes);
  const voo = prog(t, d + 0.1, 0.45, Easing.inOut(Easing.quad));
  const eA = estadoAntes(plano);
  const eD = estadoDepois(plano);
  const lado = plano.momentos.find((o) => o.tipo === "cena" && o.acao === "tercos");
  // o centro riscado e o ponto forte só fazem sentido se o vídeo ensinou os terços
  const marcas = lado ? resultado : 0;
  const ladoTerco = lado && lado.tipo === "cena" ? lado.lado : undefined;
  const cartao: React.CSSProperties = { position: "absolute", borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.45)" };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* espaço do ANTES, a lápis, enquanto a foto antiga não entra */}
      {espera > 0 ? (
        <div
          style={{
            ...cartao,
            boxShadow: "none",
            left: slotA.x,
            top: slotA.y,
            width: slotA.w,
            height: slotA.h,
            border: `3px dashed ${cor.lapis}`,
            boxSizing: "border-box",
            opacity: espera,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Icone nome="foto" tamanho={84} cor={cor.lapis} espessura={2.6} />
          <div style={{ fontFamily: mono, fontWeight: 600, fontSize: 32, letterSpacing: "0.14em", color: cor.lapis }}>{m.antes ?? "ANTES"}</div>
        </div>
      ) : null}

      {/* ANTES: a foto antiga, com todos os defeitos */}
      {antes > 0 ? (
        <div
          style={{
            ...cartao,
            left: slotA.x,
            top: slotA.y + (1 - antes) * -40,
            width: slotA.w,
            height: slotA.h,
            opacity: antes,
            scale: String(0.94 + 0.06 * antes),
          }}
        >
          <Cena w={slotA.w} h={slotA.h} e={eA} t={t} camadas={{ grade, marca: marcas }} />
          <Selo texto={m.antes ?? "ANTES"} p={antes} legenda={m.antesTexto} />
        </div>
      ) : null}

      {/* o visor ao vivo, que vira o DEPOIS */}
      <div
        style={{
          ...cartao,
          left: vivo.x,
          top: vivo.y,
          width: vivo.w,
          height: vivo.h,
          outline: resultado > 0 ? `4px solid ${comAlfa(cor.acento, resultado)}` : undefined,
          outlineOffset: -4,
        }}
      >
        <Cena w={vivo.w} h={vivo.h} e={eD} t={t} camadas={{ grade: gradeViva, ponto: marcas, lado: ladoTerco }} />
        <Selo texto={m.depois ?? "DEPOIS"} destaque={resultado > 0.5} p={rotuloDepois} legenda={m.depoisTexto ? m.depoisTexto : undefined} />
      </div>

      {/* uma cópia pequena da foto voa para a galeria */}
      {voo > 0 && voo < 1
        ? (() => {
            const w0 = vivo.w * 0.42;
            const h0 = vivo.h * 0.42;
            const w = mistura(w0, 92, voo);
            const h = mistura(h0, 92, voo);
            const cx = mistura(vivo.x + vivo.w / 2, 150, voo);
            const cy = mistura(vivo.y + vivo.h / 2, LINHA_OBTURADOR, voo);
            return (
              <div style={{ ...cartao, left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: mistura(20, 18, voo), opacity: limitar(1.5 - voo), border: `3px solid ${cor.branco}`, boxSizing: "border-box" }}>
                <Cena w={w} h={h} e={eD} t={t} />
              </div>
            );
          })()
        : null}
    </div>
  );
};
