// Ícones a traço, todos numa caixa de 100 × 100. Os do checklist têm movimento próprio
// (o cronômetro completa, a escova desliza, o fio desce); os da chamada final se desenham.
import { limitar, prog, Traco } from "../anim";
import type { IconeItem } from "../plano";
import { cor } from "../tema";

export const IconeDoItem: React.FC<{ icone: IconeItem; t: number; em: number; tamanho: number }> = ({ icone, t, em, tamanho }) => {
  const p = prog(t, em, 0.7);
  const vivo = Math.max(0, t - em);
  let conteudo: React.ReactNode = null;
  switch (icone) {
    case "cronometro": {
      const volta = prog(t, em + 0.15, 1.0);
      const a = volta * Math.PI * 2 - Math.PI / 2;
      conteudo = (
        <>
          <circle cx={50} cy={54} r={32} fill="none" stroke={cor.cinzaClaro} strokeWidth={7} />
          <Traco d="M 50 22 A 32 32 0 1 1 49.99 22" p={volta} cor={cor.azul} largura={7} />
          <Traco d="M 50 54 L 50 36" p={p} cor={cor.tinta} largura={4} />
          <line x1={50} y1={54} x2={50 + Math.cos(a) * 20} y2={54 + Math.sin(a) * 20} stroke={cor.azul} strokeWidth={4} strokeLinecap="round" opacity={p} />
          <Traco d="M 42 10 L 58 10 M 50 10 L 50 18" p={p} cor={cor.tinta} largura={4} />
        </>
      );
      break;
    }
    case "escova": {
      // movimento leve: vai e volta devagar, sem apertar
      const vai = 7 * Math.sin(vivo * Math.PI * 2 * 1.1) * p;
      conteudo = (
        <>
          <Traco d="M 22 92 C 20 78 22 68 30 64 L 70 64 C 78 68 80 78 78 92" p={p} cor={cor.azul} largura={4} />
          <g transform={`translate(${vai} 0)`} opacity={p}>
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <line key={k} x1={24 + k * 8} y1={46} x2={24 + k * 8} y2={60} stroke={cor.cinza} strokeWidth={3.2} strokeLinecap="round" />
            ))}
            <rect x={18} y={34} width={52} height={13} rx={6} fill={cor.branco} stroke={cor.azul} strokeWidth={4} />
            <path d="M 70 40 L 96 36" stroke={cor.azul} strokeWidth={6} strokeLinecap="round" />
          </g>
        </>
      );
      break;
    }
    case "fio": {
      const desce = prog(t, em + 0.2, 0.7);
      const serra = 2.5 * Math.sin(vivo * Math.PI * 2 * 1.6) * desce;
      const ponta = 14 + 62 * desce;
      conteudo = (
        <>
          <Traco d="M 8 30 C 8 22 12 18 20 18 L 40 18 C 47 18 49 22 48 30 C 47 52 44 74 42 94" p={p} cor={cor.azul} largura={4} />
          <Traco d="M 92 30 C 92 22 88 18 80 18 L 60 18 C 53 18 51 22 52 30 C 53 52 56 74 58 94" p={p} cor={cor.azul} largura={4} />
          <g transform={`translate(${serra} 0)`} opacity={desce}>
            <path d={`M 26 4 Q 46 10 50 ${ponta}`} fill="none" stroke={cor.tinta} strokeWidth={3} strokeLinecap="round" />
            <path d={`M 74 4 Q 54 10 50 ${ponta}`} fill="none" stroke={cor.tinta} strokeWidth={3} strokeLinecap="round" />
          </g>
        </>
      );
      break;
    }
    case "agua": {
      const nivel = prog(t, em + 0.2, 0.9);
      const y = 88 - 50 * nivel;
      conteudo = (
        <>
          <clipPath id={`copo-${Math.round(em * 100)}`}>
            <path d="M 26 20 L 74 20 L 68 90 L 32 90 Z" />
          </clipPath>
          <rect x={20} y={y} width={60} height={80} fill={cor.azulClaro} clipPath={`url(#copo-${Math.round(em * 100)})`} />
          <Traco d="M 26 20 L 32 90 L 68 90 L 74 20" p={p} cor={cor.azul} largura={4.5} />
        </>
      );
      break;
    }
    case "sono":
      conteudo = <Traco d="M 64 16 A 36 36 0 1 0 86 64 A 28 28 0 1 1 64 16 Z" p={p} cor={cor.azul} largura={4.5} />;
      break;
    case "check":
      conteudo = <Traco d="M 22 52 L 42 72 L 80 30" p={p} cor={cor.azul} largura={7} />;
      break;
  }
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
      {conteudo}
    </svg>
  );
};

export type IconeBotao = "salvar" | "enviar" | "seguir" | "comentar" | "link";

const TRACOS: Record<IconeBotao, string> = {
  salvar: "M 30 18 L 70 18 C 73 18 74 19 74 22 L 74 84 L 50 66 L 26 84 L 26 22 C 26 19 27 18 30 18 Z",
  enviar: "M 86 16 L 14 46 L 42 56 L 52 86 Z M 86 16 L 42 56",
  seguir: "M 40 50 A 15 15 0 1 0 39.99 50 M 14 86 C 14 70 26 62 40 62 C 54 62 66 70 66 86 M 78 34 L 78 58 M 66 46 L 90 46",
  comentar: "M 50 18 C 72 18 86 30 86 48 C 86 66 72 76 50 76 C 45 76 40 75 36 74 L 18 84 L 22 68 C 16 62 14 56 14 48 C 14 30 28 18 50 18 Z",
  link: "M 44 58 C 38 52 38 44 44 38 L 56 26 C 62 20 72 20 78 26 C 84 32 84 42 78 48 L 72 54 M 56 42 C 62 48 62 56 56 62 L 44 74 C 38 80 28 80 22 74 C 16 68 16 58 22 52 L 28 46",
};

export const IconeDoBotao: React.FC<{ icone: IconeBotao; p: number; tamanho: number; corTraco: string }> = ({ icone, p, tamanho, corTraco }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <Traco d={TRACOS[icone]} p={limitar(p)} cor={corTraco} largura={6} />
  </svg>
);
