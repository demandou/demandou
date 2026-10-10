import { prog } from "../anim";
import { corpoDoRotulo, larguraTexto, ROTULO } from "../medida";
import { cor, rotulo } from "../tema";

// Peças da linguagem do Autoridade, usadas por vários blocos.

// Letreiro em caixa alta espaçada, com fios de latão que se desenham dos lados (ou só depois).
export const Letreiro: React.FC<{
  texto: string;
  t: number;
  inicio: number;
  largura: number;
  fios?: "lados" | "depois" | "nenhum";
  corTexto?: string;
  corFio?: string;
  alinhar?: "center" | "left";
}> = ({ texto, t, inicio, largura, fios = "lados", corTexto = cor.papel, corFio = cor.latao, alinhar = "center" }) => {
  const reservaFios = fios === "lados" ? 2 * (56 + 18) : fios === "depois" ? 80 : 0;
  const tamanho = corpoDoRotulo(texto, largura - reservaFios);
  const cabe = larguraTexto(texto, tamanho, ROTULO) <= largura - reservaFios;
  const fio = (w: number) => <div style={{ width: w, height: 2, background: corFio, flexShrink: 0 }} />;
  const p = prog(t, inicio, 0.5);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: alinhar === "center" ? "center" : "flex-start",
        gap: 18,
        width: fios === "depois" ? "100%" : undefined,
        opacity: prog(t, inicio, 0.4),
      }}
    >
      {fios === "lados" ? fio(56 * p) : null}
      <div
        style={{
          ...rotulo,
          fontSize: tamanho,
          color: corTexto,
          whiteSpace: cabe ? "nowrap" : "normal",
          textAlign: alinhar,
          maxWidth: largura - reservaFios,
          lineHeight: 1.25,
        }}
      >
        {texto}
      </div>
      {fios === "lados" ? fio(56 * p) : null}
      {fios === "depois" ? (
        <div style={{ flex: 1, height: 1.5, background: corFio, scale: `${p} 1`, transformOrigin: "left", minWidth: 40 }} />
      ) : null}
    </div>
  );
};

// O papel do Autoridade: cartão marfim com filete de latão em cima. Sobe ao entrar, apaga subindo
// ao sair, e desliza de leve enquanto está na tela (a câmera não para).
export const Papel: React.FC<{
  t: number;
  de: number;
  ate: number;
  sai: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: string;
}> = ({ t, de, ate, sai, children, style, padding = "34px 44px 40px" }) => {
  const entra = prog(t, de, 0.55);
  const deriva = Math.min(1, Math.max(0, (t - de) / Math.max(1, ate - de)));
  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: cor.papel,
        borderTop: `6px solid ${cor.latao}`,
        padding,
        boxShadow: "0 28px 70px rgba(8,12,20,0.5)",
        opacity: Math.min(1, entra * 1.6) * (1 - sai),
        translate: `0 ${(1 - entra) * 70 - sai * 14}px`,
        scale: String(1 + 0.018 * deriva),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Etiqueta "ilustrativo": quando a forma não vem de números ditos.
export const Ilustrativo: React.FC<{ p: number; sobrePapel?: boolean }> = ({ p, sobrePapel }) => (
  <div
    style={{
      ...rotulo,
      fontSize: 30,
      letterSpacing: "0.16em",
      color: sobrePapel ? cor.tintaSuave : cor.lataoClaro,
      border: `1.5px solid ${sobrePapel ? cor.fioTinta : "rgba(214,181,124,0.6)"}`,
      padding: "4px 12px 3px",
      opacity: p,
      whiteSpace: "nowrap",
      lineHeight: 1.2,
    }}
  >
    ilustrativo
  </div>
);

// Blocos grandes (gráfico, documento, listas longas) podem usar um pouco mais de altura do que a
// zona: até 90 px acima (ainda abaixo do queixo) e, sem legenda, até a borda da interface do app.
// Bloco que cabe na zona fica centrado nela, como sempre; o que passa sobe só o necessário.
export type Folga = { zona: number; base: number };
export const Ajuste: React.FC<{ h: number; folga?: Folga; children: React.ReactNode }> = ({ h, folga, children }) => {
  const sobe = folga ? Math.max(0, (h - folga.zona) / 2 - folga.base) : 0;
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", translate: sobe ? `0 ${-sobe}px` : undefined }}>
      {children}
    </div>
  );
};
