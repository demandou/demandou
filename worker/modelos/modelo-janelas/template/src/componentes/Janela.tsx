// Moldura de janela do desktop fictício: barra de título com ícone, título e os botões – □ ×
// (glifos neutros, sem as "bolinhas coloridas" nem os botões de nenhum sistema real).
// Abre e fecha com animação de sistema: cresce a partir do ícone no dock e assenta.
import { mistura } from "../anim";
import { corpoQueCabe } from "../medida";
import { BARRA_JANELA, cor, RAIO_JANELA, sans, sombraJanela } from "../tema";
import { Icone, type NomeIcone } from "./Icones";

export const BotoesJanela: React.FC<{ escala?: number }> = ({ escala = 1 }) => (
  <div style={{ display: "flex", gap: 18 * escala, alignItems: "center" }}>
    {(["minimizar", "maximizar", "fechar"] as const).map((n) => (
      <div
        key={n}
        style={{
          width: 48 * escala,
          height: 48 * escala,
          borderRadius: 12 * escala,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icone nome={n} tamanho={34 * escala} cor={cor.tintaSuave} peso={3.8} />
      </div>
    ))}
  </div>
);

// Transformação de abrir/fechar: escala a partir de um ponto (o ícone do dock), com opacidade.
export const abertura = (p: number, caixa: { x: number; y: number }, origem: { x: number; y: number }): React.CSSProperties => ({
  transformOrigin: `${origem.x - caixa.x}px ${origem.y - caixa.y}px`,
  scale: String(mistura(0.16, 1, p)),
  // opaca logo no começo: a janela que abre por cima de outra nunca deixa o texto de trás vazar
  opacity: Math.min(1, p * 4),
});

export const Janela: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  titulo?: string;
  icone?: NomeIcone;
  // 0→1 abrindo; 1 aberta
  aberta: number;
  // ponto de onde a janela cresce (ícone do dock)
  origem: { x: number; y: number };
  // conteúdo da barra no lugar do título (ex.: abas do navegador)
  barra?: React.ReactNode;
  alturaBarra?: number;
  fundo?: string;
  // contorno violeta (a janela escolhida)
  contorno?: number;
  // algo à direita do título, antes dos botões (um selo)
  extra?: React.ReactNode;
  // janela estreita (tela dividida): sem os botões – □ ×, o título ganha o espaço
  semBotoes?: boolean;
  children?: React.ReactNode;
}> = ({ x, y, w, h, titulo, icone, aberta, origem, barra, alturaBarra = BARRA_JANELA, fundo = cor.janela, contorno = 0, extra, semBotoes, children }) => {
  if (aberta <= 0.001) return null;
  // o título cabe sempre numa linha: diminui até 30 px
  const livre = w - 26 - 22 - (icone ? 56 : 0) - (semBotoes ? 0 : 180) - 20 - (extra ? 70 : 0);
  const corpoTitulo = titulo ? corpoQueCabe(titulo, livre, 38, 30) : 38;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: RAIO_JANELA,
        background: fundo,
        boxShadow: sombraJanela,
        overflow: "hidden",
        outline: contorno > 0.01 ? `${mistura(1.5, 4, contorno)}px solid ${cor.violeta}` : `1.5px solid ${cor.linha}`,
        ...abertura(aberta, { x, y }, origem),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          height: alturaBarra,
          background: cor.barra,
          borderBottom: `1.5px solid ${cor.linha}`,
          display: "flex",
          alignItems: "center",
          padding: "0 22px 0 26px",
          gap: 16,
        }}
      >
        {barra ?? (
          <>
            {icone ? <Icone nome={icone} tamanho={40} cor={cor.violeta} peso={3.8} /> : null}
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: corpoTitulo, color: cor.tinta, flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>{titulo}</div>
            {extra}
            {semBotoes ? null : <BotoesJanela />}
          </>
        )}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: alturaBarra, bottom: 0 }}>{children}</div>
    </div>
  );
};
