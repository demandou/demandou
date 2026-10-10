// Estado da interface da câmera em cada instante, calculado a partir do plano:
// leituras (ISO, velocidade, EV), grade ligada, contador de fotos, seletor de modos.
import { Easing } from "remotion";
import { gradeDoMomento } from "./layout";
import { prog } from "./anim";
import type { Momento, Plano } from "./plano";

const linear = Easing.linear;

export const modoPadrao = (m: Momento): string => {
  // na comparação universal, `modo` é o estilo (contra, antes-depois…): o nome no seletor vem de `seletor`
  const nome = m.tipo === "comparacao" ? m.seletor : m.modo;
  if (nome) return nome.toUpperCase();
  switch (m.tipo) {
    case "abertura":
      return "FOTO";
    case "cena":
      return { limpar: "LENTE", tercos: "GRADE", foco: "FOCO", luz: "LUZ", horizonte: "NÍVEL" }[m.acao];
    case "foco":
      return m.luzEm !== undefined ? "FOCO E LUZ" : "FOCO";
    case "comparar":
      return "COMPARAR";
    case "cta":
      return { salvar: "SALVAR", seguir: "SEGUIR", comentar: "COMENTAR", link: "LINK" }[m.icone ?? m.acao ?? "seguir"];
    case "topicos":
      return "LISTA";
    case "passos":
      return "PASSOS";
    case "numero":
      return "NÚMERO";
    case "comparacao":
      return "VERSUS";
    case "grafico":
      return "GRÁFICO";
    case "destaque":
      return m.nivel === "alerta" ? "ALERTA" : "DESTAQUE";
    case "definicao":
      return "TERMO";
    case "frase":
      return "FRASE";
    case "pergunta":
      return "PERGUNTA";
  }
};

const VELOCIDADES = [125, 100, 80, 60, 50, 40, 30];

// Valor do EV escrito no plano ("+0,7") em número
export const numeroEv = (ev?: string) => {
  const n = Number(String(ev ?? "+0,7").replace(",", ".").replace("+", ""));
  return Number.isFinite(n) ? n : 0.7;
};
export const escreverEv = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1).replace(".", ",")}`;

export type Leituras = { iso: number; vel: number; ev: number | null; evVisivel: number };

export const leituras = (plano: Plano, t: number): Leituras => {
  // o visor liga: a exposição automática "procura" e assenta
  const boot = prog(t, 0.05, 0.75, linear);
  let iso = boot < 1 ? [800, 400, 200, 100][Math.min(3, Math.floor(boot * 4))] : 100;
  let vel = boot < 1 ? [30, 60, 125][Math.min(2, Math.floor(boot * 3))] : 125;
  let ev: number | null = null;
  let evVisivel = 0;
  for (const m of plano.momentos) {
    const luz =
      m.tipo === "foco" && m.luzEm !== undefined
        ? { de: m.luzEm, ate: m.luzAte ?? m.luzEm + 1.3, alvo: numeroEv(m.ev), fim: m.ate }
        : m.tipo === "cena" && m.acao === "luz"
          ? { de: m.acaoEm, ate: m.acaoAte ?? m.acaoEm + 1.4, alvo: 0.7, fim: m.ate }
          : null;
    if (!luz || t < luz.de - 0.1 || t > luz.fim + 0.4) continue;
    const p = prog(t, luz.de, luz.ate - luz.de, linear);
    ev = Math.round(p * luz.alvo * 10) / 10;
    evVisivel = Math.min(prog(t, luz.de - 0.1, 0.25), 1 - prog(t, luz.fim, 0.35));
    const passos = Math.round(ev * 3);
    vel = VELOCIDADES[Math.min(VELOCIDADES.length - 1, Math.max(0, passos))];
    iso = 100;
  }
  return { iso, vel, ev, evVisivel };
};

// A grade liga na primeira vez que se desenha e fica ligada
export const gradeLigadaEm = (plano: Plano): number | null => {
  const tempos = plano.momentos
    .map((m) => (m.tipo === "comparar" ? m.compararEm : gradeDoMomento(m)))
    .filter((x): x is number => x !== undefined);
  return tempos.length ? Math.min(...tempos) : null;
};

// Fotos tiradas no vídeo: a da comparação (a cena ajustada) e a do fechamento (um retrato da pessoa)
export type Foto = { em: number; tipo: "cena" | "retrato" };
export const fotoDoCta = (m: Momento) =>
  m.tipo === "cta" && m.fotoEm !== false ? (m.fotoEm ?? (m.botaoEm ?? m.de + 0.4) + 0.6) : null;
export const fotos = (plano: Plano): Foto[] =>
  plano.momentos
    .flatMap((m): Foto[] => {
      if (m.tipo === "comparar") return [{ em: m.disparoEm, tipo: "cena" }];
      const f = fotoDoCta(m);
      return f === null ? [] : [{ em: f, tipo: "retrato" }];
    })
    .sort((a, b) => a.em - b.em);

export const disparos = (plano: Plano) => fotos(plano).map((f) => f.em);

// Quantas fotos já foram tiradas, e o progresso da virada do último número
export const contador = (plano: Plano, t: number) => {
  const lista = disparos(plano);
  const feitos = lista.filter((d) => t >= d + 0.1).length;
  const ultimo = lista[feitos - 1];
  return { feitos, virada: ultimo === undefined ? 1 : prog(t, ultimo + 0.1, 0.35) };
};

// Piscar suave do obturador: sobe rápido e apaga devagar (nunca branco cheio)
export const piscar = (plano: Plano, t: number) =>
  Math.max(0, ...disparos(plano).map((d) => (t < d ? 0 : t < d + 0.05 ? ((t - d) / 0.05) * 0.34 : 0.34 * Math.max(0, 1 - (t - d - 0.05) / 0.3))));
