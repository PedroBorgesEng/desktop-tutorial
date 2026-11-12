const PASSOS = [
  {
    numero: "01",
    titulo: "Monte a reserva",
    texto:
      "Escolha os doces no catálogo e ajuste as quantidades na sua reserva. Sem cadastro e sem pagamento nesta etapa.",
  },
  {
    numero: "02",
    titulo: "Escolha retirada ou entrega",
    texto:
      "Informe nome, telefone e a data desejada. Confirmamos a disponibilidade do lote por mensagem em até 24h.",
  },
  {
    numero: "03",
    titulo: "Pague na entrega",
    texto:
      "O pagamento é feito na retirada no ateliê ou no recebimento, por Pix, débito ou dinheiro.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 border-b border-border bg-card">
      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Como funciona</p>
          <h2 className="mt-4 font-heading text-4xl font-light leading-tight tracking-tight sm:text-5xl">
            Da escolha ao primeiro pedaço, em três passos.
          </h2>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {PASSOS.map((passo) => (
            <div key={passo.numero} className="border-t border-border pt-6">
              <span className="font-heading text-2xl text-accent">{passo.numero}</span>
              <h3 className="mt-3 font-heading text-2xl font-normal">{passo.titulo}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{passo.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}