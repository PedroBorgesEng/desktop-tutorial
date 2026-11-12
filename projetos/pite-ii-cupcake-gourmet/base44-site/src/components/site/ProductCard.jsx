import { Link } from "@tanstack/react-router";
import { Image } from "@/components/ui/image";
import { formatBRL } from "@/lib/format";

export default function ProductCard({ produto }) {
  return (
    <article className="group">
      <Link
        to="/produto/$productId"
        params={{ productId: produto.id }}
        className="block focus-visible:outline-none"
      >
        <div className="overflow-hidden bg-muted">
          <Image
            src={produto.imagem_url}
            alt={produto.nome}
            fittingType="fill"
            className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h3 className="font-heading text-2xl font-normal leading-tight tracking-tight">
            {produto.nome}
          </h3>
          <span className="shrink-0 font-body text-sm tabular-nums text-foreground/80">
            {formatBRL(produto.preco)}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{produto.resumo}</p>
      </Link>
    </article>
  );
}