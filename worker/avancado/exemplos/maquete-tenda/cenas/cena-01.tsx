import React from "react";
import { Cena3D, k, useTempo, type CenaProps, type Rotulo3D } from "../kit";
import { ALTURA_BEIRAL, ALTURA_CUMEEIRA, AFASTA_ESTACA, CAMERA, elevacao, estado, Maquete, PROFUNDIDADE } from "./comum";

/**
 * A MAQUETE (aula 8.1) no alto do quadro, onde a moldura do apresentador não
 * chega: Three.js de verdade, a câmera por pontos-chave e os rótulos CORDAS,
 * CORTINA e ESTACAS presos aos objetos pela mesma câmera, o ativo no destaque.
 * CASA aparece acima da seta da largura enquanto ele diz "aumenta a casa".
 */
export const Atras: React.FC<CenaProps> = ({ de }) => {
  const { t } = useTempo();
  const e = estado(t);
  const el = elevacao(e);
  const W = e.largura;
  const D = PROFUNDIDADE;
  const sobra = 0.42 + (0.06 - 0.42) * e.finca;
  const rotulos: Rotulo3D[] = [
    { texto: "CORDAS", ponto: [0, (ALTURA_BEIRAL * e.ergue + sobra) / 2 + el.cordas, D / 2 + AFASTA_ESTACA * 0.5], visivel: e.rotulos, ativo: e.foco.cordas },
    { texto: "CORTINA", ponto: [W * 0.24, ((ALTURA_CUMEEIRA + ALTURA_BEIRAL) / 2) * e.ergue + el.cortina, D / 4 + 0.05], visivel: e.rotulos, ativo: e.foco.cortina },
    { texto: "ESTACAS", ponto: [(W / 2) * 1.08, sobra, D / 2 + AFASTA_ESTACA], visivel: e.rotulos, ativo: e.foco.estacas },
    { texto: "CASA", ponto: [0, 0.05, D / 2 + 0.75], visivel: e.casa, ativo: 1, lado: "acima" },
  ];
  return (
    <Cena3D x={0} y={0} largura={1080} altura={1120} chaves={CAMERA} rotulos={rotulos} opacidade={k(t, de + 0.03, de + 0.63)}>
      <Maquete e={e} />
    </Cena3D>
  );
};
