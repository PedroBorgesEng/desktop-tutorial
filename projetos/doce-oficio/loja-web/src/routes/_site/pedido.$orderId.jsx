import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { formatBRL, formatarData } from "@/lib/format";
import { classeStatus, rotuloStatus } from "@/lib/pedido-constantes";
import { consultarPedido } from "@/lib/server-fns";

export const Route = createFileRoute("/_site/pedido/$orderId")({
  validateSearch: (search) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    retorno: typeof search.retorno === "string" ? search.retorno : undefined,
  }),
  head: () => ({
    meta: [{ title: "Pedido · Doce Ofício" }],
  }),
  component: PedidoPage,
});

function PedidoPage() {
  const { orderId } = Route.useParams();
  const { session_id, retorno } = Route.useSearch();
  const buscarPedido = useServerFn(consultarPedido);
  const [pedido, setPedido] = useState(null);
  const [carregado, setCarregado] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erroConsulta, setErroConsulta] = useState("");
  // Apenas o retorno validado pelo servidor pode confirmar pagamento.
  const demonstracao = pedido?.demonstracao === true && pedido?.id === orderId;
  const pago = !demonstracao && pedido?.pagamento_status === "pago" && pedido?.__confirmadoServidor === true;

  useEffect(() => {
    if (/^SIM-[A-F0-9]{12}$/.test(orderId)) {
      try {
        const salvoDemo = window.sessionStorage.getItem(`doce-oficio:simulacao:${orderId}`);
        const pedidoDemo = salvoDemo ? JSON.parse(salvoDemo) : null;
        if (pedidoDemo?.demonstracao === true && pedidoDemo?.id === orderId) {
          setPedido({ ...pedidoDemo, __confirmadoServidor: false });
        }
      } catch {
        // A simulação só existe nesta aba; não há pedido no servidor.
      }
      setCarregado(true);
      return undefined;
    }
    try {
      const salvo = window.localStorage.getItem(`doce-oficio:pedido:${orderId}`);
      if (salvo) setPedido({ ...JSON.parse(salvo), pagamento_status: "pendente", __confirmadoServidor: false });
    } catch {
      /* sem resumo salvo neste navegador */
    }
    setCarregado(true);

    if (!session_id) return undefined;

    let ativo = true;
    (async () => {
      for (let tentativa = 0; tentativa < 24; tentativa += 1) {
        let resposta;
        try {
          resposta = await buscarPedido({ data: { id: orderId, sessao: session_id } });
        } catch {
          // A consulta pode falhar temporariamente; o usuário pode tentar de novo.
          if (!ativo) return;
        }
        if (!ativo) return;
        if (resposta?.pedido) {
          setPedido({ ...resposta.pedido, __confirmadoServidor: true });
          window.localStorage.setItem(
            `doce-oficio:pedido:${orderId}`,
            JSON.stringify({ ...resposta.pedido, pagamento_status: "pendente" })
          );
          if (resposta.pedido.pagamento_status === "pago") return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    })();

    return () => {
      ativo = false;
    };
  }, [orderId, session_id]);

  if (!carregado) return null;

  if (!pedido) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center lg:px-10">
        <h1 className="font-heading text-4xl font-light tracking-tight">Pedido ou simulação não encontrado</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          As compras simuladas ficam disponíveis somente nesta aba do navegador
          e não são registradas como pedidos reais. Para outra simulação, volte ao catálogo.
        </p>
        <Link
          to="/"
          hash="catalogo"
          className="mt-8 inline-flex items-center justify-center bg-primary px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-accent"
        >
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10 lg:py-20">
      <div className={`flex items-center gap-3 ${pago || demonstracao ? "text-primary" : "text-accent"}`}>
        {pago || demonstracao ? (
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Clock className="h-6 w-6" aria-hidden="true" />
        )}
        <p className="eyebrow">{demonstracao ? "Simulação concluída · Nenhuma cobrança" : pago ? "Pagamento confirmado" : "Aguardando pagamento"}</p>
      </div>

      <h1 className="mt-4 font-heading text-4xl font-light tracking-tight sm:text-5xl">
        {demonstracao ? "Compra simulada com sucesso." : pago ? "Pedido confirmado." : "Pedido registrado."}
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {demonstracao ? (
          <>
            Este é um <strong className="text-foreground">exemplo acadêmico</strong> de
            finalização de compra. O PagBank não foi acionado, não existe pagamento
            confirmado e nenhum pedido ou reserva foi criado no servidor.
          </>
        ) : pago ? (
          <>
            Pagamento confirmado pelo provedor e encomenda prevista para{" "}
            <strong className="text-foreground">{formatarData(pedido.data_desejada)}</strong>.
            Guarde o código <strong className="text-foreground">{pedido.codigo}</strong>.
          </>
        ) : (
          <>
            Estamos aguardando a confirmação do pagamento. Código{" "}
            <strong className="text-foreground">{pedido.codigo}</strong>. Se o pagamento não foi
            concluído, aguarde e confira o status antes de tentar comprar novamente.
          </>
        )}
      </p>

      {retorno === "falha" && !pago && !demonstracao && (
        <p className="mt-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          O checkout foi interrompido ou recusado. Nenhuma confirmação de pagamento foi recebida.
        </p>
      )}
      {retorno === "pendente" && !pago && !demonstracao && (
        <p className="mt-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Pagamento Pix pendente. Aguarde a confirmação automática do PagBank.
        </p>
      )}

      <div className="mt-10 border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <p className="eyebrow">Pedido</p>
            <p className="mt-1 font-heading text-2xl">{pedido.codigo}</p>
          </div>
          <span
            className={`border px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${classeStatus(pedido.status)}`}
          >
            {demonstracao ? "DEMONSTRAÇÃO" : rotuloStatus(pedido.status)}
          </span>
        </div>

        <ul className="divide-y divide-border px-6">
          {pedido.itens?.map((item) => (
            <li key={item.produto_id} className="flex items-center justify-between gap-4 py-4 text-sm">
              <span>
                {item.quantidade}× <span className="text-foreground">{item.nome}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatBRL(item.preco_unitario * item.quantidade)}
              </span>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-border px-6 py-5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatBRL(pedido.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{pedido.tipo_entrega === "entrega" ? "Taxa de entrega" : "Retirada no ateliê"}</span>
            <span className="tabular-nums">
              {pedido.taxa_entrega ? formatBRL(pedido.taxa_entrega) : "Grátis"}
            </span>
          </div>
          <div className="flex justify-between pt-2 font-heading text-xl text-foreground">
            <span>Total</span>
            <span className="tabular-nums">{formatBRL(pedido.total)}</span>
          </div>
        </div>

        <dl className="grid gap-4 border-t border-border px-6 py-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="eyebrow">Recebimento</dt>
            <dd className="mt-1">
              {pedido.tipo_entrega === "entrega" ? "Entrega" : "Retirada no ateliê"}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Data e período</dt>
            <dd className="mt-1">
              {formatarData(pedido.data_desejada)} · {pedido.periodo === "manha" ? "manhã" : "tarde"}
            </dd>
          </div>
          {pedido.endereco && (
            <div className="sm:col-span-2">
              <dt className="eyebrow">Endereço</dt>
              <dd className="mt-1">{pedido.endereco}</dd>
            </div>
          )}
          {pedido.observacoes && (
            <div className="sm:col-span-2">
              <dt className="eyebrow">Observações</dt>
              <dd className="mt-1">{pedido.observacoes}</dd>
            </div>
          )}
          <div>
            <dt className="eyebrow">Pagamento</dt>
            <dd className="mt-1">
              {demonstracao
                ? pedido.pagamento === "pix"
                  ? "Pix simulado — nenhum valor transferido"
                  : "Cartão simulado — nenhuma cobrança realizada"
                : pago
                ? pedido.pagamento === "pix"
                  ? "Pagamento por Pix confirmado"
                  : pedido.pagamento === "credito" || pedido.pagamento === "debito"
                    ? "Pagamento com cartão confirmado"
                    : "Pagamento online confirmado"
                : "Pix ou cartão — aguardando confirmação do PagBank"}
            </dd>
          </div>
        </dl>
      </div>

      {session_id && !pago && !demonstracao && (
        <div className="mt-6">
          <button
            type="button"
            disabled={atualizando}
            onClick={async () => {
              setAtualizando(true);
              setErroConsulta("");
              try {
                const resposta = await buscarPedido({ data: { id: orderId, sessao: session_id } });
                if (!resposta?.pedido) {
                  setErroConsulta("Não foi possível consultar o pedido. Confira o link da confirmação.");
                  return;
                }
                setPedido({ ...resposta.pedido, __confirmadoServidor: true });
                window.localStorage.setItem(
                  `doce-oficio:pedido:${orderId}`,
                  JSON.stringify({ ...resposta.pedido, pagamento_status: "pendente" })
                );
              } catch {
                setErroConsulta("Falha temporária. Tente consultar o pagamento novamente.");
              } finally {
                setAtualizando(false);
              }
            }}
            className="border border-foreground/25 px-5 py-3 text-xs uppercase tracking-[0.12em] hover:border-foreground/50 disabled:opacity-50"
          >
            {atualizando ? "Consultando..." : "Atualizar situação do pagamento"}
          </button>
          {erroConsulta && (
            <p role="alert" className="mt-3 text-sm text-destructive">{erroConsulta}</p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          to="/"
          hash="catalogo"
          className="inline-flex items-center justify-center border border-foreground/25 px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors hover:border-foreground/50 hover:text-accent"
        >
          Voltar ao catálogo
        </Link>
        <p className="px-2 py-4 text-xs text-muted-foreground">
          {demonstracao
            ? "Demonstração local para fins acadêmicos. Não envie dinheiro nem prepare a encomenda."
            : "Para dúvidas sobre a encomenda, utilize o canal de atendimento informado pelo estabelecimento."}
        </p>
      </div>
    </div>
  );
}