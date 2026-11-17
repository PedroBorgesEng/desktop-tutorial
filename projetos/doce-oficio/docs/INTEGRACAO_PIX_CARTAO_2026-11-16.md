# Preparação do Checkout Pro — Pix e cartão

Data: **16/11/2026** · Aplicação: Doce Ofício / Cupcake Gourmet.

## Funcionalidades adicionadas

- **GET /api/checkout**: status público dos meios de pagamento, sem credenciais.
- **POST /api/checkout**: recusa 503 se conta não configurada, valida o carrinho, calcula preços e abre preferência Mercado Pago.
- **POST /api/mercadopago-webhook**: valida HMAC assinado do provedor, consulta a API de pagamento e confere valor total, moeda e pedido antes de marcar como pago.
- **src/lib/server-fns.js**: desativa criação legada sem checkout e autoriza consulta de recibos com token aleatório.
- **Interface**: apresenta Pix/cartão, aviso de homologação e botão indisponível sem conta.
- **Modelos**: campos de gateway, preferência, ID do pagamento e token de consulta na entidade Pedido.
- **Migração**: webhook Stripe legado não pode atualizar pedido Mercado Pago.

## Situação de testes

A pré-visualização do Base44 compilou; a aplicação está publicada com o checkout **desativado por ausência de credenciais**. Isso não demonstra uma operação financeira completa. Os testes do provedor precisam ser executados com uma conta de testes real e depois em produção controlada. Ainda faltam testes ponta a ponta, simultaneidade de estoque, cancelamentos e reembolsos.

## Etapas do proprietário

1. Criar/vincular conta Mercado Pago e disponibilizar meios Pix e cartão.
2. Configurar tokens **somente nos segredos do Base44**, nunca no GitHub.
3. Configurar notificação HTTPS para `https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app/api/mercadopago-webhook`.
4. Testar em ambiente de homologação pagamentos Pix pendentes e confirmados, cartão aprovado/recusado, notificações repetidas e divergência de valores.
5. Corrigir concorrência de estoque e liberação automática de reservas não pagas; configurar devoluções, políticas legais, preços e dados reais.
6. Após validação e ativação bancária, cadastrar chaves live + `MERCADOPAGO_LIVE_ENABLED=true`.

Sem esses requisitos, **não abrir a loja para cobranças reais**.

## Fontes técnicas

- https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/create-payment-preference
- https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
