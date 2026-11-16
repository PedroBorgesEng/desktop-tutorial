import { createFileRoute } from "@tanstack/react-router";
import { criarPedido, esquemaReserva } from "@/lib/reservas.server";
import {
  configuracaoMercadoPago,
  criarPreferenciaMercadoPago,
} from "@/lib/mercadopago.server";

/** Recompõe o lote após uma falha de criação da preferência (best effort).
 * Antes de produção é indispensável controle transacional de concorrência.
 */
async function compensarFalha(base44, pedido) {
  try {
    const quantidade = new Map();
    for (const item of pedido.itens || []) {
      quantidade.set(item.produto_id,
        (quantidade.get(item.produto_id) || 0) + Number(item.quantidade));
    }
    await Promise.all([...quantidade].map(async ([id, qtd]) => {
      const produto = await base44.entities.Produto.get(id);
      if (produto?.estoque !== null &&
          produto?.estoque !== undefined &&
          produto?.estoque !== "") {
        await base44.entities.Produto.update(id, {
          estoque: Number(produto.estoque) + qtd,
        });
      }
    }));
    await base44.entities.Pedido.update(pedido.id, {
      status: "cancelado",
      pagamento_status: "cancelado",
    });
  } catch (e) {
    console.error("Falha ao compensar reserva. Verificar painel:", pedido.id, e?.message);
  }
}

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      GET: async () => {
        const status = configuracaoMercadoPago();
        return Response.json({
          provedor: "mercadopago",
          metodos: ["pix", "cartao"],
          habilitado: status.habilitado,
          modo: status.modo,
        });
      },

      POST: async ({ request, context }) => {
        // Sem conta/token + assinatura, nenhum pedido é criado.
        const config = configuracaoMercadoPago();
        if (!config.habilitado) {
          return Response.json({
            erro: "Pix e cartão estão sendo configurados. Ainda não é possível pagar neste site.",
          }, { status: 503 });
        }

        let corpo;
        try {
          corpo = await request.json();
        } catch {
          return Response.json({ erro: "JSON inválido." }, { status: 400 });
        }
        const validacao = esquemaReserva.safeParse(corpo);
        if (!validacao.success) {
          return Response.json({
            erro: "Dados inválidos.",
            detalhes: validacao.error.issues.map(i => ({
              campo: i.path.join("."), mensagem: i.message,
            })),
          }, { status: 400 });
        }

        const base44 = context.getBase44().asServiceRole;
        let pedido = null;
        try {
          pedido = await criarPedido(base44, validacao.data);
          const consultaToken = crypto.randomUUID();
          const checkout = await criarPreferenciaMercadoPago(pedido, consultaToken);
          await base44.entities.Pedido.update(pedido.id, {
            pagamento_gateway: "mercadopago",
            mercadopago_preference_id: checkout.id,
            consulta_token: consultaToken,
          });
          return Response.json({
            pedido: {
              ...pedido,
              pagamento_gateway: "mercadopago",
              mercadopago_preference_id: checkout.id,
              consulta_token: consultaToken,
            },
            url: checkout.url,
            modo: checkout.modo,
          }, { status: 201 });
        } catch (erro) {
          if (pedido?.id) await compensarFalha(base44, pedido);
          console.error("Checkout Mercado Pago:", erro?.message);
          return Response.json({
            erro: erro?.message || "Não foi possível iniciar o pagamento.",
          }, { status: 422 });
        }
      },
    },
  },
});
