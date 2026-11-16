import { createFileRoute } from "@tanstack/react-router";
import {
  configuracaoMercadoPago,
  consultarPagamentoMercadoPago,
  validarWebhookMercadoPago,
} from "@/lib/mercadopago.server";

/**
 * O status "pago" NUNCA é definido a partir de um redirect do navegador.
 * Apenas notificações autenticadas + consulta à API do provedor podem confirmá-lo.
 */
export const Route = createFileRoute("/api/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("data.id") || url.searchParams.get("id");
        if (!id || !/^\d{4,30}$/.test(id)) {
          return Response.json({ erro: "Notificação inválida." }, { status: 400 });
        }

        const xSignature = request.headers.get("x-signature") || "";
        const requestId = request.headers.get("x-request-id") || "";
        if (!await validarWebhookMercadoPago(id, xSignature, requestId)) {
          return Response.json({ erro: "Assinatura não reconhecida." }, { status: 401 });
        }

        let payload;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ erro: "JSON inválido." }, { status: 400 });
        }
        const tipo = payload?.type || payload?.topic || url.searchParams.get("type");
        if (tipo !== "payment") return Response.json({ recebido: true });
        if (payload?.data?.id && String(payload.data.id) !== id) {
          return Response.json({ erro: "Identificador divergente." }, { status: 400 });
        }

        try {
          const pagamento = await consultarPagamentoMercadoPago(id);
          const config = configuracaoMercadoPago();
          // Nunca confiar no valor, status, referência ou modo somente do corpo do webhook.
          if (typeof pagamento.live_mode === "boolean" && pagamento.live_mode !== config.live) {
            console.error("Webhook MP: ambiente divergente", id);
            return Response.json({ recebido: true });
          }
          if (pagamento.status !== "approved") return Response.json({ recebido: true });

          const pedidoId = String(pagamento.external_reference || "");
          if (!pedidoId) return Response.json({ recebido: true });

          const base44 = context.getBase44().asServiceRole;
          const pedido = await base44.entities.Pedido.get(pedidoId);
          if (pedido?.pagamento_gateway !== "mercadopago" ||
              pedido?.pagamento_status === "cancelado" ||
              pedido?.status === "cancelado") {
            console.error("Webhook MP: pedido não corresponde ou cancelado", pedidoId);
            return Response.json({ recebido: true });
          }

          const esperado = Math.round(Number(pedido.total) * 100);
          const recebido = Math.round(Number(pagamento.transaction_amount) * 100);
          if (!Number.isFinite(esperado) || esperado <= 0 ||
              recebido !== esperado || pagamento.currency_id !== "BRL") {
            console.error("Webhook MP: valor/moeda divergente", pedidoId);
            return Response.json({ recebido: true });
          }

          if (pedido.pagamento_status !== "pago") {
            const meio = pagamento.payment_method_id === "pix" ? "pix" :
              pagamento.payment_type_id === "credit_card" ? "credito" :
              pagamento.payment_type_id === "debit_card" ? "debito" : "online";
            await base44.entities.Pedido.update(pedidoId, {
              pagamento_status: "pago",
              pagamento: meio,
              mercadopago_payment_id: String(pagamento.id),
            });
          }
          return Response.json({ recebido: true });
        } catch (erro) {
          console.error("Falha ao processar notificação MP:", erro?.message);
          // Não enviar 200 se erro no provedor/banco; Mercado Pago pode reenviar.
          return Response.json({ erro: "Erro temporário de processamento." }, { status: 500 });
        }
      },
    },
  },
});
