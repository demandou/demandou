// Foco no rosto: o toque abre um anel, o quadrado procura (muda de tamanho e lugar aos trancos) e
// trava no rosto com o acento; a régua de exposição aparece ao lado e o sol sobe com o arrasto.
// Tudo em volta do rosto — nada passa por cima dele.
import { Easing } from "remotion";
import { limitar, mistura, prog, saindo } from "../anim";
import { escreverEv, numeroEv } from "../hud";
import type { Foco as TipoFoco } from "../plano";
import { cor, mono } from "../tema";
import { Moldura } from "./Abertura";
import { vidro } from "./Etiqueta";
import { Icone } from "./Icones";

// Brilho do vídeo durante o foco: ao travar, a câmera mede errado e escurece; o arrasto devolve a luz.
export const brilhoDoFoco = (m: TipoFoco, t: number) => {
  if (m.luzEm === undefined) return 1;
  const trava = prog(t, m.travaEm + 0.08, 0.3);
  const luz = prog(t, m.luzEm, (m.luzAte ?? m.luzEm + 1.3) - m.luzEm, Easing.inOut(Easing.quad));
  return 1 - 0.17 * trava + 0.17 * luz;
};

export const Foco: React.FC<{
  m: TipoFoco;
  t: number;
  fim: number;
  // centro do rosto na tela e a escala do vídeo (o quadrado acompanha o zoom)
  rosto: { x: number; y: number; escala: number };
}> = ({ m, t, fim, rosto }) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1 || t < m.toqueEm - 0.1) return null;
  const lado0 = 1080 * (m.quadro?.tamanho ?? 0.4) * rosto.escala;
  const cx = rosto.x + (m.quadro?.x ?? 0) * 1080;
  const cy = rosto.y + (m.quadro?.y ?? 0.012) * 1920;

  // toque: anel que se abre
  const toque = prog(t, m.toqueEm, 0.55, Easing.out(Easing.cubic));

  // procura: tamanhos e desvios aos trancos entre o toque e a trava
  const inicio = m.toqueEm + 0.08;
  const dur = Math.max(0.4, m.travaEm - inicio);
  const passos = [
    { f: 0, k: 1.45, dx: 0 },
    { f: 0.28, k: 0.86, dx: 22 },
    { f: 0.56, k: 1.16, dx: -14 },
    { f: 0.82, k: 0.95, dx: 6 },
    { f: 1, k: 1.0, dx: 0 },
  ];
  let k = passos[0].k;
  let dx = 0;
  for (let i = 1; i < passos.length; i++) {
    const p = prog(t, inicio + passos[i].f * dur - 0.12, 0.12, Easing.out(Easing.cubic));
    k = mistura(k, passos[i].k, p);
    dx = mistura(dx, passos[i].dx, p);
  }
  const trava = prog(t, m.travaEm, 0.28);
  // na trava, um aperto decidido (1,06 → 1)
  const aperto = trava > 0 && trava < 1 ? 0.06 * (1 - trava) : 0;
  const lado = lado0 * (k + aperto);
  const procurando = t < m.travaEm;
  const pisca = procurando ? (Math.floor(t * 14) % 2 === 0 ? 1 : 0.6) : 1;
  const aparece = prog(t, inicio, 0.12);

  // régua de exposição
  const temLuz = m.luzEm !== undefined;
  const luzDe = m.luzEm ?? 0;
  const luzAte = m.luzAte ?? luzDe + 1.3;
  const regua = temLuz ? prog(t, luzDe - 0.15, 0.3) : 0;
  const sobe = temLuz ? prog(t, luzDe, luzAte - luzDe, Easing.inOut(Easing.quad)) : 0;
  const rx = cx + lado0 / 2 + 70;
  const ry0 = cy - lado0 / 2;
  const ry1 = cy + lado0 / 2;
  const sol = mistura(cy + lado0 * 0.06, cy - lado0 * 0.36, sobe);
  const ev = Math.round(sobe * numeroEv(m.ev) * 10) / 10;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {toque > 0 && toque < 1 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={cx} cy={cy + lado0 * 0.1} r={30 + 150 * toque} fill="none" stroke={cor.branco} strokeWidth={4} opacity={(1 - toque) * 0.9} />
          <circle cx={cx} cy={cy + lado0 * 0.1} r={16} fill={cor.branco} opacity={(1 - toque) * 0.7} />
        </svg>
      ) : null}

      <Moldura
        cx={cx + dx}
        cy={cy}
        lado={lado}
        corTraco={trava > 0.5 ? cor.acento : cor.branco}
        espessura={procurando ? 3.5 : 5}
        braco={lado0 * 0.17}
        opacidade={aparece * pisca}
      />

      {/* selo "FOCO TRAVADO" */}
      {trava > 0 ? (
        <div
          style={{
            position: "absolute",
            left: cx,
            top: cy - lado0 / 2 - 82,
            translate: "-50% 0",
            padding: "8px 20px",
            fontFamily: mono,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: "0.12em",
            color: cor.acento,
            whiteSpace: "nowrap",
            opacity: trava,
            scale: String(0.92 + 0.08 * trava),
            ...vidro,
            borderRadius: 30,
          }}
        >
          {(m.selo ?? "FOCO TRAVADO").toUpperCase()}
        </div>
      ) : null}

      {/* régua de exposição com o sol */}
      {regua > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: regua }}>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, filter: "drop-shadow(0 0 3px rgba(0,0,0,0.5))" }}>
            {/* trilho: some em volta do sol; o trecho percorrido fica no acento */}
            <line x1={rx} x2={rx} y1={ry0} y2={sol - 52} stroke={cor.branco} strokeWidth={4.5} opacity={0.9} />
            <line x1={rx} x2={rx} y1={sol + 52} y2={ry1} stroke={cor.branco} strokeWidth={4.5} opacity={0.9} />
            {sobe > 0.02 ? <line x1={rx} x2={rx} y1={sol + 52} y2={Math.max(sol + 52, cy + lado0 * 0.06 + 52)} stroke={cor.acento} strokeWidth={6.5} /> : null}
            {/* marcas da régua */}
            {Array.from({ length: 9 }, (_, i) => {
              const y = ry0 + ((ry1 - ry0) * i) / 8;
              return Math.abs(y - sol) < 56 ? null : <line key={i} x1={rx - 13} x2={rx + 13} y1={y} y2={y} stroke={cor.branco} strokeWidth={3} opacity={0.65} />;
            })}
          </svg>
          <Icone
            nome="sol"
            tamanho={88}
            cor={sobe > 0.02 ? cor.acento : cor.branco}
            p={0.35 + 0.65 * limitar(sobe * 1.2)}
            espessura={4.2}
            style={{ position: "absolute", left: rx - 44, top: sol - 44, filter: "drop-shadow(0 0 3px rgba(0,0,0,0.5))" }}
          />
          <div
            style={{
              position: "absolute",
              left: rx + 58,
              top: sol - 30,
              fontFamily: mono,
              fontWeight: 600,
              fontSize: 44,
              color: cor.acento,
              textShadow: "0 1px 8px rgba(0,0,0,0.6)",
              opacity: limitar(sobe * 6),
            }}
          >
            {m.valor ?? escreverEv(ev)}
          </div>
        </div>
      ) : null}
    </div>
  );
};
