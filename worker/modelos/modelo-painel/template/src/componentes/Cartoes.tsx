// Os blocos de quadro cheio do Painel: um cartão grafite na altura do peito, como um widget do
// painel sobre o vídeo. Rótulos em mono âmbar, título em Geist, números em Geist Mono menta.
import { calculo, prog, Revela, temposDasPalavras, usePalavras, useTempo } from "../anim";
import { encaixar } from "../medida";
import type { Abertura as TAbertura, Definicao as TDefinicao, Destaque as TDestaque, Frase as TFrase, Numero as TNumero, Pergunta as TPergunta } from "../plano";
import { cor, formatar, mono, rotulo as estiloRotulo, sans } from "../tema";
import { Cartao, type Zona } from "./Cartao";
import { TituloNaFala } from "./Titulo";
import { corpoQueCabe, Valor } from "./Valor";

const temDigito = (w: string) => /\d/.test(w);
const larguraDaZona = (zona: Zona) => 1080 - zona.esquerda - zona.direita;
const contarPalavras = (texto: string) => texto.split(/\s+/).filter(Boolean).length;

// Rótulo âmbar com o quadradinho (o mesmo dos painéis).
const Rotulo: React.FC<{ texto: string; p: number; largura: number }> = ({ texto, p, largura }) => {
  const medida = encaixar(texto, { largura: largura - 28, max: 32, min: 30, linhas: 2, fonte: { mono: true, caixaAlta: true, espacamento: 0.03 } });
  return (
    <Revela p={p}>
      <div style={{ ...estiloRotulo, fontSize: medida.tamanho, lineHeight: 1.2, display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 12, height: 12, marginTop: medida.tamanho * 0.42, flexShrink: 0, borderRadius: 2, background: cor.ambar }} />
        <div>
          {medida.linhas.map((l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </Revela>
  );
};

// Ícone de traço numa caixa (viewBox 48×48), desenhado na entrada; com `vivo`, um anel respira em volta.
const Selo: React.FC<{ tracos: string[]; c: string; p: number; vivo?: number }> = ({ tracos, c, p, vivo }) => {
  const t = useTempo();
  const d = vivo === undefined ? -1 : t - vivo;
  const r = d < 0 ? 0 : (d % 1.4) / 1.4;
  return (
    <div style={{ position: "relative", width: 84, height: 84, flexShrink: 0 }}>
      {d >= 0 ? (
        <div
          style={{
            position: "absolute",
            inset: -14 * r,
            borderRadius: 18 + 8 * r,
            border: `2px solid ${c}`,
            opacity: 0.55 * (1 - r),
          }}
        />
      ) : null}
      <svg width={84} height={84} viewBox="0 0 48 48">
        <rect x={1} y={1} width={46} height={46} rx={12} fill={c} fillOpacity={0.12 * p} stroke={c} strokeOpacity={0.5 * p} strokeWidth={1.2} />
        {tracos.map((tr) => (
          <path
            key={tr}
            d={tr}
            fill="none"
            stroke={c}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - p}
          />
        ))}
      </svg>
    </div>
  );
};

const ICONES = {
  alerta: ["M24,9 L41,38 L7,38 Z", "M24,19 L24,28", "M24,33 L24,33.5"],
  chave: ["M24,7 L41,24 L24,41 L7,24 Z", "M24,17 L31,24 L24,31 L17,24 Z"],
  pergunta: ["M18,18 C18,12 30,11 30,18 C30,23 24,23 24,28.5", "M24,34.5 L24,35"],
};

// ——— abertura: o título se monta na fala; o trecho `destaque` sai em menta ———
export const Abertura: React.FC<{ m: TAbertura; zona: Zona; t0: number; rotuloPadrao?: string }> = ({ m, zona, t0, rotuloPadrao }) => {
  const t = useTempo();
  const largura = larguraDaZona(zona);
  const rotulo = m.rotulo ?? rotuloPadrao;
  const medida = encaixar(m.texto, { largura: largura - 88, max: 80, min: 54, linhas: 3, fonte: { peso: 600, espacamento: -0.02 } });
  return (
    <Cartao de={t0} ate={m.ate} style={{ width: largura, padding: "38px 44px 40px" }}>
      {rotulo ? <Rotulo texto={rotulo} p={prog(t, t0 + 0.1, 0.5)} largura={largura - 88} /> : null}
      <div style={{ marginTop: rotulo ? 22 : 0 }}>
        <TituloNaFala
          texto={m.texto}
          medida={medida}
          em={m.em ?? m.de}
          limite={m.ate + 0.3}
          fonte={sans}
          destaque={m.destaque}
          entrelinha={1.08}
          espacamento="-0.02em"
          crescer
          estiloPalavra={(w) => (temDigito(w) ? { fontFamily: mono, fontWeight: 500 } : undefined)}
        />
      </div>
    </Cartao>
  );
};

// ——— numero: um indicador. O número conta até o valor na palavra dele; "R$", "%" e "mil" saem
// menores; o rótulo diz o que ele é. Porcentagem até 100 ganha uma barra que enche junto. ———
export const Numero: React.FC<{ m: TNumero; zona: Zona; t0: number }> = ({ m, zona, t0 }) => {
  const t = useTempo();
  const largura = larguraDaZona(zona);
  const miolo = largura - 88;
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const inicio = m.inicio ?? 0;
  const final = { prefixo: m.prefixo, numero: formatar(m.valor, casas), sufixo: m.sufixo };
  const corpo = corpoQueCabe(final, miolo - 60, 150);
  const dur = Math.max(0.6, Math.min(1.3, m.ate - m.em - 0.4));
  const pConta = prog(t, m.em, dur, calculo);
  // números pequenos e inteiros não contam (de 0 a 3 só pisca); aparecem direto
  const pequeno = Number.isInteger(m.valor) && Math.abs(m.valor) < 10 && m.inicio === undefined;
  const valor = pequeno ? m.valor : inicio + (m.valor - inicio) * pConta;
  const rotuloEm = m.rotuloEm ?? Math.min(m.em, t0 + 0.15);
  const rotuloDepois = rotuloEm > m.em + 0.2;
  const medidaRotulo = encaixar(m.rotulo, { largura: miolo, max: 54, min: 40, linhas: 2, fonte: { peso: 600, espacamento: -0.015 } });
  const percentual = (m.sufixo ?? "").trim() === "%" && m.valor > 0 && m.valor <= 100;
  const pNumero = prog(t, m.em - 0.3, 0.35);
  const alturaNumero = corpo * 1.04 + (percentual ? 44 : 0);

  const blocoRotulo = (
    <div style={{ height: (medidaRotulo.linhas.length * medidaRotulo.tamanho * 1.1 + 14) * prog(t, rotuloEm - 0.2, 0.3) }}>
      <Revela p={prog(t, rotuloEm - 0.05, 0.45)} style={{ paddingTop: rotuloDepois ? 14 : 0 }}>
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: medidaRotulo.tamanho, lineHeight: 1.1, letterSpacing: "-0.015em", color: cor.texto }}>
          {medidaRotulo.linhas.map((l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      </Revela>
    </div>
  );

  return (
    <Cartao de={t0} ate={m.ate} style={{ width: largura, padding: "34px 44px 38px" }}>
      {m.titulo || m.ilustrativo ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          {m.titulo ? <Rotulo texto={m.titulo} p={prog(t, t0 + 0.1, 0.5)} largura={miolo - (m.ilustrativo ? 230 : 0)} /> : <div />}
          {m.ilustrativo ? (
            <div style={{ padding: "4px 14px", borderRadius: 10, border: `2px solid ${cor.ambar}`, fontFamily: mono, fontWeight: 500, fontSize: 30, letterSpacing: "0.04em", textTransform: "uppercase", color: cor.ambar }}>
              ilustrativo
            </div>
          ) : null}
        </div>
      ) : null}
      {rotuloDepois ? null : blocoRotulo}
      <div style={{ height: alturaNumero * pNumero }}>
        <div style={{ paddingTop: rotuloDepois ? 0 : 6, display: "flex", alignItems: "center", gap: 26 }}>
          <Revela p={prog(t, m.em - 0.15, 0.35)}>
            <Valor v={{ prefixo: m.prefixo, numero: formatar(valor, casas), sufixo: m.sufixo }} tamanho={corpo} cor={cor.positivo} />
          </Revela>
          {/* terminada a contagem, o número fica "ao vivo" */}
          {pConta >= 1 ? <Pulso desde={m.em + dur} /> : null}
        </div>
        {percentual ? (
          <div style={{ position: "relative", marginTop: 22, height: 14, borderRadius: 7, background: "rgba(226,238,231,0.1)", opacity: pNumero }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${m.valor * pConta}%`, borderRadius: 7, background: cor.positivo }} />
          </div>
        ) : null}
      </div>
      {rotuloDepois ? blocoRotulo : null}
    </Cartao>
  );
};

const Pulso: React.FC<{ desde: number }> = ({ desde }) => {
  const t = useTempo();
  const d = t - desde;
  const p = d < 0 ? 0 : (d % 1.2) / 1.2;
  return (
    <div style={{ position: "relative", width: 18, height: 18, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: cor.positivo }} />
      <div style={{ position: "absolute", inset: -16 * p, borderRadius: "50%", border: `2px solid ${cor.positivo}`, opacity: p > 0 ? 0.7 * (1 - p) : 0 }} />
    </div>
  );
};

// ——— destaque (frase): um alerta do painel. Selo de alerta (vermelho suave) ou de chave (menta),
// a frase grande montada na fala e o detalhe em mono embaixo. ———
export const DestaqueFrase: React.FC<{ m: TDestaque; zona: Zona; t0: number }> = ({ m, zona, t0 }) => {
  const t = useTempo();
  const palavras = usePalavras();
  const largura = larguraDaZona(zona);
  const miolo = largura - 88;
  const alerta = (m.nivel ?? "alerta") === "alerta";
  const c = alerta ? cor.negativo : cor.positivo;
  const medida = encaixar(m.texto, { largura: miolo - 84 - 28, max: 84, min: 52, linhas: 3, fonte: { peso: 600, espacamento: -0.02 } });
  // `em` = a primeira palavra do texto: cada palavra da tela entra junto com a dita
  const em = m.em;
  const tempos = temposDasPalavras(palavras, em, contarPalavras(m.texto), m.ate);
  const fimTexto = tempos[tempos.length - 1] ?? em;
  const detalheEm = m.detalheEm ?? fimTexto + 0.35;
  const medidaDetalhe = m.detalhe ? encaixar(m.detalhe, { largura: miolo - 112, max: 40, min: 32, linhas: 2, fonte: { mono: true } }) : null;
  return (
    <Cartao de={t0} ate={m.ate} style={{ width: largura, padding: "34px 44px 36px" }}>
      <div style={{ position: "absolute", left: 0, top: 26, bottom: 26, width: 7, borderRadius: "0 4px 4px 0", background: c, opacity: prog(t, t0 + 0.2, 0.4) }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 28 }}>
        <Selo tracos={alerta ? ICONES.alerta : ICONES.chave} c={c} p={prog(t, t0 + 0.1, 0.7)} vivo={fimTexto + 0.3} />
        <div style={{ paddingTop: Math.max(0, (84 - medida.tamanho * 1.06) / 2) }}>
          <TituloNaFala texto={m.texto} medida={medida} em={em} limite={m.ate + 0.3} fonte={sans} entrelinha={1.06} espacamento="-0.02em" crescer />
        </div>
      </div>
      {medidaDetalhe ? (
        <div style={{ height: (medidaDetalhe.linhas.length * medidaDetalhe.tamanho * 1.2 + 18) * prog(t, detalheEm - 0.2, 0.3) }}>
          <Revela p={prog(t, detalheEm, 0.45)} style={{ paddingTop: 18, paddingLeft: 112 }}>
            <div style={{ fontFamily: mono, fontWeight: 500, fontSize: medidaDetalhe.tamanho, lineHeight: 1.2, color: cor.suave }}>
              {medidaDetalhe.linhas.map((l) => (
                <div key={l} style={{ whiteSpace: "nowrap" }}>
                  {l}
                </div>
              ))}
            </div>
          </Revela>
        </div>
      ) : null}
    </Cartao>
  );
};

// ——— definicao: a dica de um gráfico. O termo em mono menta, sublinhado tracejado; quando o
// significado é dito, uma caixa de dica abre embaixo dele, com a setinha apontando o termo. ———
export const Definicao: React.FC<{ m: TDefinicao; zona: Zona; t0: number }> = ({ m, zona, t0 }) => {
  const t = useTempo();
  const largura = larguraDaZona(zona);
  const miolo = largura - 88;
  const medidaTermo = encaixar(m.termo, { largura: miolo, max: 92, min: 52, linhas: 2, fonte: { mono: true, espacamento: -0.02 } });
  const larguraTermo = Math.min(miolo, Math.max(...medidaTermo.linhas.map((l) => l.length * medidaTermo.tamanho * 0.6 * 0.98)));
  const medidaSig = encaixar(m.significado, { largura: miolo - 56, max: 56, min: 40, linhas: 3, fonte: { peso: 500, espacamento: -0.01 } });
  const emTermo = Math.max(t0, m.em - 0.05);
  const pTermo = prog(t, emTermo, 0.45);
  const pTraco = prog(t, emTermo + 0.25, 0.6);
  const pDica = prog(t, m.significadoEm - 0.15, 0.35);
  const alturaDica = medidaSig.linhas.length * medidaSig.tamanho * 1.15 + 56 + 26;
  return (
    <Cartao de={t0} ate={m.ate} style={{ width: largura, padding: "36px 44px 38px" }}>
      <Revela p={pTermo}>
        <div style={{ fontFamily: mono, fontWeight: 500, fontSize: medidaTermo.tamanho, lineHeight: 1.08, letterSpacing: "-0.02em", color: cor.positivo }}>
          {medidaTermo.linhas.map((l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      </Revela>
      {/* sublinhado tracejado: "passe o dedo aqui" */}
      <div style={{ marginTop: 10, height: 4, width: larguraTermo * pTraco, backgroundImage: `linear-gradient(to right, ${cor.ambar} 60%, transparent 60%)`, backgroundSize: "18px 4px" }} />
      <div style={{ height: alturaDica * pDica, overflow: "visible" }}>
        <div style={{ position: "relative", marginTop: 26, opacity: pDica, translate: `0 ${(1 - pDica) * 10}px` }}>
          {/* setinha */}
          <div
            style={{
              position: "absolute",
              left: 36,
              top: -12,
              width: 24,
              height: 24,
              rotate: "45deg",
              background: "#1A2420",
              borderLeft: `2px solid ${cor.linhaForte}`,
              borderTop: `2px solid ${cor.linhaForte}`,
            }}
          />
          <div style={{ padding: "26px 28px 30px", borderRadius: 18, background: "#1A2420", border: `2px solid ${cor.linhaForte}` }}>
            <Revela p={prog(t, m.significadoEm, 0.5)}>
              <div style={{ fontFamily: sans, fontWeight: 500, fontSize: medidaSig.tamanho, lineHeight: 1.15, letterSpacing: "-0.01em", color: cor.texto }}>
                {medidaSig.linhas.map((l) => (
                  <div key={l} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            </Revela>
          </div>
        </div>
      </div>
    </Cartao>
  );
};

// ——— frase: a anotação do analista. Um traço menta cresce ao lado enquanto a frase se monta;
// `destaque` em menta, `risco` riscado em vermelho suave quando é dito. ———
export const Frase: React.FC<{ m: TFrase; zona: Zona; t0: number }> = ({ m, zona, t0 }) => {
  const t = useTempo();
  const palavras = usePalavras();
  const largura = larguraDaZona(zona);
  const miolo = largura - 88 - 34;
  const medida = encaixar(m.texto, { largura: miolo, max: 74, min: 48, linhas: 3, fonte: { peso: 600, espacamento: -0.02 } });
  const em = m.em ?? m.de;
  const tempos = temposDasPalavras(palavras, em, contarPalavras(m.texto), m.ate + 0.3);
  const pTraco = prog(t, tempos[0] ?? em, Math.max(0.4, (tempos[tempos.length - 1] ?? em) - (tempos[0] ?? em) + 0.3));
  return (
    <Cartao de={t0} ate={m.ate} style={{ width: largura, padding: "36px 44px 40px" }}>
      <div style={{ display: "flex", gap: 30 }}>
        <div style={{ width: 6, flexShrink: 0, borderRadius: 3, background: "rgba(226,238,231,0.1)", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 6, height: `${pTraco * 100}%`, borderRadius: 3, background: cor.positivo }} />
        </div>
        <TituloNaFala
          texto={m.texto}
          medida={medida}
          em={em}
          limite={m.ate + 0.3}
          fonte={sans}
          destaque={m.destaque}
          risco={m.risco}
          riscoEm={m.riscoEm}
          entrelinha={1.08}
          espacamento="-0.02em"
          crescer
        />
      </div>
    </Cartao>
  );
};

// ——— pergunta: o campo de busca do painel. Selo "?" âmbar e a pergunta montada na fala; as
// opções entram como linhas com um anel; sem opções, um campo com o cursor piscando. ———
export const Pergunta: React.FC<{ m: TPergunta; zona: Zona; t0: number }> = ({ m, zona, t0 }) => {
  const t = useTempo();
  const palavras = usePalavras();
  const largura = larguraDaZona(zona);
  const miolo = largura - 88;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const medida = encaixar(m.texto, { largura: miolo - 84 - 28, max: 70, min: 46, linhas: opcoes.length > 2 ? 2 : 3, fonte: { peso: 600, espacamento: -0.02 } });
  const em = m.em ?? m.de;
  const tempos = temposDasPalavras(palavras, em, contarPalavras(m.texto), m.ate + 0.3);
  const fimTexto = tempos[tempos.length - 1] ?? em;
  const corpoOpcao = Math.min(46, ...opcoes.map((o) => encaixar(o.texto, { largura: miolo - 70, max: 46, min: 34, linhas: 1, fonte: { peso: 500 } }).tamanho));
  const campoEm = fimTexto + 0.25;
  const cursor = Math.floor(t * 2.2) % 2 === 0;
  return (
    <Cartao de={t0} ate={m.ate} style={{ width: largura, padding: "34px 44px 36px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 28 }}>
        <Selo tracos={ICONES.pergunta} c={cor.ambar} p={prog(t, t0 + 0.1, 0.7)} />
        <div style={{ paddingTop: Math.max(0, (84 - medida.tamanho * 1.08) / 2) }}>
          <TituloNaFala texto={m.texto} medida={medida} em={em} limite={m.ate + 0.3} fonte={sans} entrelinha={1.08} espacamento="-0.02em" crescer />
        </div>
      </div>
      {opcoes.length ? (
        <div style={{ marginTop: 10 }}>
          {opcoes.map((o, i) => {
            const p = prog(t, o.em, 0.45);
            return (
              <div key={`${o.texto}-${i}`} style={{ height: (corpoOpcao * 1.2 + 22) * prog(t, o.em - 0.2, 0.3), overflow: "visible" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 22, paddingTop: 18, opacity: Math.min(1, p * 2) }}>
                  <div style={{ width: 34, height: 34, flexShrink: 0, borderRadius: "50%", border: `3px solid ${cor.ambar}`, boxSizing: "border-box", scale: String(0.6 + 0.4 * p) }} />
                  <Revela p={p}>
                    <div style={{ fontFamily: sans, fontWeight: 500, fontSize: corpoOpcao, lineHeight: 1.2, color: cor.texto, whiteSpace: "nowrap" }}>{o.texto}</div>
                  </Revela>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ height: 128 * prog(t, campoEm - 0.15, 0.3) }}>
          <div
            style={{
              marginTop: 24,
              height: 104,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              padding: "0 28px",
              borderRadius: 16,
              border: `2px solid ${cor.linha}`,
              background: "rgba(240,182,78,0.05)",
              opacity: prog(t, campoEm - 0.1, 0.35),
            }}
          >
            <span style={{ display: "inline-block", width: 5, height: 56, background: cor.ambar, opacity: cursor ? 1 : 0 }} />
          </div>
        </div>
      )}
    </Cartao>
  );
};
