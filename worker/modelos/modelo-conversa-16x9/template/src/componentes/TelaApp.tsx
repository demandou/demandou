import { mistura, prog, rola, temposDoTexto, Digitado } from "../anim";
import type { ConversaInterna, MomentoInterno, PlanoInterno } from "../blocos";
import { crescimentoDoPreco, deslocamentoDaTela, DUR_TROCA_TELA, linhasDoFio, type Linha, REACAO_ALTURA, type Tela, VISTO_ALTURA } from "../fio";
import type { Comparacao, Fixada, Palavra } from "../plano";
import { BARRA_GRAVACAO, CABECALHO, COLUNA, CONTATO_PADRAO, caber, cor, CONVERSA_TOPO, FIXADA, fonte, larguraTexto, MARGEM, quebrarEquilibrado, T, W } from "../tema";
import { Balao, BalaoDigitando, Reacao, Visto } from "./Balao";
import { ComparacaoTela } from "./Comparacao";
import { ContrasteTela } from "./Contraste";
import { Icone } from "./Icones";

// ---------- cabeçalho do app ----------

export const statusDoContato = (plano: PlanoInterno, tela: Tela | undefined, t: number): { texto: string; cor: string; online: boolean } => {
  // digitando: algum "digitando…" do cliente aparecendo agora
  if (tela?.tipo === "fio") {
    const digitando = tela.mensagens.some(
      (m) => m.de === "cliente" && !m.presente && t >= m.inicio && (m.tipo === "digitando" ? t < (m.ate ?? m.em + 1) : t < m.em),
    );
    if (digitando) return { texto: "digitando…", cor: cor.acento, online: true };
  }
  // offline do `offlineEm` até o fim do momento (o do destaque dura a troca para a bolha)
  const offline = plano.momentos.some(
    (m) => "offlineEm" in m && m.offlineEm !== undefined && t >= m.offlineEm && t < m.ate + (m.tipo === "balao" ? 0.3 : 0),
  );
  if (offline) return { texto: "offline", cor: cor.porcelanaApagada, online: false };
  return { texto: "online", cor: cor.porcelanaSuave, online: true };
};

export const Avatar: React.FC<{ tamanho: number; online?: boolean; inicial?: string }> = ({ tamanho, online, inicial }) => (
  <div style={{ position: "relative", width: tamanho, height: tamanho, flexShrink: 0 }}>
    <div
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho,
        background: "#2E3542",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: fonte,
        fontWeight: 700,
        fontSize: tamanho * 0.46,
        color: cor.porcelana,
      }}
    >
      {inicial ? inicial : <Icone nome="pessoa" tamanho={tamanho * 0.62} cor={cor.porcelanaSuave} traco={3.5} estilo={{ translate: `0 ${tamanho * 0.06}px` }} />}
    </div>
    {online !== undefined ? (
      <div
        style={{
          position: "absolute",
          right: -2,
          bottom: -2,
          width: tamanho * 0.3,
          height: tamanho * 0.3,
          borderRadius: tamanho,
          background: online ? cor.acento : "#59606C",
          border: `4px solid ${cor.barra}`,
        }}
      />
    ) : null}
  </div>
);

const Cabecalho: React.FC<{ nome: string; status: { texto: string; cor: string; online: boolean } }> = ({ nome, status }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: CABECALHO.topo + CABECALHO.altura, background: cor.barra, borderBottom: `2px solid ${cor.linha}` }}>
    <div style={{ position: "absolute", left: 0, top: CABECALHO.topo, width: W, height: CABECALHO.altura, display: "flex", alignItems: "center", padding: `0 ${MARGEM - 14}px` }}>
      <Icone nome="voltar" tamanho={50} cor={cor.porcelanaSuave} traco={5} />
      <div style={{ width: 18 }} />
      <Avatar tamanho={100} online={status.online} />
      <div style={{ marginLeft: 26, display: "flex", flexDirection: "column", gap: 2, fontFamily: fonte }}>
        <div style={{ fontSize: T.nome, fontWeight: 700, color: cor.porcelana, lineHeight: 1.08 }}>{nome}</div>
        <div style={{ fontSize: T.status, fontWeight: 500, color: status.cor, lineHeight: 1.08 }}>{status.texto}</div>
      </div>
      <div style={{ flex: 1 }} />
      <Icone nome="video" tamanho={62} cor={cor.porcelanaSuave} traco={4.5} />
      <div style={{ width: 44 }} />
      <Icone nome="telefone" tamanho={54} cor={cor.porcelanaSuave} traco={4.5} />
    </div>
  </div>
);

// ---------- mensagem fixada ----------

const conteudoFixada = (f: Fixada, palavras: Palavra[], de: number, ate: number, t: number) => {
  const errado = f.tom === "errado";
  const larguraRotulo = f.rotulo ? larguraTexto(f.rotulo, T.rotulo, 800) + 48 + (errado ? 44 : 0) : 0;
  // uma linha (a letra diminui até 40 px); se ainda não couber, duas linhas equilibradas.
  // No quadro deitado a barra atravessa a tela, mas o texto fica numa linha de leitura (~1500)
  const disponivel = Math.min(W - 2 * MARGEM, 1500) - 40 - larguraRotulo - 24;
  const tamanho = caber(f.texto, disponivel, T.fixada, 46, 600);
  const linhas = larguraTexto(f.texto, tamanho, 600) <= disponivel ? [f.texto] : quebrarEquilibrado(f.texto, disponivel, 46, 600, 2);
  const tempos = temposDoTexto(f.texto, palavras, de, ate, de + 0.2);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, height: "100%", fontFamily: fonte }}>
      <div style={{ width: 8, height: 70, borderRadius: 4, background: errado ? "#59606C" : cor.acento, flexShrink: 0 }} />
      {f.rotulo ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 64,
            padding: "0 22px",
            borderRadius: 32,
            background: errado ? cor.frio : cor.acento,
            color: errado ? cor.porcelana : cor.tinta,
            fontSize: T.rotulo,
            fontWeight: 800,
            letterSpacing: "0.02em",
            flexShrink: 0,
          }}
        >
          {errado ? <Icone nome="x" tamanho={32} cor={cor.porcelana} traco={5} /> : null}
          {f.rotulo}
        </div>
      ) : null}
      <Digitado linhas={linhas} tempos={tempos} t={t} rascunho style={{ fontSize: tamanho, fontWeight: 600, color: cor.porcelana, lineHeight: 1.1 }} />
    </div>
  );
};

// A mensagem fixada no topo. Cada tela do app diz o que acontece com ela:
// - conversa da assinatura com `fixada`: troca (a nova empurra a de cima); sem `fixada`: continua a de antes;
// - blocos (lista, passos, gráfico, comparação) com título: o título vira a fixada; sem título: a barra recolhe;
// - contraste: a barra recolhe (as faixas têm os próprios títulos).
// Depois de recolhida, a próxima fixada abre a barra de novo. 1 = recolhida (ou nenhuma).
type FixadaAtiva = { m: ConversaInterna | Comparacao; f: Fixada; de: number; ate: number };

const fixadaDe = (m: MomentoInterno): Fixada | null | undefined => {
  if (m.tipo === "contraste") return null;
  if (m.tipo === "comparacao") return m.titulo ? { texto: m.titulo, tom: "certo" } : null;
  if (m.tipo === "conversa") return m.fixada ?? (m.bloco || m.semFixada ? null : undefined);
  return undefined;
};

const fixadas = (momentos: MomentoInterno[], t: number) => {
  const app = momentos.filter((m) => m.tipo === "conversa" || m.tipo === "contraste" || m.tipo === "comparacao").sort((a, b) => a.de - b.de);
  let atual: FixadaAtiva | undefined;
  let anterior: FixadaAtiva | undefined;
  let recolhida = true;
  let desde = -100;
  let primeira = true;
  for (const m of app) {
    if (m.de - 0.05 > t) break;
    const f = fixadaDe(m);
    if (f === undefined) continue;
    if (f === null) {
      if (!recolhida) {
        recolhida = true;
        desde = m.de;
      }
      continue;
    }
    if (recolhida) {
      recolhida = false;
      // a primeira fixada do vídeo já está lá quando a pessoa encolhe; as outras abrem a barra
      desde = primeira ? -100 : m.de;
      anterior = undefined;
    } else anterior = atual;
    primeira = false;
    atual = { m: m as ConversaInterna | Comparacao, f, de: m.de, ate: m.ate };
  }
  const p = prog(t, desde - 0.05, 0.4, rola);
  const recolhe = !atual ? 1 : recolhida ? p : 1 - p;
  return { atual, anterior, recolhe };
};

// a etiqueta da fixada: nos passos, conta os itens já ditos ("2/3")
const fixadaNoTempo = (a: FixadaAtiva, t: number): Fixada => {
  const contador = a.m.tipo === "conversa" ? a.m.contador : undefined;
  if (!contador?.length) return a.f;
  const ditos = contador.filter((em) => em - 0.1 <= t).length;
  return { ...a.f, rotulo: `${Math.max(1, ditos)}/${contador.length}` };
};

const BarraFixada: React.FC<{ momentos: MomentoInterno[]; t: number; palavras: Palavra[] }> = ({ momentos, t, palavras }) => {
  const { atual, anterior, recolhe } = fixadas(momentos, t);
  if (!atual || recolhe >= 1) return null;
  const troca = prog(t, atual.de - 0.05, 0.42, rola);
  const fim = (a: FixadaAtiva) => a.ate + 2;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: FIXADA.topo - recolhe * FIXADA.altura,
        width: W,
        height: FIXADA.altura,
        background: "#12161D",
        borderBottom: `2px solid ${cor.linha}`,
        overflow: "hidden",
        opacity: 1 - recolhe,
      }}
    >
      {anterior && troca < 1 ? (
        <div style={{ position: "absolute", left: MARGEM - 16, right: MARGEM, top: -troca * FIXADA.altura, height: FIXADA.altura, opacity: 1 - troca }}>
          {conteudoFixada(fixadaNoTempo(anterior, t), palavras, anterior.de, fim(anterior), t)}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: MARGEM - 16, right: MARGEM, top: (1 - troca) * FIXADA.altura * (anterior ? 1 : 0.4), height: FIXADA.altura, opacity: troca }}>
        {conteudoFixada(fixadaNoTempo(atual, t), palavras, atual.de, fim(atual), t)}
      </div>
    </div>
  );
};

// ---------- o fio ----------

// da borda direita da coluna da conversa até a borda direita da tela (os seus balões encostam nela)
const DIREITA_DA_COLUNA = W - COLUNA.x - COLUNA.w;

const LinhaDoFio: React.FC<{ l: Linha; topoArea: number; t: number; hora: string; palavras: Palavra[]; nome: string }> = ({ l, topoArea, t, hora, palavras, nome }) => {
  if (l.perfil) {
    // o cartão do contato que abre a conversa (como num app de mensagens quando a conversa é nova)
    return (
      <div
        style={{
          position: "absolute",
          left: COLUNA.x,
          width: COLUNA.w,
          top: l.y - topoArea,
          height: l.h,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          fontFamily: fonte,
        }}
      >
        <Avatar tamanho={160} />
        <div style={{ fontSize: 64, fontWeight: 700, color: cor.porcelana, lineHeight: 1.1 }}>{nome}</div>
        <div style={{ padding: "8px 28px", borderRadius: 30, background: cor.barra, fontWeight: 600, fontSize: 38, color: cor.porcelanaSuave }}>{`Conversa nova · hoje`}</div>
      </div>
    );
  }
  const m = l.msg;
  const med = l.medida;
  const dig = l.medidaDigitando;
  if (!m || !med || !dig) return null;
  const eu = m.de === "eu";
  const sistema = m.tipo === "confirmacao";
  const pVisto = m.vistoEm !== undefined ? prog(t, m.vistoEm, 0.3, rola) : 0;
  const pReacao = m.reacao ? prog(t, m.reacao.em, 0.3, rola) : 0;
  const hMsg = med.h - (m.tipo === "preco" ? med.extra * (1 - crescimentoDoPreco(m, t)) : 0);
  const altBalao = m.tipo === "digitando" ? dig.h : mistura(dig.h, hMsg, l.pronta);
  const largBalao = m.tipo === "digitando" ? dig.w : mistura(dig.w, med.w, Math.min(1, l.pronta * 1.6));
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: l.y - topoArea, height: l.h, opacity: Math.min(1, l.entrada * 1.4) * (1 - l.some) }}>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          // no quadro da esquerda: os seus balões à direita da coluna, os do outro lado à esquerda
          left: sistema ? COLUNA.x : eu ? undefined : COLUNA.x,
          right: sistema ? DIREITA_DA_COLUNA : eu ? DIREITA_DA_COLUNA : undefined,
          display: "flex",
          flexDirection: "column",
          alignItems: sistema ? "center" : eu ? "flex-end" : "flex-start",
        }}
      >
        <div style={{ position: "relative", width: largBalao, height: altBalao }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: med.corpo * 0.62 }}>
            {l.pronta < 1 ? (
              <div style={{ position: "absolute", top: 0, [eu ? "right" : "left"]: 0 }}>
                <BalaoDigitando de={m.de} med={dig} t={t} opacidade={1 - l.pronta} />
              </div>
            ) : null}
            {m.tipo !== "digitando" && l.pronta > 0 ? (
              <div style={{ position: "absolute", top: 0, [eu ? "right" : "left"]: 0, opacity: Math.min(1, l.pronta * 1.5) }}>
                <Balao m={m} med={med} t={t} hora={m.hora ?? hora} palavras={palavras} />
              </div>
            ) : null}
          </div>
          {m.reacao && pReacao > 0 ? (
            <div style={{ position: "absolute", bottom: -REACAO_ALTURA - 16, left: eu ? -18 : 28 }}>
              <Reacao m={m} t={t} tamanho={104} />
            </div>
          ) : null}
        </div>
        <div style={{ height: REACAO_ALTURA * pReacao }} />
        {m.vistoEm !== undefined ? (
          <div style={{ height: VISTO_ALTURA * pVisto, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
            <Visto m={m} t={t} corpo={med.corpo} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ---------- a tela inteira do app (fica atrás da pessoa) ----------
// Em unidades da tela virtual (2400×1350, reduzida a 0,8 no quadro): o cabeçalho, a fixada e a
// barra de gravação atravessam a tela; a conversa fica no quadro da esquerda (COLUNA) e a moldura
// da direita é o lugar da bolha (a pessoa, desenhada por cima, em px do quadro).

export const TelaApp: React.FC<{
  plano: PlanoInterno;
  telas: Tela[];
  tela: Tela | undefined;
  t: number;
  base: number;
}> = ({ plano, telas, tela, t, base }) => {
  const nome = plano.contato?.nome ?? CONTATO_PADRAO;
  const hora = plano.contato?.hora ?? "14:02";
  const status = statusDoContato(plano, tela, t);
  // sem a fixada (num contraste), a área da conversa sobe e ocupa o lugar dela
  const topoArea = CONVERSA_TOPO - FIXADA.altura * fixadas(plano.momentos, t).recolhe;
  const alturaArea = base - topoArea;
  // o degradê do topo (onde as mensagens antigas somem) não é preciso num contraste, que não rola
  const degrade = Math.round(64 * (1 - (tela && tela.tipo !== "fio" ? prog(t, tela.de, DUR_TROCA_TELA) : 0)));
  // telas visíveis: a atual e, durante uma troca, a vizinha (uma sai rolando para cima, a outra entra)
  const i = tela ? telas.indexOf(tela) : -1;
  const visiveis = [telas[i - 1], tela, telas[i + 1]].filter((x): x is Tela => !!x).filter((x) => {
    const d = deslocamentoDaTela(telas, x, t, alturaArea);
    return Math.abs(d) < alturaArea + 120 && t >= x.de - 0.6;
  });
  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${cor.noite} 0%, ${cor.noiteFundo} 100%)` }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: topoArea,
          width: W,
          height: Math.max(0, alturaArea + 6),
          overflow: "hidden",
          WebkitMaskImage: `linear-gradient(180deg, transparent 0px, black ${degrade}px)`,
          maskImage: `linear-gradient(180deg, transparent 0px, black ${degrade}px)`,
        }}
      >
        {visiveis.map((x) => {
          const d = deslocamentoDaTela(telas, x, t, alturaArea);
          if (x.tipo === "contraste") {
            return (
              <div key={`tela-${x.de}`} style={{ position: "absolute", left: 0, top: d, width: W, height: alturaArea }}>
                <ContrasteTela m={x.momento} t={t} altura={alturaArea - 20} palavras={plano.palavras} hora={hora} topo={20} />
              </div>
            );
          }
          if (x.tipo === "comparacao") {
            return (
              <div key={`tela-${x.de}`} style={{ position: "absolute", left: 0, top: d, width: W, height: alturaArea }}>
                <ComparacaoTela m={x.momento} t={t} altura={alturaArea} palavras={plano.palavras} hora={hora} topo={22} />
              </div>
            );
          }
          const linhas = linhasDoFio(x, t, base, T.balao);
          return (
            <div key={`tela-${x.de}`} style={{ position: "absolute", left: 0, top: d, width: W, height: alturaArea + 400 }}>
              {linhas.map((l) => (l.y + l.h < topoArea - 40 ? null : <LinhaDoFio
                    key={l.chave}
                    l={l}
                    topoArea={topoArea}
                    t={t}
                    hora={hora}
                    palavras={plano.palavras}
                    nome={nome}
                  />))}
            </div>
          );
        })}
      </div>
      <BarraDeGravacao t={t} />
      <BarraFixada momentos={plano.momentos} t={t} palavras={plano.palavras} />
      <Cabecalho nome={nome} status={status} />
    </div>
  );
};

// A barra de baixo do app enquanto a mensagem de vídeo é gravada: o tempo, "deslize para cancelar"
// e o botão de enviar. Fica embaixo, na faixa dos controles do player (é só moldura).
const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const BarraDeGravacao: React.FC<{ t: number }> = ({ t }) => {
  const pisca = 0.45 + 0.55 * (0.5 + 0.5 * Math.cos(t * Math.PI * 2 * 0.9));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: BARRA_GRAVACAO.topo,
        width: W,
        bottom: 0,
        background: cor.barra,
        borderTop: `2px solid ${cor.linha}`,
        fontFamily: fonte,
      }}
    >
      <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: 8, height: 104, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 22, height: 22, borderRadius: 22, background: cor.acento, opacity: pisca }} />
        <div style={{ fontSize: 44, fontWeight: 600, color: cor.porcelana, fontVariantNumeric: "tabular-nums" }}>{mmss(t)}</div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 12, fontSize: 38, fontWeight: 500, color: cor.porcelanaApagada }}>
          <Icone nome="voltar" tamanho={34} cor={cor.porcelanaApagada} traco={4} />
          deslize para cancelar
        </div>
        <div style={{ width: 104, height: 104, borderRadius: 104, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome="compartilhar" tamanho={50} cor={cor.tinta} traco={5} estilo={{ translate: "-3px 2px" }} />
        </div>
      </div>
    </div>
  );
};
