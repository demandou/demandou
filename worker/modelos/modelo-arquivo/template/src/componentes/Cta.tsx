import { Datilo, preciso, prog, saindo } from "../anim";
import { encaixar, larguraTexto, trechoNoTexto } from "../medida";
import type { Cta as TCta } from "../plano";
import { caber, cor, mono, sans, sombraTexto } from "../tema";
import { Veu } from "./Veu";

const Icone: React.FC<{ tipo: NonNullable<TCta["icone"]>; tamanho: number; p: number }> = ({ tipo, tamanho, p }) => {
  const comum = { fill: "none", stroke: cor.tinta, strokeWidth: 3.6, strokeLinecap: "square" as const, pathLength: 1, strokeDasharray: `${p} 1` };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      {tipo === "seguir" ? (
        <>
          <circle cx="19" cy="16" r="8" {...comum} />
          <path d="M5 40 C5 30 12 26 19 26 C26 26 33 30 33 40" {...comum} />
          <path d="M38 14 V28 M31 21 H45" {...comum} stroke={cor.vermelho} />
        </>
      ) : null}
      {tipo === "salvar" ? <path d="M12 6 H36 V42 L24 32 L12 42 Z" {...comum} /> : null}
      {tipo === "comentar" ? <path d="M6 8 H42 V32 H22 L12 41 V32 H6 Z" {...comum} /> : null}
      {tipo === "link" ? (
        <>
          <path d="M21 27 L27 21" {...comum} stroke={cor.vermelho} />
          <path d="M18 22 L13 27 A6.4 6.4 0 0 0 22 36 L27 31" {...comum} />
          <path d="M30 26 L35 21 A6.4 6.4 0 0 0 26 12 L21 17" {...comum} />
        </>
      ) : null}
    </svg>
  );
};

// Assinatura de documentário (lower third) + a chamada final datilografada numa tira de papel.
export const Cta: React.FC<{
  m: TCta;
  marca: { nome: string; area: string };
  t: number;
  fim: number;
  area: { x: number; y: number; w: number; h: number };
}> = ({ m, marca, t, fim, area }) => {
  const sai = saindo(t, fim, 0.3);
  const barra = prog(t, m.de, 0.35, preciso);
  const nome = prog(t, m.de + 0.08, 0.5);
  const temNome = !!marca.nome;
  const textoEm = m.em ?? m.textoEm ?? m.de + (temNome ? 0.55 : 0.1);
  const tira = prog(t, textoEm - 0.1, 0.35);
  const durTexto = Math.min(1.1, Math.max(0.22, m.texto.length * 0.042));
  const seta = prog(t, textoEm + durTexto, 0.4);
  const desenrola = Math.max(0.16 * tira, prog(t, textoEm - 0.05, durTexto + 0.4, preciso));
  const tamNome = caber(marca.nome.toUpperCase(), area.w - 40, 84, 0.72, 52);
  // a chamada cabe na tira (até 2 linhas): ícone (52) + seta (46) + respiros (~110)
  const larguraChamada = area.w - 52 - 46 - 18 * 2 - 46 - 24;
  // chamada curta: o corpo de sempre numa linha só; longa: medida e quebrada em até 2 linhas
  const antigo = caber(m.texto, area.w - 190, 46, 0.56, 40);
  const cabeUmaLinha = larguraTexto(m.texto, antigo, { peso: 700 }) <= area.w - 190;
  const fit = cabeUmaLinha ? { tamanho: antigo, linhas: [m.texto] } : encaixar(m.texto, { largura: larguraChamada, max: 46, min: 40, linhas: 2, fonte: { peso: 700 } });
  const tamTexto = fit.tamanho;
  // o trecho `destaque` ganha um sublinhado vermelho depois de datilografado
  const trecho = trechoNoTexto(m.texto, m.destaque);
  const sublinha = prog(t, textoEm + durTexto + 0.1, 0.4, preciso);
  return (
    <>
    <Veu topo={area.y + area.h - 560} opacidade={prog(t, m.de, 0.4) * (1 - sai)} />
    <div
      style={{
        position: "absolute",
        left: area.x,
        width: area.w,
        bottom: 1920 - (area.y + area.h + 8),
        display: "flex",
        flexDirection: "column",
        gap: 26,
        opacity: 1 - sai,
      }}
    >
      {temNome ? (
        <div style={{ display: "flex", gap: 24, alignItems: "stretch", textShadow: sombraTexto }}>
          <div style={{ width: 10, background: cor.vermelho, scale: `1 ${barra}`, transformOrigin: "50% 100%" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden", paddingRight: 20 }}>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: tamNome, lineHeight: 1, color: cor.claro, translate: `${(1 - nome) * -105}% 0`, letterSpacing: "0.01em" }}>
              {marca.nome.toUpperCase()}
            </div>
            {marca.area ? (
              <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 38, lineHeight: 1, letterSpacing: "0.14em", textTransform: "uppercase", color: cor.claro, opacity: 0.92 }}>
                <Datilo texto={marca.area} em={m.de + 0.3} t={t} semente={91} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div
        style={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: cor.cartao,
          padding: "16px 26px 16px 20px",
          opacity: tira,
          translate: `0 ${(1 - tira) * 24}px`,
          // a tira de papel se desenrola junto com a datilografia (nunca fica uma faixa branca vazia)
          clipPath: `inset(-40px ${(1 - desenrola) * 100}% -40px 0)`,
          boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        }}
      >
        <Icone tipo={m.icone ?? "seguir"} tamanho={52} p={prog(t, textoEm, 0.6, preciso)} />
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: tamTexto, lineHeight: 1.1, color: cor.tinta }}>
          {fit.linhas.length === 1 && !trecho ? (
            <Datilo texto={m.texto} em={textoEm} t={t} semente={93} />
          ) : (
            (() => {
              // várias linhas (e/ou um trecho sublinhado): cada linha datilografada em seguida
              let indice = 0;
              let atraso = 0;
              return fit.linhas.map((linha, k) => {
                const palavras = linha.split(" ");
                const inicioLinha = indice;
                indice += palavras.length;
                const em = textoEm + atraso;
                atraso += Math.min(0.8, Math.max(0.2, linha.length * 0.04));
                return (
                  <div key={k} style={{ whiteSpace: "nowrap" }}>
                    {palavras.map((w, j) => {
                      const i = inicioLinha + j;
                      const grifada = trecho && i >= trecho[0] && i <= trecho[1];
                      const antes = palavras.slice(0, j).join(" ");
                      const emPalavra = em + (antes.length ? (antes.length + 1) * 0.04 : 0);
                      return (
                        <span key={j} style={{ position: "relative", display: "inline-block", marginRight: j < palavras.length - 1 ? "0.26em" : 0 }}>
                          <Datilo texto={w} em={emPalavra} t={t} dur={Math.min(0.3, w.length * 0.04)} cursor={k === fit.linhas.length - 1 && j === palavras.length - 1} semente={93 + i} />
                          {grifada ? (
                            <span style={{ position: "absolute", left: 0, bottom: -4, height: 5, width: `${sublinha * 100}%`, background: cor.vermelho }} />
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                );
              });
            })()
          )}
        </div>
        <svg width={46} height={30} viewBox="0 0 46 30" style={{ flexShrink: 0, translate: `${(1 - seta) * -14}px 0`, opacity: seta }}>
          <path d="M2 15 H40 M28 4 L41 15 L28 26" fill="none" stroke={cor.vermelho} strokeWidth={4.5} />
        </svg>
      </div>
    </div>
    </>
  );
};
