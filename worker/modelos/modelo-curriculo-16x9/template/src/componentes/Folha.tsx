import {
  caminhoChave,
  caminhoInsercao,
  caminhoSeta,
  caminhosX,
  caminhoVisto,
  gesto,
  limitar,
  mistura,
  normalizar,
  preciso,
  prog,
  TextoAMao,
  Traco,
} from "../anim";
import { lugarDoMomento, temposDaReescrita, tempoDaVolta, tempoDoRisco, type PosFolha } from "../cena";
import { ALT_LINHA, alturaDe, CORPO, type Folha as TipoFolha, LARG, type LinhaFolha, type Mao, RECUO, respiroDe, type SecaoFolha, X0, X1, XT } from "../documento";
import { corpoQueCabe, larguraRotulo, larguraTexto } from "../medida";
import type { Cronometro, Marcar, Momento, Paginas, Plano, Reescrever, Riscar } from "../plano";
import { cor, FOLHA, rotuloSecao, sans, serifa, sombraFolha } from "../tema";
import { SECOES } from "./Secoes";
import { Lapis, LinhaTinta, Marcador } from "./Tinta";

const ESPACO_REESCRITA = 80;

// Folha de rascunho (as páginas 2, 3…): só linhas a lápis
const FolhaRascunho: React.FC<{ altura: number }> = ({ altura }) => {
  const linhas: React.ReactNode[] = [];
  let y = 90;
  let k = 0;
  while (y < altura - 90) {
    const titulo = k % 6 === 0;
    const w = titulo ? 220 : (X1 - X0) * [0.94, 0.8, 0.88, 0.66, 0.9, 0.74][k % 6];
    linhas.push(<Lapis key={k} x={X0} y={y} w={w} h={titulo ? 18 : 12} op={titulo ? 1 : 0.85} />);
    y += titulo ? 64 : 48;
    k++;
  }
  return <>{linhas}</>;
};

export const Folha: React.FC<{
  plano: Plano;
  folha: TipoFolha;
  momentos: Momento[];
  t: number;
  k: number;
  pos: PosFolha;
}> = ({ plano, folha, momentos, t, k, pos }) => {
  if (pos.op <= 0.001 || pos.y > 1100 || pos.y + folha.altura * pos.s < 0) return null;

  // a folha que passa do ideal ganha um X e sai
  const paginas = momentos.find((m) => m.tipo === "paginas") as Paginas | undefined;
  let extra = { x: 0, y: 0, rot: 0, op: 1 };
  let xis: React.ReactNode = null;
  if (paginas && k >= paginas.ideal) {
    const sai = prog(t, paginas.xEm + 0.62 + (k - paginas.ideal) * 0.08, 0.6, preciso);
    extra = { x: 420 * sai, y: 300 * sai, rot: 12 * sai, op: 1 - sai };
    const [a, b] = caminhosX(FOLHA.w, folha.altura);
    xis = (
      <svg width={FOLHA.w} height={folha.altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Traco d={a} p={prog(t, paginas.xEm, 0.26, gesto)} largura={16} />
        <Traco d={b} p={prog(t, paginas.xEm + 0.2, 0.26, gesto)} largura={16} />
      </svg>
    );
  }

  const estilo: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: FOLHA.w,
    height: folha.altura,
    background: cor.papel,
    boxShadow: sombraFolha,
    transformOrigin: "0 0",
    transform: `translate(${pos.x + extra.x}px, ${pos.y + extra.y}px) rotate(${pos.rot + extra.rot}deg) scale(${pos.s})`,
    opacity: pos.op * extra.op,
    overflow: "hidden",
  };

  if (k > 0) {
    return (
      <div style={estilo}>
        <FolhaRascunho altura={folha.altura} />
        {xis}
      </div>
    );
  }

  return (
    <div style={estilo}>
      <Conteudo plano={plano} folha={folha} momentos={momentos} t={t} />
    </div>
  );
};

// O conteúdo da folha 1: cabeçalho, seções com tinta e marcas de caneta, extras e lápis.
const Conteudo: React.FC<{ plano: Plano; folha: TipoFolha; momentos: Momento[]; t: number }> = ({ plano, folha, momentos, t }) => {
  // reescritas: que linha cada uma reescreve, e o espaço que ela abre na folha
  const reescritas = momentos
    .map((m, indice) => ({ m, indice }))
    .filter((x): x is { m: Reescrever; indice: number } => x.m.tipo === "reescrever")
    .map(({ m, indice }) => {
      const alvo = folha.alvos[indice];
      const tempos = temposDaReescrita(m, plano);
      const abre = prog(t, tempos.abre, 0.42, preciso);
      const aceita = prog(t, tempos.aceita, 0.5, preciso);
      // foco: o resto da folha apaga enquanto a linha é reescrita
      const foco = prog(t, m.de, 0.45) * (1 - prog(t, m.ate - 0.15, 0.45));
      return { m, alvo, tempos, abre, aceita, foco, espaco: ESPACO_REESCRITA * abre * (1 - aceita) };
    });
  // seções em foco (a folha ampliada embaixo ou a pergunta): o resto da folha fica a meio-tom
  const focos = momentos
    .map((m, indice) => ({ m, indice }))
    .filter(({ m }) => m.tipo !== "reescrever" && m.tipo !== "cronometro" && (lugarDoMomento(m) === "embaixo" || lugarDoMomento(m) === "topo"))
    .map(({ m, indice }) => ({ indice, f: prog(t, m.de, 0.45) * (1 - prog(t, m.ate - 0.15, 0.45)) }));
  const focoReescrita = Math.max(0, ...reescritas.map((r) => r.foco));
  // o resto da folha fica a meio-tom (a caneta continua vermelha, não rosa)
  const apagado = mistura(1, 0.6, Math.max(focoReescrita, ...focos.map((f) => f.f)));
  // uma seção em foco não apaga a si mesma
  const opDaSecao = (indice: number) => mistura(1, 0.6, Math.max(focoReescrita, ...focos.filter((f) => f.indice !== indice).map((f) => f.f)));
  // deslocamento das linhas abaixo de uma reescrita
  const desloc = (y: number) => reescritas.reduce((d, r) => (r.alvo && y > r.alvo.y + 1 ? d + r.espaco : d), 0);

  const cronometro = momentos.find((m) => m.tipo === "cronometro") as Cronometro | undefined;
  const cab = folha.cabecalho;

  const elementos: React.ReactNode[] = [];

  // cabeçalho
  elementos.push(
    <div key="cab" style={{ opacity: apagado }}>
      {cab.linhas.map((ws, li) => (
        <div
          key={li}
          style={{
            position: "absolute",
            left: X0,
            top: 54 + li * Math.round(cab.tamanho * 1.1),
            fontFamily: serifa,
            fontWeight: 700,
            fontSize: cab.tamanho,
            lineHeight: 1,
            color: cor.tinta,
            whiteSpace: "nowrap",
          }}
        >
          {ws.join(" ")}
        </div>
      ))}
      {cab.subLinhas.map((linha, li) => (
        <div
          key={`sub${li}`}
          style={{
            position: "absolute",
            left: X0 + 2,
            top: cab.subY + li * Math.round(cab.subTam * 1.3),
            fontFamily: sans,
            fontWeight: 600,
            fontSize: cab.subTam,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: cor.cinza,
            whiteSpace: "nowrap",
          }}
        >
          {linha}
        </div>
      ))}
      <Lapis x={X0} y={cab.lapisY} w={168} />
      <Lapis x={X0 + 192} y={cab.lapisY} w={128} />
      <Lapis x={X0 + 344} y={cab.lapisY} w={176} />
      <div style={{ position: "absolute", left: X0, top: cab.reguaY, width: X1 - X0, height: 3, background: cor.tinta }} />
    </div>,
  );

  folha.secoes.forEach((s) => {
    const m = s.indice >= 0 ? momentos[s.indice] : undefined;
    const dy = desloc(s.y);
    const extra = s.tipo === "extra";
    const corTitulo = extra ? cor.lapis : cor.tinta;
    // seção de um momento que ainda vai demorar: só o esboço a lápis (barras), sem texto legível;
    // uns 3 s antes do momento o texto aparece a lápis e ganha tinta quando é dito
    const revela = m ? prog(t, m.de - 3.2, 0.35) : 1;
    if (revela < 1) elementos.push(<Esboco key={`${s.chave}-e`} s={s} dy={dy} op={(s.indice >= 0 ? opDaSecao(s.indice) : apagado) * (1 - revela)} />);
    if (revela <= 0) return;
    const op = (s.indice >= 0 ? opDaSecao(s.indice) : apagado) * revela;
    if (s.titulo) {
      // título da seção em caixa alta (1 ou 2 linhas); o fio a lápis segue a última linha
      const linhasTitulo = s.tituloLinhas?.length ? s.tituloLinhas : [s.titulo];
      const tamTitulo = s.tituloTam ?? 30;
      elementos.push(
        <div key={`${s.chave}-t`} style={{ position: "absolute", left: X0, top: s.y + dy + 14, width: X1 - X0, opacity: op }}>
          {linhasTitulo.map((linha, li) => (
            <div key={li} style={{ display: "flex", alignItems: "center", gap: 16, height: li < linhasTitulo.length - 1 ? Math.round(tamTitulo * 1.3) : undefined }}>
              <div style={{ ...rotuloSecao, fontSize: tamTitulo, color: corTitulo, whiteSpace: "nowrap" }}>{linha}</div>
              {li === linhasTitulo.length - 1 ? <div style={{ flex: 1, height: 2, background: cor.lapis, marginTop: 2 }} /> : null}
            </div>
          ))}
        </div>,
      );
    }

    // seções dos blocos universais
    const Secao = m ? SECOES[m.tipo] : undefined;
    if (Secao && m) {
      elementos.push(
        <div key={`${s.chave}-c`} style={{ position: "absolute", left: 0, top: 0, opacity: op }}>
          <Secao s={s} m={m} t={t} dy={dy} />
        </div>,
      );
      return;
    }

    if (s.sub) {
      [s.sub, ...(s.subExtra ?? [])].forEach((sub, si) =>
        elementos.push(
          <div key={`${s.chave}-s${si}`} style={{ position: "absolute", left: X0, top: sub.y + desloc(sub.y) + 8, opacity: op }}>
            <LinhaTinta linha={sub} t={t} tamanho={sub.tamanho ?? 36} peso={600} corFinal={cor.cinza} />
          </div>,
        ),
      );
    }

    s.linhas.forEach((l, li) => {
      const r = reescritas.find((x) => x.alvo && x.alvo.y === l.y);
      const y = l.y + desloc(l.y);
      const x = l.x ?? (l.marcador ? X0 + RECUO : X0);
      const tam = l.tamanho ?? CORPO;
      const opLinha = r ? 1 : op;
      if (l.marcador) elementos.push(<Marcador key={`${s.chave}-b${li}`} y={y} op={extra ? 0.4 : opLinha} tamanho={tam} />);

      // risco do `riscar`
      let risco: number | undefined;
      if (m?.tipo === "riscar") risco = prog(t, tempoDoRisco(m as Riscar, plano), 0.42, gesto);

      if (!r) {
        elementos.push(
          <div key={`${s.chave}-l${li}`} style={{ position: "absolute", left: x, top: y + respiroDe(tam), opacity: opLinha }}>
            <LinhaTinta linha={l} t={t} corFinal={extra ? cor.lapis : cor.tinta} risco={risco} />
          </div>,
        );
        return;
      }

      // linha reescrita: a velha é riscada palavra por palavra; a nova é escrita à mão embaixo
      // e, aceita a troca, sobe para o lugar da velha já impressa
      const novaY = l.y + ESPACO_REESCRITA * (1 - r.aceita);
      const destaque = r.m.destaque ? normalizar(r.m.destaque) : undefined;
      // a escrita à mão e a linha nova cabem na largura da folha
      const tamMao = corpoQueCabe(r.m.depois, X1 - x, 40, 28, { fonte: "mao", peso: 600 });
      const tamNova = corpoQueCabe(r.m.depois, XT - x + 60, tam, 30, { fonte: "serifa", peso: 500 });
      elementos.push(
        <div key={`${s.chave}-l${li}`} style={{ position: "absolute", left: x, top: y + respiroDe(tam), opacity: 1 - r.aceita }}>
          <LinhaTinta linha={l} t={t} riscos={r.tempos.antes} />
        </div>,
      );
      if (r.abre > 0) {
        const insercao = prog(t, r.tempos.abre, 0.3, gesto);
        elementos.push(
          <svg key={`${s.chave}-ins${li}`} width={40} height={30} style={{ position: "absolute", left: x - 30, top: l.y + ALT_LINHA + 2, overflow: "visible", opacity: 1 - r.aceita }}>
            <Traco d={caminhoInsercao(26, 22)} p={insercao} largura={5} />
          </svg>,
          <div key={`${s.chave}-mao${li}`} style={{ position: "absolute", left: x, top: novaY + 2, opacity: (1 - r.aceita) * limitar(r.abre * 3) }}>
            <TextoAMao
              texto={r.m.depois}
              tempos={r.tempos.depois}
              t={t}
              tamanho={tamMao}
              style={{ fontSize: tamMao, lineHeight: 1.3, flexWrap: "nowrap", whiteSpace: "nowrap" }}
              circulo={r.m.destaque ? { trecho: r.m.destaque, em: (r.tempos.depois[r.tempos.depois.length - 1] ?? 0) + 0.14 } : undefined}
            />
          </div>,
        );
      }
      if (r.aceita > 0) {
        elementos.push(
          <div key={`${s.chave}-nova${li}`} style={{ position: "absolute", left: x, top: novaY + respiroDe(tam), opacity: r.aceita }}>
            <LinhaTinta linha={{ texto: r.m.depois, y: l.y }} t={t} tamanho={tamNova} peso={500} circulada={destaque} />
          </div>,
        );
      }
    });

    // a chave do `marcar`: na nota; sem nota, quando a última linha termina de ser dita
    if (m?.tipo === "marcar" && s.linhas.length) {
      const mm = m as Marcar;
      const ys = s.linhas.map((l) => l.y + desloc(l.y));
      const ultima = s.linhas[s.linhas.length - 1];
      const topo = Math.min(...ys) + 8;
      const base = Math.max(...ys) + Math.round((ALT_LINHA * (ultima?.tamanho ?? CORPO)) / CORPO) - 8;
      const ultimoTempo = ultima?.tempos?.[ultima.tempos.length - 1] ?? mm.linhas[mm.linhas.length - 1]?.em ?? mm.de;
      const chaveEm = mm.nota ? mm.nota.em - 0.05 : ultimoTempo + 0.45;
      elementos.push(
        <svg key={`${s.chave}-ch`} width={30} height={base - topo} style={{ position: "absolute", left: X0 - 40, top: topo, overflow: "visible", opacity: op }}>
          <Traco d={caminhoChave(base - topo, 26)} p={prog(t, chaveEm, 0.42, gesto)} largura={5} />
        </svg>,
      );
    }

    // notas à mão
    if (m && s.notaY !== undefined) {
      const ny = s.notaY + desloc(s.notaY);
      const tamNota = s.notaTam ?? 44;
      if (m.tipo === "riscar" && (m as Riscar).nota) {
        const nota = (m as Riscar).nota!;
        elementos.push(
          <div key={`${s.chave}-n`} style={{ position: "absolute", left: X0 + 4, top: ny + 4, opacity: op }}>
            <TextoAMao
              texto={nota.texto}
              tempos={nota.texto.split(/\s+/).map((_, i) => nota.em + i * 0.22)}
              t={t}
              style={{ fontSize: tamNota, lineHeight: 1.2, flexWrap: "nowrap", whiteSpace: "nowrap" }}
            />
          </div>,
        );
      }
      if (m.tipo === "marcar") {
        const mm = m as Marcar;
        const partes: React.ReactNode[] = [];
        if (mm.nota) {
          const nota = mm.nota;
          partes.push(
            <TextoAMao key="n" texto={nota.texto} tempos={nota.texto.split(/\s+/).map((_, i) => nota.em + 0.12 + i * 0.22)} t={t} style={{ fontSize: tamNota, lineHeight: 1.2, flexWrap: "nowrap" }} />,
          );
        }
        if (mm.pergunta) {
          const [a, b] = caminhoSeta(54, 14);
          const pergunta = mm.pergunta;
          partes.push(
            <svg key="s" width={60} height={30} style={{ margin: mm.nota ? "0 18px" : "0 18px 0 0", overflow: "visible", alignSelf: "center" }}>
              <Traco d={a} p={prog(t, pergunta.em - 0.2, 0.22, gesto)} largura={5} />
              <Traco d={b} p={prog(t, pergunta.em - 0.02, 0.14, gesto)} largura={5} />
            </svg>,
            <TextoAMao
              key="p"
              texto={pergunta.texto}
              tempos={pergunta.texto.split(/\s+/).map((_, i) => pergunta.em + i * 0.24)}
              t={t}
              style={{ fontSize: tamNota, lineHeight: 1.2, flexWrap: "nowrap" }}
            />,
          );
        }
        elementos.push(
          <div key={`${s.chave}-n`} style={{ position: "absolute", left: X0 + 4, top: ny + 2, display: "flex", alignItems: "center", opacity: op, whiteSpace: "nowrap" }}>
            {partes}
          </div>,
        );
      }
    }
  });

  // lápis no resto da página
  folha.lapis.forEach((l, i) => {
    elementos.push(<Lapis key={`lp${i}`} x={X0} y={l.y + desloc(l.y)} w={(X1 - X0) * l.w} op={apagado * 0.9} />);
  });

  // o olhar do leitor: pontos de fixação que passeiam pela folha; no fim, o essencial ganha caneta
  if (cronometro) {
    elementos.push(<Olhar key="olhar" folha={folha} momentos={momentos} m={cronometro} t={t} />);
  }

  return <>{elementos}</>;
};

// O esboço a lápis de uma seção que ainda não chegou: barras no lugar de cada linha
const Esboco: React.FC<{ s: SecaoFolha; dy: number; op: number }> = ({ s, dy, op }) => {
  if (op <= 0.005) return null;
  const barras: { x: number; y: number; w: number; h: number }[] = [];
  const linha = (l: LinhaFolha) => {
    const tam = l.tamanho ?? CORPO;
    barras.push({ x: l.x ?? (l.marcador ? X0 + RECUO : X0), y: l.y + alturaDe(tam) / 2 - 6, w: Math.max(40, (l.w ?? 300) * 0.92), h: 12 });
  };
  const mao = (mm?: Mao) => {
    if (!mm) return;
    const maior = Math.max(...mm.linhas.map((l) => l.join(" ").length), 1);
    mm.linhas.forEach((l, k) =>
      barras.push({ x: mm.x, y: mm.y + k * Math.round(mm.tamanho * 1.22) + mm.tamanho * 0.6 - 6, w: Math.max(40, (mm.w * l.join(" ").length) / maior), h: 12 }),
    );
  };
  (s.tituloLinhas ?? []).forEach((l, li) =>
    barras.push({ x: X0, y: s.y + 22 + li * Math.round((s.tituloTam ?? 30) * 1.3), w: Math.min(LARG - 40, larguraRotulo(l, s.tituloTam ?? 30) * 0.9), h: 16 }),
  );
  if (s.sub) [s.sub, ...(s.subExtra ?? [])].forEach(linha);
  s.linhas.forEach(linha);
  s.termo?.forEach(linha);
  mao(s.significado);
  s.itens?.forEach((it) => {
    it.linhas.forEach(linha);
    mao(it.detalhe);
  });
  s.colunas?.forEach((c) => {
    barras.push({ x: c.x, y: c.topo + 10, w: Math.min(c.w, larguraRotulo(c.rotulo, c.rotuloTam)) * 0.85, h: 14 });
    c.linhas.forEach(linha);
  });
  if (s.numero) barras.push({ x: X0, y: s.numero.y + s.numero.tamanho * 0.5, w: s.numero.wNumero * 0.75, h: 20 });
  const g = s.grafico;
  return (
    <div style={{ position: "absolute", left: 0, top: dy, opacity: op }}>
      {barras.map((b, i) => (
        <Lapis key={i} x={b.x} y={b.y} w={b.w} h={b.h} />
      ))}
      {g ? (
        <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {g.pizza ? (
            <circle cx={g.pizza.cx} cy={g.pizza.cy} r={g.pizza.r} fill="none" stroke={cor.lapis} strokeWidth={3} />
          ) : (
            <path d={`M ${g.x} ${g.y} L ${g.x} ${g.y + g.h} L ${g.x + g.w} ${g.y + g.h}`} fill="none" stroke={cor.lapis} strokeWidth={3} />
          )}
          {g.rotulos.map((r, i) => (
            <rect key={i} x={r.x + (g.pizza ? 0 : r.w * 0.2)} y={r.y + 8} width={r.w * (g.pizza ? 0.7 : 0.6)} height={12} rx={6} fill={cor.lapis} />
          ))}
        </svg>
      ) : null}
    </div>
  );
};

// Pontos de fixação (o olhar que lê em segundos) e, na conclusão, o essencial marcado
const Olhar: React.FC<{ folha: TipoFolha; momentos: Momento[]; m: Cronometro; t: number }> = ({ folha, momentos, m, t }) => {
  // alvos do olhar: o título, o começo de cada seção e a linha reescrita (o resultado),
  // só no trecho da folha que aparece embaixo do bilhete grande
  const visivel = 640;
  const reescrita = momentos.findIndex((x) => x.tipo === "reescrever");
  const alvo = reescrita >= 0 ? folha.alvos[reescrita] : undefined;
  const pontos: { x: number; y: number }[] = [{ x: X0 + 150, y: 88 }];
  for (const s of folha.secoes) {
    if (s.tipo === "extra" || s.y > visivel) continue;
    pontos.push({ x: X0 + 60, y: s.y + 30 });
    const l = s.linhas[0] ?? s.itens?.[0]?.linhas[0] ?? s.termo?.[0];
    if (l && l.y < visivel) pontos.push({ x: X0 + Math.min(330, LARG - 80), y: l.y + 34 });
  }
  if (alvo && alvo.y < visivel) pontos.push({ x: X0 + 420, y: alvo.y + 34 });
  const inicio = m.de + 0.3;
  const fim = Math.max(inicio + 0.6, tempoDaVolta(m) + 0.2);
  const passo = (fim - inicio) / Math.max(1, pontos.length - 1);
  const conclusao = m.fim ? prog(t, m.fim.em, 0.4) : 0;
  const some = conclusao;
  const caminho = pontos.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
  const percorrido = limitar((t - inicio) / (fim - inicio));
  // a linha do resultado (ou a primeira linha marcada) recebe o retângulo de caneta e o visto
  const linhaFinal = alvo ? alvo.y : folha.secoes.find((s) => s.tipo === "marcar")?.linhas[0]?.y;
  return (
    <>
      <svg width={FOLHA.w} height={folha.altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - some }}>
        <Traco d={caminho} p={percorrido} largura={4} opacidade={0.55} />
        {pontos.map((p, i) => {
          const a = prog(t, inicio + i * passo, 0.16);
          return a > 0 ? (
            <circle key={i} cx={p.x} cy={p.y} r={18 + 8 * a} fill={cor.vermelho} fillOpacity={0.16 * a} stroke={cor.vermelho} strokeWidth={4} strokeOpacity={a} />
          ) : null;
        })}
      </svg>
      {m.fim && linhaFinal !== undefined ? (
        <svg width={FOLHA.w} height={folha.altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Traco
            d={`M ${X0 + RECUO - 16} ${linhaFinal + 6} L ${X1 + 6} ${linhaFinal + 4} L ${X1 + 4} ${linhaFinal + ALT_LINHA + 2} L ${X0 + RECUO - 14} ${linhaFinal + ALT_LINHA + 4} Z`}
            p={prog(t, m.fim.em, 0.5, gesto)}
            largura={6}
          />
          <g transform={`translate(${X1 - 70}, ${linhaFinal - 64})`}>
            <Traco d={caminhoVisto(52, 40)} p={prog(t, m.fim.em + 0.45, 0.25, gesto)} largura={7} />
          </g>
        </svg>
      ) : null}
    </>
  );
};
