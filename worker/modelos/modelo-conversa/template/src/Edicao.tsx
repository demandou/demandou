import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { prog, saindo, useTempo } from "./anim";
import { type ConversaInterna, ehCheio, type MomentoInterno, type Msg, normalizar, type PlanoInterno } from "./blocos";
import { BlocoNoPeito, CtaCheia, MensagemNoPeito, PilulaAssinatura, PilulaContato, PilulaPasso, visivelCheia } from "./componentes/Cheia";
import { Gravacao } from "./componentes/Gravacao";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { TelaApp } from "./componentes/TelaApp";
import { DIGITANDO_PADRAO, diametroNoMomento, montarTelas, type Tela, telaEm } from "./fio";
import {
  aberturaCheia,
  ADIANTA,
  baseDaConversa,
  caixaDaPessoa,
  type Diametro,
  diametroDoApp,
  type Faixa,
  faixaEm,
  montarFaixas,
} from "./layout";
import { montarFrases } from "./motor/frases";
import { VideoNaCaixa } from "./motor/caixa";
import type { Plano } from "./plano";
import { BOLHA, CONTATO_PADRAO, H, T, zona as zonaPadrao } from "./tema";

type Som = { em: number; arquivo: string; volume: number; prioridade: number };

// Som raro e tonal: a bolha que cresce/encolhe, a mensagem que chega, o valor enviado, o que esfria,
// o que dá certo e o toque no botão. Nunca dois sons a menos de 0,45 s (fica o mais importante).
const sons = (plano: PlanoInterno, faixas: Faixa[], telas: Tela[]): Som[] => {
  const lista: Som[] = [];
  faixas.forEach((f, i) => {
    const antes = faixas[i - 1];
    if (!antes) return;
    const trocaDePessoa = (antes.modo === "cheia") !== (f.modo === "cheia");
    if (trocaDePessoa) lista.push({ em: f.de, arquivo: "sfx/bolha.wav", volume: 0.42, prioridade: 2 });
    else if (antes.modo !== f.modo || (f.momento?.tipo === "conversa" && f.momento.nova) || (f.modo === "contraste" && antes.modo === "contraste"))
      lista.push({ em: f.de, arquivo: "sfx/rola.wav", volume: 0.34, prioridade: 1 });
  });
  const mensagens: Msg[] = telas.flatMap((tl) => (tl.tipo === "fio" ? tl.mensagens.filter((m) => !m.presente && !m.doCheio) : []));
  // mensagens dos balões de quadro cheio (inclusive a do gancho, que entra no fio já pronta)
  for (const m of plano.momentos) if (m.tipo === "balao") mensagens.push(m.mensagem);
  const vistos = new Set<string>();
  for (const m of mensagens) {
    const chave = `${m.de}-${m.em}-${m.tipo}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    if (m.tipo === "digitando") {
      if (m.ate !== undefined) lista.push({ em: m.ate + 0.05, arquivo: "sfx/vacuo.wav", volume: 0.4, prioridade: 3 });
    } else if (m.tipo === "confirmacao") lista.push({ em: m.em, arquivo: "sfx/venda.wav", volume: 0.4, prioridade: 4 });
    else if (m.tipo === "preco" || m.tipo === "grafico") lista.push({ em: m.em, arquivo: "sfx/enviada.wav", volume: 0.42, prioridade: 3 });
    else if (m.de === "cliente") lista.push({ em: m.em, arquivo: "sfx/recebida.wav", volume: 0.34, prioridade: 2 });
    else lista.push({ em: m.em, arquivo: "sfx/enviada.wav", volume: 0.3, prioridade: 1 });
  }
  for (const m of plano.momentos) {
    if (m.tipo === "contraste") {
      for (const lado of [m.esquerda, m.direita]) {
        const r = lado.resultado;
        lista.push({ em: r.em, arquivo: r.tipo === "ruim" ? "sfx/vacuo.wav" : "sfx/venda.wav", volume: 0.42, prioridade: 4 });
      }
    }
    if (m.tipo === "comparacao") {
      lista.push({ em: m.lados[0].em, arquivo: "sfx/enviada.wav", volume: 0.3, prioridade: 1 });
      lista.push({ em: m.lados[1].em, arquivo: "sfx/enviada.wav", volume: 0.3, prioridade: 1 });
      const v = m.vencedor ?? (m.modo === "errado-certo" ? 1 : undefined);
      if (v !== undefined) lista.push({ em: m.vencedorEm ?? m.lados[v].em + 0.4, arquivo: "sfx/venda.wav", volume: 0.36, prioridade: 3 });
    }
    if (m.tipo === "numero") lista.push({ em: m.em, arquivo: "sfx/enviada.wav", volume: 0.4, prioridade: 3 });
    if (m.tipo === "destaque") lista.push({ em: m.em, arquivo: m.nivel === "alerta" ? "sfx/vacuo.wav" : "sfx/enviada.wav", volume: 0.4, prioridade: 3 });
    if (m.tipo === "abertura" || m.tipo === "frase" || m.tipo === "pergunta") lista.push({ em: m.em ?? m.de + 0.2, arquivo: "sfx/enviada.wav", volume: 0.3, prioridade: 1 });
    if (m.tipo === "frase" && m.risco) lista.push({ em: m.riscoEm ?? m.de + 0.8, arquivo: "sfx/vacuo.wav", volume: 0.32, prioridade: 2 });
    if (m.tipo === "pergunta") for (const o of m.opcoes ?? []) lista.push({ em: o.em, arquivo: "sfx/recebida.wav", volume: 0.3, prioridade: 2 });
    if (m.tipo === "cta") lista.push({ em: m.toqueEm ?? m.de + (m.ate - m.de) * 0.4, arquivo: "sfx/toque.wav", volume: 0.42, prioridade: 3 });
  }
  const ordenados = lista.filter((s) => s.em >= 0 && s.em < plano.duracao - 0.1).sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) {
    const ultimo = saida[saida.length - 1];
    if (!ultimo || s.em - ultimo.em > 0.45) saida.push(s);
    else if (s.prioridade > ultimo.prioridade) saida[saida.length - 1] = s;
  }
  return saida;
};

// que pílula cada trecho de quadro cheio mostra (a mesma pílula em dois momentos seguidos não pisca)
const tipoDaPilula = (m: MomentoInterno | undefined) => {
  if (!m || !ehCheio(m)) return "";
  if (m.tipo === "cta") return "assinatura";
  if (m.tipo === "balao" && m.fixada) return `passo:${m.fixada.texto}`;
  return "contato";
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => normalizar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zonaTopo = { ...zonaPadrao, ...plano.zona }.topo;
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const frases = useMemo(() => montarFrases(plano as unknown as Plano), [plano]);
  const faixas = useMemo(() => montarFaixas(plano), [plano]);
  const telas = useMemo(() => montarTelas(plano), [plano]);
  const listaSons = useMemo(() => sons(plano, faixas, telas), [plano, faixas, telas]);

  // O tamanho da bolha numa conversa vem das mensagens do momento; na fronteira entre duas
  // conversas seguidas ele passa de um para o outro sem pulo.
  const diametroDe = (m: ConversaInterna, tt: number) => {
    const fio = telas.find((x) => x.tipo === "fio" && x.momentos.includes(m));
    return fio && fio.tipo === "fio" ? diametroNoMomento(fio, m, tt, T.balao) : BOLHA.max;
  };
  const diametro: Diametro = (tt, f) => {
    const m = f.momento as ConversaInterna;
    const k = faixas.indexOf(f);
    const anterior = faixas[k - 1];
    const d = diametroDe(m, tt);
    if (anterior?.modo !== "conversa" || Math.abs(anterior.ate - f.de) > 0.05) return d;
    const p = prog(tt, f.de - ADIANTA, 0.55);
    return p >= 1 ? d : diametroDe(anterior.momento as ConversaInterna, tt) * (1 - p) + d * p;
  };

  const caixa = caixaDaPessoa(t, faixas, diametro);
  const abertura = aberturaCheia(caixa);
  const base = baseDaConversa(diametroDoApp(t, faixas, diametro));
  const tela = telaEm(telas, t);
  const faixa = faixaEm(faixas, t);
  const m = faixa.momento;

  // progresso da "gravação": do começo ao fim do trecho seguido de telas do app
  const i = faixas.indexOf(faixa);
  let ini = i;
  let fim = i;
  while (ini > 0 && faixas[ini - 1].modo !== "cheia") ini--;
  while (fim < faixas.length - 1 && faixas[fim + 1].modo !== "cheia") fim++;
  const progresso = faixa.modo === "cheia" ? 1 : prog(t, faixas[ini].de, faixas[fim].ate - faixas[ini].de, (x) => x);

  // pílula do topo só com o quadro cheio aberto; entre dois momentos com a mesma pílula, ela fica
  const pilula = tipoDaPilula(m);
  const antes = faixas[i - 1];
  const depois = faixas[i + 1];
  const continuaDeAntes = !!antes && Math.abs(antes.ate - faixa.de) < 0.05 && tipoDaPilula(antes.momento) === pilula;
  const continuaDepois = !!depois && Math.abs(depois.de - faixa.ate) < 0.05 && tipoDaPilula(depois.momento) === pilula;
  const pPilula =
    faixa.modo === "cheia"
      ? (faixa.de < 0.1 || continuaDeAntes ? 1 : prog(t, faixa.de + 0.3, 0.35)) * (continuaDepois ? 1 : 1 - saindo(t, faixa.ate, 0.25)) * visivelCheia(abertura)
      : 0;
  const nomeContato = plano.contato?.nome ?? CONTATO_PADRAO;

  // status do contato na pílula: digitando antes da mensagem dele, offline quando ele some;
  // depois de uma pergunta para quem assiste, o contato fica "digitando…" (a resposta é sua)
  const statusDaPilula = () => {
    if (m?.tipo === "pergunta") {
      const ultima = Math.max(m.em ?? m.de, ...(m.opcoes ?? []).map((o) => o.em));
      if (t >= ultima + 0.6) return { online: true, texto: "digitando…" };
      return { online: true, texto: "online" };
    }
    if (m?.tipo !== "balao") return { online: true, texto: "online" };
    if (m.offlineEm !== undefined && t >= m.offlineEm) return { online: false, texto: "offline" };
    const msg = m.mensagem;
    const dig = msg.digitando ?? DIGITANDO_PADRAO;
    if (msg.de === "cliente" && dig > 0 && t < msg.em) return { online: true, texto: "digitando…" };
    return { online: true, texto: "online" };
  };
  const sg = statusDaPilula();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0D11" }}>
      {/* 1. o app (fica atrás da pessoa: quando ela encolhe, a conversa já está lá) */}
      {abertura < 0.999 ? <TelaApp plano={plano} telas={telas} tela={tela} t={t} base={base} /> : null}

      {/* 2. a pessoa: uma só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} />

      {/* 3. a gravação em volta da bolha */}
      <Gravacao caixa={caixa} progresso={progresso} visivel={1 - Math.min(1, abertura * 3)} />

      {/* 4. por cima da pessoa em quadro cheio: a pílula do topo e a mensagem no peito */}
      {m && ehCheio(m) ? (
        m.tipo === "cta" ? (
          <>
            <PilulaAssinatura nome={plano.marca.nome} area={plano.marca.area} p={pPilula} />
            <CtaCheia m={m} t={t} plano={plano as unknown as Plano} zonaTopo={zonaTopo} abertura={abertura} />
          </>
        ) : (
          <>
            {m.tipo === "balao" && m.fixada ? (
              <PilulaPasso f={m.fixada} p={pPilula} t={t} palavras={plano.palavras} de={m.de} ate={m.ate} />
            ) : (
              <PilulaContato nome={nomeContato} online={sg.online} statusTexto={sg.texto} p={pPilula} />
            )}
            {m.tipo === "balao" ? (
              <MensagemNoPeito m={m} t={t} plano={plano as unknown as Plano} zonaTopo={zonaTopo} abertura={abertura} />
            ) : (
              <BlocoNoPeito m={m} t={t} plano={plano as unknown as Plano} zonaTopo={zonaTopo} abertura={abertura} />
            )}
          </>
        )
      ) : null}

      {/* 5. a legenda: o campo de texto do app, só em quadro cheio */}
      <Legenda frases={frases} t={t} visivel={abertura} />

      {guias ? <Guias plano={plano as unknown as Plano} zonaTopo={zonaTopo} caixa={caixa} /> : null}

      {plano.sfx === false
        ? null
        : listaSons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
