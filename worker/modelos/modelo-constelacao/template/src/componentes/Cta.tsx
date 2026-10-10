import { gira, prog, TextoAceso, temposDoTexto } from "../anim";
import { encaixar, larguraTexto, trechoNoTexto } from "../medida";
import type { Cta as CtaMomento, Palavra } from "../plano";
import { cor, sans, serifa } from "../tema";
import { LinhasAcesas } from "./Desenho";
import type { Zona } from "./Fala";
import { EstrelaQuatroPontas } from "./Rosa";

type Icone = "salvar" | "seguir" | "comentar" | "link";

// Ícones a traço; preenchem quando a palavra é dita.
const Icone: React.FC<{ icone: Icone; cheio: number }> = ({ icone, cheio }) => (
  <svg width={70} height={84} viewBox="0 0 70 84" style={{ overflow: "visible", flex: "none" }}>
    {icone === "salvar" ? (
      <>
        <path d="M 12 6 L 58 6 L 58 78 L 35 60 L 12 78 Z" fill={cor.texto} opacity={cheio} />
        <path d="M 12 6 L 58 6 L 58 78 L 35 60 L 12 78 Z" fill="none" stroke={cor.texto} strokeWidth={4.5} strokeLinejoin="round" />
      </>
    ) : icone === "seguir" ? (
      <>
        <circle cx={30} cy={26} r={15} fill={cor.texto} opacity={cheio} stroke={cor.texto} strokeWidth={4.5} />
        <path d="M 4 76 Q 6 50 30 48 Q 54 50 56 76 Z" fill={cor.texto} opacity={cheio} />
        <path d="M 4 76 Q 6 50 30 48 Q 54 50 56 76" fill="none" stroke={cor.texto} strokeWidth={4.5} strokeLinecap="round" />
        <path d="M 60 18 L 60 40 M 49 29 L 71 29" stroke={cor.lanterna} strokeWidth={4.5} strokeLinecap="round" opacity={cheio} />
      </>
    ) : icone === "comentar" ? (
      <>
        <path d="M 8 14 Q 8 8 14 8 L 58 8 Q 64 8 64 14 L 64 50 Q 64 56 58 56 L 30 56 L 14 72 L 16 56 L 14 56 Q 8 56 8 50 Z" fill={cor.texto} opacity={cheio} />
        <path d="M 8 14 Q 8 8 14 8 L 58 8 Q 64 8 64 14 L 64 50 Q 64 56 58 56 L 30 56 L 14 72 L 16 56 L 14 56 Q 8 56 8 50 Z" fill="none" stroke={cor.texto} strokeWidth={4.5} strokeLinejoin="round" />
        {[22, 36, 50].map((x) => (
          <circle key={x} cx={x} cy={32} r={3.6} fill={cheio > 0.5 ? cor.ceu : cor.texto} />
        ))}
      </>
    ) : (
      <>
        <g transform="rotate(-45 35 42)" fill="none" stroke={cor.texto} strokeWidth={4.5} strokeLinecap="round">
          <rect x={4} y={30} width={34} height={24} rx={12} />
          <rect x={32} y={30} width={34} height={24} rx={12} />
        </g>
        <g transform="rotate(-45 35 42)">
          <line x1={22} y1={42} x2={48} y2={42} stroke={cor.lanterna} strokeWidth={4.5} strokeLinecap="round" strokeDasharray={26} strokeDashoffset={26 * (1 - cheio)} />
        </g>
      </>
    )}
  </svg>
);

// Nuvem a traço que se desfaz para a direita e deixa uma estrela no lugar ("noite sem nuvem").
const Nuvem: React.FC<{ t: number; em: number }> = ({ t, em }) => {
  const chega = prog(t, em - 0.7, 0.4);
  const vai = prog(t, em, 0.85, gira);
  const estrela = prog(t, em + 0.25, 0.5);
  return (
    <div style={{ position: "relative", width: 100, height: 84 }}>
      <svg width={150} height={84} viewBox="0 0 150 84" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: chega * (1 - vai), translate: `${70 * vai}px 0` }}>
        <path
          d="M 22 66 Q 4 66 6 50 Q 8 36 24 37 Q 26 16 48 14 Q 66 13 74 28 Q 86 20 98 28 Q 108 36 104 46 Q 118 48 116 58 Q 114 66 102 66 Z"
          fill="rgba(10,11,31,0.55)"
          stroke={cor.textoSuave}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ position: "absolute", left: 36, top: 14, opacity: estrela, scale: String(0.6 + 0.4 * estrela) }}>
        <EstrelaQuatroPontas tamanho={56} cheia={estrela} />
      </div>
    </div>
  );
};

export const Cta: React.FC<{
  m: CtaMomento;
  palavras: Palavra[];
  marca: { nome: string; area: string };
  t: number;
  zona: Zona;
  // quando a pessoa já voltou para a tela cheia
  pronto: number;
}> = ({ m, palavras, marca, t, zona, pronto }) => {
  const texto = (m.texto ?? m.titulo ?? "").trim();
  const icone: Icone = m.icone ?? m.acao ?? "salvar";
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(`${texto} ${m.detalhe ?? ""}`.trim(), palavras, Math.min(m.de, em), m.ate + 1, Math.max(em, pronto - 0.3));
  const ws = texto.split(/\s+/).filter(Boolean);
  const n1 = ws.length;
  const entrada = prog(t, Math.max(m.de, pronto - 0.35), 0.45);
  const acaoEm = m.acaoEm ?? tempos[0] ?? m.de;
  const assinatura = [marca.nome, marca.area].filter(Boolean).join(" · ");
  const largura = 1080 - zona.esquerda - zona.direita;
  // numa linha só, com o ícone ao lado (como no exemplo); se não couber, o ícone vai em cima
  const umaLinha = larguraTexto(texto, 100, { peso: 600 }) + 70 + 24 <= largura;
  const enc = umaLinha ? { tamanho: 100, linhas: [texto], largura: 0 } : encaixar(texto, { largura, max: 92, min: 58, linhas: 3, fonte: { peso: 600 } });
  const tr = trechoNoTexto(texto, m.destaque);
  const enfase = tr ? new Set(Array.from({ length: tr[1] - tr[0] + 1 }, (_, i) => tr[0] + i)) : undefined;
  const sublinha = tr ? prog(t, (tempos[tr[1]] ?? em) + 0.15, 0.5, gira) : 0;
  const estiloEnfase: React.CSSProperties = {
    fontStyle: "italic",
    backgroundImage: `linear-gradient(${cor.texto}, ${cor.texto})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "0 96%",
    backgroundSize: `${sublinha * 100}% ${Math.max(3, enc.tamanho * 0.045)}px`,
  };
  const iconeEl = (
    <div style={{ scale: String(0.9 + 0.1 * prog(t, acaoEm - 0.05, 0.35)) }}>
      <Icone icone={icone} cheio={prog(t, acaoEm - 0.03, 0.3)} />
    </div>
  );
  return (
    <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo + 20, display: "flex", flexDirection: "column", alignItems: "center", opacity: entrada, translate: `0 ${24 * (1 - entrada)}px` }}>
      {umaLinha ? (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {iconeEl}
          <TextoAceso texto={texto} tempos={tempos} t={t} cor={cor.texto} rascunho={0.18} enfase={enfase} estiloEnfase={estiloEnfase} estilo={{ fontFamily: serifa, fontWeight: 600, fontSize: 100, lineHeight: 1.05 }} />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>{iconeEl}</div>
          <LinhasAcesas enc={enc} tempos={tempos} t={t} rascunho={0.18} alinhar="center" entrelinha={1.05} enfase={enfase} estiloEnfase={estiloEnfase} estilo={{ fontFamily: serifa, fontWeight: 600 }} />
        </>
      )}
      {m.detalhe ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          <TextoAceso
            texto={m.detalhe}
            tempos={tempos}
            offset={n1}
            t={t}
            cor={cor.texto}
            rascunho={0.18}
            alinhar="center"
            estilo={{ fontFamily: serifa, fontStyle: "italic", fontWeight: 500, fontSize: 60, lineHeight: 1.1 }}
          />
          {m.nuvemEm !== undefined ? <Nuvem t={t} em={m.nuvemEm} /> : null}
        </div>
      ) : null}
      {assinatura ? (
        <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 16, opacity: prog(t, Math.max(m.de, pronto) + 0.5, 0.6) }}>
          <div style={{ width: 56, height: 2.5, background: cor.textoSuave, opacity: 0.7 }} />
          <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 32, letterSpacing: "0.2em", textTransform: "uppercase", color: cor.texto, opacity: 0.85 }}>{assinatura}</div>
          <div style={{ width: 56, height: 2.5, background: cor.textoSuave, opacity: 0.7 }} />
        </div>
      ) : null}
    </div>
  );
};
