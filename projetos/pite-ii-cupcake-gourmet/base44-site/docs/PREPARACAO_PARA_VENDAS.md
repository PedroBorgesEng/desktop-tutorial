# Doce Ofício — Pix e cartão / Mercado Pago

**Estado atual (16/11/2026): integração de código preparada, cobrança real desabilitada.**

O antigo checkout com Stripe sandbox foi substituído na interface pela opção **Mercado Pago Checkout Pro**, que permite selecionar **Pix ou cartão no ambiente do Mercado Pago**, conforme a conta do vendedor e seus meios de pagamento habilitados.

## 1. Conectar a conta comercial

1. Criar ou acessar sua conta oficial Mercado Pago.
2. Em **Mercado Pago Developers > Suas integrações**, criar uma aplicação de pagamentos online e obter credenciais de **teste**.
3. No **Base44 > Configurações > Segredos**, cadastrar **sem compartilhar no GitHub ou chat**:
   - `MERCADOPAGO_ACCESS_TOKEN` — access token do vendedor, usado pelo servidor.
   - `MERCADOPAGO_WEBHOOK_SECRET` — assinatura secreta das notificações.
4. No Mercado Pago, configurar a notificação `payment` para:
   `https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app/api/mercadopago-webhook`
5. Conferir que Pix está habilitado (a conta pode exigir uma chave Pix) e que cartões estão disponíveis.
6. Para ativar vendas reais **somente depois da homologação, identidade comercial verificada e testes**, usar o access token de produção e o segredo `MERCADOPAGO_LIVE_ENABLED` com valor exato `true`.

**Não inserir tokens em repositórios, imagens, documentos, conversas ou códigos de front-end.**

## 2. Arquitetura implementada

- `GET /api/checkout`: informa apenas se checkout está habilitado e se é teste ou produção.
- `POST /api/checkout`: valida o carrinho no servidor, calcula valores, cria pedido provisório e preferência Checkout Pro.
- `src/lib/mercadopago.server.js`: comunicação com a API, abertura de preferências e validação HMAC da assinatura.
- `POST /api/mercadopago-webhook`: valida a assinatura, consulta o pagamento na API do Mercado Pago e confirma somente valor, moeda, referência e estado compatíveis.
- `src/lib/server-fns.js`: consulta de pedido com token aleatório; bloqueia a função legada de criação de reservas.
- `base44/entities/Pedido.jsonc`: campos `pagamento_gateway`, `mercadopago_preference_id`, `mercadopago_payment_id`, `consulta_token`.
- A interface não captura números de cartão, CVV nem senha da conta Mercado Pago.

## 3. Testes a realizar antes de abrir ao público

- Comprar com cartão em modo de testes, conferir retorno e webhook.
- Pagar por Pix em teste onde o provedor permitir, confirmar status pendente e depois pago.
- Rejeitar pagamento de valor divergente, moeda diferente, referência incorreta e assinatura inválida.
- Garantir que um webhook repetido não duplique estoque, cobrança ou estado.
- Simular checkout abandonado e expirado; restaurar/reservar estoque corretamente.
- Testar clientes simultâneos comprando a última unidade (estoque transacional).
- Testar cancelamentos, estornos, chargebacks e atualização do pedido.
- Validar política de privacidade, dados da empresa, regiões e taxas de entrega e informações de contato.

## 4. Bloqueio de segurança atual

Sem access token + secret de webhook cadastrados, a tela do carrinho informa **pagamento aguardando ativação**, o botão fica desativado e o servidor retorna **503** antes de criar qualquer pedido.

Credenciais de **produção** somente habilitam checkout quando também existir o segredo `MERCADOPAGO_LIVE_ENABLED=true`. O aplicativo ainda **não está homologado para vendas comerciais**.

Os arquivos `stripe.server.js` e `stripe-webhook.js` permanecem apenas para compatibilidade com antigos pedidos de teste; não são chamados pelo novo carrinho. O webhook antigo rejeita pedidos do Mercado Pago.

## 5. Observações comerciais

Fotos, descrições, disponibilidade, preço, área de entrega, tarifa, horários, dados do fornecedor e políticas exibidas ainda exigem revisão pelo proprietário. O estoque atual não implementa bloqueio transacional robusto nem liberação automática de reservas não pagas. **Não ativar pagamentos reais antes da correção e validação desses fluxos.**

Fontes oficiais:
- https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/create-payment-preference
- https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications
