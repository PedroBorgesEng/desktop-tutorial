import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint público do catálogo (JSON).
 * Lê apenas produtos disponíveis — a leitura da entidade é pública; a escrita é restrita ao ateliê.
 */
export const Route = createFileRoute("/api/catalogo")({
  server: {
    handlers: {
      GET: async ({ context }) => {
        const base44 = context.getBase44();
        const pagina = await base44.entities.Produto.filter(
          { disponivel: true },
          { sort: "nome", limit: 100 }
        );

        return Response.json({
          total: pagina.items.length,
          produtos: pagina.items.map((produto) => ({
            id: produto.id,
            nome: produto.nome,
            categoria: produto.categoria,
            preco: produto.preco,
            resumo: produto.resumo,
            imagem_url: produto.imagem_url,
          })),
        });
      },
    },
  },
});