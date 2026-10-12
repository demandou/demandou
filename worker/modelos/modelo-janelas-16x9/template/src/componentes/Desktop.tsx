// O desktop fictício: papel de parede calmo, barra de menu em cima e dock embaixo.
// Sem logotipo de sistema nenhum: ícones a traço genéricos, um "◐" neutro no canto.
import { prog } from "../anim";
import { ICONES_DOCK, posDock } from "../geometria";
import { BARRA_TOPO, cor, DOCK, H, mono, sans, sombraLeve, W } from "../tema";
import { Icone } from "./Icones";

// Papel de parede: dunas largas em três tons do mesmo lilás-acinzentado, que derivam devagar.
export const PapelDeParede: React.FC<{ t: number }> = ({ t }) => {
  const d = Math.sin(t * 0.18) * 18;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <rect width={W} height={H} fill={cor.parede} />
      {/* as mesmas dunas do vertical, esticadas para o quadro deitado */}
      <path
        d={`M-80 ${394 + d} C 533 ${302 + d}, 1155 ${534 - d}, ${W + 80} ${366 + d} L${W + 80} -40 L-80 -40 Z`}
        fill={cor.paredeClara}
      />
      <path
        d={`M-80 ${886 - d} C 578 ${787 + d}, 1422 ${1026 - d}, ${W + 80} ${830 + d} L${W + 80} ${H + 40} L-80 ${H + 40} Z`}
        fill={cor.paredeFunda}
      />
      <path
        d={`M-80 ${1097 + d * 0.6} C 667 ${1040 - d}, 1555 ${1195 + d}, ${W + 80} ${1069 - d * 0.6} L${W + 80} ${H + 40} L-80 ${H + 40} Z`}
        fill={cor.paredeMaisFunda}
      />
    </svg>
  );
};

const relogio = (t: number) => {
  // o relógio anda um minuto no meio do vídeo: detalhe vivo, sem chamar atenção
  const min = 24 + Math.floor(t / 12);
  return `10:${String(min).padStart(2, "0")}`;
};

export const BarraDeMenu: React.FC<{ t: number; app: string }> = ({ t, app }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: W,
      height: BARRA_TOPO,
      background: "rgba(250,249,253,0.9)",
      borderBottom: `1.5px solid ${cor.linha}`,
      display: "flex",
      alignItems: "center",
      padding: "0 34px",
      gap: 30,
      fontFamily: sans,
      fontSize: 30,
      color: cor.tinta,
    }}
  >
    <svg width={34} height={34} viewBox="0 0 34 34">
      <circle cx={17} cy={17} r={13} fill="none" stroke={cor.tinta} strokeWidth={3} />
      <path d="M17 4a13 13 0 0 1 0 26Z" fill={cor.tinta} />
    </svg>
    <div style={{ fontWeight: 800 }}>{app}</div>
    <div style={{ opacity: 0.7 }}>Arquivo</div>
    <div style={{ opacity: 0.7 }}>Editar</div>
    <div style={{ opacity: 0.7 }}>Ver</div>
    <div style={{ flex: 1 }} />
    <Icone nome="wifi" tamanho={32} cor={cor.tinta} peso={3.4} />
    <Icone nome="bateria" tamanho={34} cor={cor.tinta} peso={3} />
    <div style={{ fontFamily: mono, fontWeight: 600, fontSize: 30 }}>{relogio(t)}</div>
  </div>
);

// Dock: ícones em ladrilhos brancos; o app aberto ganha um ponto embaixo e o glifo em violeta.
export const Dock: React.FC<{
  t: number;
  // para cada ícone, os intervalos em que o app está aberto
  abertos: Record<string, { de: number; ate: number }[]>;
}> = ({ t, abertos }) => {
  const n = ICONES_DOCK.length;
  const largura = n * DOCK.icone + (n - 1) * DOCK.vao + 48;
  return (
    <div
      style={{
        position: "absolute",
        left: W / 2 - largura / 2,
        top: DOCK.y,
        width: largura,
        height: DOCK.h,
        borderRadius: 30,
        background: "rgba(250,249,253,0.92)",
        boxShadow: sombraLeve,
        outline: `1.5px solid ${cor.linha}`,
      }}
    >
      {ICONES_DOCK.map((nome, i) => {
        const p = posDock(i);
        const faixas = abertos[nome] ?? [];
        const ativo = faixas.some((f) => t >= f.de && t <= f.ate);
        const ultimaAbertura = Math.max(-10, ...faixas.filter((f) => f.de <= t).map((f) => f.de));
        // ao abrir, o ícone sobe e assenta (uma vez, sem quicar)
        const sobe = prog(t, ultimaAbertura - 0.05, 0.18) - prog(t, ultimaAbertura + 0.2, 0.3);
        return (
          <div key={nome}>
            <div
              style={{
                position: "absolute",
                left: p.x - (W / 2 - largura / 2) - DOCK.icone / 2,
                top: (DOCK.h - DOCK.icone) / 2 - 4 - sobe * 14,
                width: DOCK.icone,
                height: DOCK.icone,
                borderRadius: 18,
                background: ativo ? cor.violetaFundo : cor.janela,
                outline: `1.5px solid ${cor.linha}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icone nome={nome} tamanho={42} cor={ativo ? cor.violeta : cor.tinta} peso={3.6} />
            </div>
            <div
              style={{
                position: "absolute",
                left: p.x - (W / 2 - largura / 2) - 4,
                top: DOCK.h - 12,
                width: 8,
                height: 8,
                borderRadius: 4,
                background: ativo ? cor.violeta : "transparent",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
