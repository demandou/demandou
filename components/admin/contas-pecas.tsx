import Link from "next/link";
import { COR_DA_MARCA, NOME_DA_MARCA, type MarcaDaConta } from "@/lib/admin/contas/caso-a-caso";

/**
 * AS PEÇAS DAS TELAS DE CONTRATOS E CONTAS E DE PERFIS (08/10/2026), de
 * servidor e sem JavaScript, no visual do painel (painel-graficos.tsx).
 */

const PERIODOS = [
  { valor: "30", nome: "30 dias" },
  { valor: "90", nome: "90 dias" },
  { valor: "365", nome: "12 meses" },
  { valor: "tudo", nome: "Desde o início" },
] as const;

/** O período na URL (?periodo=30), mantendo os outros filtros. */
export function SeletorDoPeriodo({ atual, base, extra = "" }: { atual: string; base: string; extra?: string }) {
  return (
    <nav aria-label="Período" className="inline-flex flex-wrap rounded-xl border p-1 gap-1" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
      {PERIODOS.map((p) => {
        const ativo = p.valor === atual;
        return (
          <Link
            key={p.valor}
            href={`${base}?periodo=${p.valor}${extra}`}
            aria-current={ativo ? "true" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              ativo ? "bg-[var(--acento-forte)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--realce-2)] hover:text-[var(--text-primary)]"
            }`}
          >
            {p.nome}
          </Link>
        );
      })}
    </nav>
  );
}

/** "Como calculamos": fechado por padrão, abre no clique, sem JavaScript. */
export function ComoCalculamos({ children, titulo = "Como calculamos" }: { children: React.ReactNode; titulo?: string }) {
  return (
    <details className="group rounded-xl border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
      <summary className="cursor-pointer list-none text-xs font-semibold select-none [&::-webkit-details-marker]:hidden" style={{ color: "var(--text-primary)" }}>
        <span aria-hidden className="inline-block mr-1 transition-transform group-open:rotate-90">
          ›
        </span>
        {titulo}
      </summary>
      <div className="mt-2 space-y-1.5 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {children}
      </div>
    </details>
  );
}

/** A marca da conta (pagante, equipe, teste, cortesia, sem plano). */
export function MarcaDaContaNaTela({ marca }: { marca: MarcaDaConta }) {
  return (
    <span
      className="inline-block rounded-md border px-1.5 py-[1px] text-[10px] font-semibold whitespace-nowrap"
      style={{ borderColor: "var(--border)", color: COR_DA_MARCA[marca] }}
      title={
        marca === "pagante"
          ? "Tem pagamento confirmado (cartão pago no Stripe, ou Pix e transferência com comprovante)."
          : marca === "equipe"
            ? "Papel de admin, conta marcada como da equipe ou e-mail @demandou.com: gera custo, nunca receita."
            : marca === "teste"
              ? "Em período de teste: sem pagamento confirmado."
              : marca === "cortesia"
                ? "Plano liberado sem pagamento confirmado: não entra na receita."
                : "Sem plano e sem pagamento."
      }
    >
      {NOME_DA_MARCA[marca]}
    </span>
  );
}

/** Um número com o rótulo em cima, a nota embaixo e a conta no balão (title). */
export function NumeroComConta({ rotulo, valor, nota, conta, cor }: { rotulo: string; valor: string; nota?: React.ReactNode; conta: string; cor?: string }) {
  return (
    <div className="rounded-2xl border px-4 py-3 min-w-0" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", boxShadow: "var(--shadow)" }} title={conta}>
      <p className="rotulo">{rotulo}</p>
      <p className="text-xl font-semibold tabular-nums mt-0.5" style={{ color: cor ?? "var(--text-primary)" }}>
        {valor}
      </p>
      {nota && (
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {nota}
        </p>
      )}
    </div>
  );
}

/** Data curta em São Paulo, ou "sem dado". */
export function dataCurta(iso: string | null | undefined): string {
  if (!iso) return "sem dado";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit" });
}

/** "R$ 0,12 de IA por real recebido", ou "sem receita". */
export function custoPorRealNaTela(v: number | null): string {
  if (v === null) return "sem receita";
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por real`;
}
