import { Escrita, limitar, prog, saindo, temposDoTexto, Traco } from "../anim";
import type { Cta, Nota, Palavra, Plano } from "../plano";
import { encaixar } from "../medida";
import { cor, corpoQueCabe, LARGURA_ITALICO, LIMITE_APP, QUADRO, serif, traco, versalete } from "../tema";

// A largura dos cartões de tela cheia no quadro deitado: largos e baixos, na faixa de baixo
export const LARGURA_DEITADO = 1500;

type Icone = "salvar" | "seguir" | "comentar" | "enviar" | "link";

export const Icone: React.FC<{ icone: Icone; p: number }> = ({ icone, p }) => {
  const cheio = limitar(p * 1.5 - 0.3);
  const c = cor.musgo;
  const fundo = `rgba(47,91,69,${0.9 * cheio})`;
  switch (icone) {
    case "salvar":
      return (
        <svg width={76} height={86} viewBox="-38 -43 76 86" style={{ overflow: "visible" }}>
          <path d="M -24 -34 L 24 -34 L 24 38 L 0 20 L -24 38 Z" fill={fundo} />
          <Traco d="M -24 -34 L 24 -34 L 24 38 L 0 20 L -24 38 Z" p={limitar(p * 1.4)} cor={c} largura={traco.forte} />
        </svg>
      );
    case "seguir":
      return (
        <svg width={86} height={86} viewBox="-43 -43 86 86" style={{ overflow: "visible" }}>
          <circle r={36} fill={fundo} />
          <Traco d="M 0 -36 A 36 36 0 1 1 -0.1 -36" p={limitar(p * 1.4)} cor={c} largura={traco.forte} />
          <Traco d="M -15 0 L 15 0 M 0 -15 L 0 15" p={limitar(p * 2 - 0.4)} cor={cheio > 0.5 ? cor.etiqueta : c} largura={traco.forte} />
        </svg>
      );
    case "comentar":
      return (
        <svg width={90} height={86} viewBox="-45 -43 90 86" style={{ overflow: "visible" }}>
          <path d="M -36 -30 L 36 -30 L 36 18 L -6 18 L -22 34 L -20 18 L -36 18 Z" fill={fundo} />
          <Traco d="M -36 -30 L 36 -30 L 36 18 L -6 18 L -22 34 L -20 18 L -36 18 Z" p={limitar(p * 1.4)} cor={c} largura={traco.forte} />
        </svg>
      );
    case "link":
      // dois elos de corrente a pena
      return (
        <svg width={92} height={86} viewBox="-46 -43 92 86" style={{ overflow: "visible" }}>
          <g transform="rotate(-40)">
            <rect x={-40} y={-15} width={46} height={30} rx={15} fill={fundo} />
            <Traco d="M -10 -15 L -25 -15 A 15 15 0 0 0 -25 15 L -10 15 A 15 15 0 0 0 -10 -15" p={limitar(p * 1.4)} cor={c} largura={traco.forte} />
            <Traco d="M 10 15 L 25 15 A 15 15 0 0 0 25 -15 L 10 -15 A 15 15 0 0 0 10 15" p={limitar(p * 1.4 - 0.2)} cor={c} largura={traco.forte} />
            <Traco d="M -14 0 L 14 0" p={limitar(p * 2 - 0.8)} cor={cheio > 0.5 ? cor.tinta : c} largura={traco.forte} />
          </g>
        </svg>
      );
    case "enviar":
      return (
        <svg width={90} height={86} viewBox="-45 -43 90 86" style={{ overflow: "visible" }}>
          <path d="M -36 -4 L 36 -32 L 14 34 L 2 8 Z" fill={fundo} />
          <Traco d="M -36 -4 L 36 -32 L 14 34 L 2 8 Z M 2 8 L 36 -32" p={limitar(p * 1.4)} cor={c} largura={traco.forte} />
        </svg>
      );
  }
};

// Raminho prensado no canto do cartão (como o espécime da etiqueta)
export const RAMINHO = "M 0 200 C 6 140 0 80 14 0";
export const FOLHAS_RAMINHO = [
  { y: 160, ang: -150, x: 2 },
  { y: 126, ang: -30, x: 3 },
  { y: 88, ang: -158, x: 4 },
  { y: 54, ang: -24, x: 8 },
  { y: 18, ang: -110, x: 12 },
];
export const folhinha = "M 0 0 C 12 -22 46 -24 64 0 C 46 22 12 22 0 0 Z";

// O raminho prensado do canto do cartão, que se desenha quando o texto termina. `escala`: o tamanho
// (1 = o do vertical, 220×300); o cartão deitado usa um pouco menor, para caber na faixa de baixo.
export const Raminho: React.FC<{ p: number; right: number; top: number; escala?: number }> = ({ p: raminho, right, top, escala = 1 }) => (
  <svg width={220 * escala} height={300 * escala} viewBox="-90 -30 220 260" style={{ position: "absolute", right, top, overflow: "visible" }}>
    <Traco d={RAMINHO} p={raminho} cor={cor.folhaTinta} largura={traco.medio} />
    {FOLHAS_RAMINHO.map((f, i) => {
      const q = limitar(raminho * 1.5 - (1 - f.y / 200) * 0.6 - 0.1);
      return q > 0 ? (
        <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.ang}) scale(${0.4 + 0.6 * q})`}>
          <path d={folhinha} fill={cor.folha} opacity={0.8 * q} filter="url(#aquarela)" />
          <path d={folhinha} fill="none" stroke={cor.tinta} strokeWidth={2.2} opacity={q} />
          <path d="M 0 0 L 58 0" stroke={cor.folhaTinta} strokeWidth={1.4} opacity={q} />
        </g>
      ) : null;
    })}
  </svg>
);

// O raminho no cartão deitado (o mesmo desenho, 80% do tamanho)
export const ESCALA_RAMINHO = 0.8;

// A assinatura "leg. Nome · Área" do cartão de fechamento. No cartão deitado ela fica na linha do
// rótulo (à direita, antes dos ícones): o cartão cresce para os lados, não para cima.
export const Assinatura: React.FC<{ texto: string }> = ({ texto }) => (
  <div style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: 40, color: cor.tinta, opacity: 0.9, whiteSpace: "nowrap" }}>
    <span style={{ fontFamily: versalete, fontStyle: "normal", fontWeight: 700, fontSize: 30, letterSpacing: "0.1em", textTransform: "uppercase", color: cor.musgo, marginRight: 12 }}>
      leg.
    </span>
    {texto}
  </div>
);

// Cartão de herbário: sobe até a altura do peito com a pessoa em tela cheia (no quadro deitado, na
// faixa de baixo, abaixo do queixo: largo e baixo, nunca uma pilha alta).
// No fechamento, as fitas de linho prendem o cartão (salvar) e os ícones se desenham.
// As linhas do plano (formato antigo) se juntam quando cabem: o cartão deitado é largo.
export const Cartao: React.FC<{
  m: Cta | Nota;
  t: number;
  fim: number;
  palavras: Palavra[];
  marca: Plano["marca"];
  topo: number;
  entrada: number;
}> = ({ m, t, fim, palavras, marca, topo, entrada }) => {
  const sobe = prog(t, entrada, 0.7);
  const sai = saindo(t, fim, 0.3);
  if (sobe <= 0.001 || sai >= 1) return null;
  const cta = m.tipo === "cta";
  const linhas = m.linhas ?? [];
  const principais = cta && linhas.length > 1 ? linhas.slice(0, -1) : linhas;
  const apoio = cta && linhas.length > 1 ? linhas[linhas.length - 1] : undefined;
  const largura = LARGURA_DEITADO;
  const canto = Math.round(210 * ESCALA_RAMINHO);
  const larguraTexto = largura - 80 - canto;
  const rotulo = (m.tipo === "nota" ? m.rotulo : undefined) ?? (cta ? "Herbário" : "Nota");
  const assinatura = [marca.nome, marca.area].filter(Boolean).join(" · ");
  const icones = cta ? (m.icones ?? (m.icone ? [{ em: m.em ?? m.de + 0.3, icone: m.icone }] : [])) : [];
  const linhaY = icones.length ? 126 : 92;
  const textoY = linhaY + 24;
  // o maior corpo em que o cartão cabe entre o queixo e o limite de baixo (o texto encolhe primeiro)
  const maximo = cta ? 96 : 84;
  const medir = (max: number) => {
    const e = encaixar(principais.join(" "), { largura: larguraTexto, max, min: Math.min(64, max), linhas: Math.max(1, principais.length), fonte: "serif" });
    const tamApoio = apoio ? corpoQueCabe([apoio], larguraTexto, Math.min(54, Math.round(max * 0.6)), 40, LARGURA_ITALICO) : 0;
    const alturaTexto = e.linhas.length * e.tamanho * 1.0 + (apoio ? 12 + tamApoio * 1.2 : 0);
    const altura = Math.max(textoY + alturaTexto + 40, linhaY + 6 + 260 * ESCALA_RAMINHO + 24);
    return { e, tamApoio, altura };
  };
  let medida = medir(maximo);
  for (const max of [88, 80, 72, 64]) {
    if (topo + medida.altura <= LIMITE_APP + 4) break;
    medida = medir(Math.min(max, maximo));
  }
  const { e, tamApoio, altura } = medida;
  const tempos = temposDoTexto(e.linhas.join(" "), palavras, m.de, m.ate, m.de);
  const temposApoio = apoio ? temposDoTexto(apoio, palavras, m.de, m.ate, m.de) : [];
  const emSalvar = icones.find((i) => i.icone === "salvar")?.em;
  const fitas = emSalvar === undefined ? 0 : prog(t, emSalvar + 0.05, 0.35);
  const fimTexto = Math.max(tempos[tempos.length - 1] ?? m.de, temposApoio[temposApoio.length - 1] ?? m.de);
  const raminho = prog(t, fimTexto - 0.2, 0.9);
  const lapis = prog(t, entrada, 0.3);
  const y = Math.min(topo, LIMITE_APP - altura);
  return (
    <div
      style={{
        position: "absolute",
        left: (QUADRO.w - largura) / 2,
        top: y,
        width: largura,
        height: altura,
        translate: `0 ${(1 - sobe) * (QUADRO.h - y + 40) + sai * 30}px`,
        rotate: `${-1.2 * sobe}deg`,
        opacity: 1 - sai,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: cor.etiqueta,
          border: `2.5px solid ${cor.tinta}`,
          boxShadow: "0 18px 40px rgba(20,28,22,0.28)",
        }}
      />
      <div style={{ position: "absolute", inset: 12, border: `1.2px solid ${cor.tinta}`, opacity: 0.6 }} />
      {/* fitas de linho que prendem o cartão */}
      {fitas > 0
        ? [
            { left: -34, top: -14, rot: -38 },
            { right: -34, top: -14, rot: 38 },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                ...(f.left !== undefined ? { left: f.left } : { right: f.right }),
                top: f.top,
                width: 150,
                height: 48,
                background: "rgba(232,226,204,0.88)",
                border: "1px solid rgba(31,38,32,0.25)",
                rotate: `${f.rot}deg`,
                scale: `${0.6 + 0.4 * fitas}`,
                opacity: fitas,
              }}
            />
          ))
        : null}
      <div style={{ position: "absolute", left: 40, right: 40, top: 30, height: linhaY - 38, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 28 }}>
        <div style={{ fontFamily: versalete, fontWeight: 700, fontSize: 32, letterSpacing: "0.12em", textTransform: "uppercase", color: cor.musgo }}>{rotulo}</div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {cta && assinatura ? <Assinatura texto={assinatura} /> : null}
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {icones.map((ic, i) => (
              <Icone key={i} icone={ic.icone} p={prog(t, ic.em, 0.5)} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: linhaY, height: 2, background: cor.tinta, opacity: 0.7 }} />
      <div style={{ position: "absolute", left: 40, top: textoY, width: larguraTexto }}>
        <Escrita linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} familia={serif} peso={700} destaque={m.destaque} lapis={lapis} entrelinha={1.0} />
        {apoio ? (
          <Escrita
            linhas={[apoio]}
            tempos={temposApoio}
            t={t}
            tamanho={tamApoio}
            familia={serif}
            peso={600}
            italico
            corTinta={cor.musgo}
            lapis={lapis}
            estilo={{ marginTop: 12 }}
          />
        ) : null}
      </div>
      <Raminho p={raminho} right={34} top={linhaY + 6} escala={ESCALA_RAMINHO} />
    </div>
  );
};
