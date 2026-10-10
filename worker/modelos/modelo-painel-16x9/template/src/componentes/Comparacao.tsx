import { calculo, prog, Revela, useTempo } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Comparacao as TComparacao } from "../plano";
import { cor, mono, rotulo, sans } from "../tema";
import { Cartao, larguraDaZona, type Zona } from "./Cartao";
import { caminho, curvaComposta } from "./curvas";

// positivo: true = ✓ (caminho bom), false = ✗ (caminho ruim), null = sem vencedor (lado a lado)
type Opcao = { em: number; vereditoEm?: number; titulo: string; texto: string; positivo: boolean | null };

// Os lados do bloco universal (`lados`, `vencedor`, `modo`) ou as `opcoes` do formato antigo.
const opcoesDo = (m: TComparacao): Opcao[] => {
  if (m.opcoes?.length) return m.opcoes.slice(0, 2).map((o) => ({ ...o }));
  const vencedor = m.vencedor ?? (m.modo === "errado-certo" ? 1 : undefined);
  return (m.lados ?? []).slice(0, 2).map((l, i) => ({
    em: l.em,
    vereditoEm: l.vereditoEm ?? (vencedor !== undefined ? m.vencedorEm : undefined),
    titulo: l.rotulo,
    texto: l.texto,
    positivo: vencedor === undefined ? null : i === vencedor,
  }));
};

// Selo do veredito: anel vazio enquanto espera; ✓ ou ✗ se desenha quando é dito.
const Selo: React.FC<{ p: number; positivo: boolean }> = ({ p, positivo }) => {
  const c = positivo ? cor.positivo : cor.negativo;
  const traco = positivo ? "M17,31 L26,40 L43,21" : "M20,20 L40,40 M40,20 L20,40";
  return (
    <svg width={58} height={58} viewBox="0 0 60 60" style={{ flexShrink: 0 }}>
      <circle cx={30} cy={30} r={27} fill="none" stroke={cor.linhaForte} strokeWidth={2.5} opacity={1 - p} />
      <circle cx={30} cy={30} r={27} fill={c} fillOpacity={0.16 * p} stroke={c} strokeWidth={3} strokeDasharray={170} strokeDashoffset={170 * (1 - p)} />
      <path d={traco} fill="none" stroke={c} strokeWidth={4.5} strokeLinecap="round" strokeDasharray={60} strokeDashoffset={60 * (1 - prog(p, 0.4, 0.6))} />
    </svg>
  );
};

// Mini gráfico: o caminho bom se completa. O ruim para no meio: dali em diante fica reto,
// e a parte da curva que ele perde aparece tracejada, com a área perdida sombreada.
const Mini: React.FC<{ o: Opcao; t: number; inicio: number; veredito: number; W: number; H: number }> = ({ o, t, inicio, veredito, W, H }) => {
  const PONTOS = curvaComposta(30, 2.4).map((p) => ({ x: p.x * W, y: H - p.y * H }));
  const pDesenho = prog(t, inicio + 0.2, 0.9, calculo);
  const pVeredito = prog(t, veredito, 0.7);
  const corte = o.positivo ? 1 : 0.5;
  const ate = (f: number) => PONTOS.filter((p) => p.x <= f * W + 0.01);
  const feito = ate(corte * pDesenho);
  const ponta = feito[feito.length - 1] ?? PONTOS[0];
  const xFim = (corte + (1 - corte) * pVeredito) * W;
  const resto = PONTOS.filter((p) => p.x >= corte * W - 0.01 && p.x <= xFim + 0.01);
  const corLinha = o.positivo && pVeredito > 0.3 ? cor.positivo : cor.neutro;
  return (
    <svg width={W + 20} height={H + 24} style={{ overflow: "visible" }}>
      <line x1={0} x2={W} y1={H + 12} y2={H + 12} stroke={cor.linhaForte} strokeWidth={2} />
      {!o.positivo && resto.length > 1 ? (
        <>
          <path
            d={`${caminho(resto)} L${resto[resto.length - 1].x},${ponta.y} L${resto[0].x},${ponta.y} Z`}
            fill={cor.negativo}
            fillOpacity={0.16}
          />
          <path d={caminho(resto)} fill="none" stroke={cor.negativo} strokeWidth={3.5} strokeDasharray="8 9" />
          <line x1={ponta.x} x2={xFim} y1={ponta.y} y2={ponta.y} stroke={cor.neutro} strokeWidth={5} strokeLinecap="round" />
        </>
      ) : null}
      <path d={caminho(feito)} fill="none" stroke={corLinha} strokeWidth={5} strokeLinecap="round" />
      {pDesenho > 0 ? <circle cx={ponta.x} cy={ponta.y} r={8} fill={cor.fundo} stroke={corLinha} strokeWidth={4} /> : null}
    </svg>
  );
};

// Marcador sem veredito (lado a lado): a letra do lado num quadrado âmbar.
const Marcador: React.FC<{ p: number; letra: string }> = ({ p, letra }) => (
  <div
    style={{
      width: 58,
      height: 58,
      flexShrink: 0,
      borderRadius: 14,
      boxSizing: "border-box",
      border: `2.5px solid ${cor.ambar}`,
      background: `rgba(240,182,78,${0.14 * p})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: mono,
      fontWeight: 500,
      fontSize: 32,
      color: cor.ambar,
      opacity: 0.35 + 0.65 * p,
    }}
  >
    {letra}
  </div>
);

const FONTE_TITULO = { peso: 600 as const, espacamento: -0.02 };
const FONTE_TEXTO = { peso: 600 as const, espacamento: -0.01 };

// Dois lados lado a lado; cada cartão entra quando é falado. Com vencedor, cada um se resolve
// (✓ ou ✗, curva completa ou interrompida) no veredito. Sem vencedor, os dois ficam lado a lado,
// ligados por "×" (contra) ou "→" (antes e depois).
export const Comparacao: React.FC<{ m: TComparacao; zona: Zona; t0: number }> = ({ m, zona, t0 }) => {
  const t = useTempo();
  const largura = larguraDaZona(zona);
  const opcoes = opcoesDo(m);
  if (opcoes.length === 0) return null;
  const gap = 24;
  const larguraCartao = (largura - gap * (opcoes.length - 1)) / Math.max(1, opcoes.length);
  const miolo = larguraCartao - 60;
  const comVeredito = opcoes.some((o) => o.positivo !== null);
  const rotuloTopo = m.rotulo ?? m.titulo;

  // tamanhos que cabem: o mesmo corpo nos dois cartões
  const larguraVeredito = miolo - 72;
  const corpoTitulo = Math.min(...opcoes.map((o) => encaixar(o.titulo, { largura: miolo, max: 56, min: 40, linhas: 2, fonte: FONTE_TITULO }).tamanho));
  const corpoTexto = Math.min(...opcoes.map((o) => encaixar(o.texto, { largura: larguraVeredito, max: 44, min: 34, linhas: 3, fonte: FONTE_TEXTO }).tamanho));
  const titulos = opcoes.map((o) => encaixar(o.titulo, { largura: miolo, max: corpoTitulo, min: corpoTitulo, linhas: 2, fonte: FONTE_TITULO }));
  const linhasTitulo = Math.max(1, ...titulos.map((x) => x.linhas.length));
  const linhasTexto = Math.max(1, ...opcoes.map((o) => encaixar(o.texto, { largura: larguraVeredito, max: corpoTexto, min: corpoTexto, linhas: 3, fonte: FONTE_TEXTO }).linhas.length));
  const alturaConteudo = 28 + linhasTitulo * corpoTitulo * 1.06 + 16 + Math.max(58, linhasTexto * corpoTexto * 1.08) + 24;
  const alturaTopo = rotuloTopo ? 78 : 0;
  const disponivel = Math.min(446, (zona.altura || 465) - alturaTopo);
  const alturaCartao = comVeredito ? Math.max(Math.min(disponivel, 446), alturaConteudo) : Math.max(200, alturaConteudo + 14);
  // o mini gráfico ocupa o que sobra embaixo (some se sobrar pouco)
  const alturaMini = Math.min(130, alturaCartao - alturaConteudo - 48);
  const conector = !comVeredito ? (m.modo === "antes-depois" ? "→" : "×") : null;

  return (
    <div style={{ width: largura }}>
      {rotuloTopo ? (
        <Revela p={prog(t, t0 + 0.05, 0.5)} style={{ marginBottom: 16, alignSelf: "flex-start" }}>
          <div
            style={{
              ...rotulo,
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 18px",
              borderRadius: 12,
              background: cor.cartao,
              border: `2px solid ${cor.linha}`,
              whiteSpace: "nowrap",
              fontSize: larguraTexto(rotuloTopo, 32, { mono: true, caixaAlta: true, espacamento: 0.03 }) > largura - 80 ? 28 : 32,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 2, background: cor.ambar }} />
            {rotuloTopo}
          </div>
        </Revela>
      ) : null}
      <div style={{ display: "flex", gap, position: "relative" }}>
        {opcoes.map((o, i) => {
          const veredito = o.vereditoEm ?? o.em + 1;
          const pV = prog(t, veredito, 0.5);
          const corVeredito = o.positivo === null ? cor.texto : o.positivo ? cor.positivo : cor.negativo;
          // o segundo cartão espera como contorno até a sua vez
          const entra = Math.max(o.em - 0.05, t0);
          const esperando = t < entra;
          const pTexto = o.positivo === null ? prog(t, entra + 0.25, 0.35) : prog(t, veredito - 0.1, 0.35);
          return (
            <div key={`${o.titulo}-${i}`} style={{ position: "relative", width: larguraCartao, height: alturaCartao }}>
              {i > 0 ? (
                <Cartao de={t0} ate={Math.max(o.em, t0) + 0.2} tracejado style={{ position: "absolute", inset: 0 }}>
                  <div />
                </Cartao>
              ) : null}
              {!esperando ? (
                <Cartao de={entra} ate={m.ate} style={{ position: "absolute", inset: 0, padding: "28px 30px" }}>
                  <Revela p={prog(t, entra + 0.1, 0.45)}>
                    <div style={{ fontFamily: sans, fontWeight: 600, fontSize: corpoTitulo, lineHeight: 1.06, letterSpacing: "-0.02em", color: cor.texto }}>
                      {titulos[i].linhas.map((l) => (
                        <div key={l} style={{ whiteSpace: "nowrap" }}>
                          {l}
                        </div>
                      ))}
                    </div>
                  </Revela>
                  {/* veredito: o selo espera vazio e se desenha junto com a palavra */}
                  <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 14 }}>
                    {o.positivo === null ? <Marcador p={prog(t, entra + 0.1, 0.4)} letra={i === 0 ? "A" : "B"} /> : <Selo p={pV} positivo={o.positivo} />}
                    <div
                      style={{
                        marginTop: 2,
                        fontFamily: sans,
                        fontWeight: 600,
                        fontSize: corpoTexto,
                        lineHeight: 1.08,
                        letterSpacing: "-0.01em",
                        color: o.positivo === null || pV > 0.4 ? corVeredito : cor.apagado,
                        opacity: pTexto,
                        translate: pTexto >= 1 ? undefined : `0 ${(1 - pTexto) * 10}px`,
                      }}
                    >
                      {o.texto}
                    </div>
                  </div>
                  {o.positivo !== null && alturaMini >= 64 ? (
                    <div style={{ position: "absolute", left: 30, bottom: 24 }}>
                      <Mini o={o} t={t} inicio={entra} veredito={veredito} W={larguraCartao - 64} H={alturaMini} />
                    </div>
                  ) : null}
                </Cartao>
              ) : null}
            </div>
          );
        })}
        {conector && opcoes.length === 2 ? (
          <div
            style={{
              position: "absolute",
              left: larguraCartao + gap / 2 - 32,
              top: alturaCartao / 2 - 32,
              width: 64,
              height: 64,
              borderRadius: "50%",
              boxSizing: "border-box",
              background: cor.fundo,
              border: `2px solid ${cor.linhaForte}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: mono,
              fontWeight: 500,
              fontSize: 36,
              color: cor.ambar,
              opacity: prog(t, Math.max(opcoes[1].em, t0) - 0.1, 0.35),
            }}
          >
            {conector}
          </div>
        ) : null}
      </div>
    </div>
  );
};
