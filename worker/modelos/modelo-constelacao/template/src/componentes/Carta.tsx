import { gira, limitar, mistura, prog, ruido, saindo, TextoAceso, temposDoTexto } from "../anim";
import { type Cena, ehCarta, entradaNoTempo, naTela, type Ocular, type P, type Vista, localizadorNoTempo, ocularVigente, vistaNoTempo } from "../ceu";
import type { Carta as CartaMomento, Direcao, Palavra, Passo, Plano } from "../plano";
import { cor, LIMITE_DIREITA, sans, serifa } from "../tema";
import { EstrelaQuatroPontas, Rosa } from "./Rosa";

// raio pela magnitude; num close a estrela cresce um pouco (sem virar bola)
let escalaEstrela = 1;
const raioDaEstrela = (mag: number) => limitar(10 - 1.9 * mag, 3.2, 13) * escalaEstrela;

type Item = { p: Passo; m: CartaMomento; ocular: Ocular; fim: number };

// quando cada estrela acende (o primeiro "acender" que a cita)
const temposDeAcender = (passos: Item[]) => {
  const t: Record<string, number> = {};
  for (const { p } of passos) {
    if (p.acao !== "acender") continue;
    p.estrelas.forEach((id, j) => {
      const em = p.em + j * (p.ritmo ?? 0.45);
      if (t[id] === undefined || em < t[id]) t[id] = em;
    });
  }
  return t;
};

const dist = (a: P, b: P) => Math.hypot(b.x - a.x, b.y - a.y);
const unit = (a: P, b: P) => {
  const d = dist(a, b) || 1;
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
};

// segmento entre duas estrelas, com folga em volta de cada uma (estilo de carta celeste)
const segmento = (a: P, b: P, folgaA: number, folgaB: number, u = 1) => {
  const d = dist(a, b);
  const n = unit(a, b);
  const ini = { x: a.x + n.x * folgaA, y: a.y + n.y * folgaA };
  const fimTotal = { x: b.x - n.x * folgaB, y: b.y - n.y * folgaB };
  if (d <= folgaA + folgaB) return null;
  return { x1: ini.x, y1: ini.y, x2: mistura(ini.x, fimTotal.x, u), y2: mistura(ini.y, fimTotal.y, u) };
};

// Texto da carta (HTML por cima do SVG): ancorado num ponto da tela
const Rotulo: React.FC<{
  x: number;
  y: number;
  // como o texto se prende ao ponto
  ancora: "centro-topo" | "centro-base" | "esquerda-meio" | "direita-meio";
  opacidade: number;
  children: React.ReactNode;
}> = ({ x, y, ancora, opacidade, children }) => {
  // fora da área segura (perto da legenda, do topo ou das bordas) o texto some
  const seguro = Math.min(1, Math.max(0, (1420 - y) / 60), Math.max(0, (y - 70) / 60), Math.max(0, (x + 40) / 80), Math.max(0, (1120 - x) / 80));
  const tr = {
    "centro-topo": "translate(-50%, 0)",
    "centro-base": "translate(-50%, -100%)",
    "esquerda-meio": "translate(0, -50%)",
    "direita-meio": "translate(-100%, -50%)",
  }[ancora];
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: tr, opacity: opacidade * seguro, display: "flex", flexDirection: "column", alignItems: ancora.startsWith("centro") ? "center" : ancora === "esquerda-meio" ? "flex-start" : "flex-end" }}>
      {children}
    </div>
  );
};

// Moldura de prancha de atlas: filete fino com graduação nas bordas
const Moldura: React.FC = () => {
  const m = 34;
  const marcas: React.ReactNode[] = [];
  for (let x = m; x <= 1080 - m; x += 46) {
    const longa = Math.round((x - m) / 46) % 5 === 0;
    marcas.push(<line key={`mt-${x}`} x1={x} y1={m} x2={x} y2={m + (longa ? 16 : 8)} />);
  }
  for (let y = m; y <= 1920 - m; y += 46) {
    const longa = Math.round((y - m) / 46) % 5 === 0;
    marcas.push(<line key={`me-${y}`} x1={m} y1={y} x2={m + (longa ? 16 : 8)} y2={y} />);
    marcas.push(<line key={`md-${y}`} x1={1080 - m} y1={y} x2={1080 - m - (longa ? 16 : 8)} y2={y} />);
  }
  return (
    <g stroke="rgba(170,182,230,0.32)" strokeWidth={1.6} fill="none">
      <rect x={m} y={m} width={1080 - 2 * m} height={1920 - 2 * m} />
      {marcas}
    </g>
  );
};

// largura aproximada de um texto (para caber sem medir o DOM)
const larguraTexto = (texto: string, corpo: number, fator = 0.5) => texto.length * corpo * fator;

// A carta só aparece na vez dela: quando a entrada vigente é de outro bloco (lista, número…), a
// figura do céu real sai (o fundo continua).
const vezDaCarta = (cena: Cena, t: number) => {
  const e = entradaNoTempo(cena, t);
  if (!e) return 1;
  const i = cena.entradas.indexOf(e);
  const anterior = cena.entradas[i - 1];
  const mesmoBloco = !!anterior && cena.blocos.some((b) => b.cartas.includes(e) && b.cartas.includes(anterior));
  if (ehCarta(e.m)) return mesmoBloco && !ehCarta(anterior.m) ? prog(t, e.inicio + 0.25, 0.35) : 1;
  return mesmoBloco && ehCarta(anterior.m) ? 1 - prog(t, e.inicio, 0.3) : 0;
};

export const Carta: React.FC<{ cena: Cena; plano: Plano; t: number; presenca: number; fundo?: boolean; conteudo?: number }> = ({ cena, plano, t, presenca, fundo = true, conteudo = 1 }) => {
  const { mundo } = cena;
  const v: Vista = vistaNoTempo(cena, t);
  escalaEstrela = limitar(Math.pow(v.s / (2600 / Math.max(mundo.vao / 0.58, 0.05)), 0.35), 0.9, 1.35);
  const Q = (id: string): P | null => (mundo.astros[id] ? naTela(mundo.astros[id], v) : null);
  const palavras: Palavra[] = plano.palavras;
  const ocular = ocularVigente(cena, t);
  // na volta para a tela cheia, os desenhos e textos saem antes (a íris abre sobre o céu limpo)
  const blocoAtual = cena.blocos.filter((b) => t >= b.de - 0.1).pop();
  const sobre = (blocoAtual && t >= blocoAtual.ate ? conteudo : 1) * vezDaCarta(cena, t);

  // passos já começados e o momento de carta atual
  const todos = cena.passos;
  const feitos = todos.filter((i) => i.p.em <= t + 0.6);
  const atual = cena.blocos.flatMap((b) => b.cartas).filter((c) => t >= c.inicio - 0.05).pop();
  const doAtual = atual ? todos.filter((i) => i.m === atual.m) : [];

  const acende = temposDeAcender(todos);
  const brilho: Record<string, number> = {};
  for (const { p } of todos) if (p.acao === "brilhar") p.estrelas.forEach((id) => (brilho[id] = Math.min(brilho[id] ?? Infinity, p.em)));

  // ---------------- fundo: grade, Via Láctea, estrelinhas
  const fundoVisivel = mundo.fundo
    .map((s, i) => ({ ...naTela(s, v), r: s.r, a: s.a, fase: s.fase, i }))
    .filter((s) => s.x > -10 && s.x < 1090 && s.y > -10 && s.y < 1930);
  const caminho = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const grade = mundo.grade.map((pts) => caminho(pts.map((p) => naTela(p, v))));
  const faixasVia = mundo.via ? mundo.via.faixas.map((f) => caminho(f.map((p) => naTela(p, v))) + " Z") : [];

  // ---------------- linhas da constelação
  type Seg = { a: string; b: string; em: number; fim: number; m: CartaMomento };
  const segs: Seg[] = [];
  for (const { p, m, fim } of todos) if (p.acao === "ligar") p.linhas.forEach(([a, b], j) => segs.push({ a, b, em: p.em + j * 0.32, fim, m }));

  // pulso de confirmação (apontar com texto): as linhas da figura acendem mais forte
  const confirmacoes = todos.filter((i) => i.p.acao === "apontar" && i.p.texto).map((i) => (i.p as Extract<Passo, { acao: "apontar" }>).textoEm ?? i.p.em + 0.8);
  const pulso = Math.max(0, ...confirmacoes.map((c) => prog(t, c, 0.25) * (1 - prog(t, c + 0.35, 0.8))));

  const elementos: React.ReactNode[] = [];
  const textos: React.ReactNode[] = [];

  // dicas a lápis do momento atual: estrelas e linhas que ainda vão acender
  const lapisAtual = atual ? prog(t, atual.inicio - 0.05, 0.35) * (1 - saindo(t, atual.m.ate + 0.1, 0.3)) : 0;

  segs.forEach((s, k) => {
    const a = Q(s.a);
    const b = Q(s.b);
    if (!a || !b) return;
    const ra = raioDaEstrela(mundo.astros[s.a].mag) + 9;
    const rb = raioDaEstrela(mundo.astros[s.b].mag) + 9;
    const u = prog(t, s.em, 0.5, gira);
    if (u <= 0) {
      if (s.m === atual?.m && lapisAtual > 0) {
        const sg = segmento(a, b, ra, rb);
        if (sg) elementos.push(<line key={`l-lapis-${k}`} {...sg} stroke={cor.lapis} strokeWidth={2.5} strokeDasharray="2 10" strokeLinecap="round" opacity={lapisAtual} />);
      }
      return;
    }
    const sg = segmento(a, b, ra, rb, u);
    if (sg) elementos.push(<line key={`l-${k}`} {...sg} stroke={cor.linha} strokeWidth={4.5 + 2 * pulso} strokeLinecap="round" opacity={0.92} />);
  });

  // ---------------- destacar (cota)
  for (const { p, fim, m } of todos) {
    if (p.acao !== "destacar") continue;
    const a = Q(p.de);
    const b = Q(p.ate);
    if (!a || !b) continue;
    // a cota e o texto esperam a troca de layout terminar (não andam junto com a ocular)
    const inicioMomento = cena.blocos.flatMap((bl) => bl.cartas).find((c) => c.m === m)?.inicio ?? m.de;
    const assenta = Math.max(p.em, inicioMomento + 0.6);
    const vida = prog(t, p.em, 0.3) * (1 - saindo(t, fim + 0.2, 0.5));
    if (vida <= 0) continue;
    const u = prog(t, p.em, 0.55, gira);
    const ra = raioDaEstrela(mundo.astros[p.de].mag) + 9;
    const rb = raioDaEstrela(mundo.astros[p.ate].mag) + 9;
    const sg = segmento(a, b, ra, rb, u);
    if (sg) elementos.push(<line key={`d-${p.em}`} {...sg} stroke={cor.lanterna} strokeWidth={7} strokeLinecap="round" opacity={vida} />);
    // cota paralela do lado com mais espaço
    const n = unit(a, b);
    const meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    let perp = { x: -n.y, y: n.x };
    if ((perp.x > 0 ? 1 : -1) * (meio.x < 540 ? 1 : -1) < 0) perp = { x: -perp.x, y: -perp.y };
    // afastamento: passa por fora da figura (as estrelas do mesmo momento)
    // a figura inteira a que o segmento pertence (todas as linhas que tocam as duas estrelas)
    const figura = new Set<string>([p.de, p.ate]);
    for (const x of todos) if (x.p.acao === "ligar") for (const [l1, l2] of x.p.linhas) if (figura.has(l1) || figura.has(l2)) (figura.add(l1), figura.add(l2));
    const outros = [...figura].map(Q).filter(Boolean) as P[];
    const larguraFigura = Math.max(0, ...outros.map((o) => (o.x - meio.x) * perp.x + (o.y - meio.y) * perp.y));
    const off = Math.max(64, larguraFigura + 52);
    const c1 = { x: a.x + perp.x * off, y: a.y + perp.y * off };
    const c2 = { x: b.x + perp.x * off, y: b.y + perp.y * off };
    const uc = prog(t, assenta, 0.6, gira);
    const ext = 16;
    elementos.push(
      <g key={`cota-${p.em}`} opacity={vida} stroke={cor.lanternaClara} strokeWidth={3} strokeLinecap="round">
        <line x1={a.x + perp.x * (off - ext)} y1={a.y + perp.y * (off - ext)} x2={a.x + perp.x * (off + ext)} y2={a.y + perp.y * (off + ext)} opacity={uc > 0 ? 1 : 0} />
        <line x1={c1.x} y1={c1.y} x2={mistura(c1.x, c2.x, uc)} y2={mistura(c1.y, c2.y, uc)} />
        <line x1={b.x + perp.x * (off - ext)} y1={b.y + perp.y * (off - ext)} x2={b.x + perp.x * (off + ext)} y2={b.y + perp.y * (off + ext)} opacity={uc >= 1 ? 1 : 0} />
      </g>,
    );
    if (p.texto) {
      const tempos = temposDoTexto(p.texto, palavras, p.em - 0.1, fim);
      const px = (c1.x + c2.x) / 2 + perp.x * 26;
      const py = (c1.y + c2.y) / 2 + perp.y * 26;
      const palavrasTexto = p.texto.split(/\s+/);
      // em duas linhas, equilibradas
      const corte = Math.ceil(palavrasTexto.length / 2);
      const l1 = palavrasTexto.slice(0, corte).join(" ");
      const l2 = palavrasTexto.slice(corte).join(" ");
      const estilo: React.CSSProperties = { fontFamily: sans, fontWeight: 700, fontSize: 34, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.25 };
      textos.push(
        <Rotulo key={`cota-t-${p.em}`} x={px} y={py} ancora={perp.x >= 0 ? "esquerda-meio" : "direita-meio"} opacidade={vida * prog(t, assenta - 0.05, 0.35)}>
          <TextoAceso texto={l1} tempos={tempos} t={t} cor={cor.lanternaClara} rascunho={0.25} estilo={estilo} />
          {l2 ? <TextoAceso texto={l2} tempos={tempos} offset={corte} t={t} cor={cor.lanternaClara} rascunho={0.25} estilo={estilo} /> : null}
        </Rotulo>,
      );
    }
  }

  // ---------------- prolongar (tracejado até o alvo) e a marca do alvo
  let rosaNoAlvo: { x: number; y: number; em: number; direcao?: Direcao; recua: number } | null = null;
  for (const { p, fim } of todos) {
    if (p.acao !== "prolongar") continue;
    const a = Q(p.de);
    const b = Q(p.ate);
    const alvo = Q(p.alvo);
    if (!a || !b || !alvo) continue;
    const chega = p.chegaEm ?? p.em + 1.2;
    const u = prog(t, p.em, chega - p.em, gira);
    if (u <= 0) {
      if (doAtual.some((i) => i.p === p) && lapisAtual > 0) {
        // guia a lápis: para onde a reta vai
        const sg = segmento(b, alvo, raioDaEstrela(mundo.astros[p.ate].mag) + 12, 22);
        if (sg) elementos.push(<line key={`p-lapis-${p.em}`} {...sg} stroke={cor.lapis} strokeWidth={2} strokeDasharray="2 14" strokeLinecap="round" opacity={lapisAtual * 0.7} />);
      }
      continue;
    }
    const depois = 1 - 0.35 * prog(t, fim, 0.6);
    const sg = segmento(b, alvo, raioDaEstrela(mundo.astros[p.ate].mag) + 12, 22, u);
    if (sg) {
      elementos.push(<line key={`p-${p.em}`} {...sg} stroke={cor.lanterna} strokeWidth={4.5} strokeDasharray="18 13" strokeLinecap="round" opacity={depois} />);
      // ponta que anda
      if (u < 1) elementos.push(<circle key={`p-ponta-${p.em}`} cx={sg.x2} cy={sg.y2} r={7} fill={cor.lanterna} />);
      // marcas de medida: a cada "braço" (de→ate) ao longo da reta
      const passo = dist(a, b);
      const n = unit(b, alvo);
      const total = dist(b, alvo);
      const percorrido = total * u;
      for (let k = 1; k * passo < total - 30; k++) {
        if (k * passo > percorrido) break;
        const c = { x: b.x + n.x * k * passo, y: b.y + n.y * k * passo };
        const aparece = prog(t, p.em + (chega - p.em) * ((k * passo) / total) * 0.9, 0.25);
        elementos.push(
          <line key={`p-m-${p.em}-${k}`} x1={c.x - n.y * 15} y1={c.y + n.x * 15} x2={c.x + n.y * 15} y2={c.y - n.x * 15} stroke={cor.linha} strokeWidth={3} strokeLinecap="round" opacity={aparece * 0.8 * depois} />,
        );
      }
    }
    // a marca no alvo: cruz, anéis de declinação, rosa dos ventos e o nome
    if (p.marca) {
      const emMarca = Math.max(chega - 0.15, p.marca.em ?? chega);
      const m0 = prog(t, chega - 0.1, 0.4);
      if (m0 > 0) {
        const tam = 30 * prog(t, chega - 0.1, 0.45);
        elementos.push(
          <g key={`alvo-${p.em}`} stroke={cor.lanterna} strokeWidth={4.5} strokeLinecap="round">
            <line x1={alvo.x - tam} y1={alvo.y} x2={alvo.x + tam} y2={alvo.y} />
            <line x1={alvo.x} y1={alvo.y - tam} x2={alvo.x} y2={alvo.y + tam} />
            <circle cx={alvo.x} cy={alvo.y} r={11} fill={cor.ceu} strokeWidth={3} opacity={m0} />
          </g>,
        );
        const aneis = mundo.aneis[p.alvo] ?? [];
        aneis.forEach((an, k) => {
          const r = an.r * v.s;
          const ua = prog(t, chega + 0.15 + k * 0.2, 0.9, gira);
          if (r < 40 || ua <= 0) return;
          elementos.push(
            <circle key={`anel-${p.em}-${k}`} cx={alvo.x} cy={alvo.y} r={r} fill="none" stroke={cor.linha} strokeWidth={2} strokeDasharray={`${2 * Math.PI * r * ua} 9999`} opacity={0.32} transform={`rotate(-90 ${alvo.x} ${alvo.y})`} />,
          );
        });
        if (p.marca.rosa) rosaNoAlvo = { x: alvo.x, y: alvo.y, em: chega - 0.05, direcao: "S", recua: 1 - 0.7 * prog(t, fim, 0.5) };
        // nome do alvo: ao lado da rosa, do lado com mais espaço
        const tempos = temposDoTexto(p.marca.texto, palavras, emMarca - 0.2, fim + 1);
        const corpo = 56;
        const palavrasMarca = p.marca.texto.split(/\s+/);
        const linhas = palavrasMarca.length > 2 ? [palavrasMarca.slice(0, 2).join(" "), palavrasMarca.slice(2).join(" ")] : [p.marca.texto];
        const larg = Math.max(...linhas.map((l) => larguraTexto(l, corpo, 0.47)));
        const raioRosa = p.marca.rosa ? 175 : 50;
        const cabeDireita = alvo.x + raioRosa + 20 + larg < LIMITE_DIREITA && !(ocular && Math.abs(ocular.cy - alvo.y) < ocular.R + 80 && ocular.cx > alvo.x);
        const cabeEsquerda = alvo.x - raioRosa - 20 - larg > 60;
        const lado = cabeDireita ? "direita" : cabeEsquerda ? "esquerda" : "baixo";
        const pos =
          lado === "direita"
            ? { x: alvo.x + raioRosa, y: alvo.y, ancora: "esquerda-meio" as const }
            : lado === "esquerda"
              ? { x: alvo.x - raioRosa, y: alvo.y, ancora: "direita-meio" as const }
              : { x: limitar(alvo.x, 60 + larg / 2, LIMITE_DIREITA - larg / 2), y: alvo.y + raioRosa + 10, ancora: "centro-topo" as const };
        let k0 = 0;
        textos.push(
          <Rotulo key={`alvo-t-${p.em}`} x={pos.x} y={pos.y} ancora={pos.ancora} opacidade={prog(t, emMarca - 0.25, 0.3) * (1 - saindo(t, fim + 0.1, 0.35))}>
            {linhas.map((l, li) => {
              const off = k0;
              k0 += l.split(/\s+/).length;
              return (
                <TextoAceso
                  key={li}
                  texto={l}
                  tempos={tempos}
                  offset={off}
                  t={t}
                  cor={cor.texto}
                  rascunho={0.22}
                  alinhar={pos.ancora === "direita-meio" ? "flex-end" : pos.ancora === "centro-topo" ? "center" : "flex-start"}
                  estilo={{ fontFamily: serifa, fontWeight: 600, fontSize: corpo, lineHeight: 1.08 }}
                />
              );
            })}
          </Rotulo>,
        );
      }
    }
  }

  // ---------------- apontar (seta pontilhada das ponteiras) e o selo de confirmação
  for (const { p, fim } of todos) {
    if (p.acao !== "apontar") continue;
    const a = Q(p.de);
    const b = Q(p.por);
    const alvo = Q(p.alvo);
    if (!a || !b || !alvo) continue;
    const n = unit(a, b);
    // até a projeção do alvo na reta, parando antes
    const proj = (alvo.x - a.x) * n.x + (alvo.y - a.y) * n.y;
    const comprimento = Math.max(dist(a, b) + 40, proj - 58);
    const ini = { x: a.x + n.x * (raioDaEstrela(mundo.astros[p.de].mag) + 16), y: a.y + n.y * (raioDaEstrela(mundo.astros[p.de].mag) + 16) };
    const u = prog(t, p.em, 0.85, gira);
    if (u <= 0) continue;
    const vida = 1 - 0.4 * prog(t, fim, 0.5);
    const fimSeta = { x: a.x + n.x * comprimento, y: a.y + n.y * comprimento };
    const ponta = { x: mistura(ini.x, fimSeta.x, u), y: mistura(ini.y, fimSeta.y, u) };
    // a seta passa "por baixo" da estrela do meio: falha em volta dela
    const rb = raioDaEstrela(mundo.astros[p.por].mag) + 14;
    const antes = Math.max(0, dist(ini, b) - rb);
    const percorrido = dist(ini, ponta);
    const tracos: React.ReactNode[] = [];
    const seg1 = Math.min(percorrido, antes);
    tracos.push(<line key="s1" x1={ini.x} y1={ini.y} x2={ini.x + n.x * seg1} y2={ini.y + n.y * seg1} />);
    if (percorrido > antes + 2 * rb) {
      const s2 = { x: ini.x + n.x * (antes + 2 * rb), y: ini.y + n.y * (antes + 2 * rb) };
      tracos.push(<line key="s2" x1={s2.x} y1={s2.y} x2={ponta.x} y2={ponta.y} />);
    }
    const ang = (Math.atan2(n.y, n.x) * 180) / Math.PI;
    elementos.push(
      <g key={`ap-${p.em}`} opacity={vida}>
        <g stroke={cor.lanterna} strokeWidth={5} strokeDasharray="0.1 13" strokeLinecap="round">
          {tracos}
        </g>
        {percorrido > antes + 2 * rb ? (
          <path d="M -16 -11 L 0 0 L -16 11" transform={`translate(${ponta.x} ${ponta.y}) rotate(${ang})`} fill="none" stroke={cor.lanterna} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
      </g>,
    );
    if (p.texto) {
      const em = p.textoEm ?? p.em + 0.8;
      const ut = prog(t, em - 0.05, 0.4);
      if (ut > 0) {
        // selo acima da figura-alvo
        const figura = todos.filter((i) => i.p.acao === "ligar").flatMap((i) => (i.p as Extract<Passo, { acao: "ligar" }>).linhas.flat());
        const ids = figura.includes(p.alvo) ? figura : [p.alvo];
        const pts = [...new Set(ids)].map(Q).filter(Boolean) as P[];
        const topo = Math.min(...pts.map((q) => q.y));
        const cx = (Math.min(...pts.map((q) => q.x)) + Math.max(...pts.map((q) => q.x))) / 2;
        const larg = larguraTexto(p.texto, 36, 0.56) + 90;
        const x = limitar(cx, 70 + larg / 2, LIMITE_DIREITA - larg / 2);
        textos.push(
          <div
            key={`selo-${p.em}`}
            style={{
              position: "absolute",
              left: x,
              top: topo - 62,
              transform: `translate(-50%, -100%) scale(${0.92 + 0.08 * ut})`,
              opacity: ut * vida,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 26px 12px 18px",
              borderRadius: 999,
              background: "rgba(10,11,31,0.86)",
              border: `2.5px solid ${cor.lanterna}`,
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: "0.02em",
              color: cor.texto,
              whiteSpace: "nowrap",
            }}
          >
            <svg width={38} height={38} viewBox="0 0 38 38">
              <circle cx={19} cy={19} r={16} fill="none" stroke={cor.lanterna} strokeWidth={3} />
              <path d="M 11 19.5 L 17 25 L 27.5 13" fill="none" stroke={cor.lanterna} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - prog(t, em + 0.1, 0.4))} />
            </svg>
            {p.texto}
          </div>,
        );
      }
    }
  }

  // ---------------- estrelas do plano
  const alvosDoAtual = new Set(doAtual.flatMap((i) => (i.p.acao === "acender" ? i.p.estrelas : [])));
  for (const a of Object.values(mundo.astros)) {
    if (a.ponto) continue;
    const q = naTela(a, v);
    if (q.x < -40 || q.x > 1120 || q.y < -40 || q.y > 1960) continue;
    const r = raioDaEstrela(a.mag);
    const em = acende[a.id];
    const aceso = em !== undefined ? prog(t, em - 0.04, 0.3) : 0;
    const b = brilho[a.id] !== undefined ? prog(t, brilho[a.id], 0.7) : 0;
    const raio = r * (0.55 + 0.45 * aceso) * (1 + 0.38 * b);
    // estrela ainda apagada: um ponto discreto (é uma estrela fraca no céu)
    elementos.push(<circle key={`e-${a.id}`} cx={q.x} cy={q.y} r={raio} fill={aceso > 0 ? cor.estrela : "#C9CDE6"} opacity={0.42 + 0.58 * aceso} />);
    // a lápis: um círculo tracejado mostra que ela vai acender
    if (alvosDoAtual.has(a.id) && aceso < 1 && lapisAtual > 0) {
      elementos.push(<circle key={`e-lapis-${a.id}`} cx={q.x} cy={q.y} r={r + 13} fill="none" stroke={cor.lapis} strokeWidth={2} strokeDasharray="3 6" opacity={lapisAtual * (1 - aceso)} />);
    }
    if (aceso > 0) {
      // onda curta ao acender e um anel fino que fica (marca de carta)
      const onda = prog(t, em, 0.8);
      if (onda < 1) elementos.push(<circle key={`e-onda-${a.id}`} cx={q.x} cy={q.y} r={raio + 6 + 34 * onda} fill="none" stroke={cor.estrela} strokeWidth={2.5} opacity={0.55 * (1 - onda)} />);
      elementos.push(<circle key={`e-anel-${a.id}`} cx={q.x} cy={q.y} r={raio + 6.5} fill="none" stroke={cor.estrela} strokeWidth={1.6} opacity={0.32 * aceso} />);
    }
    if (b > 0) {
      const respira = 1 + 0.06 * Math.sin(t * 3.1 + a.x * 50);
      const L = raio * 6.5 * b * respira;
      const l = raio * 3 * b * respira;
      // raios de difração: losangos finos que afinam nas pontas (não são cruzes de marcação)
      const raioFino = (ang: number, comp: number, larg: number) => {
        const c = Math.cos(ang);
        const s2 = Math.sin(ang);
        return `M ${q.x + c * comp} ${q.y + s2 * comp} L ${q.x - s2 * larg} ${q.y + c * larg} L ${q.x - c * comp} ${q.y - s2 * comp} L ${q.x + s2 * larg} ${q.y - c * larg} Z`;
      };
      elementos.push(
        <g key={`e-raios-${a.id}`} fill={cor.estrela}>
          <path d={raioFino(0, L, 2.6)} opacity={0.85} />
          <path d={raioFino(Math.PI / 2, L, 2.6)} opacity={0.85} />
          <path d={raioFino(Math.PI / 4, l, 1.6)} opacity={0.5} />
          <path d={raioFino(-Math.PI / 4, l, 1.6)} opacity={0.5} />
        </g>,
      );
    }
  }

  // ---------------- nomes de estrelas (etiquetas com linha-guia)
  for (const { p } of todos) {
    if (p.acao !== "nomear") continue;
    const q = Q(p.estrela);
    if (!q) continue;
    const u = prog(t, p.em - 0.08, 0.45);
    if (u <= 0) continue;
    const r = raioDaEstrela(mundo.astros[p.estrela].mag) * (brilho[p.estrela] !== undefined ? 1.38 : 1);
    const corpo = 50;
    const larg = larguraTexto(p.texto, corpo, 0.46);
    const lado = p.lado ?? (q.y > 1200 ? "cima" : "baixo");
    const d = { cima: { x: 0, y: -1 }, baixo: { x: 0, y: 1 }, esquerda: { x: -1, y: 0 }, direita: { x: 1, y: 0 } }[lado];
    const comp = 66 * prog(t, p.em - 0.08, 0.4, gira);
    const ini = { x: q.x + d.x * (r + 16), y: q.y + d.y * (r + 16) };
    const fimL = { x: ini.x + d.x * comp, y: ini.y + d.y * comp };
    elementos.push(<line key={`n-${p.em}`} x1={ini.x} y1={ini.y} x2={fimL.x} y2={fimL.y} stroke={cor.textoSuave} strokeWidth={2.5} strokeLinecap="round" />);
    const tempos = temposDoTexto(p.texto, palavras, p.em - 0.1, p.em + 3);
    // retas que saem desta estrela (setas, linhas): a etiqueta desliza para o lado oposto a elas
    const saidas: P[] = [];
    for (const i of todos) {
      if (i.p.acao === "apontar" && (i.p.por === p.estrela || i.p.de === p.estrela)) {
        const a = Q(i.p.de);
        const b2 = Q(i.p.por);
        if (a && b2) saidas.push(unit(a, b2));
      }
      if (i.p.acao === "ligar") for (const [l1, l2] of i.p.linhas) if (l1 === p.estrela || l2 === p.estrela) {
        const a = Q(l1 === p.estrela ? l1 : l2);
        const b2 = Q(l1 === p.estrela ? l2 : l1);
        if (a && b2) saidas.push(unit(a, b2));
      }
    }
    const vertical = lado === "cima" ? -1 : 1;
    const conflito = saidas.filter((u2) => u2.y * vertical > 0.2).reduce((acc, u2) => acc + u2.x, 0);
    const desloca = conflito > 0.1 ? -1 : conflito < -0.1 ? 1 : 0;
    const xCentro = limitar(fimL.x + desloca * (larg / 2 - 30), 64 + larg / 2, LIMITE_DIREITA - larg / 2);
    const pos =
      lado === "baixo"
        ? { x: xCentro, y: fimL.y + 6, ancora: "centro-topo" as const }
        : lado === "cima"
          ? { x: xCentro, y: fimL.y - 4, ancora: "centro-base" as const }
          : lado === "esquerda"
            ? { x: fimL.x - 10, y: fimL.y, ancora: "direita-meio" as const }
            : { x: fimL.x + 10, y: fimL.y, ancora: "esquerda-meio" as const };
    textos.push(
      <Rotulo key={`n-t-${p.em}`} x={pos.x} y={pos.y} ancora={pos.ancora} opacidade={u}>
        <TextoAceso texto={p.texto} tempos={tempos} t={t} cor={cor.texto} rascunho={0.2} estilo={{ fontFamily: serifa, fontStyle: "italic", fontWeight: 500, fontSize: corpo, lineHeight: 1.1 }} />
      </Rotulo>,
    );
  }

  // ---------------- nome da figura (ligar com nome)
  for (const { p, fim } of todos) {
    if (p.acao !== "ligar" || !p.nome) continue;
    const em = p.nomeEm ?? p.em + 0.45;
    const u = prog(t, em - 0.1, 0.45);
    if (u <= 0) continue;
    const pts = p.linhas.flat().map(Q).filter(Boolean) as P[];
    if (!pts.length) continue;
    const x0 = Math.min(...pts.map((q) => q.x));
    const x1 = Math.max(...pts.map((q) => q.x));
    const y0 = Math.min(...pts.map((q) => q.y));
    const y1 = Math.max(...pts.map((q) => q.y));
    const corpo = 62;
    const larg = larguraTexto(p.nome, corpo, 0.44);
    // embaixo da figura (no momento em que ela se forma)
    const x = limitar((x0 + x1) / 2, 64 + larg / 2, LIMITE_DIREITA - larg / 2);
    const y = y1 + 48;
    void y0;
    const tempos = temposDoTexto(p.nome, palavras, em - 0.2, em + 2);
    const depois = 1 - saindo(t, fim + 0.1, 0.4);
    if (depois <= 0) continue;
    textos.push(
      <Rotulo key={`nome-${p.em}`} x={x} y={y} ancora="centro-topo" opacidade={u * depois}>
        <TextoAceso texto={p.nome} tempos={tempos.map((tt) => Math.max(tt, em - 0.05))} t={t} cor={cor.texto} rascunho={0.2} estilo={{ fontFamily: serifa, fontStyle: "italic", fontWeight: 500, fontSize: corpo, lineHeight: 1.1 }} />
        <div style={{ marginTop: 8, height: 2.5, width: larg * prog(t, em + 0.1, 0.6, gira), background: cor.textoSuave, opacity: 0.7 }} />
      </Rotulo>,
    );
  }

  // ---------------- contador ("4 estrelas brilhantes")
  for (const { p, m: mc, ocular: oc, fim } of todos) {
    if (p.acao !== "acender" || !p.contador) continue;
    // o letreiro do contador já está lá a lápis desde o começo da carta; o número sobe na palavra
    const inicioCarta = cena.entradas.find((e) => e.m === mc)?.inicio ?? mc.de;
    const vida = prog(t, Math.min(p.em - 0.12, inicioCarta - 0.05), 0.35) * (1 - saindo(t, fim + 0.15, 0.35));
    if (vida <= 0) continue;
    const ritmo = p.ritmo ?? 0.45;
    const total = p.estrelas.length;
    const area = oc.livre;
    const tempos = temposDoTexto(p.contador, palavras, p.em - 0.2, fim);
    // o letreiro em linhas curtas (até ~10 letras), sem deixar preposição sozinha
    const linhasRotulo: { texto: string; i0: number }[] = [];
    p.contador.split(/\s+/).forEach((w, i) => {
      const ult = linhasRotulo[linhasRotulo.length - 1];
      if (ult && (ult.texto + " " + w).length <= 10) ult.texto += ` ${w}`;
      else linhasRotulo.push({ texto: w, i0: i });
    });
    // o número (o total dito: "quatro") sobe de trás de uma máscara; os marcadores enchem um a um
    const sobe = prog(t, p.em - 0.12, 0.45);
    // letreiro ao lado do número; se não couber na área livre, vai para baixo dele
    const larguraLetreiro = Math.max(...linhasRotulo.map((l) => l.texto.length)) * 34 * 0.8;
    const emColuna = 134 + larguraLetreiro > area.w;
    textos.push(
      <div key={`cont-${p.em}`} style={{ position: "absolute", left: area.x, top: area.y + area.h / 2, transform: "translateY(-50%)", opacity: vida, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", flexDirection: emColuna ? "column" : "row", alignItems: emColuna ? "flex-start" : "flex-end", gap: emColuna ? 4 : 22 }}>
          <div style={{ position: "relative", width: 112, height: 168, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, bottom: 0, fontFamily: serifa, fontWeight: 500, fontSize: 176, lineHeight: "168px", color: cor.texto, translate: `0 ${100 * (1 - sobe)}%` }}>{total}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingBottom: emColuna ? 8 : 26, paddingLeft: emColuna ? 4 : 0, gap: 2 }}>
            {linhasRotulo.map((l, i) => (
              <div key={i} style={{ fontFamily: sans, fontWeight: 700, fontSize: 34, letterSpacing: "0.14em", textTransform: "uppercase", color: cor.texto, opacity: 0.3 + 0.7 * prog(t, (tempos[l.i0] ?? p.em) - 0.02, 0.3) }}>
                {l.texto}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, paddingLeft: 6 }}>
          {Array.from({ length: total }).map((_, j) => {
            const a = prog(t, p.em + j * ritmo - 0.04, 0.3);
            return <EstrelaQuatroPontas key={j} tamanho={34} cheia={a} />;
          })}
        </div>
      </div>,
    );
  }

  // ---------------- rosa dos ventos (rumo) — num canto livre; voa até o alvo se houver rosa lá
  let rosa: React.ReactNode = null;
  const rumo = todos.find((i) => i.p.acao === "rumo" && i.p.em <= t + 0.1);
  let pos0: P | null = null;
  if (rumo) {
    const pal = rumo.ocular.palco;
    const v0 = vistaNoTempo(cena, rumo.p.em + 0.4);
    const ocupados: P[] = [];
    for (const i of todos.filter((x) => x.m === rumo.m)) {
      for (const id of i.p.acao === "acender" ? i.p.estrelas : i.p.acao === "ligar" ? i.p.linhas.flat() : []) {
        const a = mundo.astros[id];
        if (a) ocupados.push(naTela(a, v0));
      }
    }
    // o nome da figura fica embaixo dela
    if (ocupados.length) {
      const yMax = Math.max(...ocupados.map((o) => o.y));
      const xMed = ocupados.reduce((a, o) => a + o.x, 0) / ocupados.length;
      ocupados.push({ x: xMed - 150, y: yMax + 90 }, { x: xMed + 150, y: yMax + 90 });
    }
    const cantos = [
      { x: pal.x + 130, y: pal.y + pal.h - 130 },
      { x: pal.x + pal.w - 130, y: pal.y + pal.h - 130 },
      { x: pal.x + 130, y: pal.y + 130 },
      { x: pal.x + pal.w - 130, y: pal.y + 130 },
    ];
    const folga = (c: P) => Math.min(...ocupados.map((o) => dist(c, o)), 9999);
    pos0 = cantos.reduce((m, c) => (folga(c) > folga(m) + 40 ? c : m), cantos[0]);
  }
  if (rumo || rosaNoAlvo) {
    const alvoR = rosaNoAlvo as { x: number; y: number; em: number; direcao?: Direcao; recua: number } | null;
    const voa = alvoR ? prog(t, alvoR.em - 0.55, 0.8, gira) : 0;
    const vidaRumo = rumo ? prog(t, rumo.p.em - 0.05, 0.5) * (alvoR ? 1 : 1 - saindo(t, rumo.fim + 0.2, 0.4)) : 0;
    const vidaAlvo = alvoR ? prog(t, alvoR.em - 0.55, 0.5) : 0;
    const vida = Math.max(vidaRumo, vidaAlvo) * (alvoR ? alvoR.recua : 1);
    if (vida > 0) {
      const de = pos0 ?? (alvoR ? { x: alvoR.x, y: alvoR.y } : { x: 0, y: 0 });
      const para = alvoR ? { x: alvoR.x, y: alvoR.y } : de;
      const x = mistura(de.x, para.x, voa);
      const y = mistura(de.y, para.y, voa);
      const direcao = (rumo?.p as Extract<Passo, { acao: "rumo" }> | undefined)?.direcao ?? alvoR?.direcao ?? "S";
      const desenho = rumo ? prog(t, rumo.p.em - 0.05, 0.7, gira) : vidaAlvo;
      // a palavra da direção ("sul", "norte"…) faz a ponta vermelha pulsar
      const nomeDir = { S: "sul", N: "norte", L: "leste", O: "oeste" }[direcao];
      const dita = rumo ? palavras.find((w) => w.em >= rumo.p.em - 0.3 && w.em <= rumo.fim + 0.5 && w.w.toLowerCase().replace(/[^a-z]/g, "") === nomeDir) : undefined;
      const pulso = dita ? prog(t, dita.em - 0.05, 0.2) * (1 - prog(t, dita.em + 0.25, 0.6)) : 0;
      const raio = mistura(rumo ? 88 : 40, 120, alvoR ? (rumo ? voa : vidaAlvo) : 0) * (1 + 0.08 * pulso);
      rosa = <Rosa key="rosa" x={x} y={y} raio={raio} desenho={desenho} giro={-35 * (1 - desenho) + 12 * voa * (1 - voa)} destaque={direcao} opacidade={vida} miolo={alvoR ? 1 - prog(t, alvoR.em - 0.2, 0.3) : 1} />;
    }
  }

  // ---------------- localizador
  const loc = localizadorNoTempo(cena, t, v);
  const bloco = cena.blocos.find((b) => t >= b.de && t < b.ate + 0.6);
  let localizador: React.ReactNode = null;
  if (loc && bloco) {
    const c = naTela(loc, v);
    const primeiro = cena.focos.find((f) => f.em >= bloco.de - 0.1);
    let vida = (primeiro ? prog(t, primeiro.em - 0.1, 0.4) : 1) * (1 - prog(t, bloco.ate - 0.2, 0.4));
    const r = limitar(loc.r, 56, 290);
    vida *= loc.vis;
    if (vida > 0)
      localizador = (
        <g opacity={vida * 0.95} stroke={cor.lanterna} strokeLinecap="round" fill="none">
          <circle cx={c.x} cy={c.y} r={r} strokeWidth={3} />
          {[0, 90, 180, 270].map((g) => {
            const a = (g * Math.PI) / 180;
            return <line key={g} x1={c.x + Math.cos(a) * (r + 6)} y1={c.y + Math.sin(a) * (r + 6)} x2={c.x + Math.cos(a) * (r + 22)} y2={c.y + Math.sin(a) * (r + 22)} strokeWidth={3} />;
          })}
        </g>
      );
  }

  return (
    <div style={{ position: "absolute", inset: 0, opacity: presenca }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="escura">
            <stop offset="0%" stopColor={cor.ceu} stopOpacity={0.55} />
            <stop offset="60%" stopColor={cor.ceu} stopOpacity={0.4} />
            <stop offset="100%" stopColor={cor.ceu} stopOpacity={0} />
          </radialGradient>
        </defs>
        {fundo ? (
          <>
            <rect width={1080} height={1920} fill={cor.ceu} />
            {faixasVia.map((d, i) => (
              <path key={`via-${i}`} d={d} fill={cor.via} />
            ))}
            {mundo.via?.escuras.map((n, i) => {
              const c = naTela(n, v);
              return <circle key={`esc-${i}`} cx={c.x} cy={c.y} r={n.r * v.s * 1.15} fill="url(#escura)" />;
            })}
            <g stroke={cor.grade} strokeWidth={1.6} fill="none">
              {grade.map((d, i) => (
                <path key={`g-${i}`} d={d} />
              ))}
            </g>
            <g fill={cor.estrela}>
              {fundoVisivel.map((s) => (
                <circle key={`f-${s.i}`} cx={s.x} cy={s.y} r={s.r} opacity={s.a * (0.82 + 0.18 * Math.sin(t * 2.3 + s.fase)) * (0.75 + 0.25 * ruido(s.i))} />
              ))}
            </g>
          </>
        ) : null}
        <g opacity={sobre}>
          {elementos}
          {rosa}
          {localizador}
        </g>
      </svg>
      <div style={{ position: "absolute", inset: 0, opacity: sobre }}>{textos}</div>
    </div>
  );
};

// A prancha por cima de toda a carta (abaixo da pessoa): vinheta, o pé escuro atrás da legenda e a
// moldura graduada de atlas.
export const Prancha: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="pe" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={cor.ceu} stopOpacity={0} />
        <stop offset="100%" stopColor={cor.ceu} stopOpacity={0.88} />
      </linearGradient>
      <radialGradient id="vinheta" cx="50%" cy="45%" r="75%">
        <stop offset="55%" stopColor={cor.ceu} stopOpacity={0} />
        <stop offset="100%" stopColor="#04040E" stopOpacity={0.75} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#vinheta)" />
    <rect x={0} y={1470} width={1080} height={450} fill="url(#pe)" />
    <Moldura />
  </svg>
);

// re-exporta a posição livre do momento (o Edicao usa para a legenda)
export type { Ocular };
