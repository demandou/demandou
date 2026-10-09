import { PLANOS_PUBLICOS } from "@/lib/planos";
import { pecasDoPlano, REDES } from "@/lib/calculadora/custos";
import { ENTREGAS, horasDeTrabalhoDoStarter } from "@/lib/entregas-do-plano";

/**
 * A FAIXA DE PROVA (02/10, pedido do Bruno), logo abaixo da hero: as frases
 * de número dele, ajustadas ao que a plataforma entrega.
 *
 * As referências eram "30 dias de posts 100% prontos em N horas de trabalho" e
 * "N horas do seu dia viram 30 conteúdos prontos e agendados". A conta real do
 * Starter desde 08/10: os minutos de vídeo do plano mais a aprovação
 * (horasDeTrabalhoDoStarter). Os números saem do código, não da mão:
 * peças de pecasDoPlano (desde 06/10 lido de lib/entregas-do-plano.ts, o mesmo
 * dos cartões de preço; antes era "cerca de 44", escrito à mão), gravações do plano e
 * redes da lista da calculadora. Mudou o plano, a faixa acompanha.
 *
 * Componente de servidor, sem JavaScript no navegador.
 */
export function FaixaDeProva() {
  const starter = PLANOS_PUBLICOS[0];
  const pecas = pecasDoPlano(starter);
  // AS HORAS DE TRABALHO (02/10, noite, pedido do Matheus, que prefere o número
  // que sabe ser real): as horas gravando mais 1 hora de aprovação das peças
  // (perto de 1 minuto e meio cada). Eram horas e gravações escritas à mão;
  // desde 08/10 os minutos saem do saldo do plano
  // (lib/entregas-do-plano.ts), e a hero e "A conta do mês" leem o mesmo número.
  const e = ENTREGAS[starter.id];
  const horas = horasDeTrabalhoDoStarter();
  const numeros = [
    // Só minutos (08/10, Bruno), nunca "N gravações de X minutos".
    { n: `${horas} horas`, rotulo: "de trabalho no mês", detalhe: `${e.minutosDeVideo} minutos de vídeo gravado e a aprovação das peças` },
    { n: `~${pecas}`, rotulo: "peças prontas", detalhe: "vídeos, cortes, posts e carrosséis" },
    { n: `${REDES.length}`, rotulo: "redes, cada uma no formato dela", detalhe: REDES.map((r) => r.nome).join(", ") },
    // Saiu "0 post sem a sua aprovação" (02/10, noite, pedido do Matheus).
  ];
  return (
    <section aria-label="O que a plataforma entrega por mês" className="relative pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-orange-500/30 bg-[var(--bg-surface)] p-6 sm:p-8">
          {/* A frase de plataforma ("A plataforma que gera 30 dias de conteúdo
              em N horas") subiu para o selo da hero (02/10, noite, pedido do
              Matheus). Aqui fica a prova da conta, sem repetir a frase. */}
          <h2 className="text-center text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-[1.08] mb-8 max-w-4xl mx-auto">
            As suas {horas} horas no mês{" "}
            <span className="text-orange-500">viram isto.</span>
          </h2>
          {/* Três itens: uma coluna no celular, três a partir de 640 px, sem vão. */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {numeros.map((x) => (
              <div key={x.rotulo} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-4 min-w-0">
                <dt className="sr-only">{x.rotulo}</dt>
                <dd>
                  <p className="text-3xl sm:text-4xl font-black text-orange-400 tabular-nums leading-none">{x.n}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)] leading-snug">{x.rotulo}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)] leading-snug">{x.detalhe}</p>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
            Números do Starter, o plano de entrada. No Pro e no Enterprise o volume dobra e quadruplica.
          </p>
        </div>
      </div>
    </section>
  );
}
