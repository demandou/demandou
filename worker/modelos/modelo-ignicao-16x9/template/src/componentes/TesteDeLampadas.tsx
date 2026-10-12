// O teste de lâmpadas da partida (o gancho do vídeo): na chave, oito luzes-espia acendem juntas,
// grandes, numa faixa de vidro escuro na base da tela da pessoa (na altura do peito, nunca no rosto);
// um instante depois apagam e encolhem até a fileira pequena do painel — as luzes do plano vão cada
// uma para o seu lugar na fileira, as outras somem no caminho.
// Quais oito: as do carro, quando o plano usa alguma luz de carro (o exemplo); senão, as luzes do
// plano e os símbolos gerais. Gravação muito perto da câmera (o queixo desce até a faixa): a faixa
// sai de cima da pessoa e vai para o alto da tela do painel (`fora`), opaca, para não cobrir o rosto.
// No quadro deitado a moldura da pessoa é mais estreita que a tela do vertical: as luzes encolhem
// para caber lado a lado, sem encostar.
import { mistura, prog, troca } from "../anim";
import type { Caixa } from "../motor/caixa";
import type { CorDaLuz, Lampada } from "../plano";
import { cor } from "../tema";
import { Luz } from "./Icones";
import { posicaoNaFileira } from "./Painel";

const CARRO: Lampada[] = ["oleo", "temperatura", "bateria", "freio", "motor", "pneu", "combustivel", "cinto"];
const GERAIS: Lampada[] = ["alerta", "info", "tempo", "servico", "raio", "pessoa", "coracao", "dinheiro"];
const TAM = 110;

export const lampadasDoTeste = (doPlano: Lampada[]): Lampada[] => {
  if (doPlano.some((l) => CARRO.includes(l))) return CARRO;
  const lista = [...doPlano];
  for (const g of GERAIS) if (lista.length < 8 && !lista.includes(g)) lista.push(g);
  return lista.slice(0, 8);
};

// quando a faixa recolhe (as luzes do plano chegam à fileira no fim)
export const recolheDe = (ig: number) => ig + 1.3;
export const FIM_DO_RECOLHE = 0.5;

export const TesteDeLampadas: React.FC<{
  t: number;
  ig: number;
  caixa: Caixa;
  // a fileira pequena do modo da chave, onde as luzes do plano terminam
  fileira: { x1: number; x2: number; y: number; tam: number };
  doPlano: Lampada[];
  corDe?: (l: Lampada) => CorDaLuz | undefined;
  // true: a faixa sai da pessoa (o rosto desce até a base da moldura) e vai para `fora`
  abaixo?: boolean;
  // onde a faixa fica quando sai da pessoa (px do quadro): o alto da tela do painel
  fora?: { x: number; y: number; w: number; h: number };
}> = ({ t, ig, caixa, fileira, doPlano, corDe, abaixo, fora }) => {
  const c0 = recolheDe(ig);
  if (t < ig + 0.05 || t > c0 + FIM_DO_RECOLHE + 0.02) return null;
  const todas = lampadasDoTeste(doPlano);
  const acende = prog(t, ig + 0.1, 0.1);
  const recolhe = prog(t, c0, FIM_DO_RECOLHE, troca);
  const apaga = prog(t, c0 + 0.04, 0.26);
  const faixa =
    abaixo && fora
      ? fora
      : abaixo
        ? { x: Math.max(60, caixa.x), y: caixa.y + caixa.h + 14, w: Math.min(960, caixa.w), h: 140 }
        : { x: caixa.x + 14, y: caixa.y + caixa.h - 168, w: caixa.w - 28, h: 152 };
  const esp = Math.min(116, (faixa.w - 16) / todas.length);
  const tam = Math.min(TAM, esp * 0.95);
  const n = doPlano.length;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: faixa.x,
          top: faixa.y,
          width: faixa.w,
          height: faixa.h,
          borderRadius: Math.max(16, (caixa.raio ?? 0) - 10),
          background: abaixo ? cor.vidro : "rgba(7,8,10,0.78)",
          boxShadow: "inset 0 0 0 1.5px rgba(241,237,228,0.12)",
          opacity: prog(t, ig + 0.05, 0.12) * (1 - prog(t, c0, 0.22)),
        }}
      />
      {todas.map((ic, i) => {
        const x0 = faixa.x + faixa.w / 2 + (i - (todas.length - 1) / 2) * esp;
        const y0 = faixa.y + faixa.h / 2;
        const j = doPlano.indexOf(ic);
        const fica = j >= 0;
        const destino = fica ? posicaoNaFileira(fileira, n, j) : { x: x0, tam: 56 };
        const y1 = fica ? fileira.y : y0 + 50;
        const tamAgora = mistura(tam, destino.tam, recolhe);
        const x = mistura(x0, destino.x, recolhe);
        const y = mistura(y0, y1, recolhe);
        return (
          <Luz
            key={ic}
            icone={ic}
            acesa={acende * (1 - apaga)}
            corLuz={corDe?.(ic)}
            tamanho={tamAgora}
            style={{ position: "absolute", left: x - tamAgora / 2, top: y - tamAgora / 2, opacity: (fica ? 1 : 1 - recolhe) * prog(t, ig + 0.05, 0.08) }}
          />
        );
      })}
    </>
  );
};
