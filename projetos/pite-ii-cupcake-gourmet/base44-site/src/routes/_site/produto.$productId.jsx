import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Image } from "@/components/ui/image";
import { buscarProduto } from "@/lib/server-fns";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_site/produto/$productId")({
  loader: async ({ params }) => {
    const { produto } = await buscarProduto({ data: { id: params.productId } });
    if (!produto) throw notFound();
    return { produto };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.produto?.nome || "Produto"} · Doce Ofício` },
      { name: "description", content: loaderData?.produto?.resumo || "Doce artesanal por encomenda." },
    ],
  }),
  component: ProdutoPage,
});

function ProdutoPage() {
  const { produto } = Route.useLoaderData();
  const { adicionar } = useCart();
  const [quantidade, setQuantidade] = useState(1);

  const adicionarAoCarrinho = () => {
    adicionar(produto, quantidade);
    toast.success(`${produto.nome} adicionado à reserva`);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
      <Link
        to="/"
        hash="catalogo"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Voltar ao catálogo
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Image
          src={produto.imagem_url}
          alt={produto.nome}
          fittingType="fill"
          className="h-[360px] w-full object-cover sm:h-[480px] lg:h-[600px]"
        />

        <div className="flex flex-col">
          <p className="eyebrow">{produto.categoria}</p>
          <h1 className="mt-4 font-heading text-4xl font-light leading-tight tracking-tight sm:text-5xl">
            {produto.nome}
          </h1>
          <p className="mt-4 font-heading text-2xl text-accent">{formatBRL(produto.preco)}</p>

          <p className="mt-6 text-base leading-relaxed text-foreground/75">
            {produto.descricao || produto.resumo}
          </p>

          <dl className="mt-8 space-y-4 border-t border-border pt-8 text-sm">
            {produto.porcao && (
              <div className="flex gap-6">
                <dt className="w-32 shrink-0 text-muted-foreground">Rendimento</dt>
                <dd>{produto.porcao}</dd>
              </div>
            )}
            {produto.ingredientes && (
              <div className="flex gap-6">
                <dt className="w-32 shrink-0 text-muted-foreground">Ingredientes</dt>
                <dd className="leading-relaxed">{produto.ingredientes}</dd>
              </div>
            )}
            <div className="flex gap-6">
              <dt className="w-32 shrink-0 text-muted-foreground">Encomenda</dt>
              <dd className="leading-relaxed">
                Produzido sob encomenda com 48h de antecedência. Pagamento na retirada ou entrega.
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-border">
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                className="flex h-12 w-12 items-center justify-center text-foreground/70 transition-colors hover:text-accent"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm tabular-nums">{quantidade}</span>
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.min(99, q + 1))}
                className="flex h-12 w-12 items-center justify-center text-foreground/70 transition-colors hover:text-accent"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={adicionarAoCarrinho}
              className="inline-flex h-12 items-center justify-center gap-2 bg-primary px-8 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-accent"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Adicionar à reserva
            </button>

            <Link
              to="/carrinho"
              className="text-xs uppercase tracking-[0.16em] text-foreground/70 underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              Ver minha reserva
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}