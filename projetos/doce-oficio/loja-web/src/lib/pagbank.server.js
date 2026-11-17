import { secrets } from "base44:runtime";
import { validarAssinaturaECDSA } from "@/lib/pagbank-assinatura";

/**
 * Checkout PagBank hospedado. Nenhum dado de cartão é capturado aqui.
 * Chaves de teste e produção são distintas; a produção só é permitida
 * após flag explícita + credenciais de produção instaladas pelo proprietário.
 */
const SITE = "https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app";
const SANDBOX_API = "https://sandbox.api.pagseguro.com";
const LIVE_API = "https://api.pagseguro.com";
const WEBHOOK_URL = SITE + "/api/pagbank-webhook";

// Trava de segurança de publicação: vendas reais só poderão ser ativadas
// após testes ponta a ponta, correção de estoque/expiração e homologação
// comercial do PagBank. Não remover sem uma revisão explícita de lançamento.
const LIVE_RELEASE_APPROVED = false;

export function statusPagBank() {
  const liveRequested = secrets.get("PAGBANK_LIVE_ENABLED") === "true";
  const tokenTest = secrets.get("PAGBANK_SANDBOX_TOKEN") || "";
  const publicTest = secrets.get("PAGBANK_SANDBOX_WEBHOOK_PUBLIC_KEY") || "";
  const tokenLive = secrets.get("PAGBANK_LIVE_TOKEN") || "";
  const publicLive = secrets.get("PAGBANK_LIVE_WEBHOOK_PUBLIC_KEY") || "";
  // Não permitir queda automática de produção para testes.
  const enabled = liveRequested
    ? Boolean(LIVE_RELEASE_APPROVED && tokenLive && publicLive)
    : Boolean(tokenTest && publicTest);
  return {
    enabled,
    mode: !enabled ? "pendente" : liveRequested ? "producao" : "teste",
    live: enabled && liveRequested,
  };
}

function credenciais() {
  const state = statusPagBank();
  if (!state.enabled) throw new Error("O checkout PagBank ainda não foi configurado.");
  const live = state.live;
  return {
    state,
    token: secrets.get(live ? "PAGBANK_LIVE_TOKEN" : "PAGBANK_SANDBOX_TOKEN"),
    publicKey: secrets.get(live ? "PAGBANK_LIVE_WEBHOOK_PUBLIC_KEY" : "PAGBANK_SANDBOX_WEBHOOK_PUBLIC_KEY"),
    api: live ? LIVE_API : SANDBOX_API,
  };
}

async function pagbankFetch(path, init = {}) {
  const { api, token } = credenciais();
  if (!/^\/(?:checkouts|orders)\/?[A-Za-z0-9/_-]*$/.test(path)) throw new Error("Rota PagBank inválida.");
  const response = await fetch(api + path, {
    ...init,
    signal: AbortSignal.timeout(12000),
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  let payload = null;
  try { payload = await response.json(); } catch { /* PagBank não retornou JSON */ }
  if (!response.ok) {
    console.error("PagBank API falhou:", response.status, path);
    throw new Error("Não foi possível consultar o PagBank neste momento.");
  }
  return payload;
}

export function gerarPayloadCheckoutPagBank(pedido, consultaToken) {
  const items = (pedido.itens || []).map(item => ({
    reference_id: String(item.produto_id).slice(0, 100),
    name: String(item.nome).slice(0, 100),
    quantity: Number(item.quantidade),
    unit_amount: Math.round(Number(item.preco_unitario) * 100),
  }));
  if (!items.length || items.some(item => !Number.isInteger(item.unit_amount) || item.unit_amount <= 0 ||
      !Number.isInteger(item.quantity) || item.quantity < 1)) {
    throw new Error("O pedido possui itens inválidos.");
  }
  const delivery = Math.round(Number(pedido.taxa_entrega || 0) * 100);
  const calculated = items.reduce((total, item) => total + item.unit_amount * item.quantity, delivery);
  if (calculated !== Math.round(Number(pedido.total) * 100)) {
    throw new Error("O valor final do pedido não confere.");
  }
  const returnUrl = SITE + "/pedido/" + encodeURIComponent(pedido.id) +
    "?session_id=" + encodeURIComponent(consultaToken);
  return {
    reference_id: String(pedido.id).slice(0, 64),
    items,
    additional_amount: delivery,
    payment_methods: [{ type: "PIX" }, { type: "CREDIT_CARD" }],
    customer_modifiable: true,
    redirect_url: returnUrl,
    return_url: SITE + "/carrinho",
    notification_urls: [WEBHOOK_URL],
    payment_notification_urls: [WEBHOOK_URL],
    soft_descriptor: "DOCE OFICIO",
  };
}

export async function criarCheckoutPagBank(pedido, consultaToken) {
  const data = await pagbankFetch("/checkouts", {
    method: "POST",
    body: JSON.stringify(gerarPayloadCheckoutPagBank(pedido, consultaToken)),
  });
  const payLink = (data?.links || []).find(link => link.rel === "PAY" && link.method === "GET")?.href;
  let parsed;
  try { parsed = new URL(payLink); } catch { /* inválido */ }
  const trusted = parsed?.protocol === "https:" &&
    /(^|\.)((pagbank\.com\.br)|(pagseguro\.uol\.com\.br))$/.test(parsed.hostname);
  if (!data?.id || !/^CHEC_[A-Za-z0-9-]+$/.test(data.id) || !trusted) {
    throw new Error("O PagBank não retornou um link seguro de pagamento.");
  }
  // O Checkout PagBank expira por padrão em duas horas. Se a resposta
  // informar a expiração, ela é a autoridade para a reserva local.
  const remoteExpires = Date.parse(String(data.expiration_date || ""));
  const expirationDate = Number.isFinite(remoteExpires)
    ? new Date(remoteExpires).toISOString()
    : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  return { id: data.id, url: parsed.toString(), mode: statusPagBank().mode, expirationDate };
}

/**
 * O PagBank atual usa assinatura ECDSA SHA256 no cabeçalho x-payload-signature
 * e chave pública X.509 (Base64). WebCrypto espera r||s; convertemos a
 * assinatura ASN.1 DER recebida para P1363.
 */
export async function validarAssinaturaPagBank(rawBody, signatures) {
  const { publicKey } = credenciais();
  return validarAssinaturaECDSA(rawBody, signatures, publicKey);
}

export async function consultarCheckoutPagBank(checkoutId) {
  if (!/^CHEC_[A-Za-z0-9-]{5,100}$/.test(checkoutId)) {
    throw new Error("Identificador de checkout inválido.");
  }
  return pagbankFetch("/checkouts/" + checkoutId);
}

export async function consultarPedidoPagBank(orderId) {
  if (!/^ORDE_[A-Za-z0-9-]{5,100}$/.test(orderId)) {
    throw new Error("Identificador PagBank inválido.");
  }
  return pagbankFetch("/orders/" + orderId);
}
