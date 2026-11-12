import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { formatBRL, formatarData } from "@/lib/format";
import { PAGAMENTOS, classeStatus, rotuloStatus } from "@/lib/pedido-constantes";

export const Route = createFileRoute("/_site/pedido/$orderId")({
  head: () => ({
    meta: [{ title: "Reserva registrada · Doce Ofício" }],
  }),
  component: PedidoPage,
});

function PedidoPage() {
  const { orderId } = Route.useParams();
  const [pedido, setPedido] = useState(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(`doce-oficio:pedido:${orderId}`);
      if (salvo) setPedido(JSON.parse(salvo));
    } catch {
      /* sem resumo salvo neste navegador */
    }
    setCarregado(true);
  }, [orderId]);

  if (!carregado) return null;

  if (!pedido) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center lg:px-10">
        <h1 className="font-heading text-4xl font-light tracking-tight">Reserva não encontrada</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          O resumo desta reserva fica salvo apenas no navegador em que ela foi feita. Se você falou
          com o ateliê, consulte pelo código enviado na confirmação.
        </p>
        <Link
          to="/"
          hash="catalogo"
          className="mt-8 inline-flex items-center justify-center bg-primary px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-accent"
        >
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10 lg:py-20">
      <div className="flex items-center gap-3 text-primary">
        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        <p className="eyebrow text-primary">Reserva registrada</p>
      </div>

      <h1 className="mt-4 font-heading text-4xl font-light tracking-tight sm:text-5xl">
        Recebemos sua reserva.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Guarde o código <strong className="text-foreground">{pedido.codigo}</strong>. Vamos
        confirmar a disponibilidade do lote pelo telefone{" "}
        <strong className="text-foreground">{pedido.telefone}</strong> em até 24h.
      </p>

      <div className="mt-10 border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <p className="eyebrow">Pedido</p>
            <p className="mt-1 font-heading text-2xl">{pedido.codigo}</p>
          </div>
          <span
            className={`border px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${classeStatus(pedido.status)}`}
          >
            {rotuloStatus(pedido.status)}
          </span>
        </div>

        <ul className="divide-y divide-border px-6">
          {pedido.itens?.map((item) => (
            <li key={item.produto_id} className="flex items-center justify-between gap-4 py-4 text-sm">
              <span>
                {item.quantidade}× <span className="text-foreground">{item.nome}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatBRL(item.preco_unitario * item.quantidade)}
              </span>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-border px-6 py-5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatBRL(pedido.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{pedido.tipo_entrega === "entrega" ? "Taxa de entrega" : "Retirada no ateliê"}</span>
            <span className="tabular-nums">
              {pedido.taxa_entrega ? formatBRL(pedido.taxa_entrega) : "Grátis"}
            </span>
          </div>
          <div className="flex justify-between pt-2 font-heading text-xl text-foreground">
            <span>Total</span>
            <span className="tabular-nums">{formatBRL(pedido.total)}</span>
          </div>
        </div>

        <dl className="grid gap-4 border-t border-border px-6 py-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="eyebrow">Recebimento</dt>
            <dd className="mt-1">
              {pedido.tipo_entrega === "entrega" ? "Entrega" : "Retirada no ateliê"}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Data e período</dt>
            <dd className="mt-1">
              {formatarData(pedido.data_desejada)} · {pedido.periodo === "manha" ? "manhã" : "tarde"}
            </dd>
          </div>
          {pedido.endereco && (
            <div className="sm:col-span-2">
              <dt className="eyebrow">Endereço</dt>
              <dd className="mt-1">{pedido.endereco}</dd>
            </div>
          )}
          {pedido.observacoes && (
            <div className="sm:col-span-2">
              <dt className="eyebrow">Observações</dt>
              <dd className="mt-1">{pedido.observacoes}</dd>
            </div>
          )}
          <div>
            <dt className="eyebrow">Pagamento</dt>
            <dd className="mt-1">
              {PAGAMENTOS.find((p) => p.value === pedido.pagamento)?.label || "A combinar"} — acertado
              na retirada ou entrega
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          to="/"
          hash="catalogo"
          className="inline-flex items-center justify-center border border-foreground/25 px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors hover:border-foreground/50 hover:text-accent"
        >
          Voltar ao catálogo
        </Link>
        <a
          href="mailto:atelie@doceoficio.com.br"
          className="inline-flex items-center justify-center px-2 py-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 hover:text-accent hover:underline"
        >
          Falar com o ateliê
        </a>
      </div>
    </div>
  );
}