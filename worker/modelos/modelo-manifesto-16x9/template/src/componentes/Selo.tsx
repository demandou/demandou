import { prog, troca } from "../anim";
import type { Selo as SeloT } from "../plano";
import { APERTO, caber, CAMPOS, display, letreiro, MARGEM, QUADRO } from "../tema";

// O selo: um pequeno pôster na altura do peito, por cima do quadro cheio. Entra varrendo da
// esquerda (borda seca) já com o primeiro texto; cada item seguinte troca o anterior no instante em
// que é dito (troca seca, e a tinta do texto novo corre da esquerda para a direita); o item de
// acento vira o selo para o branco. Sai varrendo para a direita (ou some no corte do próximo pôster).
// O texto grande é vazado: o vídeo da pessoa aparece dentro dele. As marcas embaixo acendem uma a
// uma (ex.: os 12 meses de um ano passando).
const LARGURA = 640;
const PAD = 34;
const ROTULO = 28;
const TEXTO = 128;
const MARCA = 12;

export const Selo: React.FC<{ s: SeloT; t: number; topo: number; fim: number; saiSeco: boolean; centroX?: number }> = ({ s, t, topo, fim, saiSeco, centroX = QUADRO.w / 2 }) => {
  const itens = [...s.itens].sort((a, b) => a.em - b.em);
  const primeiro = itens[0]?.em ?? s.de;
  const entra = prog(t, primeiro - 0.14, 0.22, troca);
  const sai = saiSeco ? 0 : prog(t, fim - 0.2, 0.2, troca);
  if (entra <= 0 || sai >= 1 || itens.length === 0 || (saiSeco && t >= fim + 0.25)) return null;

  // o item da vez (e a cor do selo) troca 0,02 s antes da palavra
  const k = Math.max(0, itens.reduce((ultimo, it, i) => (t >= it.em - 0.02 ? i : ultimo), 0));
  const item = itens[k];
  const tinta = k === 0 ? 1 : prog(t, item.em - 0.02, 0.22);
  const c = CAMPOS[item.acento ? "papel" : (s.campo ?? "cobalto")];
  const temRotulo = itens.some((i) => i.rotulo);
  const altura = PAD * 2 + (temRotulo ? ROTULO + 18 : 0) + TEXTO + (s.marcas ? 30 + MARCA : 0);
  const x = Math.max(MARGEM, Math.min(QUADRO.w - MARGEM - LARGURA, centroX - LARGURA / 2));
  const yTexto = PAD + (temRotulo ? ROTULO + 18 : 0);
  const id = `selo${String(s.de).replace(/[^0-9]/g, "")}`;
  const tam = caber(item.texto, LARGURA - PAD * 2, TEXTO, 900, APERTO);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: topo,
        width: LARGURA,
        height: altura,
        clipPath: `inset(0 ${(1 - entra) * 100}% 0 ${sai * 100}%)`,
      }}
    >
      <svg width={LARGURA} height={altura} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id={`${id}-tinta`}>
            <rect x={0} y={0} width={LARGURA * tinta} height={altura} />
          </clipPath>
          <clipPath id={`${id}-lapis`}>
            <rect x={LARGURA * tinta} y={0} width={LARGURA * (1 - tinta)} height={altura} />
          </clipPath>
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={LARGURA} height={altura}>
            <rect width={LARGURA} height={altura} fill="white" />
            <text
              x={LARGURA / 2 - (APERTO * tam) / 2}
              y={yTexto + (TEXTO + 0.768 * tam) / 2}
              textAnchor="middle"
              fontFamily={display}
              fontWeight={900}
              fontSize={tam}
              letterSpacing={APERTO * tam}
              // o espaço da Unbounded é estreito ao lado do "1": abre um pouco entre as palavras
              wordSpacing={0.16 * tam}
              fill="black"
              clipPath={`url(#${id}-tinta)`}
            >
              {item.texto.toLocaleUpperCase("pt-BR")}
            </text>
          </mask>
        </defs>
        <rect width={LARGURA} height={altura} fill={c.fundo} mask={`url(#${id}-m)`} />
        {/* enquanto a tinta corre, o resto da palavra nova está "a lápis" */}
        {tinta < 1 ? (
          <text
            x={LARGURA / 2 - (APERTO * tam) / 2}
            y={yTexto + (TEXTO + 0.768 * tam) / 2}
            textAnchor="middle"
            fontFamily={display}
            fontWeight={900}
            fontSize={tam}
            letterSpacing={APERTO * tam}
            wordSpacing={0.16 * tam}
            fill={c.lapis}
            clipPath={`url(#${id}-lapis)`}
          >
            {item.texto.toLocaleUpperCase("pt-BR")}
          </text>
        ) : null}
      </svg>
      {temRotulo ? (
        <div style={{ ...letreiro, position: "absolute", left: 0, right: 0, top: PAD, textAlign: "center", color: c.letreiro }}>
          {item.rotulo ?? ""}
        </div>
      ) : null}
      {s.marcas ? (
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: PAD, height: MARCA, display: "flex", gap: 10 }}>
          {Array.from({ length: s.marcas.quantas }, (_, i) => {
            const marcas = s.marcas!;
            const quando = marcas.de + ((marcas.ate - marcas.de) * (i + 1)) / marcas.quantas;
            const acesa = prog(t, quando - 0.1, 0.12);
            return <div key={i} style={{ flex: 1, background: acesa > 0 ? c.texto : c.lapis, opacity: acesa > 0 ? 0.35 + 0.65 * acesa : 1 }} />;
          })}
        </div>
      ) : null}
    </div>
  );
};
