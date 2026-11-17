/**
 * Simulação acadêmica, SEM PagBank, persistência remota, estoque ou confirmação
 * financeira. O resultado é guardado somente em sessionStorage no navegador.
 */
export function montarCompraDemonstrativa({ form, itens, taxaEntrega, metodo, uuid }) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error("Adicione um produto ao carrinho para simular a compra.");
  }
  if (form?.tipo_entrega === "entrega" && String(form.endereco || "").trim().length < 10) {
    throw new Error("Informe um endereço demonstrativo completo para a entrega.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(form?.data_desejada || ""))) {
    throw new Error("Escolha uma data válida para a encomenda.");
  }
  if (!["pix", "credito"].includes(metodo)) {
    throw new Error("Selecione Pix ou cartão de crédito para a simulação.");
  }
  if (typeof uuid !== "string" || !/^[0-9a-fA-F-]{20,50}$/.test(uuid)) {
    throw new Error("Não foi possível gerar o identificador demonstrativo.");
  }

  const itensPedido = itens.map(item => {
    const preco = Number(item.preco);
    const quantidade = Number(item.quantidade);
    if (!item.id || !Number.isInteger(quantidade) || quantidade < 1 ||
        !Number.isFinite(preco) || preco <= 0) {
      throw new Error("Item do carrinho inválido para demonstração.");
    }
    return {
      produto_id: String(item.id),
      nome: String(item.nome || "Doce artesanal"),
      preco_unitario: preco,
      quantidade,
    };
  });
  const subtotal = Number(itensPedido.reduce(
    (soma, item) => soma + item.preco_unitario * item.quantidade, 0
  ).toFixed(2));
  const entrega = form.tipo_entrega === "entrega" ? Number(taxaEntrega) : 0;
  if (!Number.isFinite(entrega) || entrega < 0) {
    throw new Error("Taxa de entrega inválida.");
  }
  const id = "SIM-" + uuid.replace(/-/g, "").slice(0, 12).toUpperCase();
  return {
    id,
    codigo: id,
    demonstracao: true,
    nome_cliente: "Cliente de demonstração",
    telefone: "",
    email: "",
    endereco: form.tipo_entrega === "entrega" ? "Endereço demonstrativo (não enviado)" : "",
    tipo_entrega: form.tipo_entrega,
    data_desejada: form.data_desejada,
    periodo: form.periodo,
    observacoes: "",
    itens: itensPedido,
    subtotal,
    taxa_entrega: entrega,
    total: Number((subtotal + entrega).toFixed(2)),
    status: "novo",
    pagamento: metodo,
    pagamento_status: "pendente",
  };
}
