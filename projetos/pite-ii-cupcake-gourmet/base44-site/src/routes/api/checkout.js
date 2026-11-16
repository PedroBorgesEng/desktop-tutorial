import { createFileRoute } from "@tanstack/react-router";
import { criarPedido, esquemaReserva } from "@/lib/reservas.server";
import { criarCheckoutPagBank, statusPagBank } from "@/lib/pagbank.server";

/**
 * Compensação de erro de checkout; não substitui transação de estoque.
 * Não habilitar vendas reais antes de testar concorrência e expiração.
 */
async function compensarErro(base44, pedido) {
  if (!pedido?.id) return;
  try {
    const quantidades = new Map();
    for (const item of pedido.itens || []) {
      quantidades.set(item.produto_id,
        (quantidades.get(item.produto_id) || 0) + Number(item.quantidade));
    }
    for (const [id, qtd] of quantidades) {
      const produto = await base44.entities.Produto.get(id);
      if (produto?.estoque !== null &&
          produto?.estoque !== undefined && produto?.estoque !== "") {
        await base44.entities.Produto.update(id, {
          estoque: Number(produto.estoque) + qtd,
        });
      }
    }
    await base44.entities.Pedido.update(pedido.id, {
      status: "cancelado",
      pagamento_status: "cancelado",
    });
  } catch (error) {
    console.error("Erro ao reverter checkout incompleto", pedido.id, error?.message);
  }
}

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      GET: async () => {
        const config = statusPagBank();
        return Response.json({
          provedor: "pagbank",
          metodos: ["pix", "cartao"],
          habilitado: config.enabled,
          modo: config.mode,
        }, { headers: { "Cache-Control": "no-store" } });
      },
      POST: async ({ request, context }) => {
        const config = statusPagBank();
        // Bloqueio ANTES de qualquer persistência ou reserva de estoque.
        if (!config.enabled) {
          return Response.json({
            erro: "Pix e cartão pelo PagBank ainda não estão disponíveis. Aguardando ativação da conta.",
          }, { status: 503 });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return Response.json({ erro: "JSON inválido." }, { status: 400 });
        }
        const result = esquemaReserva.safeParse(raw);
        if (!result.success) {
          return Response.json({
            erro: "Dados inválidos.",
            detalhes: result.error.issues.map(issue => ({
              campo: issue.path.join("."), mensagem: issue.message,
            })),
          }, { status: 400 });
        }
        const base44 = context.getBase44().asServiceRole;
        let pedido;
        try {
          pedido = await criarPedido(base44, result.data);
          const tokenConsulta = crypto.randomUUID();
          const checkout = await criarCheckoutPagBank(pedido, tokenConsulta);
          await base44.entities.Pedido.update(pedido.id, {
            pagamento_gateway: "pagbank",
            pagbank_checkout_id: checkout.id,
            pagbank_env: checkout.mode,
            consulta_token: tokenConsulta,
          });
          return Response.json({
            url: checkout.url,
            modo: checkout.mode,
            pedido: {
              ...pedido,
              pagamento_gateway: "pagbank",
              pagbank_checkout_id: checkout.id,
              pagbank_env: checkout.mode,
              consulta_token: tokenConsulta,
            },
          }, { status: 201 });
        } catch (error) {
          if (pedido) await compensarErro(base44, pedido);
          console.error("Checkout PagBank:", error?.message);
          return Response.json({
            erro: error?.message || "Falha ao iniciar pagamento. Tente novamente.",
          }, { status: 422 });
        }
      },
    },
  },
});
