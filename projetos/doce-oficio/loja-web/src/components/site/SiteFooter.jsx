import { Link } from "@tanstack/react-router";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-16 lg:grid-cols-[2fr_1fr_1fr] lg:px-10">
        <div>
          <p className="font-heading text-3xl font-semibold tracking-tight">Doce Ofício</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Ateliê de doces artesanais, com catálogo e encomendas sob consulta.
            A operação comercial e os pagamentos ainda estão em configuração.
          </p>
          <p className="mt-6 font-heading text-xl italic text-accent">
            Feito à mão, sem pressa.
          </p>
        </div>

        <div>
          <p className="eyebrow">Navegar</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/" hash="catalogo" className="text-foreground/80 hover:text-accent">Catálogo</Link></li>
            <li><Link to="/" hash="como-funciona" className="text-foreground/80 hover:text-accent">Como funciona</Link></li>
            <li><Link to="/carrinho" className="text-foreground/80 hover:text-accent">Carrinho</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Informações comerciais</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Endereço, região de entrega, horários, canais de atendimento,
            políticas comerciais e identificação do fornecedor serão divulgados
            após a confirmação dos dados do estabelecimento.
          </p>
        </div>
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-6 py-6 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} Doce Ofício.</p>
          <p>Loja em homologação · Nenhuma cobrança real está habilitada.</p>
        </div>
      </div>
    </footer>
  );
}
