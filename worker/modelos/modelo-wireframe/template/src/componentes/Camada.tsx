import { PalavraWire, prog, saindo } from "../anim";
import { TITULO, encaixar, larguraTexto } from "../medida";
import { quebrar } from "../layoutPagina";
import { CARTAO, cor, mono, sans } from "../tema";

// Camada de texto selecionada (abertura e frase): um cartão claro na altura do peito, com a caixa de
// seleção vermelha, as alças nos cantos, o nome da camada em cima e a medida L × A embaixo. Cada
// palavra nasce como barra cinza de wireframe e vira texto no instante em que é dita.
export const Camada: React.FC<{
  t: number;
  de: number;
  // quando a saída termina (o cartão sai junto com a troca de layout, sem deixar quadro vazio)
  saiAte: number;
  topo: number;
  texto: string;
  tempos: number[];
  destaque?: string;
  nome: string;
  tamanho: number;
  // trecho do texto que é riscado em vermelho, e quando
  risco?: string;
  riscoEm?: number;
}> = ({ t, de, saiAte, topo, texto, tempos, destaque, nome, tamanho: tamanhoMax, risco, riscoEm }) => {
  const entra = prog(t, de - 0.05, 0.35);
  const sai = saindo(t, saiAte, 0.32);
  if (entra <= 0 || sai >= 1) return null;

  const padX = 46;
  const padY = 34;
  const largura = CARTAO.w;
  // o texto cabe sempre: até 3 linhas, reduzido até um mínimo legível (medido com a própria fonte)
  const disponivel = largura - 2 * padX;
  let tamanho = tamanhoMax;
  let linhas = quebrar(texto, Math.floor(disponivel / (tamanho * 0.56)));
  const cabe = () => linhas.length <= 3 && linhas.every((l) => larguraTexto(l, tamanho, TITULO) <= disponivel);
  while (!cabe() && tamanho > 48) {
    tamanho -= 2;
    linhas = quebrar(texto, Math.floor(disponivel / (tamanho * 0.56)));
  }
  if (!cabe()) {
    const q = encaixar(texto, { largura: disponivel, max: tamanho, min: 40, linhas: 4, estilo: () => TITULO });
    tamanho = q.tamanho;
    linhas = q.linhas.map((l) => l.map((w) => w.w).join(" "));
  }
  const alvoRisco = (risco ?? "").split(/\s+/).filter(Boolean).map((w) => w.toLowerCase().replace(/[.,!?:;]$/, ""));
  const todas = texto.split(/\s+/).map((w) => w.toLowerCase().replace(/[.,!?:;]$/, ""));
  const riscadas: number[] = [];
  for (let i = 0; alvoRisco.length && i + alvoRisco.length <= todas.length; i++) if (alvoRisco.every((a, j) => todas[i + j] === a)) alvoRisco.forEach((_, j) => riscadas.push(i + j));
  const emRisco = riscoEm ?? (riscadas.length ? tempos[riscadas[0]] : undefined);
  const entrelinha = Math.round(tamanho * 1.08);
  const altura = linhas.length * entrelinha + 2 * padY;
  const destaques = new Set((destaque ?? "").split(/\s+/).filter(Boolean).map((w) => w.toLowerCase()));

  // seleção: as alças aparecem uma a uma
  const sel = prog(t, de, 0.4);
  const alca = (k: number) => prog(t, de + 0.05 + k * 0.05, 0.22);
  const medida = prog(t, de + 0.25, 0.55);

  let k = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: CARTAO.x,
        top: topo,
        width: largura,
        opacity: 1 - sai,
        translate: `0 ${(1 - entra) * 34 - sai * 30}px`,
        scale: String(1 - 0.06 * sai),
      }}
    >
      {/* nome da camada */}
      <div
        style={{
          position: "absolute",
          left: -6,
          top: -52,
          fontFamily: mono,
          fontWeight: 700,
          fontSize: 30,
          color: "#FFFFFF",
          background: cor.vermelho,
          padding: "2px 12px",
          borderRadius: 6,
          opacity: sel,
          whiteSpace: "nowrap",
        }}
      >
        {nome}
      </div>
      {/* cartão */}
      <div
        style={{
          position: "relative",
          width: largura,
          height: altura,
          borderRadius: 14,
          background: cor.papel,
          boxShadow: "0 24px 60px rgba(10,10,12,0.30)",
          padding: `${padY}px ${padX}px`,
          boxSizing: "border-box",
          fontFamily: sans,
          fontWeight: 700,
          fontSize: tamanho,
          lineHeight: `${entrelinha}px`,
          color: cor.tinta,
          opacity: entra,
        }}
      >
        {linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {l.split(" ").map((w, j) => {
              const idx = k++;
              const em = tempos[idx] ?? de;
              const vermelho = destaques.has(w.toLowerCase().replace(/[.,!?:;]$/, ""));
              const rPos = riscadas.indexOf(idx);
              const riscar = emRisco !== undefined && rPos >= 0 ? prog(t, emRisco + rPos * 0.12, 0.3) : 0;
              return (
                <span key={j} style={{ position: "relative", display: "inline-block" }}>
                  <PalavraWire t={t} em={em} texto={w} barra="#DADDE2" cor={vermelho ? cor.vermelho : riscar > 0.5 ? cor.tintaSuave : undefined} margem={0.24} />
                  {riscar > 0 ? (
                    <span style={{ position: "absolute", left: -2, right: rPos < riscadas.length - 1 && riscadas[rPos + 1] === idx + 1 && j < l.split(" ").length - 1 ? `${-0.22 * tamanho}px` : `${0.24 * tamanho - 2}px`, top: "54%", height: Math.max(5, tamanho * 0.08), borderRadius: 3, background: cor.vermelho, transformOrigin: "left", scale: `${riscar} 1` }} />
                  ) : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {/* caixa de seleção */}
      <div
        style={{
          position: "absolute",
          left: -6,
          top: -6,
          width: largura + 12,
          height: altura + 12,
          border: `3px solid ${cor.vermelho}`,
          opacity: sel,
          boxSizing: "border-box",
        }}
      />
      {[
        [-6, -6],
        [largura + 6, -6],
        [-6, altura + 6],
        [largura + 6, altura + 6],
      ].map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - 11,
            top: y - 11,
            width: 22,
            height: 22,
            background: "#FFFFFF",
            border: `3px solid ${cor.vermelho}`,
            boxSizing: "border-box",
            transform: `scale(${alca(i)})`,
          }}
        />
      ))}
      {/* medida */}
      <div style={{ position: "absolute", left: 0, width: largura, top: altura + 24, display: "flex", justifyContent: "center", opacity: medida }}>
        <div
          style={{
            fontFamily: mono,
            fontWeight: 700,
            fontSize: 30,
            color: "#FFFFFF",
            background: cor.vermelho,
            padding: "3px 14px",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
        >
          {Math.round(largura * medida)} × {Math.round(altura * medida)}
        </div>
      </div>
    </div>
  );
};
