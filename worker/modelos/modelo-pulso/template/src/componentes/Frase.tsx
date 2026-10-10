// Frase de efeito: embaixo do card da pessoa, a frase se monta palavra por palavra (o trecho em
// destaque na cor da zona) e o traçado do pulso corre embaixo dela, um batimento por palavra. O
// trecho `risco` é riscado em vermelho quando é dito — e o pulso dá um batimento de alerta ali.
import { Linhas, prog, temposDoTexto } from "../anim";
import { ANTES, type Geo } from "../layout";
import { encaixar, trechoNoTexto } from "../medida";
import type { Frase as FraseT, Palavra } from "../plano";
import { CONTEUDO, cor, mostrador, ZONAS, zonaCor } from "../tema";
import { Pulso } from "./Pulso";

export const Frase: React.FC<{ m: FraseT; t: number; palavras: Palavra[]; fim: number; geo: Geo }> = ({ m, t, palavras, fim, geo }) => {
  const z = zonaCor(m.zona ?? 2);
  const inicioTexto = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, inicioTexto), m.ate, inicioTexto + 0.35);
  const destaque = trechoNoTexto(m.texto, m.destaque ?? m.enfase);
  const riscadas = trechoNoTexto(m.texto, m.risco);
  const ordemRisco = [...riscadas].sort((a, b) => a - b);
  const riscoEm = m.riscoEm ?? (ordemRisco.length ? tempos[ordemRisco[0]] : undefined);
  const topoArea = geo.abaixoCartao;
  const alturaPulso = 140;
  const espaco = 1520 - topoArea - 30 - alturaPulso;
  let enc = encaixar(m.texto, { largura: CONTEUDO.w, max: 96, min: 60, linhas: 3 });
  while (enc.linhas.length * Math.round(enc.tamanho * 1.1) > espaco && enc.tamanho > 48) {
    enc = encaixar(m.texto, { largura: CONTEUDO.w, max: enc.tamanho - 4, min: Math.min(48, enc.tamanho - 4), linhas: 4 });
  }
  const alturaLinha = Math.round(enc.tamanho * 1.1);
  // o bloco (frase + pulso) fica centrado no espaço entre o card e o limite de baixo
  const altBloco = enc.linhas.length * alturaLinha + 30 + alturaPulso;
  const topo = Math.round(topoArea + Math.max(0, (1520 - topoArea - altBloco) / 2));
  const topoPulso = topo + enc.linhas.length * alturaLinha + 30;
  const inicio = m.de;
  const dur = Math.max(0.5, fim - ANTES - inicio);
  const batidas: { pos: number; em: number; alerta?: boolean }[] = [];
  for (const tw of tempos) {
    if (batidas.length && tw - batidas[batidas.length - 1].em < 0.2) continue;
    batidas.push({ em: tw, pos: Math.min(0.97, (tw + 0.04 - inicio) / dur) });
  }
  if (riscoEm !== undefined && batidas.length) {
    const perto = batidas.reduce((a, b) => (Math.abs(b.em - riscoEm) < Math.abs(a.em - riscoEm) ? b : a), batidas[0]);
    if (Math.abs(perto.em - riscoEm) < 0.3) perto.alerta = true;
  }
  // o risco atravessa as palavras, uma depois da outra
  const risco = (i: number) => {
    const k = ordemRisco.indexOf(i);
    if (k < 0 || riscoEm === undefined) return 0;
    return prog(t, riscoEm + 0.15 + k * 0.12, 0.22, (x) => x);
  };
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Linhas
        linhas={enc.linhas}
        tempos={tempos}
        t={t}
        x={CONTEUDO.x}
        y={topo}
        largura={CONTEUDO.w}
        alturaLinha={alturaLinha}
        estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: enc.tamanho, color: cor.tinta }}
        esboco={cor.esboco}
        corDe={(j) => (riscadas.has(j) && risco(j) > 0.5 ? cor.tintaFraca : destaque.has(j) ? z.texto : undefined)}
        risco={risco}
        corRisco={ZONAS[4].cor}
      />
      <Pulso x={CONTEUDO.x} y={topoPulso} largura={CONTEUDO.w} altura={alturaPulso} caneta={Math.min(1, Math.max(0, (t - inicio) / dur))} batidas={batidas} corTraco={z.cor} />
    </div>
  );
};
