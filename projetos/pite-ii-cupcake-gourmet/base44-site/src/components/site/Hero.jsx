import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { HERO_IMAGES } from "@/data/catalogo-sample";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] lg:block">
        <Image
          src={HERO_IMAGES.backdrop}
          alt=""
          fittingType="fill"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-background/10" />
      </div>

      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-6 py-14 lg:grid-cols-2 lg:gap-8 lg:px-10 lg:py-24">
        <div className="relative z-10 max-w-xl">
          <p className="eyebrow">Ateliê de doces artesanais · São Paulo</p>

          <h1 className="mt-6 font-heading text-[2.75rem] font-light leading-[0.98] tracking-tight sm:text-6xl lg:text-[4.25rem]">
            Doces feitos à mão,
            <br />
            em pequenas fornadas.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/75 sm:text-lg">
            Bolos, tortas e doces de forno com manteiga, cacau de origem e frutas da estação.
            Escolha no catálogo, reserve pelo site e acerte o pagamento na retirada.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/"
              hash="catalogo"
              className="group inline-flex items-center justify-center gap-3 bg-primary px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-accent"
            >
              Ver o catálogo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              hash="como-funciona"
              className="inline-flex items-center justify-center border border-foreground/25 px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:border-foreground/50 hover:text-accent"
            >
              Como funciona
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Lote desta semana · encomendas até sexta, 18h
          </div>
        </div>

        <div className="relative h-[380px] sm:h-[480px] lg:h-[600px]">
          <Image
            src={HERO_IMAGES.portrait}
            alt="Fatia de bolo de chocolate com ganache sobre prato de cerâmica"
            fittingType="fill"
            className="h-full w-full object-cover shadow-[0_24px_60px_-30px_rgba(26,22,21,0.55)]"
          />
          <div className="absolute bottom-5 left-5 max-w-[15rem] border border-border/80 bg-card/95 px-5 py-4 backdrop-blur">
            <p className="eyebrow">Destaque do lote</p>
            <p className="mt-2 font-heading text-xl leading-tight">Bolo de Chocolate Intenso</p>
            <p className="mt-1 text-xs text-muted-foreground">Cacau 70% · 8 fatias</p>
          </div>
        </div>
      </div>
    </section>
  );
}