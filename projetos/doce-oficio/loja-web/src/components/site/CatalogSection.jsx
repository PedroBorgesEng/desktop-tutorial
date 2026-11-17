import { useMemo, useState } from "react";
import ProductCard from "@/components/site/ProductCard";
import { CATEGORIAS } from "@/data/catalogo-sample";

export default function CatalogSection({ produtos }) {
  const [categoria, setCategoria] = useState("todos");

  const visiveis = useMemo(
    () => (categoria === "todos" ? produtos : produtos.filter((p) => p.categoria === categoria)),
    [produtos, categoria]
  );

  const filtros = [{ value: "todos", label: "Todos" }, ...CATEGORIAS];

  return (
    <section id="catalogo" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="flex flex-col gap-8 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-lg">
            <p className="eyebrow">Catálogo do lote</p>
            <h2 className="mt-4 font-heading text-4xl font-light leading-tight tracking-tight sm:text-5xl">
              Escolha o que vai para a sua mesa.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Cada item é produzido sob encomenda. Pedidos para o mesmo dia dependem de
              disponibilidade — confirmamos por telefone.
            </p>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
            {filtros.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setCategoria(f.value)}
                aria-pressed={categoria === f.value}
                className={`border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  categoria === f.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground/70 hover:border-foreground/40 hover:text-accent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((produto) => (
            <ProductCard key={produto.id} produto={produto} />
          ))}
        </div>

        {visiveis.length === 0 && (
          <p className="mt-12 text-sm text-muted-foreground">
            Nenhum item nesta categoria por enquanto.
          </p>
        )}
      </div>
    </section>
  );
}