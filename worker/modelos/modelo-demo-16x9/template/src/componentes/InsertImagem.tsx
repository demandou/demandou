// A `imagem`: uma foto ou arte no insert (o quadro da esquerda no split, ou o quadro inteiro no
// cheio), em corte seco, com aproximação lenta para não parecer foto parada. Sem borda, sem sombra,
// sem cantos.
import type { ImagemMomento, Plano } from "../plano";
import { Foto, imagemDoPlano } from "../motor/imagem";
import { COR, PALCO_H, PALCO_W } from "../tema";

export const InsertImagem: React.FC<{ plano: Plano; m: ImagemMomento; t: number; larg?: number; alt?: number }> = ({ plano, m, t, larg = PALCO_W, alt = PALCO_H }) => {
  const img = imagemDoPlano(plano, m.imagem);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: larg, height: alt, overflow: "hidden", background: COR.palco }}>
      <Foto
        imagem={img}
        foco={m.imagem.foco}
        de={m.de}
        ate={m.ate + 1}
        t={t}
        largura={larg}
        altura={alt}
        efeito={m.efeito ?? m.imagem.efeito ?? "aproximar"}
        intensidade={0.14}
        entrada="corte"
        saida="corte"
        antes={1}
        cartao={{ fundo: COR.palco, cor: COR.osso }}
      />
    </div>
  );
};
