import { limitar, mistura, pousa, prog } from "../anim";
import { cor, PILHA } from "../tema";
import { Folha } from "./Papel";

const PAPEIS = [cor.papel, cor.papelQuente, cor.papelFrio];
// pose de cada cartão na pilha arrumada e na pilha aberta em leque (fechamento)
const NA_PILHA = [
  { r: -1.6, dx: 0, dy: 6 },
  { r: 1.4, dx: 12, dy: -4 },
  { r: -0.8, dx: -10, dy: 2 },
  { r: 1.9, dx: 8, dy: -6 },
  { r: -1.2, dx: -6, dy: 0 },
  { r: 0.9, dx: 6, dy: 4 },
  { r: -1.9, dx: -8, dy: -2 },
  { r: 1.1, dx: 10, dy: 2 },
];
// no leque, os cartões sobem para trás do convite e só as bordas aparecem dos lados
const EM_LEQUE = [
  { r: -10, dx: -96, dy: -620 },
  { r: 8, dx: 100, dy: -470 },
  { r: -7, dx: -104, dy: -300 },
  { r: 10, dx: 92, dy: -150 },
  { r: -5, dx: -70, dy: -40 },
  { r: 6, dx: 80, dy: -360 },
  { r: -8, dx: -110, dy: -520 },
  { r: 9, dx: 104, dy: -230 },
];

export const DURACAO_QUEDA = 0.62;

// A pilha: cada bloco da mesa (um marco, os passos, a lista, a comparação, o gráfico) vira um cartão
// que cai (vindo de um lado, girado e um pouco maior, como jogado sobre a mesa) e assenta por cima
// dos anteriores. No fechamento a pilha se abre em leque por trás do convite.
export const Pilha: React.FC<{
  cartas: { chave: string }[];
  quedas: number[];
  t: number;
  // o miolo de cada cartão (`pousou` = quando ele assentou)
  conteudo: (i: number, pousou: number) => React.ReactNode;
  leque: number;
  visivel: number;
  // 0–1: o lugar da pilha riscado a lápis, antes do primeiro cartão cair
  rascunho?: number;
}> = ({ cartas, quedas, t, conteudo, leque, visivel, rascunho = 0 }) => {
  if (visivel <= 0.001) return null;
  const cx = PILHA.cx;
  const cy = PILHA.y + PILHA.h / 2;
  // quantos cartões já caíram (o próximo a cair empurra levemente os de baixo)
  const pose0 = NA_PILHA[0];
  return (
    <>
      {rascunho > 0.001 ? (
        <svg
          width={PILHA.w + 20}
          height={PILHA.h + 20}
          viewBox={`-10 -10 ${PILHA.w + 20} ${PILHA.h + 20}`}
          style={{ position: "absolute", left: cx + pose0.dx - PILHA.w / 2 - 10, top: cy + pose0.dy - PILHA.h / 2 - 10, rotate: `${pose0.r}deg`, opacity: rascunho, overflow: "visible" }}
        >
          <rect x={0} y={0} width={PILHA.w} height={PILHA.h} rx={4} fill="rgba(251,248,243,0.26)" stroke={cor.linhoLapis} strokeWidth={2.6} strokeDasharray="12 10" />
          <rect x={22} y={22} width={PILHA.w - 44} height={PILHA.h - 44} rx={2} fill="none" stroke={cor.linhoLapis} strokeOpacity={0.55} strokeWidth={1.4} strokeDasharray="4 8" />
          <path d={`M${PILHA.w / 2 - 170} 150 H${PILHA.w / 2 - 16} M${PILHA.w / 2 + 16} 150 H${PILHA.w / 2 + 170}`} stroke={cor.linhoLapis} strokeOpacity={0.7} strokeWidth={1.6} strokeDasharray="3 7" />
          <path d={`M${PILHA.w / 2} 142 L${PILHA.w / 2 + 8} 150 L${PILHA.w / 2} 158 L${PILHA.w / 2 - 8} 150 Z`} fill={cor.linhoLapis} opacity={0.7} />
        </svg>
      ) : null}
      {cartas.map((carta, i) => {
        const q = quedas[i];
        if (t < q) return null;
        const p = prog(t, q, DURACAO_QUEDA, pousa);
        const lado = i % 2 === 0 ? 1 : -1;
        const pose = NA_PILHA[i % NA_PILHA.length];
        const aberta = EM_LEQUE[i % EM_LEQUE.length];
        // assentar: os de baixo descem 4 px quando um cartão novo pousa por cima
        const peso = cartas.reduce((s, _, j) => (j > i && t >= quedas[j] ? s + 4 * prog(t, quedas[j] + DURACAO_QUEDA * 0.55, 0.3) : s), 0);
        const x = mistura(cx + lado * 760, cx + pose.dx, p);
        const y = mistura(cy - 70, cy + pose.dy + peso, p);
        const rot = mistura(lado * 15, pose.r, p);
        const escala = mistura(1.1, 1, p);
        const xl = mistura(x, cx + aberta.dx, leque);
        const yl = mistura(y, cy + aberta.dy, leque);
        const rl = mistura(rot, aberta.r, leque);
        const sombraY = mistura(46, 12, p);
        const sombraB = mistura(70, 24, p);
        return (
          <div
            key={carta.chave}
            style={{
              position: "absolute",
              left: xl - PILHA.w / 2,
              top: yl - PILHA.h / 2,
              width: PILHA.w,
              height: PILHA.h,
              rotate: `${rl}deg`,
              scale: String(escala),
              opacity: limitar(p * 6),
            }}
          >
            <Folha
              x={0}
              y={0}
              w={PILHA.w}
              h={PILHA.h}
              fundo={PAPEIS[i % PAPEIS.length]}
              filete={18}
              sombra={`0 ${sombraY}px ${sombraB}px rgba(40,56,76,${mistura(0.2, 0.26, p)}), 0 2px 6px rgba(40,56,76,0.16)`}
            >
              {conteudo(i, q + DURACAO_QUEDA * 0.6)}
            </Folha>
          </div>
        );
      })}
    </>
  );
};
