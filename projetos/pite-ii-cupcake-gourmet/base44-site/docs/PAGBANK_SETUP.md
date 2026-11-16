# Ativação segura de Pix e cartão — PagBank

**Versão: 16/11/2026 · Status: homologação; cobranças reais desativadas.**

O Checkout PagBank substitui o Checkout Pro Mercado Pago no carrinho. O PagBank hospeda a página de pagamento e apresenta Pix e cartão de crédito conforme a disponibilidade do estabelecimento. A loja não armazena número nem CVV do cartão.

## Origem correta do token — produção versus Sandbox

**Importante:** O token gerado em **PagBank → Vendas → Integrações → Gerar Token** é de **PRODUÇÃO** e usa autenticação `Authorization: Bearer <token>` na API atual de Checkout. Não é um token de testes. A conta também pode precisar de homologação/liberação antes de usar `POST /checkouts` em produção.

O proprietário já compartilhou um token de produção em uma conversa. **Considere esse token exposto: revogue e gere outro no PagBank antes de utilizá-lo.** Não copie o token antigo para o Base44, nem no Sandbox, nem no código. O e-mail da conta não é necessário para autenticação da API moderna de Checkout.

Para testar sem cobranças reais:
1. Acesse [PagBank Developers](https://portaldev.pagbank.com.br/) e, na aba **Tokens**, obtenha o token **Sandbox**. Um token gerado em Vendas → Integrações não substitui este.
2. No editor Base44 da loja, cadastre o token Sandbox **somente** em `PAGBANK_SANDBOX_TOKEN`.
3. Consulte a chave pública específica para validação de notificações **com `type=webhook`**, utilizando o token Sandbox pelo endpoint documentado em [Validação de autenticidade](https://developer.pagbank.com.br/reference/validacao-de-autenticidade). Guarde o valor de `public_key` (Base64 X.509) como `PAGBANK_SANDBOX_WEBHOOK_PUBLIC_KEY` em Secrets.
4. Verifique `GET /api/checkout`: `provedor=pagbank`, `modo=teste`, `habilitado=true` significam apenas que as variáveis exigidas existem, **não** que o PagBank confirmou credenciais, webhook ou a habilitação do método Pix.
5. Teste o checkout Pix/cartão, recusa, pagamento pendente e eventos assinados antes de qualquer produção.

**Bloqueio em duas camadas:** além de exigir `PAGBANK_LIVE_ENABLED=true` e credenciais de produção, o código contém `LIVE_RELEASE_APPROVED=false`, que impede **qualquer ativação real nesta versão**. A remoção dessa trava exige uma revisão futura específica de lançamento, com correções de estoque, expiração, pagamentos e homologação da conta. Inserir tokens de produção sozinho não liberará cobranças.

O PagBank usa `Authorization: Bearer <token>` na API atual de Checkout, mesmo que o token tenha sido gerado no menu de produção. Isso não autoriza misturar token live com endpoint Sandbox.

Referências oficiais:
- [Token de autenticação](https://developer.pagbank.com.br/docs/token-de-autenticacao)
- [Criar Checkout](https://developer.pagbank.com.br/reference/criar-checkout)
- [Validação de autenticidade dos webhooks](https://developer.pagbank.com.br/reference/validacao-de-autenticidade)
- [Crie sua conta e homologação](https://developer.pagbank.com.br/docs/crie-sua-conta-pagbank)

## Segredos privados no Base44

No editor do site, configure os segredos em área própria **apenas após criar sua conta PagBank**. Nunca publique tokens em conversas, front-end, GitHub ou PDFs.

| Segredo | O que configurar | Etapa |
| --- | --- | --- |
| `PAGBANK_SANDBOX_TOKEN` | Token do Sandbox PagBank | Homologação |
| `PAGBANK_SANDBOX_WEBHOOK_PUBLIC_KEY` | Chave pública **X.509 Base64** para validar a assinatura ECDSA-SHA256 | Homologação |
| `PAGBANK_LIVE_TOKEN` | Token de produção da conta, após homologação | Apenas produção |
| `PAGBANK_LIVE_WEBHOOK_PUBLIC_KEY` | Chave pública de produção correspondente | Apenas produção |
| `PAGBANK_LIVE_ENABLED` | Valor exato `true`, **não suficiente nesta versão** por causa da trava no código | Somente após homologação e decisão explícita |

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
