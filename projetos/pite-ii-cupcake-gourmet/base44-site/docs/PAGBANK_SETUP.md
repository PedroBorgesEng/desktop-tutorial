# Ativação segura de Pix e cartão — PagBank

**Versão: 16/11/2026 · Status: homologação; cobranças reais desativadas.**

O Checkout PagBank substitui o Checkout Pro Mercado Pago no carrinho. O PagBank hospeda a página de pagamento e apresenta Pix e cartão de crédito conforme a disponibilidade do estabelecimento. A loja não armazena número nem CVV do cartão.

## Segredos privados no Base44

No editor do site, configure os segredos em área própria **apenas após criar sua conta PagBank**. Nunca publique tokens em conversas, front-end, GitHub ou PDFs.

| Segredo | O que configurar | Etapa |
| --- | --- | --- |
| `PAGBANK_SANDBOX_TOKEN` | Token do Sandbox PagBank | Homologação |
| `PAGBANK_SANDBOX_WEBHOOK_PUBLIC_KEY` | Chave pública **X.509 Base64** para validar a assinatura ECDSA-SHA256 | Homologação |
| `PAGBANK_LIVE_TOKEN` | Token de produção da conta, após homologação | Apenas produção |
| `PAGBANK_LIVE_WEBHOOK_PUBLIC_KEY` | Chave pública de produção correspondente | Apenas produção |
| `PAGBANK_LIVE_ENABLED` | Valor exato `true` | **Somente após decisão explícita de ativar vendas** |

Para consultar a chave pública do webhook, siga a documentação oficial de validação da autenticidade e a função `type=webhook`. Confirme com o PagBank qual URL de consulta está habilitada no ambiente da conta.

**Com nenhum token PagBank configurado, `GET /api/checkout` informa `habilitado=false` e `POST /api/checkout` devolve 503 antes de criar um pedido.** Essa restrição é proposital.

O projeto não contém credenciais PagBank, nem ativa o ambiente live.

## Fluxo técnico

1. O cliente escolhe produtos e data de encomenda, informa entrega ou retirada e seleciona **Pix ou cartão**.
2. `POST /api/checkout` valida o pedido no servidor, recalcula os preços e, somente se o PagBank estiver configurado, solicita `POST /checkouts` com `payment_methods=[PIX,CREDIT_CARD]`.
3. O PagBank retorna `links[].rel=PAY`; a loja abre somente link HTTPS de domínio PagBank/PagSeguro reconhecido.
4. `POST /api/pagbank-webhook` recebe o **corpo bruto**; valida `x-payload-signature` com ECDSA-SHA256 antes do JSON.
5. O servidor consulta o Checkout ou Order na API do PagBank para confirmar status **PAID**, referência da compra, valor em centavos, moeda BRL e tipo de pagamento.
6. Só a verificação no servidor pode definir `pagamento_status=pago`. O simples redirecionamento do navegador não aprova compra.

As notificações são configuradas no payload da preferência: `notification_urls` e `payment_notification_urls` apontam para:

`https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app/api/pagbank-webhook`

## Verificações antes de usar com clientes reais

- Confirmar chave pública real e algoritmo de webhook com sua conta PagBank (a documentação de notificações possui versões distintas).
- Realizar pagamentos de teste de Pix (pendente/pago) e cartão (autorizado/recusado), confirmação por webhook, webhook inválido e repetido.
- Testar diferenças de valor e moeda, chargebacks, reembolsos, cancelamentos e expiração de checkout.
- **Corrigir a concorrência de estoque:** o sistema atual diminui estoque antes do pagamento e não realiza liberação automática de pedidos abandonados/expirados. Esse fluxo é de demonstração, não produção.
- Confirmar dados verdadeiros do fornecedor, fotos, preços, prazo, endereço, região de entrega, taxa, políticas de privacidade e atendimento.
- Solicitar a **homologação/liberação do Checkout junto ao PagBank** para produção.
- Revisar proteção de dados, avisos e conformidade da venda com as exigências aplicáveis.

## Endpoints

- `GET /api/checkout` — sinaliza `provedor: pagbank`, `modo: pendente|teste|producao` e disponibilidade de Pix/cartão.
- `POST /api/checkout` — início da compra; bloqueado sem as credenciais.
- `POST /api/pagbank-webhook` — recebe e verifica notificações.
- `POST /api/pedidos` — rota legada desabilitada (`410 Gone`).

As integrações Mercado Pago e Stripe anteriores ficam no código para pedidos antigos em homologação, mas **não são utilizadas pelo novo carrinho**.

## Documentação oficial

- https://developer.pagbank.com.br/docs/checkout
- https://developer.pagbank.com.br/reference/criar-checkout
- https://developer.pagbank.com.br/reference/objeto-checkout
- https://developer.pagbank.com.br/reference/consultar-checkout
- https://developer.pagbank.com.br/reference/validacao-de-autenticidade
- https://developer.pagbank.com.br/reference/webhooks-checkout

**A integração foi preparada para homologação. Não há conexão financeira real nem testes completos com credenciais do proprietário.**
