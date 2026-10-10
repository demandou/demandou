// Ícones a traço (caixa 100 × 100), desenhados com a progressão p (0 → 1)
import { Traco } from "../anim";
import type { Icone as TIcone } from "../plano";

export type NomeIcone = TIcone | "salvar" | "seguir" | "comentar" | "link";

const TRACOS: Record<NomeIcone, string[]> = {
  cima: ["M50,82 L50,20", "M28,42 L50,20 L72,42"],
  baixo: ["M50,18 L50,80", "M28,58 L50,80 L72,58"],
  seta: ["M14,50 L84,50", "M62,28 L84,50 L62,72"],
  x: ["M27,27 L73,73", "M73,27 L27,73"],
  alerta: ["M50,13 L90,83 L10,83 Z", "M50,38 L50,58", "M50,70 L50,71"],
  olho: ["M8,50 Q50,12 92,50 Q50,88 8,50 Z", "M50,37 A13,13 0 1 1 49.9,37"],
  ideia: ["M50,10 A27,27 0 0 1 67,58 L63,70 L37,70 L33,58 A27,27 0 0 1 50,10 Z", "M39,80 L61,80", "M43,90 L57,90"],
  dinheiro: ["M50,10 A40,40 0 1 1 49.9,10", "M61,35 C57,28 39,28 39,39 C39,50 61,47 61,59 C61,70 42,71 37,63", "M50,21 L50,79"],
  diagonal: ["M24,78 L76,26", "M44,24 L76,24 L76,56"],
  brilho: ["M50,12 Q54,46 88,50 Q54,54 50,88 Q46,54 12,50 Q46,46 50,12 Z", "M80,14 L80,30", "M72,22 L88,22"],
  check: ["M20,52 L42,74 L82,28"],
  gota: ["M50,12 C66,36 78,50 78,64 A28,28 0 0 1 22,64 C22,50 34,36 50,12 Z"],
  pincel: ["M70,14 L86,30 L50,66 L34,50 Z", "M34,50 C22,52 16,64 14,86 C36,84 48,78 50,66"],
  relogio: ["M50,12 A38,38 0 1 1 49.9,12", "M50,28 L50,52 L66,62"],
  lua: ["M60,14 A37,37 0 1 0 86,58 A29,29 0 0 1 60,14 Z"],
  coracao: ["M50,84 C18,62 10,44 18,30 C26,16 44,16 50,32 C56,16 74,16 82,30 C90,44 82,62 50,84 Z"],
  estrela: ["M50,12 L61,38 L88,40 L67,58 L74,86 L50,70 L26,86 L33,58 L12,40 L39,38 Z"],
  salvar: ["M26,12 L74,12 L74,88 L50,70 L26,88 Z"],
  seguir: ["M42,48 A18,18 0 1 0 41.9,48", "M12,88 C12,68 26,58 42,58 C58,58 72,68 72,88", "M80,30 L80,54", "M68,42 L92,42"],
  comentar: ["M16,20 L84,20 L84,68 L46,68 L28,84 L28,68 L16,68 Z"],
  link: ["M40,60 L60,40", "M46,32 L54,24 A15,15 0 0 1 76,46 L68,54", "M54,68 L46,76 A15,15 0 0 1 24,54 L32,46"],
};

export const Icone: React.FC<{ nome: NomeIcone; p: number; tamanho: number; cor: string; largura?: number; preenchido?: number }> = ({
  nome,
  p,
  tamanho,
  cor,
  largura = 6,
  preenchido = 0,
}) => {
  const tracos = TRACOS[nome];
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
      {preenchido > 0 && /Z\s*$/.test(tracos[0]) ? <path d={tracos[0]} fill={cor} opacity={preenchido} /> : null}
      {tracos.map((d, i) => {
        // cada traço começa um pouco depois do anterior; o último termina junto com p = 1
        const n = tracos.length;
        const inicio = (i / n) * 0.5;
        const duracao = 1 - (0.5 * (n - 1)) / n;
        const pi = Math.max(0, Math.min(1, (p - inicio) / duracao));
        return <Traco key={i} d={d} p={pi} cor={cor} largura={largura} />;
      })}
    </svg>
  );
};
