// O lance no tempo: onde cada jogador e a bola estão em cada instante, a partir das ações do plano.
import { alvoNoGol, type Curva, curvar, escalaEm, pontoNaCurva, projetar } from "./campo";
import { entra, prog, troca } from "./anim";
import type { AcaoCampo, Campo, Ponto } from "./plano";

// durações (s)
export const PASSE = { seta: 0.45, bolaDe: 0.05, bolaAte: 0.62 };
export const CHUTE = { seta: 0.42, bolaDe: 0.04, bolaAte: 0.5 };
export const CORRIDA = 0.8;

const ordem = (acoes: AcaoCampo[]) => [...acoes].sort((a, b) => a.em - b.em);

// posição (em metros) de um jogador no instante t
export const posicaoEm = (campo: Campo, id: string, t: number): Ponto => {
  const j = campo.jogadores.find((x) => x.id === id);
  if (!j) return { x: 0, y: 11 };
  let pos: Ponto = { x: j.x, y: j.y };
  for (const a of ordem(campo.acoes)) {
    if (a.tipo !== "corrida" || a.quem !== id) continue;
    const ate = a.ate ?? a.em + CORRIDA;
    if (t <= a.em) break;
    const p = prog(t, a.em, ate - a.em, troca);
    pos = { x: pos.x + (a.para.x - pos.x) * p, y: pos.y + (a.para.y - pos.y) * p };
    if (t < ate) break;
  }
  return pos;
};

// na tela: o ponto no chão onde o jogador pisa
export const telaDoJogador = (campo: Campo, id: string, t: number) => {
  const p = posicaoEm(campo, id, t);
  return projetar(p.x, p.y);
};

// a bola no pé de quem a tem: ao lado e um pouco à frente da ficha (mais perto da câmera), sem
// cobrir o número
const bolaNoPe = (campo: Campo, id: string, t: number) => {
  const p = posicaoEm(campo, id, t);
  return projetar(p.x + 1.05, p.y + 0.35);
};

// curva de um passe na tela (do pé de quem passa até o pé de quem recebe, quando a bola chega)
export const curvaDoPasse = (campo: Campo, a: Extract<AcaoCampo, { tipo: "passe" }>): Curva => {
  const de = telaDoJogador(campo, a.de, a.em);
  const para = telaDoJogador(campo, a.para, a.em + PASSE.bolaAte);
  return curvar(de, para, 0.06);
};

export const curvaDoChute = (campo: Campo, a: Extract<AcaoCampo, { tipo: "chute" }>): Curva => {
  const de = bolaNoPe(campo, a.de, a.em);
  const alvo = alvoNoGol(a.alvo);
  return curvar(de, alvo, a.alvo === "esquerda" ? 0.07 : a.alvo === "direita" ? -0.07 : 0.03);
};

export type Bola = { x: number; y: number; s: number; altura: number; noGol: boolean; girando: number };

// onde está a bola (na tela) no instante t
export const bolaEm = (campo: Campo, t: number): Bola => {
  let dono: string | null = typeof campo.bola === "string" ? campo.bola : null;
  const livre: Ponto = typeof campo.bola === "string" ? { x: 0, y: 11 } : campo.bola;
  const comDono = () => {
    if (dono) {
      const p = bolaNoPe(campo, dono, t);
      return { x: p.x, y: p.y, s: p.s, altura: 0, noGol: false, girando: 0 };
    }
    const p = projetar(livre.x, livre.y);
    return { x: p.x, y: p.y, s: p.s, altura: 0, noGol: false, girando: 0 };
  };
  for (const a of ordem(campo.acoes)) {
    if (a.tipo === "passe") {
      if (t < a.em + PASSE.bolaDe) return comDono();
      const c = curvaDoPasse(campo, a);
      if (t < a.em + PASSE.bolaAte) {
        const u = prog(t, a.em + PASSE.bolaDe, PASSE.bolaAte - PASSE.bolaDe, entra);
        const p = pontoNaCurva(c, u);
        return { x: p.x, y: p.y, s: escalaEm(p.y), altura: 0, noGol: false, girando: u };
      }
      dono = a.para;
    }
    if (a.tipo === "chute") {
      if (t < a.em + CHUTE.bolaDe) return comDono();
      const c = curvaDoChute(campo, a);
      const u = prog(t, a.em + CHUTE.bolaDe, CHUTE.bolaAte - CHUTE.bolaDe, entra);
      const p = pontoNaCurva(c, u);
      // a bola sobe meio metro no caminho: a escala vem do chão sob ela (aproximação suficiente)
      return { x: p.x, y: p.y, s: escalaEm(p.y + u * 12), altura: u, noGol: u >= 1, girando: u * 2 };
    }
  }
  return comDono();
};
