import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

const NAV = [
  { label: "Catálogo", hash: "catalogo" },
  { label: "Como funciona", hash: "como-funciona" },
  { label: "O ateliê", hash: "atelier" },
];

export default function SiteHeader() {
  const [aberto, setAberto] = useState(false);
  const { quantidadeTotal } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-6 px-6 lg:px-10">
        <Link to="/" className="group flex items-baseline gap-3">
          <span className="font-heading text-2xl font-semibold tracking-tight">Doce Ofício</span>
          <span className="hidden text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:inline">
            Ateliê
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.hash}
              to="/"
              hash={item.hash}
              className="text-sm text-foreground/80 transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/carrinho"
            className="relative inline-flex items-center gap-2 border border-border px-4 py-2.5 text-xs uppercase tracking-[0.16em] transition-colors hover:border-foreground/40 hover:text-accent"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Reserva</span>
            {quantidadeTotal > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                {quantidadeTotal}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center border border-border md:hidden"
            aria-expanded={aberto}
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          >
            {aberto ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {aberto && (
        <nav className="border-t border-border bg-background px-6 py-4 md:hidden">
          <ul className="space-y-3">
            {NAV.map((item) => (
              <li key={item.hash}>
                <Link
                  to="/"
                  hash={item.hash}
                  onClick={() => setAberto(false)}
                  className="block text-sm text-foreground/80"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}