import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-16 lg:grid-cols-[2fr_1fr_1fr] lg:px-10">
        <div>
          <p className="font-heading text-3xl font-semibold tracking-tight">Doce Ofício</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Ateliê de doces artesanais em São Paulo. Produção em pequenos lotes, sob encomenda,
            com ingredientes de origem conhecida.
          </p>
          <p className="mt-6 font-heading text-xl italic text-accent">Feito à mão, sem pressa.</p>
        </div>

        <div>
          <p className="eyebrow">Navegar</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/" hash="catalogo" className="text-foreground/80 hover:text-accent">
                Catálogo
              </Link>
            </li>
            <li>
              <Link to="/" hash="como-funciona" className="text-foreground/80 hover:text-accent">
                Como funciona
              </Link>
            </li>
            <li>
              <Link to="/carrinho" className="text-foreground/80 hover:text-accent">
                Minha reserva
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Contato</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href="mailto:atelie@doceoficio.com.br"
                className="inline-flex items-center gap-2 text-foreground/80 hover:text-accent"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                atelie@doceoficio.com.br
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-foreground/80 hover:text-accent"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
                @doceoficio
              </a>
            </li>
            <li className="text-muted-foreground">
              Retirada no ateliê · Vila Madalena
              <br />
              Terça a sábado, 10h às 18h
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-6 py-6 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} Doce Ofício · Todos os direitos reservados.</p>
          <p>Projeto Integrador · Situação 2 · PITE Software II</p>
        </div>
      </div>
    </footer>
  );
}