import { createFileRoute } from "@tanstack/react-router";
import { verificarAssinaturaStripe } from "@/lib/stripe.server";

const EVENTOS_PAGOS = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];

/**
 * POST /api/stripe-webhook — só um evento com assinatura válida e valor conferido
 * marca o pedido como pago.
 */
export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const payload = await request.text();
        const valido = await verificarAssinaturaStripe(
          payload,
          request.headers.get("stripe-signature")
        );
        if (!valido) return Response.json({ erro: "Assinatura inválida." }, { status: 400 });

        let evento;
        try {
          evento = JSON.parse(payload);
        } catch {
          return Response.json({ erro: "Payload inválido." }, { status: 400 });
        }

        if (!EVENTOS_PAGOS.includes(evento.type)) return Response.json({ recebido: true });

        const sessao = evento.data?.object || {};
        if (sessao.metadata?.base44_test_checkout === "true") return Response.json({ recebido: true });
        if (sessao.payment_status !== "paid") return Response.json({ recebido: true });

        const pedidoId = sessao.metadata?.pedido_id || sessao.client_reference_id;
        if (!pedidoId) return Response.json({ recebido: true });

        const base44 = context.getBase44().asServiceRole;
        try {
          const pedido = await base44.entities.Pedido.get(pedidoId);
          const esperado = Math.round(Number(pedido.total) * 100);
          if (Number(sessao.amount_total) !== esperado || (sessao.currency || "").toLowerCase() !== "brl") {
            console.error("stripe-webhook: valor divergente", pedidoId, sessao.amount_total, esperado);
            return Response.json({ recebido: true });
          }
          if (pedido.pagamento_status !== "pago") {
            await base44.entities.Pedido.update(pedidoId, {
              pagamento_status: "pago",
              pagamento: "online",
              stripe_session_id: sessao.id,
            });
          }
          return Response.json({ recebido: true });
        } catch (erro) {
          console.error("stripe-webhook:", erro?.message);
          return Response.json({ erro: "Falha ao processar o pagamento." }, { status: 500 });
        }
      },
    },
  },
});