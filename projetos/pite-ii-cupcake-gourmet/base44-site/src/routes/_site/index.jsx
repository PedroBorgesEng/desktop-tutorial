import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/site/Hero";
import CatalogSection from "@/components/site/CatalogSection";
import HowItWorks from "@/components/site/HowItWorks";
import AtelierSection from "@/components/site/AtelierSection";
import { listarProdutos } from "@/lib/server-fns";

export const Route = createFileRoute("/_site/")({
  loader: () => listarProdutos(),
  head: () => ({
    meta: [
      { title: "Doce Ofício · Doces artesanais por encomenda" },
      {
        name: "description",
        content:
          "Catálogo de bolos, tortas, cookies e doces artesanais feitos em pequenos lotes. Reserve pelo site e pague na retirada.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { produtos } = Route.useLoaderData();

  return (
    <>
      <Hero />
      <CatalogSection produtos={produtos} />
      <HowItWorks />
      <AtelierSection />

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary-foreground/70">
              Encomendas da semana
            </p>
            <h2 className="mt-3 max-w-xl font-heading text-3xl font-light leading-tight sm:text-4xl">
              O lote fecha na sexta às 18h — depois disso, só na próxima fornada.
            </h2>
          </div>
          <Link
            to="/"
            hash="catalogo"
            className="inline-flex items-center justify-center gap-3 border border-primary-foreground/40 px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors hover:bg-primary-foreground hover:text-primary"
          >
            Reservar agora
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}