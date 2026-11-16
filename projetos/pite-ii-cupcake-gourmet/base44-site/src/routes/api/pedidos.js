import { createFileRoute } from "@tanstack/react-router";

/**
 * Rota antiga de reservas: desativada para impedir a criação de pedidos sem checkout.
 * O cliente deve utilizar POST /api/checkout (Pix ou cartão pelo Mercado Pago).
 */
export const Route = createFileRoute("/api/pedidos")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          { erro: "Rota descontinuada. Use /api/checkout para iniciar o pagamento." },
          { status: 410 }
        ),
    },
  },
});
