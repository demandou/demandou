// A `imagem`: uma foto ou arte no insert de cima (ou em tela cheia), em corte seco, com
// aproximação lenta para não parecer foto parada. Sem borda, sem sombra, sem cantos.
import type { ImagemMomento, Plano } from "../plano";
import { Foto, imagemDoPlano } from "../motor/imagem";
import { COR, LARGURA } from "../tema";

export const InsertImagem: React.FC<{ plano: Plano; m: ImagemMomento; t: number; alt: number }> = ({ plano, m, t, alt }) => {
  const img = imagemDoPlano(plano, m.imagem);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA, height: alt, overflow: "hidden", background: COR.palco }}>
      <Foto
        imagem={img}
        foco={m.imagem.foco}
        de={m.de}
        ate={m.ate + 1}
        t={t}
        largura={LARGURA}
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
