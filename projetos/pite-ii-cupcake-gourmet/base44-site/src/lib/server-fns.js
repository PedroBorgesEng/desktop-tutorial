import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { criarPedido, esquemaReserva } from "@/lib/reservas.server";

export const getServerInfo = createServerFn({ method: "GET" }).handler(async () => ({
  renderedAt: new Date().toISOString(),
}));

export const listarProdutos = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const base44 = context.getBase44();
  const pagina = await base44.entities.Produto.filter(
    { disponivel: true },
    { sort: "nome", limit: 100 }
  );
  return { produtos: pagina.items };
});

export const buscarProduto = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    try {
      const produto = await base44.entities.Produto.get(data.id);
      return { produto: produto?.disponivel === false ? null : produto };
    } catch (erro) {
      if (erro?.status === 404) return { produto: null };
      throw erro;
    }
  });

/**
 * Endpoint público de reserva: o cliente final não cria conta.
 * Preços e total são calculados no servidor a partir do catálogo.
 */
export const criarReserva = createServerFn({ method: "POST" })
  .validator(esquemaReserva)
  .handler(async ({ data, context }) => {
    const pedido = await criarPedido(context.getBase44().asServiceRole, data);
    return { pedido };
  });