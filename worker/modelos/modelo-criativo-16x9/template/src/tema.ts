// Identidade do Criativo: anúncio de performance (Meta e TikTok Ads), limpo e de contraste alto.
// A pessoa em quadro cheio, como num vídeo de criador; por cima, VIDRO: placas de vidro fumê
// (texto branco) e cartões de vidro claro com espessura (produto e provas), tudo na altura do peito.
// UM destaque (laranja-sinal por padrão, ou a cor da marca do produto em `plano.cor`) no botão,
// nos selos, nos ✓ e nas palavras-chave. Sora em tudo (grande, limpa, legível no celular).
// Nada mexe na pessoa: a cor do vídeo nunca muda, nenhum brilho atrás dela.
// VERSÃO DEITADA (16:9, 1920×1080, o vídeo completo do YouTube): o mesmo vidro, as mesmas cores e a
// mesma Sora; muda só a diagramação (aula 9 do curso): a pessoa em quadro cheio é a base e, quando um
// cartão pede apoio visual, ela vai para uma MOLDURA de vidro à direita e o cartão ocupa o QUADRO à
// esquerda (o palco do vertical). Placas curtas continuam no peito, entre o queixo e a legenda.
import type { CSSProperties } from "react";
import { loadFont } from "@remotion/google-fonts/Sora";

export const fonte = loadFont("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const DESTAQUE_PADRAO = "#FF6A13";

export const cor = {
  // tinta (texto sobre vidro claro, botões claros)
  tinta: "#0B1020",
  tintaSuave: "#4B5168",
  branco: "#FFFFFF",
  brancoSuave: "rgba(255,255,255,0.62)",
  // alerta (✗, "não faça"): só no destaque de alerta e no lado errado da comparação
  alerta: "#FF4057",
  apagado: "#9AA0B4",
};

// ——— o destaque: a cor da marca (plano.cor) ou o laranja-sinal ———
const canal = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luz = (hex: string) => {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h.padEnd(6, "0");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
};
const contraste = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

export type Tons = { destaque: string; sobreDestaque: string; destaqueSuave: string };
export const tons = (corDaMarca?: string): Tons => {
  const d = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(corDaMarca ?? "") ? (corDaMarca as string) : DESTAQUE_PADRAO;
  const L = luz(d);
  // texto em cima do destaque: o que tiver mais contraste (tinta ou branco)
  const sobre = contraste(L, luz(cor.tinta)) >= contraste(L, 1) ? cor.tinta : cor.branco;
  return { destaque: d, sobreDestaque: sobre, destaqueSuave: `${d}33` };
};

// ——— vidro ———
// Vidro fumê: placas de texto (manchete, listas, números). Lê bem sobre qualquer roupa ou fundo.
export const vidroEscuro: CSSProperties = {
  background: "linear-gradient(158deg, rgba(34,40,62,0.68) 0%, rgba(9,12,24,0.76) 100%)",
  backdropFilter: "blur(22px) saturate(1.35)",
  WebkitBackdropFilter: "blur(22px) saturate(1.35)",
  border: "1.5px solid rgba(255,255,255,0.24)",
  boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.30), 0 26px 60px rgba(0,0,0,0.36), 0 6px 14px rgba(0,0,0,0.22)",
};
// Vidro claro: cartões de produto e de prova (o produto e a foto saltam).
export const vidroClaro: CSSProperties = {
  background: "linear-gradient(158deg, rgba(255,255,255,0.80) 0%, rgba(246,248,252,0.62) 48%, rgba(226,233,245,0.56) 100%)",
  backdropFilter: "blur(26px) saturate(1.6) brightness(1.06)",
  WebkitBackdropFilter: "blur(26px) saturate(1.6) brightness(1.06)",
  border: "2px solid rgba(255,255,255,0.85)",
  boxShadow:
    "inset 0 2px 0 rgba(255,255,255,1), inset 2px 0 0 rgba(255,255,255,0.5), inset 0 -18px 40px rgba(255,255,255,0.18), 0 30px 70px rgba(0,0,0,0.32), 0 8px 18px rgba(0,0,0,0.16)",
};
// a borda de baixo do vidro (a espessura do cartão, vista de leve de cima)
export const ESPESSURA = 12;
export const corDaEspessura = {
  claro: "linear-gradient(180deg, rgba(214,224,240,0.92), rgba(150,166,194,0.88))",
  escuro: "linear-gradient(180deg, rgba(40,46,70,0.92), rgba(5,7,14,0.92))",
};

export const RAIO = 34;
export const sombraTexto = "0 3px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)";

// --- o quadro deitado (16:9, 1920×1080) ---
export const QUADRO = { w: 1920, h: 1080 };
// Zona segura do YouTube: margem lateral de 96 px, nada importante acima de y 72 (título do player)
// nem abaixo de y 984 (barra de tempo e botões do player).
export const SEGURO = { topo: 72, base: 984, margem: 96 };
// A legenda: centro em y 912, centralizada no quadro (a pílula de 58 px vai de ~860 a ~964).
export const LEGENDA_Y = 912;
// Tudo o que fica acima da legenda (o palco, a moldura, as placas do peito) termina aqui.
export const BASE_CONTEUDO = 832;
// A MOLDURA da pessoa (aula 9): um cartão de vidro do lado direito, com o rosto centralizado nele.
// Estas são as bordas de fora do cartão (alinhadas com o palco e a margem); o vídeo fica 14 px
// para dentro (a borda de vidro).
export const MOLDURA = { x: 1184, y: 72, w: 640, h: 760 };
// O PALCO (o quadro da explicação): o lado esquerdo, da margem até 48 px antes da moldura
// (~1040 × 760 px, a mesma proporção do palco do vertical, ~952 × 687).
export const PALCO_X = 96;
export const PALCO_Y = 72;
export const PALCO_W = 1040;
export const PALCO_BASE = BASE_CONTEUDO;
// O PEITO: no quadro cheio, as placas curtas ficam entre o queixo e a legenda, até esta largura.
export const PEITO_W = 1000;
