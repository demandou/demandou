// O número no anel do cronômetro (o segundo herói do modelo): o anel espera a lápis, o número conta
// até o valor na palavra e o arco se enche junto (em %, ele para na porcentagem). Depois de contar,
// a marcação "agora" segue andando devagar em volta do anel — a tela nunca fica parada.
// Na folha: o anel grande no quadro à esquerda da pessoa e o rótulo ao lado dele (ou embaixo, num quadro estreito).
import { Easing } from "remotion";
import { Linhas, prog, temposDoTexto } from "../anim";
import { type Agenda, areaDoConteudo, entradaESaida, quadroEstreito } from "../agenda";
import { casasDe, encaixar, formatar, medir } from "../medida";
import type { Numero, Palavra } from "../plano";
import { cor, numeros, sans } from "../tema";
import { NaFolha } from "./NaFolha";
import { Ilustrativo } from "./Peito";

const conta = Easing.out(Easing.cubic);

export const duracaoDaConta = (valor: number) => Math.min(1.5, Math.max(0.8, 0.8 + Math.log10(Math.max(1, Math.abs(valor))) * 0.14));

// o texto do número em `t` (pt-BR) e quanto do anel está cheio
export const valorNoTempo = (m: Numero, t: number) => {
  const casas = m.casas ?? casasDe(m.valor);
  const p = prog(t, m.em, duracaoDaConta(m.valor), conta);
  const v = m.valor * p;
  const porcento = (m.sufixo ?? "").trim().startsWith("%");
  return { texto: formatar(casas ? v : Math.round(v), casas), fracao: porcento ? Math.min(1, Math.max(0, v / 100)) : p, p };
};

// O anel: trilho tomate claro (a lápis antes da palavra), arco tomate e a marcação "agora"
export const Aro: React.FC<{ d: number; fracao: number; t: number; aceso: boolean; giroDe?: number }> = ({ d, fracao, t, aceso, giroDe }) => {
  const sw = Math.max(16, d * 0.075);
  const r = (d - sw) / 2;
  const c = d / 2;
  // depois de contar, um ponto anda em volta do anel (uma volta a cada ~9 s)
  const giro = giroDe !== undefined && t > giroDe ? ((t - giroDe) / 9) * 360 : 0;
  const tracos = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} style={{ display: "block", overflow: "visible" }}>
      {aceso ? (
        <circle cx={c} cy={c} r={r} fill="none" stroke={cor.focoFundo} strokeWidth={sw} />
      ) : (
        <circle cx={c} cy={c} r={r} fill="none" stroke={cor.esboco} strokeWidth={4} strokeDasharray="12 12" />
      )}
      {tracos.map((a) => (
        <line
          key={a}
          x1={c}
          y1={sw + 14}
          x2={c}
          y2={sw + 26}
          stroke={aceso ? cor.linhaForte : cor.linha}
          strokeWidth={4}
          strokeLinecap="round"
          transform={`rotate(${a} ${c} ${c})`}
        />
      ))}
      {aceso && fracao > 0.002 ? (
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={cor.foco}
          strokeWidth={sw}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${Math.min(fracao, 0.9999)} 1`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      ) : null}
      {giroDe !== undefined && t > giroDe ? (
        <circle cx={c} cy={sw / 2} r={sw * 0.32} fill="#FFFFFF" transform={`rotate(${giro + fracao * 360} ${c} ${c})`} opacity={prog(t, giroDe, 0.3)} />
      ) : null}
    </svg>
  );
};

// número + prefixo + sufixo, do maior tamanho que cabe em `largura`
const tamanhoDoNumero = (m: Numero, largura: number, maximo: number) => {
  const final = valorNoTempo(m, 1e9).texto + (m.sufixo && m.sufixo.trim().length <= 2 ? m.sufixo.trim() : "");
  return Math.max(48, Math.min(maximo, Math.floor((maximo * largura) / Math.max(1, medir(final, maximo, { tabular: true })))));
};

export const NumeroNaFolha: React.FC<{ m: Numero; i: number; t: number; palavras: Palavra[]; ag: Agenda }> = ({ m, i, t, palavras, ag }) => {
  const lugar = ag.lugarDe[i];
  const area = areaDoConteudo(lugar, ag.L);
  const es = entradaESaida(ag, i);
  const aoLado = quadroEstreito(area);
  const chip = m.ilustrativo ? 70 : 0;
  // anel: na coluna (quadro estreito) ou à esquerda, com o rótulo ao lado (o quadro deitado é largo)
  const d = aoLado ? Math.min(area.w, 480) : Math.min(area.h - 10, 560, Math.round(area.w * 0.42));
  const larguraRotulo = aoLado ? area.w : area.w - d - 52;
  const rot = encaixar(m.rotulo, {
    largura: larguraRotulo,
    max: aoLado ? 76 : 72,
    min: 40,
    linhas: aoLado ? 4 : 4,
    entrelinha: 1.08,
    fonte: { peso: 800 },
    menos: false,
  });
  const alturaRotulo = rot.linhas.length * rot.tamanho * 1.08;
  const grupo = aoLado ? chip + d + 44 + alturaRotulo : Math.max(d, alturaRotulo + chip);
  const topo = area.y + Math.max(0, (area.h - grupo) * 0.42);
  const xAro = aoLado ? area.x + (area.w - d) / 2 : area.x;
  const yAro = aoLado ? topo + chip : area.y + (area.h - d) / 2;
  const { texto, fracao } = valorNoTempo(m, t);
  const aceso = t >= m.em - 0.05;
  const fimConta = m.em + duracaoDaConta(m.valor);
  const interno = d - 2 * Math.max(16, d * 0.075) - 70;
  const tamanho = tamanhoDoNumero(m, interno, aoLado ? 130 : 150);
  const temposR = temposDoTexto(m.rotulo, palavras, m.rotuloEm ?? m.de, m.ate, m.rotuloEm ?? m.de);
  const prefixoT = Math.max(34, Math.round(tamanho * 0.36));
  const sufixoT = Math.max(34, Math.round(tamanho * 0.36));
  const sufixoLargo = m.sufixo && medir(m.sufixo, sufixoT, { peso: 700 }) > interno;
  // "%", "x", "°": colado ao número
  const colado = !!m.sufixo && m.sufixo.trim().length <= 2;
  return (
    <NaFolha t={t} es={es} ag={ag}>
      {m.ilustrativo ? <Ilustrativo x={area.x} y={aoLado ? topo : area.y - 6} p={prog(t, es.entra + 0.2, 0.3)} /> : null}
      <div style={{ position: "absolute", left: xAro, top: yAro }}>
        <Aro d={d} fracao={fracao} t={t} aceso={aceso} giroDe={fimConta + 0.2} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: sans,
          }}
        >
          {m.prefixo ? <div style={{ fontSize: prefixoT, fontWeight: 700, color: aceso ? cor.focoEscuro : cor.esbocoTexto, lineHeight: 1.1 }}>{m.prefixo}</div> : null}
          <div style={{ fontSize: tamanho, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", color: aceso ? cor.tinta : cor.esbocoTexto, whiteSpace: "nowrap", ...numeros }}>
            {aceso ? texto : valorNoTempo(m, 1e9).texto.replace(/\d/g, "0")}
            {colado ? <span style={{ fontSize: Math.round(tamanho * 0.6), marginLeft: 4 }}>{m.sufixo?.trim()}</span> : null}
          </div>
          {m.sufixo && !sufixoLargo && !colado ? <div style={{ marginTop: 6, fontSize: sufixoT, fontWeight: 700, color: aceso ? cor.tintaSuave : cor.esbocoTexto, lineHeight: 1.1, whiteSpace: "nowrap" }}>{m.sufixo}</div> : null}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: aoLado ? area.x : area.x + d + 52,
          top: aoLado ? yAro + d + 44 : yAro + (d - alturaRotulo) / 2,
          width: larguraRotulo,
          fontFamily: sans,
        }}
      >
        {sufixoLargo ? <div style={{ fontSize: 40, fontWeight: 700, color: cor.tintaSuave, marginBottom: 8 }}>{m.sufixo}</div> : null}
        <Linhas linhas={rot.linhas} tempos={temposR} t={t} tamanho={rot.tamanho} entrelinha={1.08} esboco={cor.esboco} cor={cor.tinta} />
      </div>
    </NaFolha>
  );
};
