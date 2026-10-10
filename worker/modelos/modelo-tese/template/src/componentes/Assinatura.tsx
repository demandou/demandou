// A assinatura da Tese:
// - `cena`: a imagem do que é citado, na faixa de cima (1080×864, 45% da altura), preenchendo a
//   moldura inteira (cover, com o foco escolhido; nunca faixa preta nem fundo desfocado). A pessoa
//   fica embaixo. Entra na palavra que a nomeia; push-in lento de ~6%. Sem imagem, um cartão com
//   a palavra (nunca uma imagem errada).
// - `fechado`: o rosto em tela cheia; o desenho é do vídeo da pessoa (Edicao.tsx), não tem peça.
import { Foto, SemImagem, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Cena as TCena, Plano } from "../plano";
import { COR, FONTE, TOPO_H } from "../tema";

export const Cena: React.FC<{ plano: Plano; m: TCena; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const img = imagemDoPlano(plano, m.imagem);
  const palavra = img?.palavra ?? m.imagem.id;
  if (!temImagem(img)) {
    return <SemImagem texto={palavra} largura={1080} altura={TOPO_H} de={m.de} ate={m.ate} t={t} fundo={COR.grafite} cor={COR.branco} fonte={FONTE} peso={800} style={{ position: "absolute", left: 0, top: 0 }} />;
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: TOPO_H, overflow: "hidden" }}>
      <Foto imagem={img} de={m.de} ate={m.ate} t={t} largura={1080} altura={TOPO_H} efeito={m.imagem.efeito ?? "aproximar"} intensidade={0.07} style={{ position: "absolute", left: 0, top: 0 }} />
    </div>
  );
};
