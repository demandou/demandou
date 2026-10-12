import { Bloco, Linha, prog, useTempo } from "../anim";
import type { Gancho as TGancho, Palavra } from "../plano";
import { ESPACO, ITALICO, larguraTexto, SERIF } from "../medida";
import { cor, rotulo, serif, sombra } from "../tema";

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
// No quadro deitado a faixa do peito é larga e baixa: as linhas curtas se juntam em fileiras (cada
// uma continua entrando no seu tempo), no maior corpo que cabe na largura e na altura.
const ALTURA_ROTULO = 58;
const TRACO = 13;
const arrumar = (m: TGancho, largura: number, altura: number) => {
  const estilo = (i: number) => (m.enfase === i ? ITALICO : SERIF);
  for (let tamanho = 132; tamanho >= 56; tamanho -= 2) {
    const fileiras: number[][] = [];
    let ocupado = 0;
    let cabe = true;
    m.linhas.forEach((linha, i) => {
      const w = larguraTexto(linha, tamanho, estilo(i));
      if (w > largura) cabe = false;
      const atual = fileiras[fileiras.length - 1];
      if (atual && ocupado + ESPACO * tamanho + w <= largura) {
        atual.push(i);
        ocupado += ESPACO * tamanho + w;
      } else {
        fileiras.push([i]);
        ocupado = w;
      }
    });
    const comTraco = m.enfase !== undefined && fileiras.some((f) => f.includes(m.enfase as number));
    const h = fileiras.length * tamanho + (m.rotulo ? ALTURA_ROTULO : 0) + (comTraco ? TRACO : 0);
    if (cabe && h <= altura) return { tamanho, fileiras };
  }
  return { tamanho: 56, fileiras: m.linhas.map((_, i) => [i]) };
};

export const Gancho: React.FC<{ m: TGancho; palavras: Palavra[]; largura: number; altura: number }> = ({ m, palavras, largura, altura }) => {
  const t = useTempo();
  const { tamanho, fileiras } = arrumar(m, largura, altura);
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
      {fileiras.map((fileira, k) => (
        <div key={k} style={{ display: "flex", alignItems: "flex-start", gap: `0 ${ESPACO}em`, fontSize: tamanho }}>
      {fileira.map((i) => {
        const linha = m.linhas[i];
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
        </div>
      ))}
    </Bloco>
  );
};
