// Véu dos supers em tela cheia: escurece de leve a parte de baixo da imagem enquanto um crédito
// ou a assinatura está na tela, para o texto claro ler bem sobre qualquer roupa (camiseta branca,
// camisa clara). Mesmo desenho do véu da linha do tempo, mais leve. Não é brilho nem moldura.
export const Veu: React.FC<{ topo: number; opacidade: number }> = ({ topo, opacidade }) =>
  opacidade <= 0.001 ? null : (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: topo,
        bottom: 0,
        background: "linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.42) 38%, rgba(10,10,10,0.6) 100%)",
        opacity: opacidade,
        pointerEvents: "none",
      }}
    />
  );
