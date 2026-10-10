import { corpoDaPrancha, type Regiao } from "../layout";
import type { Layout, Palavra } from "../plano";
import { alturaCabecalho, Cabecalho } from "./Prancha";

// Tamanho máximo do título da prancha em cada layout (nunca fica abaixo de 56 px)
export const TITULO_FOLHA: Record<Layout, number> = { cheio: 68, dividida: 68, cheia: 88, lateral: 76 };

// Uma folha da prancha: cabeçalho (① + título a lápis que vira nanquim na fala) e o corpo do bloco.
// Na prancha cheia, o cabeçalho fica ao lado da janela da pessoa e o corpo começa abaixo dela.
export const Folha: React.FC<{
  t: number;
  de: number;
  ate: number;
  palavras: Palavra[];
  layout: Layout;
  regiao: Regiao;
  numero?: string;
  titulo?: string;
  subtitulo?: string;
  children: (corpo: Regiao) => React.ReactNode;
}> = ({ t, de, ate, palavras, layout, regiao, numero, titulo, subtitulo, children }) => {
  const tem = !!(numero || titulo);
  const tamanho = TITULO_FOLHA[layout];
  const largura = layout === "cheia" ? corpoDaPrancha(layout, regiao, 0).cabecalho.w : regiao.w;
  const altura = tem ? alturaCabecalho({ numero, titulo, subtitulo }, largura, tamanho) : 0;
  const { cabecalho, corpo } = corpoDaPrancha(layout, regiao, altura);
  return (
    <>
      {tem ? (
        <div style={{ position: "absolute", left: cabecalho.x, top: cabecalho.y }}>
          <Cabecalho t={t} de={de} ate={ate} palavras={palavras} numero={numero} titulo={titulo} subtitulo={subtitulo} largura={cabecalho.w} tamanho={tamanho} />
        </div>
      ) : null}
      {children(corpo)}
    </>
  );
};
