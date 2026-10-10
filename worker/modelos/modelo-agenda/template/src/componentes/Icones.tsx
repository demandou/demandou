// Ícones a traço, genéricos (nada que lembre logotipo de app). viewBox 48×48, traço único com
// pontas redondas; `cheios` são áreas preenchidas. `p` desenha o traço de 0 a 1.
import { Traco } from "../anim";

type Desenho = { tracos: string[]; cheios?: string[] };

const DESENHOS = {
  // celular de frente, com alto-falante e botão
  celular: { tracos: ["M15 6h18a3 3 0 0 1 3 3v30a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z", "M21 11h6", "M22 37h4"] },
  email: { tracos: ["M8 13h32v22H8z", "M8 14l16 12 16-12"] },
  mensagem: { tracos: ["M9 11h30a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H21l-8 7v-7H9a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z", "M15 20h18", "M15 26h11"] },
  video: { tracos: ["M8 11h32a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z"], cheios: ["M20 18l10 6-10 6z"] },
  noticia: { tracos: ["M10 8h22l6 6v26H10z", "M16 18h16", "M16 25h16", "M16 32h10"] },
  calendario: { tracos: ["M8 12h32v28H8z", "M8 20h32", "M16 7v8", "M32 7v8"], cheios: ["M14 25h6v5h-6z"] },
  maleta: { tracos: ["M7 16h34v22H7z", "M18 16v-5h12v5", "M7 26h34", "M22 26v4h4v-4"] },
  relogio: { tracos: ["M24 7a17 17 0 1 0 0 34a17 17 0 1 0 0-34z", "M24 14v10l7 5"] },
  salvar: { tracos: ["M14 7h20v34l-10-8-10 8z"] },
  salvarCheio: { tracos: ["M14 7h20v34l-10-8-10 8z"], cheios: ["M14 7h20v34l-10-8-10 8z"] },
  seguir: { tracos: ["M20 22a7 7 0 1 0 0-14a7 7 0 1 0 0 14z", "M7 40c1-8 6-12 13-12s12 4 13 12", "M38 14v12", "M32 20h12"] },
  comentar: { tracos: ["M24 8c10 0 17 6 17 14s-7 14-17 14c-2 0-4 0-6-1l-9 5 2-8c-3-3-4-6-4-10 0-8 7-14 17-14z"] },
  camera: { tracos: ["M6 15h26v20H6z", "M32 21l10-6v20l-10-6"] },
  check: { tracos: ["M10 25l9 9 19-20"] },
  casa: { tracos: ["M8 22L24 9l16 13", "M12 19v20h24V19", "M21 39V28h6v11"] },
  cafe: { tracos: ["M9 18h24v10a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10z", "M33 21h3a5 5 0 0 1 0 10h-3", "M16 7c-2 3 2 5 0 8", "M24 7c-2 3 2 5 0 8"] },
  livro: { tracos: ["M24 13c-5-4-11-4-16-3v27c5-1 11-1 16 3c5-4 11-4 16-3V10c-5-1-11-1-16 3z", "M24 13v27"] },
  alvo: { tracos: ["M24 7a17 17 0 1 0 0 34a17 17 0 1 0 0-34z", "M24 15a9 9 0 1 0 0 18a9 9 0 1 0 0-18z"], cheios: ["M24 21a3 3 0 1 0 0 6a3 3 0 1 0 0-6z"] },
  silencio: { tracos: ["M14 30V20h6l9-7v22l-9-7h-6", "M34 19l8 10", "M42 19l-8 10"] },
  // dois elos de corrente
  link: { tracos: ["M21 27a7 7 0 0 0 10 0l6-6a7 7 0 0 0-10-10l-2 2", "M27 21a7 7 0 0 0-10 0l-6 6a7 7 0 0 0 10 10l2-2"] },
  // triângulo de aviso
  alerta: { tracos: ["M24 8L42 39H6z", "M24 19v9"], cheios: ["M22 32h4v4h-4z"] },
  // ponto de interrogação
  pergunta: { tracos: ["M17 17a7 7 0 1 1 10 6c-2 1-3 3-3 5v2"], cheios: ["M22 35h4v4h-4z"] },
  seta: { tracos: ["M8 24h30", "M28 14l10 10-10 10"] },
  setaBaixo: { tracos: ["M24 8v30", "M14 28l10 10 10-10"] },
  xis: { tracos: ["M13 13l22 22", "M35 13L13 35"] },
  sobe: { tracos: ["M7 36l11-11 8 7 15-17", "M31 15h10v10"] },
} satisfies Record<string, Desenho>;

export type NomeIcone = keyof typeof DESENHOS;

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor: string; p?: number; peso?: number; style?: React.CSSProperties }> = ({
  nome,
  tamanho,
  cor,
  p = 1,
  peso = 3.6,
  style,
}) => {
  const d: Desenho = DESENHOS[nome] ?? DESENHOS.calendario;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ display: "block", flexShrink: 0, overflow: "visible", ...style }}>
      {d.cheios?.map((c, i) => <path key={`c${i}`} d={c} fill={cor} opacity={p > 0.6 ? 1 : 0} />)}
      {d.tracos.map((tr, i) => {
        const n = d.tracos.length;
        const pi = Math.min(1, Math.max(0, p * n - i));
        return <Traco key={i} d={tr} p={pi} cor={cor} largura={peso} />;
      })}
    </svg>
  );
};
