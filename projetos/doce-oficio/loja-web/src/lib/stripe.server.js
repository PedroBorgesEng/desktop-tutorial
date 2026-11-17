import { secrets } from "base44:runtime";

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_VERSION = "2025-10-29.clover";

function appId() {
  return globalThis.process?.env?.BASE44_APP_ID || "";
}

async function chamarStripe(caminho, parametros) {
  const chave = secrets.get("STRIPE_SECRET_KEY");
  if (!chave) throw new Error("Pagamento ainda não está configurado.");

  const resposta = await fetch(`${STRIPE_API}${caminho}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chave}`,
      "Stripe-Version": STRIPE_VERSION,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: parametros,
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    console.error("Stripe error:", dados?.error?.message);
    throw new Error("Não foi possível iniciar o pagamento. Tente novamente.");
  }
  return dados;
}

/**
 * Cria a sessão de checkout a partir do pedido gravado no banco.
 * Os valores vêm sempre do servidor — o navegador não envia preço nem total.
 */
export async function criarSessaoCheckout({ pedido, origem }) {
  const base = origem.replace(/\/$/, "");
  const parametros = new URLSearchParams();

  parametros.set("mode", "payment");
  parametros.append("payment_method_types[]", "card");
  parametros.set("locale", "pt-BR");
  parametros.set("client_reference_id", pedido.id);
  parametros.set("metadata[pedido_id]", pedido.id);
  const id = appId();
  if (id) parametros.set("metadata[base44_app_id]", id);
  if (pedido.email) parametros.set("customer_email", pedido.email);
  parametros.set("success_url", `${base}/pedido/${pedido.id}?session_id={CHECKOUT_SESSION_ID}`);
  parametros.set("cancel_url", `${base}/carrinho`);

  const linhas = [
    ...pedido.itens.map((item) => ({
      nome: item.nome,
      valor: Math.round(Number(item.preco_unitario) * 100),
      quantidade: item.quantidade,
    })),
  ];
  if (Number(pedido.taxa_entrega) > 0) {
    linhas.push({
      nome: "Taxa de entrega",
      valor: Math.round(Number(pedido.taxa_entrega) * 100),
      quantidade: 1,
    });
  }

  linhas.forEach((linha, indice) => {
    parametros.set(`line_items[${indice}][quantity]`, String(linha.quantidade));
    parametros.set(`line_items[${indice}][price_data][currency]`, "brl");
    parametros.set(`line_items[${indice}][price_data][unit_amount]`, String(linha.valor));
    parametros.set(`line_items[${indice}][price_data][product_data][name]`, linha.nome);
  });

  const sessao = await chamarStripe("/checkout/sessions", parametros);
  return { id: sessao.id, url: sessao.url, total: sessao.amount_total };
}

function mesmaAssinatura(a, b) {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i += 1) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

/** Confere a assinatura do webhook (Stripe-Signature) antes de liberar o pedido pago. */
export async function verificarAssinaturaStripe(payload, cabecalho) {
  const segredo = secrets.get("STRIPE_WEBHOOK_SECRET");
  if (!segredo || !cabecalho) return false;

  const partes = { t: [], v1: [] };
  for (const trecho of cabecalho.split(",")) {
    const [chave, valor] = trecho.split("=");
    if (partes[chave]) partes[chave].push(valor);
  }

  const timestamp = Number(partes.t[0]);
  if (!timestamp) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const assinatura = new Uint8Array(
    await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(`${timestamp}.${payload}`))
  );
  const esperado = Array.from(assinatura)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return partes.v1.some((valor) => mesmaAssinatura(valor || "", esperado));
}