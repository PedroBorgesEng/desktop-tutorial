import { createFileRoute } from "@tanstack/react-router";
import { conferirPagamentoPagBank } from "@/lib/pagbank-regras";
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

          // Só encerrar automaticamente checkout expirado quando a própria
          // API confirmar a expiração e não houver pagamentos associados.
          // A reserva também deixa de contar após seu horário limite local.
          if (checkout?.status === "EXPIRED" && orders.length === 0 && checkout.reference_id) {
            const base44 = context.getBase44().asServiceRole;
            const pedidoExpirado = await base44.entities.Pedido.get(String(checkout.reference_id));
            if (pedidoExpirado?.pagbank_checkout_id === checkout.id &&
                pedidoExpirado?.pagamento_gateway === "pagbank" &&
                pedidoExpirado?.pagamento_status === "pendente") {
              await base44.entities.Pedido.update(pedidoExpirado.id, {
                status: "cancelado",
                pagamento_status: "cancelado",
              });
            }
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
                pedido.pagbank_env !== statusPagBank().mode) {
              continue;
            }
            if (checkout && pedido.pagbank_checkout_id !== checkout.id) continue;
            if (pedido.pagamento_status === "pago") continue; // Evento repetido

            const confirmacao = conferirPagamentoPagBank(remote, pedido, pedidoId);
            if (!confirmacao) continue;
            // Não ignorar fundos efetivamente capturados se o pedido foi
            // cancelado localmente: recuperar para revisão de atendimento.
            if (pedido.status === "cancelado" || pedido.pagamento_status === "cancelado") {
              console.error("PAGAMENTO_APOS_CANCELAMENTO_REVISAR", pedidoId);
            }
            await base44.entities.Pedido.update(pedidoId, {
              pagamento_status: "pago",
              ...confirmacao,
              ...(pedido.status === "cancelado" ? { status: "novo" } : {}),
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
