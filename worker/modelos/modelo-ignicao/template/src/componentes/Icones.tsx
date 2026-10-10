// Luzes-espia a traço (padrão genérico de painel, sem marca), num quadro de 120×120.
// Cada ícone é uma lista de traços; alguns têm partes cheias (a gota, o ponto do "!").
import { mistura, prog, Traco } from "../anim";
import type { CorDaLuz, Icone, Lampada } from "../plano";
import { cor, fonte } from "../tema";

type Desenho = { tracos: string[]; cheios?: string[] };

export const DESENHOS: Record<Icone, Desenho> = {
  // almotolia (pressão do óleo): corpo, tampa, alça, bico afinando e a gota
  oleo: {
    tracos: [
      "M28 60 Q28 56 32 56 H70 Q74 56 74 60 V82 Q74 86 70 86 H32 Q28 86 28 82 Z",
      "M44 56 V48 H58 V56",
      "M28 63 L16 59 Q11 58 11 63 V68 Q11 72 15 73 L28 77",
      "M74 61 L104 48 Q107 47 107 51 L74 72",
    ],
    cheios: ["M105 60 C105 60 99.5 68 99.5 72.5 A5.5 5.5 0 0 0 110.5 72.5 C110.5 68 105 60 105 60 Z"],
  },
  // termômetro mergulhado na água (temperatura do motor)
  temperatura: {
    tracos: [
      "M54 71 V22 A6 6 0 0 1 66 22 V71 A11 11 0 1 1 54 71 Z",
      "M66 30 H81",
      "M66 42 H78",
      "M66 54 H81",
      "M14 101 q7.5 -6 15 0 t15 0 t15 0 t15 0 t15 0 t15 0",
      "M14 111 q7.5 -6 15 0 t15 0 t15 0 t15 0 t15 0 t15 0",
    ],
  },
  // bateria: corpo, polos, − e +
  bateria: {
    tracos: [
      "M19 38 H101 Q106 38 106 43 V89 Q106 94 101 94 H19 Q14 94 14 89 V43 Q14 38 19 38 Z",
      "M26 38 V30 H44 V38",
      "M76 38 V30 H94 V38",
      "M27 64 H43",
      "M77 64 H93",
      "M85 56 V72",
    ],
  },
  // freio: círculo com "!" entre parênteses
  freio: {
    tracos: [
      "M60 36 A26 26 0 1 1 59.99 36 Z",
      "M31.7 38.2 A37 37 0 0 0 31.7 85.8",
      "M88.3 38.2 A37 37 0 0 1 88.3 85.8",
      "M60 47 V66",
    ],
    cheios: ["M60 72 A3.6 3.6 0 1 1 59.99 72 Z"],
  },
  // injeção / motor: o bloco do motor de perfil
  motor: {
    tracos: [
      "M24 54 H34 V46 H50 V40 H72 V46 H80 L88 54 H94 V48 H102 V82 H94 V76 H88 L80 86 H42 L34 78 H24 Z",
      "M14 58 V76",
      "M14 67 H24",
    ],
  },
  // pressão dos pneus: o pneu em corte, com "!" e a banda de rodagem
  pneu: {
    tracos: [
      "M33 32 C21 46 21 74 34 87 L40 92 H80 L86 87 C99 74 99 46 87 32",
      "M42 100 V93",
      "M54 100 V93",
      "M66 100 V93",
      "M78 100 V93",
      "M60 44 V67",
    ],
    cheios: ["M60 73 A3.6 3.6 0 1 1 59.99 73 Z"],
  },
  // reserva de combustível: a bomba com a mangueira
  combustivel: {
    tracos: [
      "M34 96 V34 Q34 28 40 28 H62 Q68 28 68 34 V96",
      "M40 38 H62 V56 H40 Z",
      "M26 96 H76",
      "M68 50 H76 Q82 50 82 56 V80 Q82 86 88 86 Q94 86 94 80 V46 L86 38",
    ],
  },
  // cinto de segurança: a pessoa sentada com a faixa na diagonal
  cinto: {
    tracos: [
      "M60 14 A10 10 0 1 1 59.99 14 Z",
      "M38 100 V62 Q38 44 56 44 H64 Q82 44 82 62 V100",
      "M44 46 L80 92",
      "M74 86 L86 98",
    ],
  },
  // ---- símbolos gerais (qualquer assunto), no mesmo traço ----
  // alerta geral: triângulo com "!"
  alerta: {
    tracos: ["M60 18 L104 96 Q106 100 101 100 H19 Q14 100 16 96 Z", "M60 46 V72"],
    cheios: ["M60 80 A4.4 4.4 0 1 1 59.99 80 Z"],
  },
  // informação: "i" num círculo
  info: {
    tracos: ["M60 20 A40 40 0 1 1 59.99 20 Z", "M60 54 V84"],
    cheios: ["M60 36 A4.6 4.6 0 1 1 59.99 36 Z"],
  },
  // serviço: a chave de boca deitada
  servico: {
    tracos: ["M84 16 A24 24 0 0 0 58 46 L22 82 A9 9 0 0 0 36 96 L72 60 A24 24 0 0 0 102 34 L88 48 L74 44 L70 30 Z"],
  },
  // tempo: relógio com os ponteiros e o botão de cima
  tempo: {
    tracos: ["M60 24 A38 38 0 1 1 59.99 24 Z", "M60 40 V62 L76 72", "M50 14 H70"],
  },
  // dinheiro: moeda com o cifrão
  dinheiro: {
    tracos: [
      "M60 20 A40 40 0 1 1 59.99 20 Z",
      "M74 46 Q71 38 60 38 Q47 38 47 48 Q47 57 60 59 Q73 61 73 71 Q73 82 60 82 Q49 82 45 74",
      "M60 30 V38",
      "M60 82 V90",
    ],
  },
  // pessoa: cabeça e ombros
  pessoa: {
    tracos: ["M60 22 A15 15 0 1 1 59.99 22 Z", "M28 100 Q28 66 60 66 Q92 66 92 100"],
  },
  // coração
  coracao: {
    tracos: ["M60 98 C40 82 18 68 18 46 Q18 26 38 26 Q52 26 60 40 Q68 26 82 26 Q102 26 102 46 C102 68 80 82 60 98 Z"],
  },
  // raio
  raio: {
    tracos: ["M68 12 L32 66 H58 L50 108 L90 50 H64 Z"],
  },
};

// Luz numerada (o padrão neutro): o contorno de uma luz de painel com o número dentro
const CONTORNO_NUMERADA = ["M60 34 A28 28 0 1 1 59.99 34 Z", "M29.6 37 A38 38 0 0 0 29.6 87", "M90.4 37 A38 38 0 0 1 90.4 87"];
const numeroDa = (l: Lampada) => (l.startsWith("n") && l.length === 2 ? l.slice(1) : null);
const desenhoDe = (l: Lampada): Desenho => (numeroDa(l) ? { tracos: CONTORNO_NUMERADA } : DESENHOS[l as Icone]);
const Algarismo: React.FC<{ l: Lampada; cor: string }> = ({ l, cor: c }) => {
  const n = numeroDa(l);
  return n ? (
    <text x={60} y={63} textAnchor="middle" dominantBaseline="central" fontFamily={fonte} fontWeight={700} fontSize={38} fill={c}>
      {n}
    </text>
  ) : null;
};

// cor de cada luz quando o plano não diz: a de um painel de verdade (injeção, pneus e reserva são
// âmbar); nos símbolos gerais, vermelho só no que é alerta (alerta, coração), marfim nos indicadores
// neutros (info, pessoa) e âmbar no resto e nas luzes numeradas
const AMBAR: Lampada[] = ["motor", "pneu", "combustivel", "servico", "tempo", "dinheiro", "raio"];
const MARFIM: Lampada[] = ["info", "pessoa"];
export const corPadrao = (i: Lampada): CorDaLuz => (numeroDa(i) || AMBAR.includes(i) ? "ambar" : MARFIM.includes(i) ? "marfim" : "vermelho");
export const corDaLuz = (c?: CorDaLuz) => (c === "ambar" ? cor.ambar : c === "marfim" ? cor.marfim : cor.alerta);

// Luz-espia pequena: apagada (esboço atrás do vidro) ↔ acesa (vermelho, com um halo curto no
// próprio desenho — é a lâmpada; nunca brilho atrás da pessoa)
export const Luz: React.FC<{
  icone: Lampada;
  // 0 = apagada, 1 = acesa
  acesa: number;
  tamanho: number;
  corLuz?: CorDaLuz;
  // opacidade do esboço apagado
  esboco?: number;
  style?: React.CSSProperties;
}> = ({ icone, acesa, tamanho, corLuz, esboco = 1, style }) => {
  const d = desenhoDe(icone);
  const c = corDaLuz(corLuz ?? corPadrao(icone));
  const traco = 7.2;
  return (
    <div style={{ position: "relative", width: tamanho, height: tamanho, ...style }}>
      <svg viewBox="0 0 120 120" width={tamanho} height={tamanho} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: esboco * (1 - acesa * 0.9) }}>
        {d.tracos.map((p) => (
          <Traco key={p} d={p} cor={cor.apagado} largura={traco} />
        ))}
        {(d.cheios ?? []).map((p) => (
          <path key={p} d={p} fill={cor.apagado} />
        ))}
        <Algarismo l={icone} cor={cor.apagado} />
      </svg>
      {acesa > 0.01 ? (
        <svg
          viewBox="0 0 120 120"
          width={tamanho}
          height={tamanho}
          style={{ position: "absolute", inset: 0, overflow: "visible", opacity: acesa, filter: `drop-shadow(0 0 ${tamanho * 0.07}px ${c}88)` }}
        >
          {d.tracos.map((p) => (
            <Traco key={p} d={p} cor={c} largura={traco} />
          ))}
          {(d.cheios ?? []).map((p) => (
            <path key={p} d={p} fill={c} />
          ))}
          <Algarismo l={icone} cor={c} />
        </svg>
      ) : null}
    </div>
  );
};

// Luz grande da tela central: o desenho se traça quando a luz é nomeada e reage ao que é dito
// sobre ela (detalheEm): a almotolia ganha uma chama no bico e vira lamparina; o termômetro enche;
// a bateria descarrega barra por barra. As outras luzes "respiram" acesas.
export const LuzGrande: React.FC<{
  icone: Lampada;
  t: number;
  em: number;
  detalheEm?: number;
  tamanho: number;
  corLuz?: CorDaLuz;
  // a luz pisca (alerta que não apaga)
  piscando?: number;
}> = ({ icone, t, em, detalheEm, tamanho, corLuz, piscando }) => {
  const d = desenhoDe(icone);
  const c = corDaLuz(corLuz ?? corPadrao(icone));
  const desenho = prog(t, em - 0.05, 0.55);
  const reage = detalheEm ?? em + 1.2;
  const traco = 5.2;
  const extra: React.ReactNode[] = [];

  if (icone === "oleo") {
    // a gota se forma no bico e cai, em ciclo, até o detalhe; então a chama acende no bico
    const chama = prog(t, reage - 0.05, 0.45);
    const ciclo = ((t - em - 0.4) % 1.3 + 1.3) % 1.3;
    const queda = t > em + 0.4 ? Math.min(1, Math.max(0, (ciclo - 0.55) / 0.5)) : 0;
    const forma = t > em + 0.4 ? Math.min(1, ciclo / 0.55) : 0;
    extra.push(
      <g key="gota" opacity={(1 - chama) * (1 - queda * 0.9)} transform={`translate(0 ${queda * 34})`}>
        <path d="M105 60 C105 60 99.5 68 99.5 72.5 A5.5 5.5 0 0 0 110.5 72.5 C110.5 68 105 60 105 60 Z" fill={c} transform={`translate(105 66) scale(${0.4 + 0.6 * forma}) translate(-105 -66)`} />
      </g>,
    );
    const tremor = 1 + 0.05 * Math.sin(t * 9) * chama;
    extra.push(
      <g key="chama" opacity={chama} transform={`translate(108 44) scale(${chama * tremor}) translate(-108 -44)`}>
        <path d="M108 46 C100 38 102 28 109 20 C110 28 117 31 115 40 C114 44 111 46 108 46 Z" fill="none" stroke={cor.marfim} strokeWidth={3.6} strokeLinejoin="round" />
        <path d="M108.5 43 C105 39 106 34 109 30 C110 35 113 37 112 40.5 C111.5 42 110 43 108.5 43 Z" fill={cor.marfim} />
      </g>,
    );
  }
  if (icone === "temperatura") {
    // a coluna sobe do bulbo até perto do topo; no detalhe passa da última marca
    const sobe = prog(t, em + 0.15, 1.1) * 0.62 + prog(t, reage, 0.9) * 0.34;
    const topo = 71 - sobe * 47;
    extra.push(<circle key="bulbo" cx={60} cy={80.7} r={6.5 * desenho} fill={c} />);
    extra.push(<rect key="coluna" x={57.6} y={topo} width={4.8} height={Math.max(0, 76 - topo)} rx={2.4} fill={c} />);
  }
  if (icone === "bateria") {
    // quatro barras de carga que se apagam uma a uma a partir do detalhe; a última pisca
    const inicio = reage;
    for (let i = 0; i < 4; i++) {
      const apaga = prog(t, inicio + 0.08 + (3 - i) * 0.32, 0.2);
      const ultima = i === 0 && t > inicio + 1.1 ? 0.45 + 0.55 * Math.abs(Math.cos((t - inicio) * 4)) : 1;
      extra.push(
        <rect key={`b${i}`} x={24 + i * 19} y={76} width={14} height={10} rx={2} fill={c} opacity={desenho * (i === 0 ? ultima : 1 - apaga)} />,
      );
    }
  }
  const respira =
    piscando !== undefined ? 0.3 + 0.7 * piscando : icone === "oleo" || icone === "temperatura" || icone === "bateria" ? 1 : 0.85 + 0.15 * Math.cos((t - em) * 3.2);
  // o número da luz numerada acende junto com o contorno
  extra.push(
    <g key="n" opacity={desenho}>
      <Algarismo l={icone} cor={c} />
    </g>,
  );

  return (
    <svg viewBox="0 0 120 120" width={tamanho} height={tamanho} style={{ overflow: "visible", filter: `drop-shadow(0 0 ${tamanho * 0.035}px ${c}66)` }}>
      {/* o esboço apagado por baixo: a luz já está lá antes de acender */}
      {d.tracos.map((p) => (
        <Traco key={`e-${p}`} d={p} cor={cor.apagado} largura={traco} />
      ))}
      <Algarismo l={icone} cor={cor.apagado} />
      <g opacity={respira}>
        {d.tracos.map((p) => (
          <Traco key={p} d={p} cor={c} largura={traco} p={desenho} />
        ))}
        {(d.cheios ?? [])
          .filter(() => icone !== "oleo")
          .map((p) => (
            <path key={p} d={p} fill={c} opacity={prog(t, em + 0.4, 0.2)} />
          ))}
        <path d={d.tracos[0]} fill={mistura(0, 1, desenho) > 0.9 ? `${c}1A` : "none"} stroke="none" />
        {extra}
      </g>
    </svg>
  );
};

// Ícones de interface (não são luzes-espia): marcador de salvar e a seta de direção
export const Marcador: React.FC<{ tamanho: number; p: number; corTraco?: string }> = ({ tamanho, p, corTraco = cor.marfim }) => (
  <svg viewBox="0 0 60 60" width={tamanho} height={tamanho} style={{ overflow: "visible" }}>
    <path d="M16 8 H44 Q48 8 48 12 V52 L30 40 L12 52 V12 Q12 8 16 8 Z" fill="none" stroke={cor.apagado} strokeWidth={4.5} strokeLinejoin="round" />
    <path d="M16 8 H44 Q48 8 48 12 V52 L30 40 L12 52 V12 Q12 8 16 8 Z" fill={p > 0.5 ? corTraco : "none"} fillOpacity={prog(p, 0.5, 0.5)} stroke={corTraco} strokeWidth={4.5} strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
  </svg>
);

// Ícones das outras ações do fechamento, no mesmo traço do marcador (60×60): seguir, comentar, link
const ACOES: Record<"seguir" | "comentar" | "link", string[]> = {
  seguir: ["M24 10 A9 9 0 1 1 23.99 10 Z", "M8 50 Q8 32 24 32 Q34 32 38 38", "M46 30 V50", "M36 40 H56"],
  comentar: ["M12 10 H48 Q52 10 52 14 V38 Q52 42 48 42 H26 L14 52 V42 H12 Q8 42 8 38 V14 Q8 10 12 10 Z"],
  link: ["M26 34 L34 26", "M30 18 L35 13 A9.5 9.5 0 0 1 48.5 26.5 L43 32", "M30 42 L25 47 A9.5 9.5 0 0 1 11.5 33.5 L17 28"],
};
export const IconeAcao: React.FC<{ icone: "salvar" | "seguir" | "comentar" | "link"; tamanho: number; p: number }> = ({ icone, tamanho, p }) => {
  if (icone === "salvar") return <Marcador tamanho={tamanho} p={p} />;
  const d = ACOES[icone];
  return (
    <svg viewBox="0 0 60 60" width={tamanho} height={tamanho} style={{ overflow: "visible" }}>
      {d.map((x) => (
        <path key={`e${x}`} d={x} fill="none" stroke={cor.apagado} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {p > 0.002
        ? d.map((x) => (
            <path
              key={x}
              d={x}
              fill="none"
              stroke={cor.marfim}
              strokeWidth={4.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={p < 0.999 ? `${p} 1` : undefined}
            />
          ))
        : null}
    </svg>
  );
};

export const Seta: React.FC<{ tamanho: number; acesa: number; direcao?: "direita" | "esquerda" }> = ({ tamanho, acesa, direcao = "direita" }) => (
  <svg viewBox="0 0 80 60" width={tamanho} height={(tamanho * 60) / 80} style={{ overflow: "visible", transform: direcao === "esquerda" ? "scaleX(-1)" : undefined }}>
    <path d="M6 22 H40 V8 L74 30 L40 52 V38 H6 Z" fill="none" stroke={cor.apagado} strokeWidth={4} strokeLinejoin="round" />
    <path
      d="M6 22 H40 V8 L74 30 L40 52 V38 H6 Z"
      fill={cor.seta}
      stroke={cor.seta}
      strokeWidth={4}
      strokeLinejoin="round"
      opacity={acesa}
      style={{ filter: `drop-shadow(0 0 6px ${cor.seta}88)` }}
    />
  </svg>
);
