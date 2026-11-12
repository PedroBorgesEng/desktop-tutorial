import { z } from "zod";
import { TAXA_ENTREGA } from "@/lib/pedido-constantes";

const itemSchema = z.object({
  produto_id: z.string().min(1).max(120),
  quantidade: z.number().int().min(1).max(99),
});

/** Contrato de entrada de uma reserva — usado pela server function e pelo endpoint /api/pedidos. */
export const esquemaReserva = z.object({
  nome_cliente: z.string().trim().min(2).max(120),
  telefone: z.string().trim().min(8).max(30),
  email: z.string().trim().max(160).optional(),
  tipo_entrega: z.enum(["retirada", "entrega"]),
  endereco: z.string().trim().max(240).optional(),
  data_desejada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodo: z.enum(["manha", "tarde"]),
  observacoes: z.string().trim().max(600).optional(),
  itens: z.array(itemSchema).min(1).max(40),
});

function gerarCodigo() {
  return `DO-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/**
 * Regra de negócio da reserva, no servidor:
 * relê os preços do catálogo (o navegador nunca define valores), valida
 * disponibilidade e grava o pedido com status "novo".
 */
export async function criarPedido(base44ServiceRole, dados) {
  if (dados.tipo_entrega === "entrega" && (dados.endereco || "").length < 10) {
    throw new Error("Informe o endereço completo para entrega.");
  }

  const hoje = new Date().toISOString().slice(0, 10);
  if (dados.data_desejada < hoje) {
    throw new Error("A data desejada não pode estar no passado.");
  }

  const quantidadeTotal = dados.itens.reduce((soma, item) => soma + item.quantidade, 0);
  if (quantidadeTotal > 200) {
    throw new Error("Quantidade acima do limite do lote. Fale com o ateliê.");
  }

  const ids = [...new Set(dados.itens.map((item) => item.produto_id))];
  const encontrados = await Promise.all(
    ids.map((id) =>
      base44ServiceRole.entities.Produto.get(id).catch((erro) => {
        if (erro?.status === 404) return null;
        throw erro;
      })
    )
  );
  const catalogo = new Map(encontrados.filter(Boolean).map((produto) => [produto.id, produto]));

  const itens = dados.itens.map((item) => {
    const produto = catalogo.get(item.produto_id);
    if (!produto || produto.disponivel === false) {
      throw new Error("Um dos itens da reserva não está mais disponível. Atualize o carrinho.");
    }
    return {
      produto_id: produto.id,
      nome: produto.nome,
      preco_unitario: Number(produto.preco),
      quantidade: item.quantidade,
    };
  });

  const subtotalBruto = itens.reduce((soma, item) => soma + item.preco_unitario * item.quantidade, 0);
  const subtotal = Number(subtotalBruto.toFixed(2));
  const taxa_entrega = dados.tipo_entrega === "entrega" ? TAXA_ENTREGA : 0;
  const total = Number((subtotal + taxa_entrega).toFixed(2));

  const pedido = await base44ServiceRole.entities.Pedido.create({
    codigo: gerarCodigo(),
    nome_cliente: dados.nome_cliente,
    telefone: dados.telefone,
    email: dados.email || "",
    tipo_entrega: dados.tipo_entrega,
    endereco: dados.tipo_entrega === "entrega" ? dados.endereco : "",
    data_desejada: dados.data_desejada,
    periodo: dados.periodo,
    observacoes: dados.observacoes || "",
    itens,
    subtotal,
    taxa_entrega,
    total,
    status: "novo",
    pagamento: "a_combinar",
  });

  return {
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
    itens,
    subtotal: pedido.subtotal,
    taxa_entrega: pedido.taxa_entrega,
    total: pedido.total,
    status: pedido.status,
    pagamento: pedido.pagamento,
  };
}