import { createFileRoute } from "@tanstack/react-router";
import { criarPedido, esquemaReserva } from "@/lib/reservas.server";

/**
 * POST /api/pedidos — registra uma reserva (JSON).
 * Endpoint público: o cliente final não cria conta. O servidor relê os preços do
 * catálogo e calcula o total; o navegador nunca envia valores.
 */
export const Route = createFileRoute("/api/pedidos")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
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

        try {
          const pedido = await criarPedido(context.getBase44().asServiceRole, validacao.data);
          return Response.json({ pedido }, { status: 201 });
        } catch (erro) {
          return Response.json(
            { erro: erro?.message || "Não foi possível registrar o pedido." },
            { status: 422 }
          );
        }
      },
    },
  },
});