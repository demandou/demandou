import { Palavras, prog, saindo, temposDoTexto } from "../anim";
import type { Regiao } from "../layout";
import { encaixarTitulo, larguraTexto } from "../medida";
import type { Palavra, Titulo as TituloT } from "../plano";
import { caber, cor, sans } from "../tema";
import { pSelo, Selo } from "./Selo";

// Abertura em tela cheia: o título se monta palavra por palavra na névoa branca, abaixo do queixo.
// Com `duvidaEm`, o par ✓ / ✗ aparece (a pergunta que o vídeo vai responder).
// No quadro deitado a névoa é uma faixa larga e baixa: as linhas escolhidas à mão valem quando cabem
// grandes; se não, o texto se reorganiza em até 2 linhas largas. O par ✓ / ✗ fica ao lado do texto
// (uma fileira), não embaixo dele.
export const Titulo: React.FC<{ m: TituloT; t: number; fim: number; area: Regiao; palavras: Palavra[] }> = ({ m, t, fim, area, palavras }) => {
  const sai = saindo(t, fim, 0.28);
  if (sai >= 1) return null;
  const texto = m.linhas.join(" ");
  const duvida = m.duvidaEm !== undefined;
  const larguraDoTexto = area.w - (duvida ? 340 : 0);
  const alturaRotulo = m.rotulo ? 70 : 0;
  const alturaDoTexto = area.h - alturaRotulo;
  // as linhas escritas à mão, no maior corpo que cabe na largura e na altura da faixa
  const tamMao = Math.min(...m.linhas.map((l) => caber(l, larguraDoTexto, 112, 56)), Math.floor(alturaDoTexto / (m.linhas.length * 1.02)));
  // o mesmo texto reorganizado em até 2 linhas largas
  const novo = encaixarTitulo(texto, { largura: larguraDoTexto, max: 112, min: 56, linhas: 2, peso: 800, espacamento: -0.02, altura: alturaDoTexto, entrelinha: 1.02 });
  // no quadro deitado, menos linhas (mais largas) é melhor: as linhas à mão só ficam se tiverem o
  // mesmo número de linhas (ou menos) e a letra parecida, ou se a letra sair bem maior
  const aMao = m.linhas.length <= novo.linhas.length ? tamMao >= novo.tamanho * 0.92 : tamMao >= novo.tamanho * 1.15;
  const linhas = aMao ? m.linhas : novo.linhas;
  const tamanho = aMao ? Math.max(56, tamMao) : novo.tamanho;
  const tempos = temposDoTexto(texto, palavras, m.de, m.ate, m.de + 0.1);
  const quebras: number[] = [];
  let n = 0;
  for (const l of linhas) {
    quebras.push(n);
    n += l.split(/\s+/).filter(Boolean).length;
  }
  const alturaBloco = alturaRotulo + linhas.length * tamanho * 1.02;
  // o par ✓ / ✗ vem logo depois da linha mais longa (o bloco do texto tem a largura dela)
  const larguraUsada = Math.min(
    larguraDoTexto,
    Math.max(m.rotulo ? larguraTexto(m.rotulo, 42, 600) + 50 : 0, ...linhas.map((l) => larguraTexto(l, tamanho, 800, -0.02))) + 8,
  );
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        top: area.y + Math.max(0, (area.h - alturaBloco) / 2),
        width: area.w,
        display: "flex",
        alignItems: "center",
        gap: 40,
        opacity: 1 - sai,
        translate: `0 ${18 * sai}px`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: larguraUsada, flexShrink: 0 }}>
        {m.rotulo ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 42,
              color: cor.azul,
              opacity: prog(t, m.de, 0.4),
              translate: `${(1 - prog(t, m.de, 0.5)) * -20}px 0`,
            }}
          >
            <svg width={26} height={26}>
              <circle cx={13} cy={13} r={10} fill="none" stroke={cor.azul} strokeWidth={3.5} />
              <circle cx={13} cy={13} r={3.5} fill={cor.azul} />
            </svg>
            {m.rotulo}
          </div>
        ) : null}
        <Palavras
          texto={texto}
          tempos={tempos}
          t={t}
          enfase={m.enfase}
          corEnfase={cor.azul}
          quebras={quebras}
          style={{ fontFamily: sans, fontWeight: 800, fontSize: tamanho, lineHeight: 1.02, letterSpacing: "-0.02em", color: cor.tinta, textWrap: "nowrap" }}
        />
      </div>
      {duvida ? (
        <svg width={300} height={120} style={{ overflow: "visible", flexShrink: 0 }}>
          <Selo cx={56} cy={60} r={54} tipo="certo" p={pSelo(t, m.duvidaEm as number)} vazado />
          <Selo cx={186} cy={60} r={54} tipo="errado" p={pSelo(t, (m.duvidaEm as number) + 0.2)} vazado />
        </svg>
      ) : null}
    </div>
  );
};
