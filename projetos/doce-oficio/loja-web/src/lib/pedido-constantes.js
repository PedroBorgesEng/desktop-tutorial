export const TAXA_ENTREGA = 12;

export const TIPOS_ENTREGA = [
  { value: "retirada", label: "Retirada no ateliê", ajuda: "Sem taxa · endereço a confirmar" },
  { value: "entrega", label: "Entrega sob disponibilidade", ajuda: "Taxa demonstrativa; confirme a região atendida" },
];

export const PERIODOS = [
  { value: "manha", label: "Manhã (10h às 13h)" },
  { value: "tarde", label: "Tarde (13h às 18h)" },
];

export const STATUS_PEDIDO = [
  { value: "novo", label: "Novo", classe: "bg-yellow-100 text-yellow-900 border-yellow-300" },
  { value: "confirmado", label: "Confirmado", classe: "bg-blue-100 text-blue-900 border-blue-300" },
  { value: "pronto", label: "Pronto", classe: "bg-purple-100 text-purple-900 border-purple-300" },
  { value: "entregue", label: "Entregue", classe: "bg-primary/15 text-primary border-primary/30" },
  { value: "cancelado", label: "Cancelado", classe: "bg-red-100 text-red-900 border-red-300" },
];

export const PAGAMENTOS = [
  { value: "online", label: "Online (cartão)" },
  { value: "a_combinar", label: "A combinar" },
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "debito", label: "Cartão de débito" },
  { value: "credito", label: "Cartão de crédito" },
];

export const PAGAMENTO_STATUS = [
  { value: "pendente", label: "Aguardando", classe: "bg-yellow-100 text-yellow-900 border-yellow-300" },
  { value: "pago", label: "Pago", classe: "bg-primary/15 text-primary border-primary/30" },
  { value: "cancelado", label: "Cancelado", classe: "bg-red-100 text-red-900 border-red-300" },
];

export function rotuloPagamentoStatus(valor) {
  return PAGAMENTO_STATUS.find((p) => p.value === valor)?.label || "Aguardando";
}

export function classePagamentoStatus(valor) {
  return PAGAMENTO_STATUS.find((p) => p.value === valor)?.classe || "bg-muted text-foreground";
}

export function rotuloStatus(valor) {
  return STATUS_PEDIDO.find((s) => s.value === valor)?.label || valor;
}

export function classeStatus(valor) {
  return STATUS_PEDIDO.find((s) => s.value === valor)?.classe || "bg-muted text-foreground";
}