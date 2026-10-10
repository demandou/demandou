import { indicesDoTrecho, prog, temposDasPalavras, troca, usePalavras } from "../anim";
import { diagramar, encaixar, type Fonte } from "../medida";
import { cor, sans } from "../tema";

// O ponto que pula: a marca do Pronúncia. Ele salta para a palavra (ou sílaba) que está sendo
// dita e pousa nela com um leve achatamento — o ritmo da fala desenhado na tela.
export type Alvo = { t: number; x: number; y: number };

export const posicaoDoPonto = (alvos: Alvo[], t: number) => {
  let k = -1;
  for (let i = 0; i < alvos.length; i++) if (alvos[i].t - 0.1 <= t) k = i;
  if (k < 0) return null;
  const alvo = alvos[k];
  const de = alvos[k - 1] ?? { ...alvo, y: alvo.y - 70 };
  const p = prog(t, alvo.t - 0.1, 0.2, troca);
  const dist = Math.hypot(alvo.x - de.x, alvo.y - de.y);
  const altura = Math.min(90, 26 + dist * 0.18);
  const x = de.x + (alvo.x - de.x) * p;
  const y = de.y + (alvo.y - de.y) * p - Math.sin(Math.PI * p) * altura;
  // pouso: achata 1 quadro ou 2 e volta
  const pouso = prog(t, alvo.t + 0.1, 0.12);
  const achata = p >= 1 && pouso < 1 ? Math.sin(Math.PI * pouso) * 0.22 : 0;
  return { x, y, achata, k };
};

export const Ponto: React.FC<{ alvos: Alvo[]; t: number; raio?: number; cor?: string; opacidade?: number }> = ({
  alvos,
  t,
  raio = 12,
  cor: c = cor.coral,
  opacidade = 1,
}) => {
  const pos = posicaoDoPonto(alvos, t);
  if (!pos) return null;
  const surge = alvos.length ? prog(t, alvos[0].t - 0.1, 0.16) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: pos.x - raio,
        top: pos.y - raio,
        width: raio * 2,
        height: raio * 2,
        borderRadius: "50%",
        background: c,
        opacity: surge * opacidade,
        scale: `${1 + pos.achata} ${1 - pos.achata}`,
      }}
    />
  );
};

// Texto que se monta palavra a palavra na fala, com o ponto pulando para cada palavra dita.
// Mede com a fonte de verdade, quebra em até `maxLinhas` linhas e reduz o corpo até `minimo`.
export const TextoFalado: React.FC<{
  texto: string;
  em: number;
  t: number;
  largura: number;
  maximo: number;
  minimo: number;
  maxLinhas?: number;
  peso?: number;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  alinhar?: "esquerda" | "centro";
  semPonto?: boolean;
  limite?: number;
  corTexto?: string;
}> = ({ texto, em, t, largura, maximo, minimo, maxLinhas = 3, peso = 800, destaque, risco, riscoEm, alinhar = "esquerda", semPonto, limite, corTexto = cor.tinta }) => {
  const palavras = usePalavras();
  const fonte: Fonte = { peso };
  const { tamanho, linhas } = encaixar(texto, largura, maximo, minimo, maxLinhas, fonte);
  const entre = 1.14;
  const postas = diagramar(linhas, tamanho, entre, fonte, alinhar, largura);
  const tempos = temposDasPalavras(palavras, em, postas.length, limite);
  const marcadas = indicesDoTrecho(texto, destaque);
  const riscadas = indicesDoTrecho(texto, risco);
  const altura = linhas.length * tamanho * entre;
  // o ponto pousa sobre cada palavra quando ela é dita
  const alvos: Alvo[] = postas.map((p, i) => ({ t: tempos[i], x: p.x + p.l / 2, y: p.y - tamanho * 0.06 }));
  const tRisco = riscoEm ?? (riscadas.size ? tempos[Math.max(...riscadas)] + 0.25 : 0);

  return (
    <div style={{ position: "relative", width: largura, height: altura, marginTop: tamanho * 0.18 }}>
      {postas.map((p, i) => {
        const e = prog(t, tempos[i] - 0.05, 0.22);
        const estilo: React.CSSProperties = e >= 1 ? {} : { opacity: e, translate: `0 ${(1 - e) * 12}px` };
        const riscada = riscadas.has(i);
        const pr = riscada ? prog(t, tRisco, 0.3) : 0;
        return (
          <div
            key={`${p.w}-${i}`}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              fontFamily: sans,
              fontWeight: peso,
              fontSize: tamanho,
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              whiteSpace: "nowrap",
              color: marcadas.has(i) ? cor.coral : riscada && pr > 0 ? cor.apagado : corTexto,
              ...estilo,
            }}
          >
            {p.w}
            {riscada && pr > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: -4,
                  top: "54%",
                  height: Math.max(5, tamanho * 0.08),
                  width: `calc(${pr * 100}% + 8px)`,
                  borderRadius: 4,
                  background: cor.coral,
                }}
              />
            ) : null}
          </div>
        );
      })}
      {semPonto ? null : <Ponto alvos={alvos} t={t} raio={Math.max(8, Math.round(tamanho * 0.12))} />}
    </div>
  );
};

// traço desenhado à mão embaixo do que está certo (o "certo" do Pronúncia)
export const Traco: React.FC<{ largura: number; p: number; espessura?: number; cor?: string; style?: React.CSSProperties }> = ({
  largura,
  p,
  espessura = 7,
  cor: c = cor.coral,
  style,
}) => {
  const h = 26;
  const d = `M 4 ${h * 0.62} C ${largura * 0.3} ${h * 0.2}, ${largura * 0.62} ${h * 0.95}, ${largura - 4} ${h * 0.38}`;
  return (
    <svg width={largura} height={h} style={{ position: "absolute", overflow: "visible", ...style }}>
      <path d={d} fill="none" stroke={c} strokeWidth={espessura} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};
