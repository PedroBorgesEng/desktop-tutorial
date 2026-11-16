import { createFileRoute } from "@tanstack/react-router";
import { criarPedido, esquemaReserva } from "@/lib/reservas.server";
import { criarSessaoCheckout } from "@/lib/stripe.server";

/**
 * POST /api/checkout — pedido público com pagamento online.
 * O servidor relê o catálogo, aplica lote/prazo, grava o pedido e abre o checkout do Stripe.
 */
export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        // Redirecionamentos Stripe nunca devem usar um domínio fornecido pelo cliente.
        const origem = "https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app";

        let corpo;
        try {
          corpo = await request.json();
        } catch {
          return Response.json({ erro: "Corpo da requisição não é um JSON válido." }, { status: 400 });
        }

        const validacao = esquemaReserva.safeParse(corpo);
        if (!validacao.success) {
          return Response.json(
            {
              erro: "Dados inválidos.",
              detalhes: validacao.error.issues.map((issue) => ({
                campo: issue.path.join("."),
                mensagem: issue.message,
              })),
            },
            { status: 400 }
          );
        }

        const base44 = context.getBase44().asServiceRole;

        try {
          const pedido = await criarPedido(base44, validacao.data);
          const sessao = await criarSessaoCheckout({ pedido, origem });
          await base44.entities.Pedido.update(pedido.id, { stripe_session_id: sessao.id });
          return Response.json({
            pedido: { ...pedido, stripe_session_id: sessao.id },
            url: sessao.url,
          });
        } catch (erro) {
          console.error("checkout:", erro?.message);
          return Response.json(
            { erro: erro?.message || "Não foi possível iniciar o pagamento." },
            { status: 422 }
          );
        }
      },
    },
  },
});