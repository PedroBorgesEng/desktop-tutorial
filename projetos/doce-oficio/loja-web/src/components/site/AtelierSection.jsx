import { Image } from "@/components/ui/image";
import { HERO_IMAGES } from "@/data/catalogo-sample";

const FATOS = [
  { valor: "12", rotulo: "receitas fixas no lote" },
  { valor: "48h", rotulo: "de antecedência mínima" },
  { valor: "100%", rotulo: "manteiga, sem mistura" },
];

export default function AtelierSection() {
  return (
    <section id="atelier" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">
        <Image
          src={HERO_IMAGES.atelier}
          alt="Bolo caseiro sobre prato de cerâmica visto de cima"
          fittingType="fill"
          className="h-[320px] w-full object-cover sm:h-[420px] lg:h-full"
        />

        <div className="flex flex-col justify-center">
          <p className="eyebrow">O ateliê</p>
          <h2 className="mt-4 font-heading text-4xl font-light leading-tight tracking-tight sm:text-5xl">
            Uma cozinha pequena, um caderno de receitas e nenhuma pressa.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-foreground/75">
            O Doce Ofício começou na cozinha de casa, vendendo brownies para vizinhos. Hoje
            produzimos em lotes limitados, com cacau de origem, ovos caipiras e frutas compradas
            na feira da semana. Cada receita é testada até acertar o ponto — e depois repetida do
            mesmo jeito, sempre.
          </p>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            Por isso o catálogo muda com as estações e o número de encomendas por semana é
            limitado: é o que garante que nada saia daqui sem passar pela mão de quem assa.
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
            {FATOS.map((fato) => (
              <div key={fato.rotulo}>
                <dt className="font-heading text-3xl font-normal text-foreground">{fato.valor}</dt>
                <dd className="mt-1 text-xs leading-snug text-muted-foreground">{fato.rotulo}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}