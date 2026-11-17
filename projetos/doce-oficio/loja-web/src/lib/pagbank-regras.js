/**
 * Regras puras de confirmação. Nunca confie no status enviado pelo browser
 * ou no corpo do webhook: a rota consulta o Order autenticado no PagBank.
 */
export function conferirPagamentoPagBank(order, pedido, referenciaComprovada) {
  if (!order || !pedido || !/^ORDE_[A-Za-z0-9-]{5,100}$/.test(String(order.id || ""))) {
    return null;
  }
  if (String(referenciaComprovada || "") !== String(pedido.id || "")) return null;
  if (order.reference_id && String(order.reference_id) !== String(pedido.id)) return null;

  const amount = Number(pedido.total) * 100;
  if (!Number.isFinite(amount) || amount <= 0 ||
      Math.abs(Math.round(amount) - amount) > 1e-6) return null;
  const expected = Math.round(amount);

  const paid = Array.isArray(order.charges)
    ? order.charges.filter(c => c.status === "PAID")
    : [];
  if (paid.length === 0) return null;
  // Não ignore outra cobrança paga com moeda/tipo desconhecido:
  // a soma tem de refletir todos os pagamentos capturados.
  if (paid.some(c => c.amount?.currency !== "BRL" ||
      !["PIX", "CREDIT_CARD"].includes(c.payment_method?.type) ||
      !Number.isInteger(c.amount?.value) || c.amount.value <= 0)) {
    return null;
  }
  const paidTotal = paid.reduce((sum, charge) => sum + charge.amount.value, 0);
  if (paidTotal !== expected) return null;
  return {
    pagamento: paid.some(c => c.payment_method.type === "PIX") ? "pix" : "credito",
    pagbank_order_id: order.id,
  };
}
