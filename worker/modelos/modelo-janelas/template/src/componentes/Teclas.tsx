// Teclas grandes (keycaps) que afundam no instante em que cada tecla é dita.
// Antes de ser dita, a tecla espera "a lápis": contorno tracejado e o nome apagado. Na palavra,
// ela ganha corpo, afunda e fica violeta enquanto o atalho é segurado; no fim, todas sobem juntas.
import { arrasto, limitar, mistura, prog, saindo } from "../anim";
import { encaixar } from "../medida";
import { duasFilas, unidades } from "../teclado";
import type { Tecla } from "../plano";
import { TextoFalado } from "../texto";
import { cor, mono, rotuloCaixaAlta, sans } from "../tema";
import { Icone } from "./Icones";

// largura de cada tecla em "unidades" (1 = tecla de uma letra)
const larguraDaFila = (ks: string[], u: number, vao: number) => ks.reduce((s, k) => s + unidades(k) * u, 0) + Math.max(0, ks.length - 1) * vao;

const Legenda: React.FC<{ tecla: string; tamanho: number; cor: string }> = ({ tecla, tamanho, cor: c }) => {
  const shift = /^shift$/i.test(tecla.trim());
  const enter = /^(enter|return)$/i.test(tecla.trim());
  return (
    <div style={{ display: "flex", alignItems: "center", gap: tamanho * 0.22, color: c, fontFamily: mono, fontWeight: 700, fontSize: tamanho, lineHeight: 1 }}>
      {shift ? <Icone nome="setaCima" tamanho={tamanho * 0.78} cor={c} peso={3.6} /> : null}
      {enter ? <Icone nome="enter" tamanho={tamanho * 0.78} cor={c} peso={3.6} /> : null}
      <span>{tecla}</span>
    </div>
  );
};

export const Teclas: React.FC<{
  t: number;
  cx: number;
  cy: number;
  u: number;
  teclas: Tecla[];
  // teclas do momento anterior (continuam na tela e são trocadas em `trocaEm`)
  anteriores?: string[];
  trocaEm?: number;
  rotulo?: string;
  rotuloEm?: number;
  chip?: { texto: string; em: number };
  de: number;
  ate: number;
  // quando as teclas sobem (padrão: 0,5 s depois da última)
  soltaEm?: number;
  // posição das teclas no momento anterior: elas deslizam de lá para cá
  antes?: { cx: number; cy: number; u: number; largura: number };
  // espaço máximo da fila de teclas (px)
  largura?: number;
  // o momento seguinte continua estas teclas: some no fim, sem animação de saída
  semSaida?: boolean;
  // frase curta embaixo das teclas (já medida) e o instante de cada palavra
  descricao?: { texto: string; tempos: number[] };
  // quando as teclas entram (a lápis); padrão: depois que a janela da pessoa assentou
  entraEm?: number;
  // quando terminam de sair (padrão: logo depois do fim do momento)
  saiEm?: number;
  // faixa livre embaixo da pessoa: com duas filas, o conjunto (rótulo, teclas, frase) fica no meio dela
  regiao?: { y: number; h: number };
}> = ({ t, cx: cx1, cy: cy1, u: uBase, teclas, anteriores, trocaEm, rotulo, rotuloEm, chip, de, ate, soltaEm, antes, semSaida, largura = 960, descricao, entraEm, saiEm, regiao }) => {
  if (semSaida && t >= ate) return null;
  // um atalho comprido encolhe as teclas para caber na largura
  const somaU = teclas.reduce((s, k) => s + unidades(k.tecla), 0) + 0.42 * Math.max(0, teclas.length - 1);
  const umaFila = Math.min(uBase, largura / Math.max(somaU, 1));
  // palavras compridas: em vez de encolher demais, as teclas quebram em duas filas
  const filasDe = (ks: string[]) => (!anteriores && !antes && duasFilas(ks, largura, uBase) ? [ks.slice(0, Math.ceil(ks.length / 2)), ks.slice(Math.ceil(ks.length / 2))] : [ks]);
  const filas = filasDe(teclas.map((k) => k.tecla));
  const somaFila = (ks: string[]) => ks.reduce((s, k) => s + unidades(k), 0) + 0.42 * Math.max(0, ks.length - 1);
  const u1 = filas.length > 1 ? Math.min(uBase * 0.8, ...filas.map((f) => largura / somaFila(f))) : umaFila;
  const pG = antes ? prog(t, de, 0.62, arrasto) : 1;
  const cx = antes ? mistura(antes.cx, cx1, pG) : cx1;
  const cy = antes ? mistura(antes.cy, cy1, pG) : cy1;
  const uAntes = antes && anteriores ? Math.min(antes.u, antes.largura / Math.max(anteriores.reduce((s, k) => s + unidades(k), 0) + 0.42 * Math.max(0, anteriores.length - 1), 1)) : u1;
  const u = antes ? mistura(uAntes, u1, pG) : u1;
  const vao = u * 0.42;
  const skirt = Math.round(u * 0.12);
  const novas = teclas.map((k) => k.tecla);
  const comAnteriores = !!anteriores && anteriores.length === novas.length;
  const troca = trocaEm ?? (teclas.length ? Math.min(...teclas.map((k) => k.em)) - 0.5 : de);
  const pTroca = comAnteriores ? prog(t, troca, 0.32) : 1;
  const ultima = teclas.length ? Math.max(...teclas.map((k) => k.em)) : de;
  const solta = soltaEm ?? ultima + 0.55;

  // entra depois que a janela da pessoa assentou no lugar novo (nunca por cima do rosto)
  const entra = comAnteriores ? 1 : prog(t, entraEm ?? de + 0.45, 0.3);
  const sai = semSaida ? 0 : saindo(t, saiEm ?? ate + 0.06, 0.2);
  if (entra <= 0.001 || sai >= 0.999) return null;

  const larguras = novas.map((k, i) => mistura(comAnteriores ? unidades(anteriores![i]) * u : unidades(k) * u, unidades(k) * u, pTroca));
  // posição de cada tecla (uma ou duas filas, cada fila centrada)
  const vaoFilas = 30;
  const alturaFilas = filas.length * (u + skirt) + (filas.length - 1) * vaoFilas;
  // o rótulo de cima cabe sempre: diminui até 30 px e, se precisar, quebra em duas linhas
  const fonteRotulo = { caixaAlta: true, espacamento: 0.14, peso: 800 as const };
  const encRotulo = rotulo ? encaixar(rotulo, { largura: chip ? 640 : 960, max: 36, min: 30, linhas: 2, fonte: fonteRotulo }) : null;
  const linhasRotulo = encRotulo ? encRotulo.linhas.length : 1;
  const encDescricao = descricao ? encaixar(descricao.texto, { largura: 960, max: filas.length > 1 ? 48 : 54, min: 36, linhas: 2 }) : null;
  let cyFilas = cy + (linhasRotulo - 1) * 42;
  if (filas.length > 1 && regiao) {
    const cima = rotulo || chip ? 70 + (linhasRotulo - 1) * 42 : 0;
    const baixo = encDescricao ? 34 + encDescricao.linhas.length * encDescricao.tamanho * 1.1 : 0;
    const total = cima + alturaFilas + baixo;
    cyFilas = regiao.y + Math.max(0, (regiao.h - total) / 2) + cima + alturaFilas / 2;
  }
  const topo = cyFilas - alturaFilas / 2;
  const posicoes: { left: number; top: number; fila: number }[] = [];
  let k0 = 0;
  filas.forEach((fila, f) => {
    const ws = larguras.slice(k0, k0 + fila.length);
    const total = ws.reduce((s, w) => s + w, 0) + Math.max(0, fila.length - 1) * vao;
    let xf = cx - total / 2;
    ws.forEach((w) => {
      posicoes.push({ left: xf, top: topo + f * (u + skirt + vaoFilas), fila: f });
      xf += w + vao;
    });
    k0 += fila.length;
  });
  const fundoFilas = topo + alturaFilas;
  const tamanho = Math.round(u * 0.4);

  const pRotulo = prog(t, rotuloEm ?? de + 0.05, 0.35);
  const pChip = chip ? prog(t, chip.em - 0.05, 0.3) : 0;
  const temCima = !!rotulo || !!chip;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: Math.min(entra, 1 - sai), translate: `0 ${(1 - entra) * 26 + sai * 20}px` }}>
      {temCima ? (
        <div
          style={{
            position: "absolute",
            left: cx - 540,
            width: 1080,
            top: topo - 70 - (linhasRotulo - 1) * 42,
            height: 56 + (linhasRotulo - 1) * 42,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 22,
          }}
        >
          {rotulo && encRotulo ? (
            <div style={{ overflow: "hidden", paddingBottom: 4 }}>
              <div style={{ ...rotuloCaixaAlta, fontSize: encRotulo.tamanho, color: cor.tinta, translate: pRotulo >= 0.999 ? undefined : `0 ${(1 - pRotulo) * 110}%`, textAlign: "center" }}>
                {encRotulo.linhas.map((l, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap", lineHeight: 1.16 }}>
                    {l.map((i) => encRotulo.palavras[i]).join(" ")}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {chip ? (
            <div
              style={{
                fontFamily: sans,
                fontWeight: 800,
                fontSize: 40,
                color: cor.janela,
                background: cor.violeta,
                padding: "6px 24px 8px",
                borderRadius: 40,
                opacity: pChip,
                scale: String(mistura(0.86, 1, pChip)),
              }}
            >
              {chip.texto}
            </div>
          ) : null}
        </div>
      ) : null}

      {descricao ? (
        <div style={{ position: "absolute", left: cx - 500, width: 1000, top: fundoFilas + 34 }}>
          <TextoFalado enc={encDescricao!} tempos={descricao.tempos} t={t} cor={cor.tinta} esboco={cor.esbocoParede} alinhar="center" alturaLinha={1.1} />
        </div>
      ) : null}
      {novas.map((tecla, i) => {
        const w = larguras[i];
        const { left, top: topo, fila } = posicoes[i];
        const em = teclas[i].em;
        const igual = comAnteriores && anteriores![i].toLowerCase() === tecla.toLowerCase();
        // corpo: tecla que veio do momento anterior e não muda já tem corpo
        const corpo = igual ? 1 : comAnteriores ? Math.max(1 - pTroca, prog(t, em - 0.16, 0.12)) : prog(t, em - 0.16, 0.12);
        const desce = prog(t, em - 0.03, 0.07) * (1 - prog(t, solta, 0.14));
        const esboco = prog(t, de, 0.3);
        const legendaVelha = comAnteriores && !igual ? anteriores![i] : null;
        const topoTecla = topo + desce * skirt * 0.85;
        const corTopo = desce > 0.5 ? cor.violeta : cor.tecla;
        // a tecla espera a lápis, com o nome apagado
        const corLegenda = corpo > 0.5 ? cor.teclaLegenda : cor.esbocoParede;
        return (
          <div key={i}>
            {/* "+" entre as teclas (da mesma fila) */}
            {i > 0 && posicoes[i - 1].fila === fila ? (
              <div
                style={{
                  position: "absolute",
                  left: left - vao,
                  width: vao,
                  top: topo,
                  height: u,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: u * 0.36,
                  color: cor.tinta,
                  opacity: esboco,
                }}
              >
                +
              </div>
            ) : null}
            {/* esboço a lápis */}
            <div
              style={{
                position: "absolute",
                left,
                top: topo,
                width: w,
                height: u,
                borderRadius: u * 0.17,
                border: `4px dashed ${cor.esbocoParede}`,
                background: "rgba(255,255,255,0.18)",
                opacity: esboco * (1 - corpo),
              }}
            />
            {/* base (a espessura da tecla) e sombra no desktop */}
            <div
              style={{
                position: "absolute",
                left,
                top: topo + skirt * 0.4,
                width: w,
                height: u + skirt * 0.6,
                borderRadius: u * 0.18,
                background: desce > 0.5 ? cor.teclaApertadaLado : cor.teclaLado,
                boxShadow: `0 ${mistura(22, 10, desce)}px ${mistura(34, 18, desce)}px rgba(28,20,64,${mistura(0.34, 0.24, desce)})`,
                opacity: corpo,
              }}
            />
            {/* topo da tecla */}
            <div
              style={{
                position: "absolute",
                left: left + 2,
                top: topoTecla,
                width: w - 4,
                height: u - skirt * 0.25,
                borderRadius: u * 0.16,
                background: corTopo,
                boxShadow: "inset 0 2px 0 rgba(255,255,255,0.12), inset 0 -3px 0 rgba(0,0,0,0.18)",
                opacity: corpo,
              }}
            />
            {/* nome da tecla */}
            <div
              style={{
                position: "absolute",
                left,
                top: topoTecla,
                width: w,
                height: u - skirt * 0.25,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {legendaVelha && pTroca < 1 ? (
                <div style={{ position: "absolute", translate: `0 ${-pTroca * 90}%`, opacity: 1 - pTroca }}>
                  <Legenda tecla={legendaVelha} tamanho={tamanho} cor={cor.teclaLegenda} />
                </div>
              ) : null}
              <div style={{ translate: `0 ${legendaVelha ? (1 - pTroca) * 90 : 0}%`, opacity: legendaVelha ? limitar(pTroca * 1.5) : 1 }}>
                <Legenda tecla={tecla} tamanho={tamanho} cor={corLegenda} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { larguraDaFila };
