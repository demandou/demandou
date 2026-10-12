// Peças pequenas do Guia: a pílula (preta com texto branco, ou colorida), o fio da estrada.
import { COR, FONTE } from "../tema";

export const Pilula: React.FC<{ texto: string; tamanho?: number; cor?: string; texto2?: string }> = ({ texto, tamanho = 40, cor = COR.tinta }) => (
  <div style={{ display: "inline-block", background: cor, color: "#fff", fontFamily: FONTE, fontWeight: 700, fontSize: tamanho, lineHeight: 1, padding: `${tamanho * 0.34}px ${tamanho * 0.62}px`, borderRadius: tamanho * 0.5 + 8, whiteSpace: "nowrap", letterSpacing: "-0.005em" }}>{texto}</div>
);
