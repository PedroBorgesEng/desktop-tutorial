import { secrets } from "base44:runtime";

// A conta do vendedor e os tokens ficam SOMENTE nos segredos do Base44.
const MP_API = "https://api.mercadopago.com";
export const LOJA_URL = "https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app";

export function configuracaoMercadoPago() {
  const token = secrets.get("MERCADOPAGO_ACCESS_TOKEN") || "";
  const assinatura = secrets.get("MERCADOPAGO_WEBHOOK_SECRET") || "";
  const liberacaoLive = secrets.get("MERCADOPAGO_LIVE_ENABLED") === "true";
  const tokenTeste = token.startsWith("TEST-");
  const habilitado = Boolean(token && assinatura && (tokenTeste || liberacaoLive));
  const live = habilitado && !tokenTeste && liberacaoLive;
  return {
    habilitado,
    live,
    modo: !habilitado ? "pendente" : live ? "producao" : "teste",
  };
}

function credenciais() {
  const config = configuracaoMercadoPago();
  if (!config.habilitado) {
    throw new Error("Pagamento por Pix e cartão aguardando configuração do Mercado Pago.");
  }
  return { config, token: secrets.get("MERCADOPAGO_ACCESS_TOKEN") };
}

async function apiMercadoPago(path, { method = "GET", body } = {}) {
  const { token } = credenciais();
  const res = await fetch(MP_API + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("Falha API Mercado Pago", res.status, path);
    throw new Error("Não foi possível comunicar com o Mercado Pago. Tente novamente.");
  }
  return data;
}

export async function criarPreferenciaMercadoPago(pedido, consultaToken) {
  const { config } = credenciais();
  const itens = (pedido.itens || []).map((item) => ({
    id: String(item.produto_id),
    title: String(item.nome).slice(0, 200),
    quantity: Number(item.quantidade),
    unit_price: Number(item.preco_unitario),
    currency_id: "BRL",
  }));
  if (Number(pedido.taxa_entrega) > 0) {
    itens.push({
      id: "taxa-entrega",
      title: "Entrega",
      quantity: 1,
      unit_price: Number(pedido.taxa_entrega),
      currency_id: "BRL",
    });
  }
  if (!itens.length) throw new Error("Carrinho vazio.");

  const retorno = LOJA_URL + "/pedido/" + encodeURIComponent(pedido.id) +
    "?session_id=" + encodeURIComponent(consultaToken);
  const body = {
    items: itens,
    external_reference: String(pedido.id),
    metadata: { pedido_id: String(pedido.id) },
    back_urls: {
      success: retorno + "&retorno=sucesso",
      pending: retorno + "&retorno=pendente",
      failure: retorno + "&retorno=falha",
    },
    auto_return: "approved",
    notification_url: LOJA_URL + "/api/mercadopago-webhook",
    statement_descriptor: "DOCE OFICIO",
    payment_methods: {
      excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
    },
  };
  // Pix e cartões são escolhidos no checkout hospedado do Mercado Pago.
  // A disponibilidade do Pix depende da conta do vendedor.
  const result = await apiMercadoPago("/checkout/preferences", { method: "POST", body });
  const url = config.live ? result.init_point : result.sandbox_init_point || result.init_point;
  if (!result.id || !url || !/^https:\/\/(?:www\.mercadopago\.com(?:\.br)?|sandbox\.mercadopago\.com(?:\.br)?)/.test(url)) {
    throw new Error("Mercado Pago não retornou um checkout válido.");
  }
  return { id: String(result.id), url, modo: config.modo };
}

function hex(bytes) {
  return Array.from(bytes).map(n => n.toString(16).padStart(2, "0")).join("");
}

function compararConstante(a, b) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i += 1) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function validarWebhookMercadoPago(id, cabecalho, requestId) {
  const secret = secrets.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!secret || !id || !cabecalho || !requestId) return false;
  const partes = Object.fromEntries(cabecalho.split(",").map(s => s.trim().split("=")));
  const ts = partes.ts;
  const assinatura = (partes.v1 || "").toLowerCase();
  if (!/^\d{10,16}$/.test(ts || "") || !/^[0-9a-f]{64}$/.test(assinatura)) return false;
  const ms = Number(ts) > 1e12 ? Number(ts) : Number(ts) * 1000;
  if (Math.abs(Date.now() - ms) > 10 * 60 * 1000) return false;
  const manifesto = "id:" + id.toLowerCase() + ";request-id:" + requestId + ";ts:" + ts + ";";
  const chave = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const assinaturaCalculada = hex(new Uint8Array(await crypto.subtle.sign(
    "HMAC", chave, new TextEncoder().encode(manifesto),
  )));
  return compararConstante(assinatura, assinaturaCalculada);
}

export async function consultarPagamentoMercadoPago(id) {
  if (!/^\d{4,30}$/.test(id)) throw new Error("Identificador de pagamento inválido.");
  return await apiMercadoPago("/v1/payments/" + encodeURIComponent(id));
}
