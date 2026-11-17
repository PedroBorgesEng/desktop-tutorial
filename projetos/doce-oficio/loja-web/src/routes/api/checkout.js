import { createFileRoute } from "@tanstack/react-router";
import { criarPedido, esquemaReserva } from "@/lib/reservas.server";
import { validarDisponibilidade } from "@/lib/estoque-ledger.server";
import { criarCheckoutPagBank, statusPagBank } from "@/lib/pagbank.server";

/**
 * Cancelamento de pedido provisório se não foi possível criar checkout.
 * Estoque não é mais baixado antes do pagamento.
 */
async function compensarErro(base44, pedido) {
  if (!pedido?.id) return;
  try {
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
      GET: async ({ context }) => {
        const config = statusPagBank();
        let habilitado = config.enabled;
        if (config.mode === "teste") {
          try {
            const usuario = await context.getBase44().auth.me();
            habilitado = Boolean(usuario?.role === "admin");
          } catch {
            habilitado = false;
          }
        }
        return Response.json({
          provedor: "pagbank",
          metodos: ["pix", "cartao"],
          habilitado,
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
        // Sandbox é exclusivo do administrador: impede que visitantes
        // criem pagamentos de teste falsos e ocupem reservas do catálogo.
        if (config.mode === "teste") {
          let usuario;
          try { usuario = await context.getBase44().auth.me(); } catch { /* não autenticado */ }
          if (usuario?.role !== "admin") {
            return Response.json({
              erro: "Checkout de testes disponível somente ao administrador autenticado.",
            }, { status: 403 });
          }
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
        let checkout;
        try {
          pedido = await criarPedido(base44, result.data);
          // Segunda verificação após registrar a reserva; reduz colisões
          // simples, mas não substitui uma transação atômica no banco.
          await validarDisponibilidade(base44, pedido.itens);
          const tokenConsulta = crypto.randomUUID();
          checkout = await criarCheckoutPagBank(pedido, tokenConsulta);
          await base44.entities.Pedido.update(pedido.id, {
            pagamento_gateway: "pagbank",
            pagbank_checkout_id: checkout.id,
            pagbank_env: checkout.mode,
            reserva_expira_em: checkout.expirationDate,
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
          if (pedido && !checkout) await compensarErro(base44, pedido);
          // Um checkout remoto já criado não deve ser cancelado localmente
          // sem primeiro inativar o checkout na API do PagBank.
          if (pedido && checkout) {
            console.error("RECONCILIACAO_PAGBANK", pedido.id, checkout.id);
          }
          console.error("Checkout PagBank:", error?.message);
          return Response.json({
            erro: error?.message || "Falha ao iniciar pagamento. Tente novamente.",
          }, { status: 422 });
        }
      },
    },
  },
});
