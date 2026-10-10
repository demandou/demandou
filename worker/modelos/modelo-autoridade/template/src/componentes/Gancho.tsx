import { Bloco, Linha, prog, useTempo } from "../anim";
import type { Gancho as TGancho, Palavra } from "../plano";
import { caberNaLargura, cor, rotulo, serif, sombra, zona } from "../tema";

const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Quando cada linha começa a ser falada: procura, em ordem, a primeira palavra de cada linha
// entre as palavras do trecho. Sem achar, a linha entra logo depois da anterior.
const temposDasLinhas = (m: TGancho, palavras: Palavra[]) => {
  const falado = palavras.filter((p) => p.em >= m.de - 0.3 && p.em < m.ate);
  const tempos: number[] = [];
  let cursor = 0;
  for (const linha of m.linhas) {
    const primeira = normalizar(linha.split(/\s+/)[0] ?? "");
    const achou = falado.findIndex((p, k) => k >= cursor && normalizar(p.w) === primeira);
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, m.de);
    if (achou >= 0) {
      tempos.push(Math.max(anterior, falado[achou].em - 0.08));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.35);
  }
  return tempos;
};

// Título de abertura: rótulo + até 3 linhas serifadas que entram no ritmo da fala;
// a linha em destaque ganha um traço de latão quando é dita.
export const Gancho: React.FC<{ m: TGancho; palavras: Palavra[] }> = ({ m, palavras }) => {
  const t = useTempo();
  const largura = 1080 - zona.esquerda - zona.direita;
  const tamanho = caberNaLargura(m.linhas, largura, 132);
  const tempos = temposDasLinhas(m, palavras);
  const inicio = Math.max(0, m.de);

  return (
    <Bloco t={t} ate={m.ate}>
      {m.rotulo ? (
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, opacity: prog(t, inicio, 0.4) }}>
          <div style={{ width: 56 * prog(t, inicio, 0.5), height: 2, background: cor.latao }} />
          <div style={{ ...rotulo, color: cor.papel }}>{m.rotulo}</div>
          <div style={{ width: 56 * prog(t, inicio, 0.5), height: 2, background: cor.latao }} />
        </div>
      ) : null}
      {m.linhas.map((linha, i) => {
        const destaque = m.enfase === i;
        return (
          <div key={linha} style={{ position: "relative" }}>
            <Linha
              p={prog(t, tempos[i], 0.45)}
              style={{
                fontFamily: serif,
                fontStyle: destaque ? "italic" : "normal",
                fontSize: tamanho,
                lineHeight: 1.0,
                color: destaque ? cor.lataoClaro : cor.papel,
                textAlign: "center",
                whiteSpace: "nowrap",
                textShadow: sombra,
              }}
            >
              {linha}
            </Linha>
            {destaque ? (
              <div
                style={{
                  height: 3,
                  margin: "10px auto 0",
                  width: `${prog(t, tempos[i] + 0.35, 0.7) * 72}%`,
                  background: cor.latao,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </Bloco>
  );
};
