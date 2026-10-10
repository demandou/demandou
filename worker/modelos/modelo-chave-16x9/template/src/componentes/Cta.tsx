// Fechamento: uma régua curta com ganchos logo abaixo do queixo (acima das mãos); cada ação
// ("Salva", "Manda") é uma etiqueta que chega no gancho e balança na palavra. Ao lado, o complemento
// numa etiqueta deitada e, embaixo dele, a placa de porta com a assinatura. A última batida: a chave
// entra na fechadura da placa e gira, e o filete de latão da placa acende.
// No quadro deitado a faixa do peito é baixa: a régua com as etiquetas de ação fica à esquerda e a
// chamada com a placa à direita, numa FILEIRA centrada no rosto. Sem largura (lado livre do rosto),
// volta a pilha do vertical; sem altura nem para a fileira, a etiqueta de ação vira um selo dentro da
// chamada (o fechamento compacto).
import { useMemo } from "react";
import { balanco, indicesDoTrecho, Linhas, prog, saida, temposDoTexto, troca } from "../anim";
import { encaixar, larguraTexto, ROTULO } from "../medida";
import type { Cta as TipoCta, Icone as NomeIcone, Palavra, Plano } from "../plano";
import { BASE, cor, grotesca, LARGURA_PEITO, MARGEM, rotulo, serifa, W } from "../tema";
import { FundoEtiqueta, misturarCor } from "./Etiqueta";
import { Icone } from "./Icones";

// A fechadura da placa: espelho de latão com o buraco da chave; a chave (vista de frente, a cabeça
// de perfil) entra e gira 90°.
const Fechadura: React.FC<{ entra: number; gira: number; tamanho: number }> = ({ entra, gira, tamanho }) => {
  const r = tamanho / 2;
  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} style={{ display: "block", overflow: "visible", flexShrink: 0 }}>
      <circle cx={r} cy={r} r={r - 2} fill={cor.latao} stroke={cor.lataoEscuro} strokeWidth={4} />
      <circle cx={r} cy={r} r={r - 10} fill="none" stroke={cor.lataoClaro} strokeWidth={2} opacity={0.7} />
      {/* buraco da chave */}
      <g opacity={1 - entra}>
        <circle cx={r} cy={r - 5} r={7} fill={cor.preto} />
        <path d={`M ${r - 5} ${r - 2} L ${r - 8} ${r + 13} L ${r + 8} ${r + 13} L ${r + 5} ${r - 2} Z`} fill={cor.preto} />
      </g>
      {/* a chave: chega de frente (encolhe até o tamanho) e gira */}
      {entra > 0.001 ? (
        <g transform={`translate(${r} ${r}) rotate(${gira * 90}) scale(${1.45 - 0.45 * entra})`} opacity={Math.min(1, entra * 1.6)}>
          <rect x={-9} y={-r * 0.95} width={18} height={r * 1.9} rx={9} fill={cor.lataoClaro} stroke={cor.lataoEscuro} strokeWidth={3.5} />
          <circle cx={0} cy={-r * 0.55} r={4} fill={cor.lataoEscuro} />
        </g>
      ) : null}
    </svg>
  );
};

// Quando a chave entra na fechadura: na última palavra do fechamento, com folga para girar antes do fim
export const quandoFecha = (m: TipoCta, palavras: Palavra[]) => {
  const ultimaPalavra = palavras.filter((p) => p.em >= m.de && p.em < m.ate + 0.1).pop();
  return Math.min(m.ate - 0.95, ultimaPalavra ? ultimaPalavra.em : m.ate - 0.95);
};

// `centro`: o centro do rosto na tela cheia (o fechamento fica centrado nele).
// `topo`: o topo da faixa do peito (logo abaixo do queixo); a régua sobe até ~30 px abaixo do queixo.
// As etiquetas de ação: as do plano (`acoes`, com texto) ou uma só, com o ícone do `icone`
// (sem ícone: a chave do modelo), chegando na primeira palavra da chamada.
export const acoesDoCta = (m: TipoCta): { texto: string; icone: NomeIcone; em: number }[] =>
  m.acoes?.length ? m.acoes.slice(0, 2) : [{ texto: "", icone: m.icone ?? "chave", em: (m.em ?? m.de) + 0.02 }];

// `queixo`: altura do queixo na tela (px); a régua nunca sobe acima dele
export const Cta: React.FC<{ m: TipoCta; marca: Plano["marca"]; palavras: Palavra[]; t: number; topo: number; fim: number; centro?: number; largura?: number; queixo?: number; entradaMin?: number }> = ({
  m,
  marca,
  palavras,
  t,
  topo,
  fim,
  centro = W / 2,
  largura = LARGURA_PEITO,
  queixo = 0,
  entradaMin = -1,
}) => {
  const acoes = acoesDoCta(m);
  const legado = !!m.acoes?.length;
  const entrada = Math.max(entradaMin, Math.min(m.de + 0.06, (acoes[0]?.em ?? m.de) - 0.04));
  const pEntra = prog(t, entrada, 0.45);
  const s = saida(t, fim, 0.3);
  const ultimaAcao = Math.max(...acoes.map((a) => a.em), m.de);
  // no formato antigo o texto é o complemento, dito depois das ações; na chamada universal, é a
  // própria chamada, dita a partir de `em`
  const inicioTexto = legado ? ultimaAcao : (m.em ?? m.de);
  const tempos = useMemo(
    () => (m.texto ? (legado ? temposDoTexto(m.texto, palavras, ultimaAcao, m.ate, ultimaAcao + 0.15) : temposDoTexto(m.texto, palavras, inicioTexto - 0.1, m.ate, inicioTexto - 0.02)) : []),
    [m.texto, palavras, ultimaAcao, m.ate, legado, inicioTexto],
  );
  const destaque = useMemo(() => indicesDoTrecho(m.texto ?? "", m.destaque), [m.texto, m.destaque]);
  const temAssinatura = !!marca.nome;
  const BASE_CTA = BASE;
  const SELO = 76;
  const VAO_FILEIRA = 44;
  // a régua: logo abaixo do queixo (nunca acima dele), no topo da faixa do peito
  const reguaY = Math.max(topo - 30, queixo + 30);
  const alturaDe = (c: { linhas: string[]; tamanho: number } | null) => (c ? (c.linhas.length > 1 ? 40 + c.linhas.length * c.tamanho * 1.15 : Math.max(92, c.tamanho + 46)) : 0);
  // FILEIRA (o peito largo do quadro deitado): a régua com as etiquetas à esquerda, a chamada e a placa
  // à direita. As etiquetas cabem na altura da faixa; a chamada, na largura que sobra.
  const fileira = largura >= 1000;
  const alturaFaixa = BASE_CTA - reguaY;
  const etFileira = Math.round(Math.max(130, Math.min(200, alturaFaixa - 30 - 26 - 8)));
  const larguraReguaFileira = acoes.length * (etFileira + 36) + 24;
  // a placa com o nome: a largura de verdade (fechadura, nome em serifa e área em caixa alta)
  const larguraPlaca = temAssinatura ? 14 + 70 + 18 + larguraTexto(marca.nome, 46, { nome: "serifa" }) + (marca.area ? 18 + larguraTexto(marca.area, 30, ROTULO) : 0) + 30 : 0;
  // a chamada tem pelo menos a largura da placa (as duas alinhadas), sem passar da faixa
  const larguraCompFileira = Math.min(W - 2 * MARGEM - larguraReguaFileira - VAO_FILEIRA, Math.max(Math.min(900, largura - larguraReguaFileira - VAO_FILEIRA), larguraPlaca));
  const compFileira = useMemo(
    () => (m.texto && fileira ? encaixar(m.texto, { largura: larguraCompFileira - 66 - 24, max: legado ? 46 : 52, min: 36, linhas: 2 }) : null),
    [m.texto, fileira, larguraCompFileira, legado],
  );
  const alturaDireita = (compFileira ? alturaDe(compFileira) : 0) + (compFileira && temAssinatura ? 18 : 0) + (temAssinatura ? 96 : 0);
  const cabeFileira = fileira && etFileira + 56 <= alturaFaixa + 1 && alturaDireita <= alturaFaixa;
  // PILHA (lado livre, estreito): como no vertical
  const larguraRegua = cabeFileira ? larguraReguaFileira : legado ? 600 : 320;
  const larguraComp = cabeFileira ? larguraCompFileira : Math.min(largura, W - 2 * MARGEM) - 40;
  const larguraGrupo = cabeFileira ? larguraRegua + VAO_FILEIRA + Math.max(larguraComp, larguraPlaca) : Math.max(larguraRegua, larguraComp);
  const x0 = Math.min(W - MARGEM - larguraGrupo, Math.max(MARGEM, centro - larguraGrupo / 2));
  const cx0 = x0 + larguraGrupo / 2;
  const regua = { x: cabeFileira ? x0 : cx0 - larguraRegua / 2, w: larguraRegua, y: reguaY, h: 30 };
  // o complemento: medido para caber em 1 ou 2 linhas
  const compNormal = useMemo(
    () => (m.texto ? (cabeFileira ? compFileira : encaixar(m.texto, { largura: larguraComp - 66 - 24, max: legado ? 46 : 52, min: legado ? 38 : 40, linhas: 2 })) : null),
    [m.texto, larguraComp, legado, cabeFileira, compFileira],
  );
  // pouco espaço no peito: a etiqueta de ação vira um selo dentro da etiqueta da chamada, sem a
  // régua; o resto (chamada, placa, chave na fechadura) continua igual
  const compacto = !cabeFileira && !legado && 30 + 150 + 34 + alturaDe(compNormal) + 18 + (temAssinatura ? 96 : 0) > BASE_CTA - reguaY;
  const compCompacto = useMemo(() => (m.texto && compacto ? encaixar(m.texto, { largura: larguraComp - 66 - SELO - 20 - 24, max: 52, min: 36, linhas: 2 }) : null), [m.texto, larguraComp, compacto]);
  const comp1 = compacto ? compCompacto : compNormal;
  const alturaComp = compacto ? Math.max(SELO + 30, alturaDe(comp1)) : alturaDe(comp1);
  // na pilha, a régua, as etiquetas, o complemento e a placa cabem na faixa: as etiquetas encolhem
  const resto = BASE_CTA - (regua.y + regua.h) - 34 - (comp1 ? alturaComp + 18 : 0) - (temAssinatura ? 96 : 0);
  const etW = cabeFileira ? etFileira : Math.max(150, Math.min(220, resto));
  const etH = etW;
  const assinatura = prog(t, (legado ? ultimaAcao + 0.5 : (tempos[tempos.length - 1] ?? ultimaAcao) - 0.1), 0.45);
  const comp = prog(t, (tempos[0] ?? ultimaAcao) - 0.25, 0.4);
  // onde ficam a chamada e a placa: ao lado da régua (fileira) ou embaixo das etiquetas (pilha)
  const xComp = cabeFileira ? x0 + larguraRegua + VAO_FILEIRA : cx0 - larguraComp / 2;
  const yTexto = cabeFileira ? reguaY + Math.max(0, (etH + 56 - alturaDireita) / 2) : compacto ? regua.y : regua.y + regua.h + etH + 34;
  const yPlaca = yTexto + (comp1 ? alturaComp + 18 : 0);
  // na fileira a placa encosta na borda esquerda da chamada; na pilha, fica centrada
  const xPlaca = cabeFileira ? xComp : cx0;
  if (t < entrada - 0.01 || s >= 1) return null;
  // a última batida: a chave entra na fechadura na última palavra e gira
  const fecha = quandoFecha(m, palavras);
  const chaveEntra = prog(t, fecha, 0.22);
  const chaveGira = prog(t, fecha + 0.24, 0.36, troca);
  const luz = prog(t, fecha + 0.5, 0.35);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - s }}>
      {/* régua com ganchos */}
      {compacto ? null : <div style={{ position: "absolute", left: regua.x, top: regua.y, width: regua.w, height: regua.h, opacity: pEntra, translate: `0 ${(1 - pEntra) * 30}px` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 8, background: cor.madeira, boxShadow: "0 6px 10px rgba(30,20,10,0.25)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, borderRadius: 3, background: cor.madeiraEscura, opacity: 0.45 }} />
      </div>}
      {(compacto ? [] : acoes).map((a, i) => {
        const cx = regua.x + (regua.w * (i + 0.5)) / acoes.length;
        const chega = prog(t, a.em - 0.05, 0.3);
        const angulo = balanco(t, a.em + 0.08, 9, 0.62, 0.3);
        const pinoY = regua.y + regua.h - 8;
        return (
          <div key={`${a.texto}-${i}`}>
            <svg width={30} height={36} style={{ position: "absolute", left: cx - 15, top: pinoY, overflow: "visible", opacity: pEntra }}>
              <rect x={9} y={0} width={12} height={20} rx={4} fill={cor.preto} />
              <circle cx={15} cy={21} r={8} fill={cor.preto} />
            </svg>
            {/* esboço até a palavra */}
            <div style={{ position: "absolute", left: cx - etW / 2, top: pinoY + 18, width: etW, height: etH, opacity: (1 - chega) * pEntra }}>
              <FundoEtiqueta w={etW} h={etH} esboco={1} />
              <div style={{ position: "absolute", inset: 0, paddingTop: etH * 0.21, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <Icone nome={a.icone} tamanho={a.texto ? etW * 0.29 : etW * 0.42} cor={cor.lapisClaro} />
                {a.texto ? <div style={{ fontFamily: grotesca, fontWeight: 700, fontSize: etW * 0.218, color: cor.lapisClaro }}>{a.texto}</div> : null}
              </div>
            </div>
            {chega > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  left: cx - etW / 2,
                  top: pinoY + 18,
                  width: etW,
                  height: etH,
                  transformOrigin: `${etW / 2}px -6px`,
                  rotate: `${angulo}deg`,
                  translate: `0 ${(1 - chega) * -40}px`,
                  opacity: Math.min(1, chega * 1.8),
                }}
              >
                <FundoEtiqueta w={etW} h={etH} acesa={1} />
                <svg width={44} height={44} style={{ position: "absolute", left: etW / 2 - 22, top: -26, overflow: "visible" }}>
                  <circle cx={22} cy={22} r={17} fill="none" stroke={cor.lataoEscuro} strokeWidth={7} />
                  <circle cx={22} cy={22} r={17} fill="none" stroke={cor.latao} strokeWidth={4} />
                </svg>
                <div style={{ position: "absolute", inset: 0, paddingTop: etH * 0.21, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <Icone nome={a.icone} tamanho={a.texto ? etW * 0.29 : etW * 0.42} cor={cor.papel} espessura={5} />
                  {a.texto ? <div style={{ fontFamily: grotesca, fontWeight: 700, fontSize: etW * 0.218, color: cor.papel }}>{a.texto}</div> : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {/* complemento (ou a chamada) numa etiqueta deitada */}
      {comp1 ? (
        <div
          style={{
            position: "absolute",
            left: xComp,
            width: larguraComp,
            top: yTexto,
            height: alturaComp,
            opacity: comp,
            translate: `0 ${(1 - comp) * 24}px`,
          }}
        >
          <FundoEtiqueta w={larguraComp} h={alturaComp} deitada />
          {compacto ? (
            <div style={{ position: "absolute", left: 62, top: (alturaComp - SELO) / 2, width: SELO, height: SELO, borderRadius: SELO / 2, background: cor.verde, display: "flex", alignItems: "center", justifyContent: "center", scale: `${0.7 + 0.3 * prog(t, (acoes[0]?.em ?? m.de) - 0.05, 0.3)}` }}>
              <Icone nome={acoes[0]?.icone ?? "chave"} tamanho={SELO * 0.56} cor={cor.papel} espessura={5.5} />
            </div>
          ) : null}
          <div style={{ position: "absolute", left: compacto ? 62 + SELO + 20 : 66, right: 24, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: compacto ? "flex-start" : "center" }}>
            <Linhas
              linhas={comp1.linhas}
              tempos={tempos}
              t={t}
              esboco={0.22}
              alinhar={compacto ? "left" : "center"}
              corDe={(i) => (destaque.has(i) ? cor.verde : undefined)}
              style={{ alignItems: compacto ? "flex-start" : "center", fontFamily: grotesca, fontWeight: 600, fontSize: comp1.tamanho, lineHeight: 1.15, color: cor.preto }}
            />
          </div>
        </div>
      ) : null}
      {/* placa de porta com a assinatura e a fechadura */}
      {temAssinatura ? (
        <div
          style={{
            position: "absolute",
            left: xPlaca,
            top: yPlaca,
            translate: `${cabeFileira ? "0" : "-50%"} ${(1 - assinatura) * 20}px`,
            opacity: assinatura,
            background: cor.preto,
            borderRadius: 12,
            padding: "12px 30px 12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 18,
            boxShadow: `0 10px 16px rgba(20,14,8,0.3), inset 0 0 0 ${2 + luz * 1.5}px ${misturarCor(cor.lataoEscuro, cor.lataoClaro, luz)}`,
            whiteSpace: "nowrap",
          }}
        >
          <Fechadura entra={chaveEntra} gira={chaveGira} tamanho={70} />
          <div style={{ fontFamily: serifa, fontSize: 46, color: cor.papel, lineHeight: 1 }}>{marca.nome}</div>
          {marca.area ? <div style={{ ...rotulo, fontSize: 30, color: misturarCor(cor.latao, cor.lataoClaro, luz), paddingTop: 4 }}>{marca.area}</div> : null}
        </div>
      ) : null}
    </div>
  );
};

