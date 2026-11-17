/**
 * Livro-razão de disponibilidade. Produto.estoque é a capacidade remanescente
 * LEGADA do lote; apenas pedidos da versão ledger_v2 entram no cálculo, pois
 * os pedidos anteriores já baixavam o campo físico diretamente.
 *
 * Reservas pendentes contam até vencerem; pedidos pagos contam até revisão
 * manual do lote. Não há dupla baixa nem devolução cega de estoque.
 *
 * IMPORTANTE: duas requisições simultâneas ainda podem ler o mesmo saldo.
 * Sem reserva transacional/CAS no armazenamento, NÃO liberar produção.
 */
export const MODELO_ESTOQUE = "ledger_v2";
export const RESERVA_MS = 2 * 60 * 60 * 1000;
const LIMITE_CONSULTA_SEGURA = 400;

export function reservaContaNoEstoque(pedido, nowMs = Date.now()) {
  if (pedido?.estoque_modelo !== MODELO_ESTOQUE) return false;
  if (pedido.pagamento_status === "pago") return true;
  if (pedido.pagamento_status !== "pendente" || pedido.status === "cancelado") return false;
  const fim = Date.parse(String(pedido.reserva_expira_em || ""));
  return Number.isFinite(fim) && fim > nowMs;
}

export function unidadesOcupadas(pedidos, nowMs = Date.now()) {
  const total = new Map();
  for (const pedido of pedidos || []) {
    if (!reservaContaNoEstoque(pedido, nowMs)) continue;
    for (const item of pedido.itens || []) {
      const qtd = Number(item.quantidade);
      if (!item.produto_id || !Number.isInteger(qtd) || qtd < 1) {
        throw new Error("Reserva inválida; é necessária revisão administrativa.");
      }
      total.set(item.produto_id, (total.get(item.produto_id) || 0) + qtd);
    }
  }
  return total;
}

export async function obterUnidadesOcupadas(base44, nowMs = Date.now()) {
  const page = await base44.entities.Pedido.filter(
    { estoque_modelo: MODELO_ESTOQUE },
    { limit: LIMITE_CONSULTA_SEGURA }
  );
  const pedidos = page?.items;
  if (!Array.isArray(pedidos) || pedidos.length >= LIMITE_CONSULTA_SEGURA ||
      Boolean(page?.has_more || page?.next_cursor || page?.nextCursor)) {
    // Fail closed se uma página truncar: nunca declarar estoque sobrando
    // com histórico de reservas incompleto.
    throw new Error("Não foi possível conferir todas as reservas; contate o ateliê.");
  }
  return unidadesOcupadas(pedidos, nowMs);
}

/** Calcula a disponibilidade exibida no catálogo, sem expor pedidos. */
export async function aplicarDisponibilidadeCatalogo(base44, produtos, nowMs = Date.now()) {
  const ocupadas = await obterUnidadesOcupadas(base44, nowMs);
  return produtos.map(produto => {
    if (produto.estoque === undefined || produto.estoque === null || produto.estoque === "") return produto;
    const bruto = Number(produto.estoque);
    return {
      ...produto,
      estoque: Number.isFinite(bruto)
        ? Math.max(0, bruto - (ocupadas.get(produto.id) || 0))
        : 0,
    };
  });
}

export async function validarDisponibilidade(base44, itens, nowMs = Date.now()) {
  const ocupadas = await obterUnidadesOcupadas(base44, nowMs);
  const desejadas = new Map();
  for (const item of itens) {
    const qtd = Number(item.quantidade);
    if (!item.produto_id || !Number.isInteger(qtd) || qtd < 1) {
      throw new Error("Quantidade de reserva inválida.");
    }
    desejadas.set(item.produto_id, (desejadas.get(item.produto_id) || 0) + qtd);
  }
  for (const [id, quantidade] of desejadas) {
    const produto = await base44.entities.Produto.get(id);
    if (!produto || produto.disponivel === false) {
      throw new Error("Produto indisponível; atualize o carrinho.");
    }
    const bruto = produto.estoque;
    if (bruto === undefined || bruto === null || bruto === "") continue;
    const capacidade = Number(bruto);
    if (!Number.isInteger(capacidade) || capacidade < 0) {
      throw new Error("Estoque do lote inválido; contate o ateliê.");
    }
    const restante = capacidade - (ocupadas.get(id) || 0);
    if (quantidade > restante) {
      throw new Error(restante > 0
        ? `Restam ${restante} unidade(s) de ${produto.nome} neste lote.`
        : `${produto.nome} está esgotado neste lote.`);
    }
  }
  return { itensVerificados: desejadas.size };
}
