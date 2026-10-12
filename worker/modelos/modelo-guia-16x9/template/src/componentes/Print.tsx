// A assinatura 2: o print real (captura de página, tela do usuário) num cartão grande na tela de aula,
// rolando devagar e aproximando no ponto, com a seta vermelha grossa no botão citado.
// Versão deitada: px LÓGICOS da camada das telas (1080 de largura; ver tema.ts). O cartão tem 936 px
// lógicos (~977 px no quadro) e vai de y 140 até a base útil; a pessoa fica na moldura ao lado.
import { Img, staticFile } from "remotion";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type { Plano, Print as PrintMomento, Seta } from "../plano";
import { BASE_LOGICA, COR, FONTE, LOGICO, MARGEM, SOMBRA_CARTAO, prog } from "../tema";
import { Pilula } from "./Pecas";
import { larguraTexto } from "../medida";

const ANG = { cima: 90, baixo: -90, esq: 0, dir: 180 } as const;
// a largura da camada lógica (as margens das setas e das pílulas são medidas nela)
const LW = LOGICO.w;

export const SetaVermelha: React.FC<{ x: number; y: number; t: number; seta: Seta }> = ({ x, y, t, seta }) => {
  const e = prog(t, seta.em, 0.26);
  if (e <= 0) return null;
  // a seta nunca sai da margem segura (64 px): se a cauda passaria da borda, ela vem do outro lado
  let vem = seta.vem ?? "cima";
  if (vem === "esq" && x - 250 < MARGEM) vem = "dir";
  if (vem === "dir" && x + 250 > LW - MARGEM) vem = "esq";
  if (vem === "cima" && y - 250 < 96) vem = "baixo";
  if (vem === "baixo" && y + 250 > BASE_LOGICA + 20) vem = "cima";
  const a = ANG[vem];
  const L = 230;
  const rad = (a * Math.PI) / 180;
  const recuo = (1 - e) * 60;
  const dx = -Math.cos(rad) * recuo;
  const dy = -Math.sin(rad) * recuo;
  // rótulo: sobre a haste (seta horizontal) ou na cauda (seta vertical), sempre dentro da margem;
  // entra na palavra dele (`textoEm`)
  const eTexto = seta.texto ? prog(t, seta.textoEm ?? seta.em, 0.22) : 0;
  const larg = seta.texto ? larguraTexto(seta.texto, 36, { peso: 700 }) + 2 * 36 * 0.62 : 0;
  const vertical = Math.abs(Math.sin(rad)) > 0.5;
  // seta horizontal: a pílula fica sobre a haste. Seta vertical: a pílula fica AO LADO da haste
  // (não na cauda, que costuma cair na cabeça da pessoa), do lado que tem espaço na margem.
  let px: number;
  let py: number;
  if (vertical) {
    const meio = -Math.sin(rad) * (L * 0.62); // y do meio da haste, relativo à ponta
    const ladoDir = x + 40 + larg <= LW - MARGEM - 8;
    px = ladoDir ? 40 : -40 - larg;
    py = meio - 30;
  } else {
    const cx = -Math.cos(rad) * (L / 2);
    const desloc = Math.max(0, MARGEM + 8 - (x + cx - larg / 2)) - Math.max(0, x + cx + larg / 2 - (LW - MARGEM - 8));
    px = cx + desloc - larg / 2;
    py = -84;
  }
  return (
    <div style={{ position: "absolute", left: x + dx, top: y + dy, width: 0, height: 0, opacity: Math.min(1, e * 1.6), zIndex: 3 }}>
      <svg width={600} height={600} viewBox="-300 -300 600 600" style={{ position: "absolute", left: -300, top: -300, overflow: "visible", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.30))" }}>
        <g transform={`rotate(${a})`}>
          <polygon points={`${-L},-19 -96,-19 -96,-56 0,0 -96,56 -96,19 ${-L},19`} fill={COR.seta} stroke="#fff" strokeWidth={7} strokeLinejoin="round" />
        </g>
      </svg>
      {seta.texto && eTexto > 0 ? (
        <div style={{ position: "absolute", left: px, top: py, whiteSpace: "nowrap", opacity: eTexto, transform: `scale(${0.9 + 0.1 * eTexto})`, transformOrigin: "center" }}>
          <Pilula texto={seta.texto} cor={COR.seta} tamanho={36} />
        </div>
      ) : null}
    </div>
  );
};

// Barra de navegador (genérica) com o endereço que a pessoa fala: "entra no chatgpt.com".
export const BARRA = 96;
const Barra: React.FC<{ endereco: string; W: number }> = ({ endereco, W }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: BARRA, background: "#EFEFF1", borderBottom: `2px solid ${COR.linha}`, display: "flex", alignItems: "center", gap: 14, padding: "0 24px", boxSizing: "border-box" }}>
    {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
      <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c, flex: "none" }} />
    ))}
    <div style={{ marginLeft: 18, flex: 1, height: 60, borderRadius: 30, background: "#fff", display: "flex", alignItems: "center", gap: 14, padding: "0 26px", boxSizing: "border-box", fontFamily: FONTE, fontWeight: 700, fontSize: 36, color: COR.tinta, overflow: "hidden", whiteSpace: "nowrap" }}>
      <svg width={24} height={30} viewBox="0 0 24 30" style={{ flex: "none" }}>
        <rect x={2} y={12} width={20} height={16} rx={4} fill={COR.cinza} />
        <path d="M6 12 V8 a6 6 0 0 1 12 0 V12" stroke={COR.cinza} strokeWidth={3.2} fill="none" />
      </svg>
      {endereco}
    </div>
  </div>
);

export const TelaPrint: React.FC<{ plano: Plano; m: PrintMomento; t: number }> = ({ plano, m, t }) => {
  const img = imagemDoPlano(plano, m.imagem);
  // margem segura: o cartão fica a ≥ 64 px das laterais e ≥ 140 px do topo (px lógicos)
  const W = 936;
  const X = (LW - W) / 2;
  const Y0 = m.rotulo ? 216 : 140;
  const B = m.endereco ? BARRA : 0;
  // o cartão termina na base útil da tela de aula (a pessoa fica na moldura ao lado, não embaixo)
  const Hmax = BASE_LOGICA - Y0 - B;
  const dur = Math.max(0.01, m.ate - m.de);
  const lento = (t - m.de) / dur;
  const foco = m.foco ?? (m.setas?.[0] ? { x: m.setas[0].x, y: m.setas[0].y } : { x: 0.5, y: 0.3 });
  let corpo: React.ReactNode;
  // o cartão tem a altura do print (nunca sobra faixa); se o print é mais alto, ele rola até o foco
  const comImagem = temImagem(img) && !!img.largura && !!img.altura;
  const ih = comImagem ? img.altura! * (W / img.largura!) : Hmax;
  const H = Math.min(Hmax, ih);
  // print baixo (largo): no quadro deitado o cartão desce para perto do meio da tela de aula, em vez
  // de deixar a metade de baixo vazia (um pouco acima do centro)
  const Y = Y0 + Math.max(0, (BASE_LOGICA - Y0 - (H + B)) * 0.42);
  let mapa = (_x: number, _y: number) => ({ x: X, y: Y + B });
  if (comImagem) {
    const maxOff = Math.max(0, ih - H);
    const off = Math.min(maxOff, Math.max(0, foco.y * ih - H * 0.42 + lento * H * 0.05));
    // aproximação no ponto citado; o zoom nunca deixa ver fora do print (a origem fica dentro)
    const z = (m.zoom ?? 1) * (1 + 0.03 * lento);
    const zx = Math.min(W, Math.max(0, foco.x * W));
    const zy = Math.min(H, Math.max(0, foco.y * ih - off));
    corpo = (
      <div style={{ position: "absolute", left: 0, top: B, width: W, height: H, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${zx}px ${zy}px`, transform: `scale(${z})` }}>
          <Img src={staticFile(img.arquivo)} style={{ position: "absolute", left: 0, top: -off, width: W, height: ih }} />
        </div>
      </div>
    );
    mapa = (fx, fy) => ({
      x: X + zx + (fx * W - zx) * z,
      y: Y + B + zy + (fy * ih - off - zy) * z,
    });
  } else {
    corpo = <div style={{ position: "absolute", left: 0, top: B, width: W, height: H, background: COR.cinzaClaro, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 60, color: COR.cinza }}>{m.imagem.id}</div>;
  }
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {m.rotulo ? (
        <div style={{ position: "absolute", left: X, top: Y - 76 }}>
          <Pilula texto={m.rotulo} tamanho={36} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: X, top: Y, width: W, height: H + B, borderRadius: 22, overflow: "hidden", background: "#fff", boxShadow: SOMBRA_CARTAO, outline: `2px solid ${COR.linha}` }}>
        {m.endereco ? <Barra endereco={m.endereco} W={W} /> : null}
        {corpo}
      </div>
      {(m.setas ?? []).map((s, i) => {
        const p = mapa(s.x, s.y);
        return <SetaVermelha key={i} x={p.x} y={p.y} t={t} seta={s} />;
      })}
    </div>
  );
};
