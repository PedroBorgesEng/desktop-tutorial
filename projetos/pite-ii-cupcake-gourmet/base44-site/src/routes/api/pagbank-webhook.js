import { createFileRoute } from "@tanstack/react-router";
import {
  statusPagBank,
  validarAssinaturaPagBank,
  consultarCheckoutPagBank,
  consultarPedidoPagBank,
} from "@/lib/pagbank.server";

/**
 * Notificações PagBank:
 * 1. verifica ECDSA SHA-256 sobre corpo bruto;
 * 2. consulta o checkout/pedido autenticado na API PagBank;
 * 3. confere referência, valor, moeda e tipo de pagamento;
 * 4. apenas então marca pagamento "pago".
 *
 * O retorno do navegador nunca autoriza uma alteração financeira.
 */
export const Route = createFileRoute("/api/pagbank-webhook")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        if (!statusPagBank().enabled) {
          return Response.json({ erro: "PagBank ainda não configurado." }, { status: 503 });
        }
        const raw = await request.text();
        const signed = request.headers.get("x-payload-signature");
        if (!signed || !(await validarAssinaturaPagBank(raw, signed))) {
          return Response.json({ erro: "Assinatura inválida." }, { status: 401 });
        }
        let event;
        try { event = JSON.parse(raw); } catch {
          return Response.json({ erro: "JSON inválido." }, { status: 400 });
        }
        const eventId = String(event?.id || "");
        if (!/^(CHEC|ORDE)_[A-Za-z0-9-]{5,100}$/.test(eventId)) {
          return Response.json({ recebido: true });
        }

        try {
          let checkout = null;
          const orders = [];
          if (eventId.startsWith("CHEC_")) {
            checkout = await consultarCheckoutPagBank(eventId);
            // PagBank pode informar pedidos vinculados à consulta do checkout.
            const related = Array.isArray(checkout?.orders) ? checkout.orders : [];
            for (const item of related) {
              const id = typeof item === "string" ? item : item?.id;
              if (typeof id === "string" && /^ORDE_[A-Za-z0-9-]{5,100}$/.test(id)) {
                orders.push(id);
              }
            }
          } else {
            orders.push(eventId);
          }

          for (const id of orders) {
            // A consulta autenticada é a fonte de verdade, NÃO o webhook recebido.
            const remote = await consultarPedidoPagBank(id);
            const pedidoId = String(remote?.reference_id || checkout?.reference_id || "");
            if (!pedidoId || (checkout && checkout.reference_id !== pedidoId)) continue;
            const base44 = context.getBase44().asServiceRole;
            const pedido = await base44.entities.Pedido.get(pedidoId);
            if (!pedido || pedido.pagamento_gateway !== "pagbank" ||
                !pedido.pagbank_checkout_id ||
                pedido.pagbank_env !== statusPagBank().mode ||
                pedido.status === "cancelado" ||
                pedido.pagamento_status === "cancelado" ) {
              continue;
            }
            if (checkout && pedido.pagbank_checkout_id !== checkout.id) continue;
            if (pedido.pagamento_status === "pago") continue; // Evento repetido

            const charges = Array.isArray(remote?.charges) ? remote.charges : [];
            const paid = charges.filter(c => c.status === "PAID" &&
              c.amount?.currency === "BRL" &&
              ["PIX", "CREDIT_CARD"].includes(c.payment_method?.type));
            const received = paid.reduce((s, c) => s + Number(c.amount.value), 0);
            const expected = Math.round(Number(pedido.total) * 100);
            if (!Number.isInteger(expected) || expected <= 0 ||
                !Number.isInteger(received) || received !== expected) {
              continue;
            }
            const method = paid.some(c => c.payment_method?.type === "PIX") ? "pix" : "credito";
            await base44.entities.Pedido.update(pedidoId, {
              pagamento_status: "pago",
              pagamento: method,
              pagbank_order_id: String(remote.id),
            });
          }
          return Response.json({ recebido: true });
        } catch (error) {
          console.error("Falha transitória ao verificar pagamento PagBank:", error?.message);
          return Response.json({ erro: "Falha temporária." }, { status: 500 });
        }
      },
    },
  },
});
