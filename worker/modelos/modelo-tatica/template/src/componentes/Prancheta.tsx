// A prancheta de uma dica: o campo e/ou o gol de frente. Com os dois, no instante `gol.em` a câmera
// "entra" no gol: o campo cresce em volta do gol até o gol do campo virar o gol de frente (um corte
// casado, sem quadro vazio).
import { mistura, prog, troca } from "../anim";
import { CENTRO_GOL, GOL, GOL_NO_CAMPO } from "../campo";
import type { Janela } from "../layout";
import { cor, H, W } from "../tema";
import { CampoVista } from "./CampoVista";
import { GolFrente } from "./GolFrente";
import { Quadro } from "./Quadro";

const ENTRADA_NO_GOL = 0.62;

export const Prancheta: React.FC<{ janela: Janela; t: number; palavras: import("../plano").Palavra[] }> = ({ janela, t, palavras }) => {
  const { dica, entra, primeira } = janela;
  if (janela.universal) return <Quadro universal={janela.universal} palavras={palavras} t={t} entra={entra} />;
  const { campo, gol } = dica;

  // câmera: 0 = campo, 1 = gol de frente
  const p = campo && gol ? prog(t, gol.em, ENTRADA_NO_GOL, troca) : gol ? 1 : 0;
  const escalaGol = (GOL.direita - GOL.esquerda) / GOL_NO_CAMPO.largura;
  // zoom exponencial (a velocidade aparente fica constante) e âncora que vai do gol do campo ao centro do gol de frente
  const S = Math.exp(mistura(0, Math.log(escalaGol), p));
  const ax = mistura(GOL_NO_CAMPO.x, CENTRO_GOL.x, p);
  const ay = mistura(GOL_NO_CAMPO.y, CENTRO_GOL.y, p);
  const camCampo = `translate(${ax - GOL_NO_CAMPO.x * S}px, ${ay - GOL_NO_CAMPO.y * S}px) scale(${S})`;
  const sG = S / escalaGol;
  const camGol = `translate(${ax - CENTRO_GOL.x * sG}px, ${ay - CENTRO_GOL.y * sG}px) scale(${sG})`;
  // o desenho do gol (traves, rede, goleiro) chega cedo, por cima do campo que ainda cresce; o
  // gramado do gol de frente só substitui o do campo no fim, quando os dois já estão casados
  const opCampo = 1 - prog(p, 0.6, 0.32);
  const opGol = campo ? prog(p, 0.1, 0.35) : 1;
  const opFundoGol = campo ? prog(p, 0.55, 0.35) : 1;

  // ao reaparecer (2ª dica em diante), a prancheta assenta com um leve recuo de câmera
  const assenta = primeira ? 1 : 1 + 0.05 * (1 - prog(t, entra, 0.7));

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "hidden", background: cor.foraDoCampo }}>
      <div style={{ position: "absolute", inset: 0, scale: String(assenta), transformOrigin: "540px 1100px" }}>
        {campo && opCampo > 0.001 ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: camCampo, transformOrigin: "0 0", opacity: opCampo }}>
            <CampoVista campo={campo} t={t} entra={entra} desenhar={primeira} semBola={gol ? prog(p, 0, 0.12) : 0} />
          </div>
        ) : null}
        {gol && opGol > 0.001 ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: camGol, transformOrigin: "0 0", opacity: opGol }}>
            <GolFrente gol={gol} t={t} aparece={campo ? gol.em : entra} desenhar={!campo} fundo={opFundoGol} chegada={campo ? prog(p, 0.6, 0.3) : 1} />
          </div>
        ) : null}
      </div>
      {/* vinheta suave nas bordas: dá profundidade ao gramado (não é brilho) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 85% 70% at 50% 58%, rgba(0,0,0,0) 55%, rgba(4,20,10,0.42) 100%)",
        }}
      />
      {/* faixa escura no alto: segura a leitura do cabeçalho e da caixa de transmissão */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 720,
          background: "linear-gradient(to bottom, rgba(6,22,13,0.55) 0%, rgba(6,22,13,0.35) 55%, rgba(6,22,13,0) 100%)",
        }}
      />
    </div>
  );
};
