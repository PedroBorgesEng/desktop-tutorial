import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { esquemaReserva } from "@/lib/reservas.server";

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
  .handler(async () => {
    throw new Error("Rota antiga desativada: finalize a compra pelo checkout.");
  });

/**
 * Consulta o pedido pelo id + sessão de checkout: é assim que a página de
 * confirmação mostra o resumo em outro navegador, sem abrir a listagem.
 */
export const consultarPedido = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1).max(120), sessao: z.string().min(1).max(200) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44().asServiceRole;
    try {
      const pedido = await base44.entities.Pedido.get(data.id);
      if (!pedido || !(
        (pedido.mercadopago_preference_id && pedido.consulta_token === data.sessao) ||
        (pedido.stripe_session_id && pedido.stripe_session_id === data.sessao)
      )) {
        return { pedido: null };
      }
      return {
        pedido: {
          id: pedido.id,
          codigo: pedido.codigo,
          nome_cliente: pedido.nome_cliente,
          telefone: pedido.telefone,
          email: pedido.email,
          tipo_entrega: pedido.tipo_entrega,
          endereco: pedido.endereco,
          data_desejada: pedido.data_desejada,
          periodo: pedido.periodo,
          observacoes: pedido.observacoes,
          itens: pedido.itens,
          subtotal: pedido.subtotal,
          taxa_entrega: pedido.taxa_entrega,
          total: pedido.total,
          status: pedido.status,
          pagamento: pedido.pagamento,
          pagamento_status: pedido.pagamento_status,
        },
      };
    } catch (erro) {
      if (erro?.status === 404) return { pedido: null };
      throw erro;
    }
  });