import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { PERIODOS, TAXA_ENTREGA, TIPOS_ENTREGA } from "@/lib/pedido-constantes";

export const Route = createFileRoute("/_site/carrinho")({
  head: () => ({
    meta: [{ title: "Minha reserva · Doce Ofício" }],
  }),
  component: CarrinhoPage,
});

const FORM_INICIAL = {
  nome_cliente: "",
  telefone: "",
  email: "",
  tipo_entrega: "retirada",
  endereco: "",
  data_desejada: "",
  periodo: "tarde",
  observacoes: "",
};

const campo =
  "w-full border border-input bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent";

function CarrinhoPage() {
  const { itens, alterarQuantidade, remover, limpar, total } = useCart();

  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [dataMinima, setDataMinima] = useState("");
  const [prazoDias, setPrazoDias] = useState(2);
  const [pagamentos, setPagamentos] = useState(null);

  useEffect(() => {
    let ativo = true;
    fetch("/api/checkout")
      .then((r) => r.json())
      .then((dados) => { if (ativo) setPagamentos(dados); })
      .catch(() => { if (ativo) setPagamentos({ habilitado: false, modo: "pendente" }); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    const prazo = itens.reduce((maior, item) => Math.max(maior, item.prazo_dias ?? 2), 2);
    const data = new Date();
    data.setDate(data.getDate() + prazo);
    const iso = data.toISOString().slice(0, 10);
    setPrazoDias(prazo);
    setDataMinima(iso);
    setForm((atual) =>
      !atual.data_desejada || atual.data_desejada < iso ? { ...atual, data_desejada: iso } : atual
    );
  }, [itens]);

  const taxa = form.tipo_entrega === "entrega" ? TAXA_ENTREGA : 0;
  const totalFinal = total + taxa;

  const atualizar = (campoNome) => (evento) =>
    setForm((atual) => ({ ...atual, [campoNome]: evento.target.value }));

  async function enviar(evento) {
    evento.preventDefault();
    setErro("");

    if (itens.length === 0) {
      setErro("Sua reserva está vazia.");
      return;
    }
    if (!pagamentos?.habilitado) {
      setErro("Pix e cartão pelo PagBank ainda não estão disponíveis. Aguarde a configuração da loja.");
      return;
    }

    // Checkout hospedado no PagBank deve abrir como página inteira: em preview (iframe)
    // a aba é aberta no próprio clique, antes de qualquer espera.
    const enquadrado = window.self !== window.top;
    const aba = enquadrado ? window.open("", "_blank") : null;
    if (enquadrado && !aba) {
      setErro("Permita pop-ups neste navegador para concluir o pagamento.");
      return;
    }
    if (aba) aba.opener = null;

    setEnviando(true);
    try {
      const resposta = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          itens: itens.map((item) => ({ produto_id: item.id, quantidade: item.quantidade })),
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados?.erro || "Não foi possível iniciar o pagamento.");

      window.localStorage.setItem(`doce-oficio:pedido:${dados.pedido.id}`, JSON.stringify(dados.pedido));
      limpar();
      if (aba) aba.location.replace(dados.url);
      else window.location.assign(dados.url);
      setEnviando(false);
    } catch (falha) {
      aba?.close();
      setEnviando(false);
      setErro(falha?.message || "Não conseguimos registrar o pedido. Confira os dados e tente novamente.");
    }
  }

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center lg:px-10">
        <p className="eyebrow">Reserva</p>
        <h1 className="mt-4 font-heading text-4xl font-light tracking-tight">
          Sua reserva está vazia.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Escolha os doces no catálogo, ajuste as quantidades e volte aqui para informar os dados
          de retirada ou entrega.
        </p>
        <Link
          to="/"
          hash="catalogo"
          className="mt-8 inline-flex items-center justify-center bg-primary px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-accent"
        >
          Ver o catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
      <p className="eyebrow">Reserva</p>
      <h1 className="mt-4 font-heading text-4xl font-light tracking-tight sm:text-5xl">
        Sua reserva
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Escolha Pix ou cartão no ambiente seguro de pagamento do PagBank.
        {pagamentos?.modo !== "producao" && " Esta loja permanece em homologação, sem cobrança real."}
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div>
          <ul className="divide-y divide-border border-y border-border">
            {itens.map((item) => (
              <li key={item.id} className="flex gap-5 py-5">
                <Image
                  src={item.imagem_url}
                  alt={item.nome}
                  fittingType="fill"
                  className="h-24 w-20 shrink-0 object-cover"
                />
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-heading text-xl leading-tight">{item.nome}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatBRL(item.preco)} · unidade
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remover(item.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Remover ${item.nome} da reserva`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center border border-border">
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                        className="flex h-9 w-9 items-center justify-center text-foreground/70 hover:text-accent"
                        aria-label={`Diminuir ${item.nome}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">{item.quantidade}</span>
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                        className="flex h-9 w-9 items-center justify-center text-foreground/70 hover:text-accent"
                        aria-label={`Aumentar ${item.nome}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm tabular-nums">{formatBRL(item.preco * item.quantidade)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link
            to="/"
            hash="catalogo"
            className="mt-6 inline-block text-xs uppercase tracking-[0.16em] text-foreground/70 underline-offset-4 hover:text-accent hover:underline"
          >
            Continuar escolhendo
          </Link>
        </div>

        <form onSubmit={enviar} className="border border-border bg-card p-6 lg:p-8">
          <h2 className="font-heading text-2xl font-normal">Dados da reserva</h2>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="nome" className="eyebrow">
                Nome completo
              </label>
              <input
                id="nome"
                required
                minLength={2}
                value={form.nome_cliente}
                onChange={atualizar("nome_cliente")}
                className={`mt-2 ${campo}`}
                autoComplete="name"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="telefone" className="eyebrow">
                  Telefone
                </label>
                <input
                  id="telefone"
                  required
                  value={form.telefone}
                  onChange={atualizar("telefone")}
                  placeholder="(11) 99999-0000"
                  className={`mt-2 ${campo}`}
                  autoComplete="tel"
                />
              </div>
              <div>
                <label htmlFor="email" className="eyebrow">
                  E-mail (opcional)
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={atualizar("email")}
                  className={`mt-2 ${campo}`}
                  autoComplete="email"
                />
              </div>
            </div>

            <fieldset>
              <legend className="eyebrow">Como prefere receber</legend>
              <div className="mt-2 grid gap-2">
                {TIPOS_ENTREGA.map((tipo) => (
                  <label
                    key={tipo.value}
                    className={`flex cursor-pointer items-start gap-3 border px-3 py-3 text-sm transition-colors ${
                      form.tipo_entrega === tipo.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo_entrega"
                      value={tipo.value}
                      checked={form.tipo_entrega === tipo.value}
                      onChange={atualizar("tipo_entrega")}
                      className="mt-1 accent-[hsl(var(--primary))]"
                    />
                    <span>
                      <span className="block">{tipo.label}</span>
                      <span className="block text-xs text-muted-foreground">{tipo.ajuda}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {form.tipo_entrega === "entrega" && (
              <div>
                <label htmlFor="endereco" className="eyebrow">
                  Endereço de entrega
                </label>
                <input
                  id="endereco"
                  required
                  value={form.endereco}
                  onChange={atualizar("endereco")}
                  placeholder="Rua, número, complemento, bairro"
                  className={`mt-2 ${campo}`}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="data" className="eyebrow">
                  Data desejada
                </label>
                <input
                  id="data"
                  type="date"
                  required
                  min={dataMinima}
                  value={form.data_desejada}
                  onChange={atualizar("data_desejada")}
                  className={`mt-2 ${campo}`}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Antecedência mínima de {prazoDias} dias
                </p>
              </div>
              <div>
                <label htmlFor="periodo" className="eyebrow">
                  Período
                </label>
                <select
                  id="periodo"
                  value={form.periodo}
                  onChange={atualizar("periodo")}
                  className={`mt-2 ${campo}`}
                >
                  {PERIODOS.map((periodo) => (
                    <option key={periodo.value} value={periodo.value}>
                      {periodo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="observacoes" className="eyebrow">
                Observações
              </label>
              <textarea
                id="observacoes"
                rows={3}
                value={form.observacoes}
                onChange={atualizar("observacoes")}
                placeholder="Alergias, mensagem no bolo, ponto de referência..."
                className={`mt-2 ${campo}`}
              />
            </div>
          </div>

          <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatBRL(total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{form.tipo_entrega === "entrega" ? "Taxa de entrega" : "Retirada no ateliê"}</span>
              <span className="tabular-nums">{taxa ? formatBRL(taxa) : "Grátis"}</span>
            </div>
            <div className="flex justify-between pt-2 font-heading text-xl">
              <span>Total</span>
              <span className="tabular-nums">{formatBRL(totalFinal)}</span>
            </div>
          </div>

          {erro && (
            <p role="alert" className="mt-4 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando || !pagamentos?.habilitado}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-primary px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60"
          >
            {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {enviando ? "Abrindo pagamento..." : pagamentos?.habilitado ? "Pagar com Pix ou cartão" : "Pagamento aguardando ativação"}
          </button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Pix ou cartão · Checkout PagBank {pagamentos?.modo === "teste" ? "(ambiente de testes)" : ""}
          </p>
          {!pagamentos?.habilitado && (
            <p role="status" className="mt-2 text-center text-xs text-amber-800">
              A conta PagBank da loja ainda não está configurada. Não há cobranças nem criação de novos pedidos.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}