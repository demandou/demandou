// Lista de tarefas: a pessoa larga em cima e, na folha embaixo dela, uma lista de afazeres que
// enche o espaço. Cada tarefa espera a lápis, entra na palavra e é marcada (a caixinha enche de
// tomate com ✓) em `feitoEm`.
import { Palavras, prog, saindo, temposDoTexto } from "../anim";
import { ANTES, type CaixaPessoa } from "../agenda";
import type { Palavra, Tarefas as TTarefas } from "../plano";
import { CONTEUDO, cor, FOLHA, sans } from "../tema";
import { Icone } from "./Icones";

export const Tarefas: React.FC<{ m: TTarefas; t: number; palavras: Palavra[]; pessoa: CaixaPessoa; fim: number }> = ({ m, t, palavras, pessoa, fim }) => {
  const x = FOLHA.x + 32;
  const largura = FOLHA.w - 64;
  const topo = pessoa.y + pessoa.h + 30;
  // entra depois que a troca de layout assentou (a agenda anterior já sumiu)
  const entra = prog(t, m.de + 0.35, 0.4);
  const sai = saindo(t, fim - ANTES + 0.12, 0.25);
  const titulo = temposDoTexto(m.titulo, palavras, m.de, m.ate);
  const itens = m.itens.slice(0, 4);
  const alturaItem = Math.min(150, (CONTEUDO.base - topo - 96) / Math.max(1, itens.length));
  return (
    <div style={{ position: "absolute", left: x, top: topo, width: largura, fontFamily: sans, opacity: entra * (1 - sai) }}>
      <Palavras texto={m.titulo} tempos={titulo} t={t} esboco={cor.esboco} style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.05, color: cor.tinta, letterSpacing: "-0.02em" }} />
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column" }}>
        {itens.map((it, i) => {
          const p = prog(t, it.em, 0.35);
          const feito = it.feitoEm === undefined ? 0 : prog(t, it.feitoEm, 0.3);
          return (
            <div key={i} style={{ height: alturaItem, display: "flex", alignItems: "center", gap: 24, borderTop: `2px solid ${cor.linha}` }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  flexShrink: 0,
                  borderRadius: 18,
                  border: `4px ${p > 0.5 ? "solid" : "dashed"} ${feito > 0.5 ? cor.foco : p > 0.5 ? cor.tinta : cor.esboco}`,
                  background: feito > 0.5 ? cor.foco : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {feito > 0.01 ? <Icone nome="check" tamanho={44} cor="#FFFFFF" peso={6} p={feito} /> : null}
              </div>
              <div style={{ position: "relative", flex: 1, fontSize: 52, fontWeight: 700, lineHeight: 1.1 }}>
                <div style={{ color: cor.esbocoTexto, opacity: 1 - p }}>{it.texto}</div>
                <div style={{ position: "absolute", inset: 0, color: cor.tinta, opacity: p, translate: `${(1 - p) * -18}px 0` }}>{it.texto}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
