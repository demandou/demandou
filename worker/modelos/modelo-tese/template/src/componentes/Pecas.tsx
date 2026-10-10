// Peças do pacote gráfico do Multicâmera: a tarja (quadrado vermelho + barra grafite), o painel
// grafite com a faixa vermelha à esquerda e a linha de tempo que corre por baixo enquanto a peça
// está no ar. Tudo entra por uma cortina da esquerda para a direita e sai pelo mesmo caminho.
import { larguraTexto } from "../medida";
import { ALTURA_PALCO, CENTRO_PALCO, LARGURA_UTIL, COR, FONTE, RAIO, SOMBRA, TOPO_H, prog, suave } from "../tema";

// entrada/saída comum: cortina que abre da esquerda (0,38 s) e fecha para a esquerda (0,22 s)
export const cortina = (t: number, de: number, ate: number, atraso = 0) => {
  const e = prog(t, de + atraso, 0.38);
  const s = prog(t, ate - 0.22, 0.22, suave);
  return { e, s, aberto: Math.max(0, e - s), visivel: t >= de && t < ate };
};

// Quadrado vermelho (a luz de "no ar"): número, letra ou ícone.
export const Quadrado: React.FC<{ tamanho: number; children?: React.ReactNode; apagado?: boolean; vazado?: boolean }> = ({ tamanho, children, apagado, vazado }) => (
  <div
    style={{
      width: tamanho,
      height: tamanho,
      flex: "none",
      borderRadius: Math.max(4, Math.round(tamanho * 0.12)),
      background: vazado ? "transparent" : apagado ? COR.trilho : COR.tally,
      border: vazado ? `3px solid ${COR.trilho}` : undefined,
      boxSizing: "border-box",
      color: apagado || vazado ? COR.branco : COR.grafite,
      fontFamily: FONTE,
      fontWeight: 800,
      fontSize: Math.round(tamanho * 0.5),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {children}
  </div>
);

// Linha de tempo: corre por baixo da peça enquanto ela está no ar (nada fica parado).
export const LinhaDeTempo: React.FC<{ t: number; de: number; ate: number; largura: number; cor?: string }> = ({ t, de, ate, largura, cor = COR.tally }) => {
  const p = Math.min(1, Math.max(0, (t - de) / Math.max(0.1, ate - de)));
  return <div style={{ position: "absolute", left: 0, bottom: 0, width: largura * p, height: 4, background: cor }} />;
};

// Tarja: [quadrado vermelho][barra grafite com o texto]. `alerta` pinta a barra de vermelho.
export const medirTarja = (texto: string, tamanho: number, comQuadrado: boolean) => {
  const h = Math.round(tamanho * 1.86);
  const pad = Math.round(tamanho * 0.56);
  const w = Math.ceil(larguraTexto(texto, tamanho, { peso: 700 })) + pad * 2;
  return { h, pad, w, total: w + (comQuadrado ? h + 6 : 0) };
};

export const Tarja: React.FC<{
  x: number;
  y: number;
  t: number;
  de: number;
  ate: number;
  texto: string;
  tamanho?: number;
  quadrado?: React.ReactNode | false;
  alerta?: boolean;
  tempo?: boolean;
}> = ({ x, y, t, de, ate, texto, tamanho = 42, quadrado, alerta, tempo }) => {
  if (t < de || t >= ate) return null;
  const comQuadrado = quadrado !== false;
  const { h, pad, w } = medirTarja(texto, tamanho, comQuadrado);
  const q = prog(t, de, 0.22);
  const c = cortina(t, de, ate, comQuadrado ? 0.1 : 0);
  const sq = prog(t, ate - 0.1, 0.1, suave);
  const xBarra = comQuadrado ? h + 6 : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, height: h }}>
      {comQuadrado ? (
        <div style={{ position: "absolute", left: 0, top: 0, clipPath: `inset(${((1 - q) * 100).toFixed(2)}% 0 0 0)`, opacity: 1 - sq, boxShadow: SOMBRA, borderRadius: RAIO }}>
          <Quadrado tamanho={h}>{quadrado}</Quadrado>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: xBarra,
          top: 0,
          width: w,
          height: h,
          borderRadius: RAIO,
          overflow: "hidden",
          background: alerta ? COR.tally : COR.grafite,
          boxShadow: c.aberto > 0.05 ? SOMBRA : "none",
          clipPath: `inset(0 ${((1 - c.aberto) * 100).toFixed(2)}% 0 0 round ${RAIO}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: pad,
            top: 0,
            height: h,
            lineHeight: `${h}px`,
            fontFamily: FONTE,
            fontWeight: 700,
            fontSize: tamanho,
            color: COR.branco,
            whiteSpace: "nowrap",
            opacity: c.e >= 1 ? 1 : c.e,
            transform: c.e >= 1 ? undefined : `translateX(${(1 - c.e) * -16}px)`,
          }}
        >
          {texto}
        </div>
        {tempo ? <LinhaDeTempo t={t} de={de} ate={ate} largura={w} cor={alerta ? COR.branco : COR.tally} /> : null}
      </div>
    </div>
  );
};

// O palco de texto da Tese: ocupa a faixa de cima (1080×864, o lugar da imagem), corte seco, sem
// moldura. O conteúdo (largura `w`, altura `h`, desenhado nas coordenadas do painel) fica centrado
// na faixa, na horizontal e na vertical, e cresce um pouco quando sobra espaço. Sem animação de entrada: o que anima são os itens.
export const Painel: React.FC<{ x?: number; y?: number; w: number; h: number; t: number; de: number; ate: number; tempo?: boolean; children?: React.ReactNode }> = ({ w, h, t, de, ate, children }) => {
  if (t < de || t >= ate) return null;
  const s = Math.min(1.4, LARGURA_UTIL / w, ALTURA_PALCO / h);
  // centrado na faixa (horizontal e vertical), sem subir acima do topo seguro (y 130)
  const meiaAltura = (h * s) / 2;
  const cy = Math.min(CENTRO_PALCO + ALTURA_PALCO / 2 - meiaAltura, Math.max(TOPO_H / 2, CENTRO_PALCO - ALTURA_PALCO / 2 + meiaAltura));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: TOPO_H, background: COR.grafite, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: (1080 - w) / 2, top: cy - h / 2, width: w, height: h, transform: `scale(${s})`, transformOrigin: "center" }}>{children}</div>
    </div>
  );
};

// Linha pequena em caixa alta (títulos de painel, rótulos): reduz o corpo para caber na largura.
export const Sobretitulo: React.FC<{ texto: string; x: number; y: number; largura: number; tamanho?: number; cor?: string }> = ({ texto, x, y, largura, tamanho = 26, cor = COR.apoio }) => {
  const fonte = { peso: 700 as const, caixaAlta: true, espacamento: 0.08 };
  let corpo = tamanho;
  while (corpo > 18 && larguraTexto(texto, corpo, fonte) > largura) corpo -= 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: FONTE, fontWeight: 700, fontSize: corpo, letterSpacing: "0.08em", textTransform: "uppercase", color: cor, whiteSpace: "nowrap" }}>
      {texto}
    </div>
  );
};
