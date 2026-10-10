// Os blocos universais que acontecem na folha da agenda, desenhados com as peças do modelo:
// - topicos: blocos que caem nos seus lugares a lápis; o item da vez fica tomate;
// - passos: a linha do tempo da agenda, com marcadores numerados e a linha que se enche;
// - comparacao: dois dias lado a lado (ou um embaixo do outro), cada lado cai como um bloco;
// - grafico: sobre as linhas da régua (barras = blocos que sobem, linha em tomate, pizza no anel);
// - definicao: o termo cai como um bloco e se abre para baixo com o significado.
// A pessoa fica no lugar que o momento escolheu (em cima ou na raia ao lado) e nada passa por baixo dela.
import { assenta, type Ret, Linhas, limitar, mistura, prog, temposDoTexto, Traco, troca } from "../anim";
import { type Agenda, areaDoConteudo, entradaESaida } from "../agenda";
import { casasDe, encaixar, formatar, medir } from "../medida";
import type { Comparacao, Definicao, Grafico, Item, Palavra, Passos, Topicos } from "../plano";
import { CATEGORIAS, cor, numeros, rotuloCaixaAlta, sans } from "../tema";
import { Icone } from "./Icones";
import { BlocoQueCai, layoutTitulo, NaFolha, tintaDoBloco, TituloDoMomento } from "./NaFolha";
import { Ilustrativo } from "./Peito";

type Props<M> = { m: M; i: number; t: number; palavras: Palavra[]; ag: Agenda };

const proximoEm = (itens: { em: number }[], k: number, fim: number) => itens[k + 1]?.em ?? fim;

// área útil abaixo do título
const corpoDaArea = (area: Ret, titulo?: string, extra = 0) => {
  const l = layoutTitulo(titulo, area);
  const y = area.y + (l ? l.altura + 34 : 0) + extra;
  return { x: area.x, y, w: area.w, h: area.y + area.h - y };
};

// ——— tópicos: blocos que caem ———

const layoutTopicos = (itens: Item[], corpo: Ret, aoLado: boolean) => {
  const n = Math.max(1, itens.length);
  const vao = aoLado ? 22 : 18;
  const altura = Math.min(aoLado ? 270 : 200, (corpo.h - vao * (n - 1)) / n);
  const pad = 34;
  const largura = corpo.w - pad * 2 - 12;
  // o mesmo corpo para todos os itens (hierarquia limpa): o menor dos maiores que cabem
  const medidas = itens.map((it) => {
    const det = it.detalhe ? 1 : 0;
    return encaixar(it.texto, { largura, max: aoLado ? 54 : 62, min: 38, linhas: aoLado ? 3 : 2, altura: altura - 28 - det * 48, entrelinha: 1.05 });
  });
  const tamanho = Math.min(...medidas.map((e) => e.tamanho));
  const linhas = itens.map((it, k) => (medidas[k].tamanho === tamanho ? medidas[k].linhas : encaixar(it.texto, { largura, max: tamanho, min: tamanho, linhas: 4, entrelinha: 1.05 }).linhas));
  const total = n * altura + (n - 1) * vao;
  const topo = corpo.y + Math.max(0, (corpo.h - total) * 0.4);
  return itens.map((it, k) => ({ r: { x: corpo.x, y: topo + k * (altura + vao), w: corpo.w, h: altura }, tamanho, linhas: linhas[k], pad, largura }));
};

export const TopicosNaFolha: React.FC<Props<Topicos>> = ({ m, i, t, palavras, ag }) => {
  const lugar = ag.lugarDe[i];
  const area = areaDoConteudo(lugar, ag.L);
  const es = entradaESaida(ag, i);
  const corpo = corpoDaArea(area, m.titulo);
  const itens = m.itens.slice(0, 5);
  const l = layoutTopicos(itens, corpo, lugar === "lado");
  return (
    <NaFolha t={t} es={es} ag={ag}>
      <TituloDoMomento titulo={m.titulo} area={area} t={t} palavras={palavras} de={m.de} ate={itens[0]?.em ?? m.ate} />
      {itens.map((it, k) => {
        const x = l[k];
        const ativo = t >= it.em - 0.06 && (k === itens.length - 1 || t < itens[k + 1].em - 0.06) ? 1 : 0;
        const tinta = tintaDoBloco("outro", ativo);
        const tempos = temposDoTexto(it.texto, palavras, it.em - 0.3, proximoEm(itens, k, m.ate), it.em);
        const det = it.detalhe ? encaixar(it.detalhe, { largura: x.largura, max: 40, min: 34, linhas: 1, fonte: { peso: 600 } }) : null;
        const alto = x.linhas.length * x.tamanho * 1.05 + (det ? 10 + det.tamanho * 1.15 : 0);
        return (
          <BlocoQueCai key={k} r={x.r} em={it.em} t={t} categoria="outro" ativo={ativo} esbocoDe={es.entra}>
            <div style={{ position: "absolute", left: x.pad + 12, top: (x.r.h - alto) / 2 - 2, width: x.largura }}>
              <Linhas linhas={x.linhas} tempos={tempos} t={t} tamanho={x.tamanho} entrelinha={1.05} cor={tinta} espacamento="-0.01em" />
              {det && it.detalhe ? (
                <div style={{ marginTop: 10, fontSize: det.tamanho, fontWeight: 600, color: tinta, opacity: 0.82 * prog(t, it.em + 0.3, 0.3), whiteSpace: "nowrap" }}>{it.detalhe}</div>
              ) : null}
            </div>
          </BlocoQueCai>
        );
      })}
    </NaFolha>
  );
};

// ——— passos: a linha do tempo ———

export const PassosNaFolha: React.FC<Props<Passos>> = ({ m, i, t, palavras, ag }) => {
  const lugar = ag.lugarDe[i];
  const aoLado = lugar === "lado";
  const area = areaDoConteudo(lugar, ag.L);
  const es = entradaESaida(ag, i);
  const corpo = corpoDaArea(area, m.titulo, 6);
  const itens = m.itens.slice(0, 5);
  const n = itens.length;
  const d = aoLado ? 78 : 76;
  const xNo = corpo.x + d / 2 + 4;
  const xTexto = corpo.x + d + 34;
  const largura = corpo.x + corpo.w - xTexto;
  const fila = corpo.h / Math.max(1, n);
  const medidas = itens.map((it) =>
    encaixar(it.texto, { largura, max: aoLado ? 70 : 68, min: 40, linhas: aoLado ? 3 : 2, altura: fila - 40 - (it.detalhe ? 50 : 0), entrelinha: 1.05 }),
  );
  const tamanho = Math.min(...medidas.map((e) => e.tamanho));
  const linhas = itens.map((it, k) => (medidas[k].tamanho === tamanho ? medidas[k].linhas : encaixar(it.texto, { largura, max: tamanho, min: tamanho, linhas: 4 }).linhas));
  const altos = itens.map((it, k) => linhas[k].length * tamanho * 1.05 + (it.detalhe ? 12 + 44 : 0));
  // fileiras do mesmo tamanho; o grupo um pouco acima do centro
  const passo = Math.min(fila, Math.max(...altos) + (aoLado ? 190 : 80));
  const topo = corpo.y + Math.max(0, (corpo.h - passo * n) * 0.4);
  const yNo = (k: number) => topo + k * passo + d / 2;
  // a linha se enche até o passo dito
  let enche = 0;
  itens.forEach((it, k) => {
    if (k > 0) enche = Math.max(enche, mistura(k - 1, k, prog(t, it.em - 0.1, 0.45, troca)));
  });
  const yEnche = yNo(0) + (yNo(Math.max(0, n - 1)) - yNo(0)) * (n > 1 ? enche / (n - 1) : 0);
  const desenho = prog(t, es.entra, 0.6, troca);
  const atual = itens.reduce((a, it, k) => (t >= it.em - 0.06 ? k : a), -1);
  return (
    <NaFolha t={t} es={es} ag={ag}>
      <TituloDoMomento titulo={m.titulo} area={area} t={t} palavras={palavras} de={m.de} ate={itens[0]?.em ?? m.ate} />
      {/* o realce do passo da vez (como o evento de agora) */}
      {atual >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: corpo.x - 14,
            width: corpo.w + 28,
            top: mistura(yNo(Math.max(0, atual - 1)), yNo(atual), prog(t, itens[atual].em - 0.06, 0.4, troca)) - d / 2 - 14,
            height: Math.max(d, altos[atual] ?? d) + 28,
            borderRadius: 26,
            background: cor.focoFundo,
            opacity: 0.75 * prog(t, itens[0].em - 0.06, 0.3),
          }}
        />
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {n > 1 ? (
          <line x1={xNo} y1={yNo(0)} x2={xNo} y2={yNo(0) + (yNo(n - 1) - yNo(0)) * desenho} stroke={cor.esboco} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" />
        ) : null}
        {n > 1 && t >= itens[0].em - 0.06 ? <line x1={xNo} y1={yNo(0)} x2={xNo} y2={yEnche} stroke={cor.foco} strokeWidth={9} strokeLinecap="round" /> : null}
      </svg>
      {itens.map((it, k) => {
        const aceso = prog(t, it.em - 0.06, 0.3);
        const feito = k < atual;
        const tempos = temposDoTexto(it.texto, palavras, it.em - 0.3, proximoEm(itens, k, m.ate), it.em);
        return (
          <div key={k}>
            <div
              style={{
                position: "absolute",
                left: xNo - d / 2,
                top: yNo(k) - d / 2,
                width: d,
                height: d,
                borderRadius: 999,
                boxSizing: "border-box",
                border: aceso > 0.5 ? "none" : `4px dashed ${cor.esboco}`,
                background: aceso > 0.5 ? (feito ? cor.tinta : cor.foco) : cor.folha,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: sans,
                fontSize: Math.round(d * 0.5),
                fontWeight: 800,
                color: aceso > 0.5 ? "#FFFFFF" : cor.esbocoTexto,
                scale: String(1 + 0.12 * Math.sin(Math.PI * aceso)),
                ...numeros,
              }}
            >
              {feito ? <Icone nome="check" tamanho={d * 0.56} cor="#FFFFFF" peso={6} p={prog(t, itens[k + 1].em - 0.06, 0.3)} /> : k + 1}
            </div>
            <div style={{ position: "absolute", left: xTexto, top: yNo(k) - (tamanho * 1.05) / 2, width: largura }}>
              <Linhas linhas={linhas[k]} tempos={tempos} t={t} tamanho={tamanho} entrelinha={1.05} cor={cor.tinta} />
              {it.detalhe ? (
                <div style={{ marginTop: 12, fontSize: 40, fontWeight: 600, color: cor.tintaSuave, opacity: prog(t, it.em + 0.3, 0.3), whiteSpace: "nowrap" }}>{it.detalhe}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </NaFolha>
  );
};

// ——— comparação: dois dias ———

const Cabecalho: React.FC<{ texto: string; x: number; y: number; w: number; t: number; em: number; marca: string }> = ({ texto, x, y, w, t, em, marca }) => {
  const p = prog(t, em - 0.06, 0.3);
  const tamanho = Math.max(28, Math.min(36, Math.floor((36 * (w - 40)) / Math.max(1, medir(texto, 36, { peso: 700, caixaAlta: true, espacamento: 0.1 })))));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w }}>
      <div style={{ ...rotuloCaixaAlta, fontSize: tamanho, letterSpacing: "0.1em", color: p > 0.5 ? cor.tinta : cor.esbocoTexto, display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: p > 0.5 ? marca : cor.esboco, flexShrink: 0 }} />
        {texto}
      </div>
      <div style={{ marginTop: 14, height: 3, borderRadius: 2, width: w * mistura(0.15, 1, p), background: p > 0.5 ? cor.linhaForte : cor.linha }} />
    </div>
  );
};

export const ComparacaoNaFolha: React.FC<Props<Comparacao>> = ({ m, i, t, palavras, ag }) => {
  const lugar = ag.lugarDe[i];
  const aoLado = lugar === "lado";
  const area = areaDoConteudo(lugar, ag.L);
  const es = entradaESaida(ag, i);
  const corpo = corpoDaArea(area, m.titulo);
  const modo = m.modo ?? "contra";
  const meio = 92;
  const CAB = 74;
  // colunas lado a lado (pessoa em cima) ou fileiras uma embaixo da outra (pessoa ao lado)
  const largura = aoLado ? corpo.w : (corpo.w - meio) / 2;
  const alturaMax = aoLado ? (corpo.h - meio) / 2 - CAB : corpo.h - CAB;
  const medidas = m.lados.map((l) => encaixar(l.texto, { largura: largura - 64 - 12, max: aoLado ? 76 : 72, min: 40, linhas: 4, altura: alturaMax - 70, entrelinha: 1.05 }));
  const tamanho = Math.min(...medidas.map((e) => e.tamanho));
  const linhas = m.lados.map((l, k) => (medidas[k].tamanho === tamanho ? medidas[k].linhas : encaixar(l.texto, { largura: largura - 76, max: tamanho, min: tamanho, linhas: 5 }).linhas));
  // o bloco é alto (um evento da agenda), mas não precisa encher a coluna inteira; o grupo fica
  // um pouco acima do centro
  const natural = Math.max(...linhas.map((ls) => ls.length * tamanho * 1.05)) + 120;
  const alturaBloco = Math.min(alturaMax, Math.max(natural, alturaMax * (aoLado ? 0.82 : 0.72)));
  const grupo = aoLado ? 2 * (CAB + alturaBloco) + meio : CAB + alturaBloco;
  const topoGrupo = corpo.y + Math.max(0, (corpo.h - grupo) * 0.4);
  const caixas: Ret[] = [0, 1].map((k) =>
    aoLado ? { x: corpo.x, y: topoGrupo + k * (CAB + alturaBloco + meio), w: largura, h: CAB + alturaBloco } : { x: corpo.x + k * (largura + meio), y: topoGrupo, w: largura, h: CAB + alturaBloco },
  );
  const blocos = caixas.map((c) => ({ x: c.x, y: c.y + CAB, w: c.w, h: alturaBloco }));
  const segundo = prog(t, m.lados[1].em - 0.06, 0.3);
  const vencedorEm = m.vencedor !== undefined ? (m.vencedorEm ?? m.lados[m.vencedor].em + 0.6) : undefined;
  const veredito = vencedorEm !== undefined ? prog(t, vencedorEm, 0.35) : 0;
  const xMeio = aoLado ? corpo.x + corpo.w / 2 : caixas[0].x + caixas[0].w + meio / 2;
  const yMeio = aoLado ? caixas[0].y + caixas[0].h + meio / 2 : blocos[0].y + alturaBloco / 2;
  return (
    <NaFolha t={t} es={es} ag={ag}>
      <TituloDoMomento titulo={m.titulo} area={area} t={t} palavras={palavras} de={m.de} ate={m.lados[0].em} />
      {m.lados.map((lado, k) => {
        const errado = modo === "errado-certo" && k === 0;
        const certo = modo === "errado-certo" && k === 1;
        const ganhou = m.vencedor === k ? veredito : 0;
        const perdeu = m.vencedor !== undefined && m.vencedor !== k ? veredito : 0;
        const antes = modo === "antes-depois" && k === 0 ? segundo : 0;
        const categoria = certo ? "pausa" : "outro";
        const ativo = (modo === "antes-depois" && k === 1) || ganhou > 0.5 ? 1 : 0;
        const r = blocos[k];
        const tinta = tintaDoBloco(categoria, ativo);
        const tempos = temposDoTexto(lado.texto, palavras, lado.em - 0.3, k === 0 ? m.lados[1].em : m.ate, lado.em);
        // o bloco cai quando o texto do lado começa a ser dito (o rótulo já acendeu no `em`)
        const cai = Math.max(lado.em, (tempos[0] ?? lado.em) - 0.04);
        const alto = linhas[k].length * tamanho * 1.05;
        const risco = errado ? prog(t, m.lados[1].em - 0.05, 0.45) : 0;
        const marca = errado ? cor.foco : certo ? cor.pausa : k === 0 ? cor.outro : cor.foco;
        return (
          <div key={k} style={{ opacity: 1 - Math.max(perdeu * 0.5, antes * 0.45) }}>
            <Cabecalho texto={lado.rotulo} x={caixas[k].x} y={caixas[k].y} w={caixas[k].w} t={t} em={lado.em} marca={marca} />
            <BlocoQueCai r={r} em={cai} t={t} categoria={categoria} ativo={ativo} esbocoDe={es.entra}>
              <div style={{ position: "absolute", left: 34 + 12, top: (r.h - alto) / 2 - 2, width: r.w - 76 }}>
                <Linhas linhas={linhas[k]} tempos={tempos} t={t} tamanho={tamanho} entrelinha={1.05} cor={tinta} />
              </div>
              {risco > 0
                ? linhas[k].map((ws, j) => (
                    <div
                      key={j}
                      style={{
                        position: "absolute",
                        left: 34 + 12 - 6,
                        top: (r.h - alto) / 2 - 2 + j * tamanho * 1.05 + tamanho * 0.56,
                        width: (medir(ws.join(" "), tamanho) + 12) * limitar(risco * linhas[k].length - j),
                        height: Math.max(7, tamanho * 0.09),
                        borderRadius: 6,
                        background: cor.focoEscuro,
                      }}
                    />
                  ))
                : null}
              {(certo && prog(t, lado.em + 0.35, 0.3) > 0) || ganhou > 0 ? (
                <div style={{ position: "absolute", right: 20, top: 20, width: 64, height: 64, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icone nome="check" tamanho={40} cor={certo ? cor.pausa : cor.foco} peso={6} p={certo ? prog(t, lado.em + 0.35, 0.35) : ganhou} />
                </div>
              ) : null}
            </BlocoQueCai>
          </div>
        );
      })}
      {/* o símbolo entre os lados: × (contra) ou seta */}
      <div
        style={{
          position: "absolute",
          left: xMeio - 42,
          top: yMeio - 42,
          width: 84,
          height: 84,
          borderRadius: 999,
          boxSizing: "border-box",
          border: `4px ${segundo > 0.5 ? "solid" : "dashed"} ${segundo > 0.5 ? cor.tinta : cor.esboco}`,
          background: cor.folha,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          rotate: aoLado && modo !== "contra" ? "90deg" : undefined,
        }}
      >
        <Icone nome={modo === "contra" ? "xis" : "seta"} tamanho={46} cor={segundo > 0.5 ? cor.tinta : cor.esboco} peso={4.6} p={0.35 + 0.65 * segundo} />
      </div>
    </NaFolha>
  );
};

// ——— gráfico ———

// número curto em pt-BR: 47000 → "47 mil"; 1500000 → "1,5 mi"
const curto = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1e9) return `${formatar(v / 1e9, a >= 1e10 ? 0 : 1).replace(/,0$/, "")} bi`;
  if (a >= 1e6) return `${formatar(v / 1e6, a >= 1e7 ? 0 : 1).replace(/,0$/, "")} mi`;
  if (a >= 1e4) return `${formatar(v / 1e3, 0)} mil`;
  return null;
};
const comUnidade = (v: number, casas: number, unidade?: string, compacto = false) => {
  const u = unidade?.trim();
  const n = (compacto ? curto(v) : null) ?? formatar(casas ? v : Math.round(v), casas);
  if (!u) return n;
  if (u === "%") return `${n}%`;
  if (/^(R\$|US\$|€|£)$/.test(u)) return `${u} ${n}`;
  return n;
};
const unidadeNaNota = (u?: string) => !!u?.trim() && !/^(%|R\$|US\$|€|£)$/.test(u.trim());

const CORES_PIZZA = [CATEGORIAS.foco.forte, CATEGORIAS.pausa.forte, CATEGORIAS.outro.forte, CATEGORIAS.longa.forte, cor.focoEscuro, cor.tintaFraca];

export const GraficoNaFolha: React.FC<Props<Grafico>> = (props) => {
  const { m, i, t, palavras, ag } = props;
  const lugar = ag.lugarDe[i];
  const area = areaDoConteudo(lugar, ag.L);
  const es = entradaESaida(ag, i);
  const dados = (m.dados ?? []).slice(0, 6);
  const ilustrativo = !!m.ilustrativo || !dados.length;
  const nota = unidadeNaNota(m.unidade) ? m.unidade : undefined;
  const faixaChip = ilustrativo || nota ? 66 : 0;
  // pessoa no canto: o título e a etiqueta ficam ao lado dela; o gráfico ocupa a largura toda embaixo
  const noCanto = lugar === "canto";
  const P = ag.L.canto;
  const zonaTitulo = { x: area.x, y: area.y, w: P.x - 34 - area.x, h: P.h };
  const tituloCanto = noCanto && m.titulo ? encaixar(m.titulo, { largura: zonaTitulo.w, max: 76, min: 48, linhas: 3, entrelinha: 1.06 }) : null;
  const corpo = noCanto ? { x: area.x, y: P.y + P.h + 40, w: 952, h: area.y + area.h - (P.y + P.h + 40) } : corpoDaArea(area, m.titulo, faixaChip);
  const alturaTituloCanto = tituloCanto ? tituloCanto.linhas.length * tituloCanto.tamanho * 1.06 : 0;
  const topoTituloCanto = zonaTitulo.y + Math.max(0, (zonaTitulo.h - alturaTituloCanto - (faixaChip ? faixaChip + 10 : 0)) / 2);
  const yChip = noCanto ? topoTituloCanto + alturaTituloCanto + 24 : corpo.y - faixaChip;
  let desenho: React.ReactNode;
  if (dados.length >= 2 && m.forma === "pizza") desenho = <Pizza {...props} corpo={corpo} />;
  else if (dados.length >= 2 && m.forma === "linha") desenho = <LinhaComDados {...props} corpo={corpo} />;
  else if (dados.length >= 2) desenho = <Barras {...props} corpo={corpo} />;
  else desenho = <Tendencia {...props} corpo={corpo} es={es} />;
  return (
    <NaFolha t={t} es={es} ag={ag}>
      {tituloCanto && m.titulo ? (
        <div style={{ position: "absolute", left: zonaTitulo.x, top: topoTituloCanto }}>
          <Linhas
            linhas={tituloCanto.linhas}
            tempos={temposDoTexto(m.titulo, palavras, m.de - 0.3, dados[0]?.em ?? m.tendenciaEm ?? m.ate, m.de)}
            t={t}
            tamanho={tituloCanto.tamanho}
            esboco={cor.esboco}
            cor={cor.tinta}
          />
        </div>
      ) : (
        <TituloDoMomento titulo={m.titulo} area={area} t={t} palavras={palavras} de={m.de} ate={dados[0]?.em ?? m.tendenciaEm ?? m.ate} />
      )}
      {ilustrativo || nota ? (
        <div style={{ position: "absolute", left: area.x, top: yChip, display: "flex", gap: 18, alignItems: "center" }}>
          {ilustrativo ? <div style={{ position: "relative", width: 250, height: 48 }}><Ilustrativo x={0} y={0} p={prog(t, es.entra + 0.15, 0.3)} /></div> : null}
          {nota ? <div style={{ fontSize: 36, fontWeight: 600, color: cor.tintaSuave, whiteSpace: "nowrap" }}>{nota}</div> : null}
        </div>
      ) : null}
      {desenho}
    </NaFolha>
  );
};

// as linhas da régua, por trás do gráfico
const Grade: React.FC<{ corpo: Ret; base: number; t: number; de: number }> = ({ corpo, base, t, de }) => {
  const linhas: number[] = [];
  for (let y = base - 90; y > corpo.y + 20; y -= 90) linhas.push(y);
  const p = prog(t, de, 0.5, troca);
  return (
    <>
      {linhas.map((y) => (
        <div key={y} style={{ position: "absolute", left: corpo.x, top: y - 1, width: corpo.w * p, height: 2, background: cor.linha }} />
      ))}
      <div style={{ position: "absolute", left: corpo.x, top: base - 1.5, width: corpo.w * p, height: 3, background: cor.linhaForte }} />
    </>
  );
};

const Barras: React.FC<Props<Grafico> & { corpo: Ret }> = ({ m, t, palavras, corpo }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const n = dados.length;
  const slot = corpo.w / n;
  const largura = Math.min(170, slot * 0.66);
  const rotulos = dados.map((d) => encaixar(d.rotulo, { largura: slot - 12, max: 40, min: 30, linhas: 2, entrelinha: 1.08, fonte: { peso: 700 } }));
  const alturaRotulo = Math.max(...rotulos.map((r) => r.linhas.length * r.tamanho * 1.08));
  const base = corpo.y + corpo.h - alturaRotulo - 24;
  const topo = corpo.y + 70;
  const maior = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-6);
  const casas = Math.max(...dados.map((d) => casasDe(d.valor)));
  const atual = dados.reduce((a, d, k) => (t >= d.em - 0.06 ? k : a), -1);
  // o valor cabe na largura da coluna: senão vira "47 mil", e o corpo desce até 32
  const cabe = (compacto: boolean) => Math.floor((46 * (slot - 8)) / Math.max(1, medir(comUnidade(maior, casas, m.unidade, compacto), 46, { tabular: true })));
  const compacto = cabe(false) < 34;
  const valorT = Math.max(32, Math.min(46, cabe(compacto)));
  return (
    <>
      <Grade corpo={corpo} base={base} t={t} de={m.de} />
      {dados.map((d, k) => {
        const h = ((base - topo) * Math.abs(d.valor)) / maior;
        const cresce = prog(t, d.em - 0.06, 0.6, assenta);
        const x = corpo.x + k * slot + (slot - largura) / 2;
        const ativo = k === atual;
        const temposR = temposDoTexto(d.rotulo, palavras, d.em - 0.4, dados[k + 1]?.em ?? m.ate, d.em);
        return (
          <div key={k}>
            {/* lugar a lápis */}
            <div style={{ position: "absolute", left: x, top: base - 70, width: largura, height: 70, borderRadius: "18px 18px 0 0", border: `3px dashed ${cor.esboco}`, borderBottom: "none", boxSizing: "border-box", opacity: 1 - prog(t, d.em, 0.25) }} />
            {cresce > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: base - h * cresce,
                  width: largura,
                  height: h * cresce,
                  borderRadius: "18px 18px 0 0",
                  background: ativo ? cor.foco : cor.outro,
                }}
              />
            ) : null}
            <div style={{ position: "absolute", left: x - 20, width: largura + 40, top: base - h * cresce - valorT - 16, textAlign: "center", fontSize: valorT, fontWeight: 800, color: cresce > 0 ? cor.tinta : cor.esbocoTexto, opacity: limitar(cresce * 3), whiteSpace: "nowrap", ...numeros }}>
              {comUnidade(d.valor * cresce, casas, m.unidade, compacto)}
            </div>
            <div style={{ position: "absolute", left: corpo.x + k * slot + 6, width: slot - 12, top: base + 16, display: "flex", justifyContent: "center" }}>
              <Linhas linhas={rotulos[k].linhas} tempos={temposR} t={t} tamanho={rotulos[k].tamanho} entrelinha={1.08} peso={700} espacamento="0em" alinhar="center" esboco={cor.esbocoTexto} cor={cor.tintaSuave} />
            </div>
          </div>
        );
      })}
    </>
  );
};

const LinhaComDados: React.FC<Props<Grafico> & { corpo: Ret }> = ({ m, t, palavras, corpo }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const n = dados.length;
  const rotulos = dados.map((d) => encaixar(d.rotulo, { largura: corpo.w / n - 12, max: 38, min: 30, linhas: 2, entrelinha: 1.08, fonte: { peso: 700 } }));
  const alturaRotulo = Math.max(...rotulos.map((r) => r.linhas.length * r.tamanho * 1.08));
  const base = corpo.y + corpo.h - alturaRotulo - 24;
  const topo = corpo.y + 90;
  const valores = dados.map((d) => d.valor);
  const maior = Math.max(...valores);
  const menor = Math.min(0, ...valores);
  const xs = dados.map((_, k) => corpo.x + (corpo.w / n) * (k + 0.5));
  const ys = valores.map((v) => base - 30 - ((v - menor) / Math.max(1e-6, maior - menor)) * (base - 30 - topo));
  const casas = Math.max(...dados.map((d) => casasDe(d.valor)));
  return (
    <>
      <Grade corpo={corpo} base={base} t={t} de={m.de} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {dados.map((d, k) =>
          k === 0 ? null : <Traco key={`s${k}`} d={`M ${xs[k - 1]} ${ys[k - 1]} L ${xs[k]} ${ys[k]}`} p={prog(t, d.em - 0.15, 0.45, troca)} cor={cor.foco} largura={8} />,
        )}
        {dados.map((d, k) => {
          const p = prog(t, d.em - 0.06, 0.42, assenta);
          return (
            <g key={`p${k}`}>
              <line x1={xs[k]} y1={base} x2={xs[k]} y2={ys[k]} stroke={cor.linhaForte} strokeWidth={3} strokeDasharray="6 8" opacity={prog(t, d.em, 0.3)} />
              <circle cx={xs[k]} cy={ys[k]} r={17} fill="none" stroke={cor.esboco} strokeWidth={3} strokeDasharray="5 5" opacity={1 - p} />
              {p > 0 ? <circle cx={xs[k]} cy={ys[k] - (1 - p) * 46} r={19} fill={cor.foco} stroke="#FFFFFF" strokeWidth={5} opacity={limitar(p * 3)} /> : null}
            </g>
          );
        })}
      </svg>
      {dados.map((d, k) => {
        const p = prog(t, d.em - 0.06, 0.7);
        const temposR = temposDoTexto(d.rotulo, palavras, d.em - 0.4, dados[k + 1]?.em ?? m.ate, d.em);
        return (
          <div key={k}>
            <div style={{ position: "absolute", left: xs[k] - 120, width: 240, top: ys[k] - 80, textAlign: "center", fontSize: 42, fontWeight: 800, color: cor.tinta, opacity: limitar(p * 3), whiteSpace: "nowrap", ...numeros }}>
              {comUnidade(d.valor * p, casas, m.unidade)}
            </div>
            <div style={{ position: "absolute", left: xs[k] - corpo.w / n / 2 + 6, width: corpo.w / n - 12, top: base + 16, display: "flex", justifyContent: "center" }}>
              <Linhas linhas={rotulos[k].linhas} tempos={temposR} t={t} tamanho={rotulos[k].tamanho} entrelinha={1.08} peso={700} espacamento="0em" alinhar="center" esboco={cor.esbocoTexto} cor={cor.tintaSuave} />
            </div>
          </div>
        );
      })}
    </>
  );
};

const Pizza: React.FC<Props<Grafico> & { corpo: Ret }> = ({ m, t, palavras, corpo }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const aoLado = corpo.w < 700;
  const d = aoLado ? Math.min(corpo.w, corpo.h * 0.5) : Math.min(corpo.h, corpo.w * 0.52);
  const total = dados.reduce((s, x) => s + Math.max(0, x.valor), 0) || 1;
  const sw = Math.max(40, d * 0.16);
  const r = (d - sw) / 2;
  const vao = 0.012;
  const xAnel = corpo.x + (aoLado ? (corpo.w - d) / 2 : 0);
  const yAnel = corpo.y + (aoLado ? 0 : (corpo.h - d) / 2);
  const legenda = aoLado ? { x: corpo.x, y: yAnel + d + 40, w: corpo.w } : { x: xAnel + d + 50, y: corpo.y, w: corpo.w - d - 50 };
  const porcento = m.unidade?.trim() === "%" || Math.abs(total - 100) < 1.5;
  const fileira = Math.min(110, (corpo.y + corpo.h - legenda.y) / dados.length);
  const yLegenda = aoLado ? legenda.y : corpo.y + (corpo.h - fileira * dados.length) / 2;
  let acumulado = 0;
  // a legenda inteira no mesmo corpo (o menor que serve para todas)
  const valores = dados.map((x) => (porcento ? `${formatar((Math.max(0, x.valor) / total) * 100, casasDe(x.valor))}%` : comUnidade(x.valor, casasDe(x.valor), m.unidade)));
  const larguraV = Math.max(...valores.map((v) => medir(v, 44, { tabular: true }))) + 20;
  const corpoLegenda = Math.min(...dados.map((x) => encaixar(x.rotulo, { largura: legenda.w - 60 - larguraV, max: 44, min: 32, linhas: 2, entrelinha: 1.06, fonte: { peso: 700 } }).tamanho));
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={xAnel + d / 2} cy={yAnel + d / 2} r={r} fill="none" stroke={cor.linha} strokeWidth={sw} />
        {dados.map((x, k) => {
          const parte = Math.max(0, x.valor) / total;
          const de = acumulado;
          acumulado += parte;
          const enche = prog(t, x.em - 0.06, 0.5, assenta);
          if (enche <= 0) return null;
          const giro = -90 + (de + vao / 2) * 360;
          return (
            <circle
              key={k}
              cx={xAnel + d / 2}
              cy={yAnel + d / 2}
              r={r}
              fill="none"
              stroke={CORES_PIZZA[k % CORES_PIZZA.length]}
              strokeWidth={sw}
              pathLength={1}
              strokeDasharray={`${Math.max(0.001, (parte - vao) * enche)} 1`}
              transform={`rotate(${giro} ${xAnel + d / 2} ${yAnel + d / 2})`}
            />
          );
        })}
      </svg>
      {dados.map((x, k) => {
        const p = prog(t, x.em - 0.06, 0.3);
        const v = valores[k];
        const rot = encaixar(x.rotulo, { largura: legenda.w - 60 - larguraV, max: corpoLegenda, min: corpoLegenda, linhas: 3, entrelinha: 1.06, fonte: { peso: 700 } });
        const temposR = temposDoTexto(x.rotulo, palavras, x.em - 0.4, dados[k + 1]?.em ?? m.ate, x.em);
        return (
          <div key={k} style={{ position: "absolute", left: legenda.x, top: yLegenda + k * fileira, width: legenda.w, height: fileira, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: p > 0.5 ? CORES_PIZZA[k % CORES_PIZZA.length] : "transparent", border: p > 0.5 ? "none" : `3px dashed ${cor.esboco}`, boxSizing: "border-box" }} />
            <div style={{ flex: 1 }}>
              <Linhas linhas={rot.linhas} tempos={temposR} t={t} tamanho={rot.tamanho} entrelinha={1.06} peso={700} espacamento="0em" esboco={cor.esbocoTexto} cor={cor.tinta} />
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: p > 0.5 ? cor.tinta : cor.esbocoTexto, whiteSpace: "nowrap", ...numeros }}>{p > 0.5 ? v : "—"}</div>
          </div>
        );
      })}
    </>
  );
};

// sem números ditos: uma curva (ou colunas) que mostra a tendência, desenhada até a palavra
const Tendencia: React.FC<Props<Grafico> & { corpo: Ret; es: ReturnType<typeof entradaESaida> }> = ({ m, t, corpo, es }) => {
  const tendencia = m.tendencia ?? "sobe";
  const base = corpo.y + corpo.h - 30;
  const topo = corpo.y + 50;
  const de = Math.max(es.entra + 0.2, m.de + 0.1);
  const ate = Math.max(de + 0.6, m.tendenciaEm ?? m.de + (m.ate - m.de) * 0.6);
  const p = prog(t, de, ate - de, troca);
  const forma = (u: number) => {
    // 0 = embaixo, 1 = em cima, com ondulações de mercado
    const onda = (0.07 * Math.sin(u * Math.PI * 5.2) + 0.035 * Math.sin(u * Math.PI * 11.3)) * Math.sin(Math.PI * Math.min(1, u * 1.08));
    if (tendencia === "sobe") return 0.08 + 0.8 * Math.pow(u, 1.35) + onda * (0.4 + u);
    if (tendencia === "cai") return 0.9 - 0.8 * Math.pow(u, 1.2) + onda * (1.2 - u);
    return 0.48 + 0.3 * Math.sin(u * Math.PI * 3) + onda;
  };
  const x0 = corpo.x + 10;
  const x1 = corpo.x + corpo.w - 30;
  const ponto = (u: number) => [x0 + (x1 - x0) * u, base - (base - topo) * Math.min(1, Math.max(0, forma(u)))] as const;
  if (m.forma === "barras") {
    const n = 6;
    const slot = (x1 - x0) / n;
    return (
      <>
        <Grade corpo={corpo} base={base} t={t} de={es.entra} />
        {Array.from({ length: n }, (_, k) => {
          const u = (k + 0.5) / n;
          const h = (base - topo) * Math.min(1, Math.max(0.08, forma(u)));
          const c = prog(t, de + ((ate - de) * k) / n, 0.45, assenta);
          return (
            <div key={k}>
              <div style={{ position: "absolute", left: x0 + k * slot + slot * 0.17, width: slot * 0.66, top: base - h, height: h, borderRadius: "18px 18px 0 0", border: `3px dashed ${cor.esboco}`, borderBottom: "none", boxSizing: "border-box", opacity: 1 - c }} />
              {c > 0 ? <div style={{ position: "absolute", left: x0 + k * slot + slot * 0.17, width: slot * 0.66, top: base - h * c, height: h * c, borderRadius: "18px 18px 0 0", background: k === n - 1 ? cor.foco : cor.outro }} /> : null}
            </div>
          );
        })}
      </>
    );
  }
  const passos = 80;
  const pts = Array.from({ length: passos + 1 }, (_, k) => ponto(k / passos));
  const caminho = pts.map(([x, y], k) => `${k ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const visiveis = pts.slice(0, Math.max(1, Math.round(p * passos)) + 1);
  const area = `${visiveis.map(([x, y], k) => `${k ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} L ${visiveis[visiveis.length - 1][0].toFixed(1)} ${base} L ${x0} ${base} Z`;
  const [hx, hy] = ponto(p);
  // depois de chegar, a ponta pulsa devagar
  const pulso = t > ate ? 0.5 + 0.5 * Math.sin((t - ate) * 4) : 0;
  return (
    <>
      <Grade corpo={corpo} base={base} t={t} de={es.entra} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {/* a curva inteira a lápis, esperando */}
        <path d={caminho} fill="none" stroke={cor.esboco} strokeWidth={4} strokeDasharray="6 10" strokeLinecap="round" opacity={1 - prog(t, ate, 0.4)} />
        {p > 0 ? <path d={area} fill={cor.focoFundo} opacity={0.8} /> : null}
        <Traco d={caminho} p={p} cor={cor.foco} largura={9} />
        {p > 0 ? (
          <>
            <circle cx={hx} cy={hy} r={20 + 10 * pulso} fill={cor.foco} opacity={0.18} />
            <circle cx={hx} cy={hy} r={17} fill={cor.foco} stroke="#FFFFFF" strokeWidth={5} />
          </>
        ) : null}
      </svg>
      {p > 0.85 ? (
        <div style={{ position: "absolute", left: Math.min(hx - 40, x1 - 100), top: hy + (tendencia === "cai" ? -110 : 34), opacity: prog(t, ate - 0.1, 0.3) }}>
          <Icone nome={tendencia === "cai" ? "setaBaixo" : tendencia === "sobe" ? "sobe" : "seta"} tamanho={72} cor={cor.focoEscuro} peso={4.4} />
        </div>
      ) : null}
    </>
  );
};

// ——— definição: o termo que se abre ———

export const DefinicaoNaFolha: React.FC<Props<Definicao>> = ({ m, i, t, palavras, ag }) => {
  const lugar = ag.lugarDe[i];
  const aoLado = lugar === "lado";
  const area = areaDoConteudo(lugar, ag.L);
  const es = entradaESaida(ag, i);
  const pad = 40;
  const largura = area.w - pad * 2;
  const termo = encaixar(m.termo, { largura, max: aoLado ? 92 : 104, min: 56, linhas: 2, entrelinha: 1.02 });
  const sig = encaixar(m.significado, { largura, max: aoLado ? 58 : 64, min: 40, linhas: aoLado ? 4 : 3, entrelinha: 1.08, fonte: { peso: 700 } });
  // o bloco é um evento comprido: na raia ao lado ele ocupa boa parte da coluna (nada de terço vazio)
  const naturalTermo = pad * 2 + termo.linhas.length * termo.tamanho * 1.02;
  const naturalSig = 30 + sig.linhas.length * sig.tamanho * 1.08 + pad;
  const sobra = Math.max(0, area.h * (aoLado ? 0.66 : 0.86) - naturalTermo - naturalSig);
  const hTermo = naturalTermo + sobra * 0.35;
  const hSig = naturalSig + sobra * 0.65;
  const total = Math.min(area.h, hTermo + hSig);
  const y = area.y + Math.max(0, (area.h - total) * 0.42);
  const abre = prog(t, m.significadoEm - 0.08, 0.5, assenta);
  const r = { x: area.x, y, w: area.w, h: hTermo + hSig * abre };
  const temposT = temposDoTexto(m.termo, palavras, m.em - 0.3, m.significadoEm, m.em);
  const temposS = temposDoTexto(m.significado, palavras, m.significadoEm - 0.3, m.ate, m.significadoEm);
  return (
    <NaFolha t={t} es={es} ag={ag}>
      {/* a parte que vai abrir espera tracejada embaixo do bloco */}
      <div
        style={{
          position: "absolute",
          left: area.x,
          top: y + hTermo - 6,
          width: area.w,
          height: hSig + 6,
          borderRadius: "0 0 22px 22px",
          border: `3px dashed ${cor.esboco}`,
          borderTop: "none",
          boxSizing: "border-box",
          opacity: prog(t, es.entra + 0.1, 0.3) * (1 - abre),
        }}
      />
      <BlocoQueCai
        r={r}
        em={m.em}
        t={t}
        categoria="foco"
        esbocoDe={es.entra}
        lapis={
          // o termo espera a lápis dentro do lugar dele
          <div style={{ position: "absolute", left: pad - 3, top: (hTermo - termo.linhas.length * termo.tamanho * 1.02) / 2 - 7, fontSize: termo.tamanho, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.02em", color: cor.esbocoTexto, opacity: 0.55 }}>
            {termo.linhas.map((l, k) => (
              <div key={k} style={{ whiteSpace: "nowrap" }}>{l.join(" ")}</div>
            ))}
          </div>
        }
      >
        <div style={{ position: "absolute", left: pad, top: (hTermo - termo.linhas.length * termo.tamanho * 1.02) / 2 - 4, width: largura }}>
          <Linhas linhas={termo.linhas} tempos={temposT} t={t} tamanho={termo.tamanho} entrelinha={1.02} cor="#FFFFFF" />
        </div>
        <div style={{ position: "absolute", left: pad, right: pad, top: hTermo - 2, height: 3, background: "rgba(255,255,255,0.45)", transformOrigin: "left", scale: `${abre} 1` }} />
        <div style={{ position: "absolute", left: pad, top: hTermo + 26, width: largura }}>
          <Linhas linhas={sig.linhas} tempos={temposS} t={t} tamanho={sig.tamanho} entrelinha={1.08} peso={700} espacamento="-0.01em" cor="rgba(255,255,255,0.95)" />
        </div>
      </BlocoQueCai>
    </NaFolha>
  );
};
