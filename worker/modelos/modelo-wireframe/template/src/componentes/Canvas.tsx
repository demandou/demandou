import { mixCor, prog } from "../anim";
import { type Linha, problemasAbertos } from "../cena";
import type { Pagina } from "../plano";
import { CELULAR, cor, HUD_Y, mono, sans, W } from "../tema";
import { Check, Quadro } from "./Icones";

// O fundo do canvas de design: grafite com grade de pontos.
export const FundoCanvas: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: cor.canvas,
      backgroundImage: `radial-gradient(circle, ${cor.ponto} 2.4px, transparent 2.6px)`,
      backgroundSize: "36px 36px",
      backgroundPosition: "8px 14px",
    }}
  />
);

// A barra de cima do canvas: o nome da tela e o contador de problemas; e o rótulo do celular.
export const BarraDoCanvas: React.FC<{
  t: number;
  linha: Linha;
  pagina: Required<Pagina>;
  presenca: number;
  // quando o canvas mostra um frame dos blocos universais: o nome dele e o contador de camadas
  quadro?: { nome: string; camadas: number; total: number };
}> = ({ t, linha, pagina, presenca, quadro }) => {
  const entrada = prog(presenca, 0.2, 0.8);
  const abertos = problemasAbertos(t, linha);
  const vistos = linha.erros.filter((e) => t >= e.em).length;
  const consertados = vistos > 0 && abertos === 0 && linha.erros.every((e) => t >= e.resolvidoEm + 0.2);
  // o contador pulsa a cada mudança
  const mudancas = linha.erros.flatMap((e) => [e.em, e.resolvidoEm + 0.2]).filter((x) => x <= t);
  const ultima = mudancas.length ? Math.max(...mudancas) : -10;
  const pulso = 1 + 0.08 * (1 - prog(t, ultima, 0.35));
  const fimDoConserto = linha.erros.length ? Math.max(...linha.erros.map((e) => e.resolvidoEm)) + 0.2 : Infinity;
  const v2 = !quadro && consertados ? prog(t, fimDoConserto, 0.3) : 0;
  const fundo = consertados ? pagina.cor : vistos === 0 ? "#2E3035" : cor.vermelho;
  const texto = quadro
    ? `${quadro.camadas} de ${quadro.total} ${quadro.total === 1 ? "camada" : "camadas"}`
    : consertados ? "Tudo certo" : vistos === 0 ? "Revisão" : `${abertos} ${abertos === 1 ? "problema" : "problemas"}`;
  const fundoPilula = quadro ? (quadro.camadas > 0 ? cor.vermelho : "#2E3035") : fundo;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada, translate: `0 ${(1 - entrada) * -24}px` }}>
      <div style={{ position: "absolute", left: 44, top: HUD_Y, height: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <Quadro tamanho={34} cor={cor.hud} />
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 38, color: cor.hudForte, whiteSpace: "nowrap", maxWidth: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{quadro ? quadro.nome : pagina.nome}</div>
        {/* tudo consertado: a tela vira a versão 2 */}
        <div
          style={{
            fontFamily: mono,
            fontWeight: 700,
            fontSize: 30,
            color: pagina.tinta,
            background: pagina.cor,
            borderRadius: 8,
            padding: "2px 12px",
            opacity: v2,
            transform: `scale(${0.7 + 0.3 * v2})`,
          }}
        >
          v2
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 44,
          top: HUD_Y,
          height: 60,
          padding: "0 24px 0 14px",
          borderRadius: 30,
          background: fundoPilula,
          display: "flex",
          alignItems: "center",
          gap: 12,
          transform: `scale(${pulso})`,
          transformOrigin: "right center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: consertados ? pagina.tinta : "rgba(255,255,255,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {consertados ? <Check tamanho={22} cor={pagina.cor} espessura={4} /> : <div style={{ width: 12, height: 12, borderRadius: 6, background: vistos ? cor.vermelho : "#5A5D64" }} />}
        </div>
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 34, color: consertados ? pagina.tinta : mixCor("#FFFFFF", "#FFFFFF", 0), whiteSpace: "nowrap" }}>{texto}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: CELULAR.x + 4,
          top: CELULAR.y - 52,
          fontFamily: mono,
          fontWeight: 500,
          fontSize: 30,
          color: cor.hud,
          whiteSpace: "nowrap",
          width: W,
        }}
      >
        {quadro ? "Frame · 556 × 1198" : "Celular · 390 × 844"}
      </div>
    </div>
  );
};
