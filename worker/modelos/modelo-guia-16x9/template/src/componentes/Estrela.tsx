// A estrela laranja da marca: 12 raios arredondados. Genérica (serve a qualquer assunto).
import { COR } from "../tema";

export const Estrela: React.FC<{ tamanho: number; cor?: string; raios?: number }> = ({ tamanho, cor = COR.laranja, raios = 12 }) => {
  const r = Array.from({ length: raios }, (_, i) => i * (360 / raios));
  return (
    <svg width={tamanho} height={tamanho} viewBox="-50 -50 100 100" style={{ display: "block" }}>
      {r.map((a) => (
        <rect key={a} x={-3.4} y={-46} width={6.8} height={30} rx={3.4} fill={cor} transform={`rotate(${a})`} />
      ))}
    </svg>
  );
};

// Quadrado arredondado laranja com a estrela branca dentro (o "ícone do app").
export const IconeEstrela: React.FC<{ tamanho: number }> = ({ tamanho }) => (
  <div style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.22, background: COR.laranja, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Estrela tamanho={tamanho * 0.7} cor="#FFFFFF" />
  </div>
);
