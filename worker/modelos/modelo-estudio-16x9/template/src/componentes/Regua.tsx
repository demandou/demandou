// A régua do episódio, no alto: chip "EP. 12", o capítulo atual (troca rolando quando um capítulo
// novo abre), o tempo do episódio correndo e a barra de capítulos que se preenche com o vídeo.
import { limitar, prog, relogio, segundos } from "../anim";
import type { Capitulo } from "../layout";
import type { Plano } from "../plano";
import { cor, MARGEM, REGUA, rotulo, W } from "../tema";

const LARGURA = W - 2 * MARGEM;
const VAO = 10;

export const Regua: React.FC<{ plano: Plano; capitulos: Capitulo[]; t: number }> = ({ plano, capitulos, t }) => {
  const ep = plano.episodio?.numero;
  const inicio = segundos(plano.episodio?.inicio);
  const lista: Capitulo[] = capitulos.length ? capitulos : [{ numero: 0, nome: "", de: 0, ate: plano.duracao }];
  const atual = [...lista].reverse().find((c) => t >= c.de - 0.05) ?? lista[0];
  const anterior = lista[lista.indexOf(atual) - 1];
  const fala = prog(t, atual.de - 0.05, 0.4);
  // o chip: o número do episódio; sem ele, o programa (se for curto) ou "CORTE"
  const area = (plano.marca.area ?? "").trim();
  const chipEp = ep ? `EP. ${ep}` : area && area.length <= 12 ? area : "CORTE";
  const larguraChip = chipEp.length * 0.72 * 34 + 40;
  // o nome do capítulo cabe no espaço entre o chip e o relógio: o corpo desce até 30 px, depois corta
  const relogioLargura = plano.episodio?.inicio ? 190 : 0;
  const livre = LARGURA - larguraChip - 24 - relogioLargura;
  const tamCapitulo = (nome: string) => Math.max(30, Math.min(34, livre / Math.max(1, (nome.length + 3) * 0.74)));
  // segmentos proporcionais ao tempo de cada capítulo
  const total = lista.reduce((s, c) => s + (c.ate - c.de), 0) || 1;
  const util = LARGURA - VAO * (lista.length - 1);
  let x = MARGEM;

  const etiqueta = (c: Capitulo, y: number, opacidade: number) =>
    c.nome ? (
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: REGUA.altura, display: "flex", alignItems: "center", gap: 14, translate: `0 ${y}px`, opacity: opacidade }}>
        <span style={{ ...rotulo, fontSize: tamCapitulo(c.nome), color: cor.acento }}>{String(c.numero).padStart(2, "0")}</span>
        <span
          style={{
            ...rotulo,
            fontSize: tamCapitulo(c.nome),
            color: cor.texto,
            whiteSpace: "nowrap",
            // só corta (com reticências) o nome que não cabe; a entrelinha folgada guarda os acentos
            ...((c.nome.length + 3) * 0.74 * tamCapitulo(c.nome) > livre ? { overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, lineHeight: 1.5 } : {}),
          }}
        >
          {c.nome}
        </span>
      </div>
    ) : null;

  return (
    <>
      <div style={{ position: "absolute", left: MARGEM, top: REGUA.y, height: REGUA.altura, width: LARGURA, display: "flex", alignItems: "center" }}>
        <div
          style={{
            height: REGUA.altura,
            width: larguraChip,
            borderRadius: 12,
            background: cor.acento,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ ...rotulo, fontSize: 34, color: cor.sobreAcento }}>{chipEp}</span>
        </div>
        <div style={{ position: "relative", marginLeft: 24, height: REGUA.altura, flex: 1, overflow: "hidden" }}>
          {anterior && fala < 1 ? etiqueta(anterior, -42 * fala, 1 - fala) : null}
          {etiqueta(atual, anterior ? 42 * (1 - fala) : 0, anterior ? fala : 1)}
        </div>
        {plano.episodio?.inicio ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width={18} height={20} viewBox="0 0 18 20">
              <path d="M2 2 L16 10 L2 18 Z" fill={cor.acento} />
            </svg>
            <span style={{ ...rotulo, fontSize: 32, color: cor.textoSuave }}>{relogio(inicio + t)}</span>
          </div>
        ) : null}
      </div>
      {lista.map((c) => {
        const w = (util * (c.ate - c.de)) / total;
        const esquerda = x;
        x += w + VAO;
        const cheio = limitar((t - c.de) / Math.max(0.01, c.ate - c.de));
        const corrente = c === atual;
        return (
          <div key={`${c.numero}-${c.de}`} style={{ position: "absolute", left: esquerda, top: REGUA.barraY, width: w, height: 8, borderRadius: 4, background: cor.apagado, overflow: "hidden" }}>
            <div style={{ width: `${cheio * 100}%`, height: "100%", borderRadius: 4, background: corrente ? cor.acento : cor.texto, opacity: corrente ? 1 : 0.86 }} />
          </div>
        );
      })}
    </>
  );
};

