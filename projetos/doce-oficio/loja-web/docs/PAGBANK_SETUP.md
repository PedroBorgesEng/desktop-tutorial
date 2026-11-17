# Ativação segura de Pix e cartão — PagBank

**Revisão de segurança: 17/11/2026 · Status: testes automatizados concluídos; homologação externa e produção pendentes. Cobranças reais desativadas.**

O Checkout PagBank substitui o Checkout Pro Mercado Pago no carrinho. O PagBank hospeda a página de pagamento e apresenta Pix e cartão de crédito conforme a disponibilidade do estabelecimento. A loja não armazena número nem CVV do cartão.

## Origem correta do token — produção versus Sandbox

**Importante:** O token gerado em **PagBank → Vendas → Integrações → Gerar Token** é de **PRODUÇÃO** e usa autenticação `Authorization: Bearer <token>` na API atual de Checkout. Não é um token de testes. A conta também pode precisar de homologação/liberação antes de usar `POST /checkouts` em produção.

O proprietário já compartilhou um token de produção em uma conversa. **Considere esse token exposto: revogue e gere outro no PagBank antes de utilizá-lo.** Não copie o token antigo para o Base44, nem no Sandbox, nem no código. O e-mail da conta não é necessário para autenticação da API moderna de Checkout.

Para testar sem cobranças reais:
1. Acesse [PagBank Developers](https://portaldev.pagbank.com.br/) e, na aba **Tokens**, obtenha o token **Sandbox**. Um token gerado em Vendas → Integrações não substitui este.
2. No editor Base44 da loja, cadastre o token Sandbox **somente** em `PAGBANK_SANDBOX_TOKEN`.
3. Consulte a chave pública específica para validação de notificações **com `type=webhook`**, utilizando o token Sandbox pelo endpoint documentado em [Validação de autenticidade](https://developer.pagbank.com.br/reference/validacao-de-autenticidade). Guarde o valor de `public_key` (Base64 X.509) como `PAGBANK_SANDBOX_WEBHOOK_PUBLIC_KEY` em Secrets.
4. Verifique `GET /api/checkout`: `provedor=pagbank`, `modo=teste`, `habilitado=true` significam apenas que as variáveis exigidas existem, **não** que o PagBank confirmou credenciais, webhook ou a habilitação do método Pix.
5. Entre na loja como **administrador autenticado** para testes Sandbox; visitantes não podem criar checkouts de demonstração.
6. Teste o checkout Pix/cartão, recusa, pagamento pendente e eventos assinados antes de qualquer produção.

**Bloqueio em duas camadas:** além de exigir `PAGBANK_LIVE_ENABLED=true` e credenciais de produção, o código contém `LIVE_RELEASE_APPROVED=false`, que impede **qualquer ativação real nesta versão**. A remoção dessa trava exige uma revisão futura específica de lançamento, com correções de estoque, expiração, pagamentos e homologação da conta. Inserir tokens de produção sozinho não liberará cobranças.

O PagBank usa `Authorization: Bearer <token>` na API atual de Checkout, mesmo que o token tenha sido gerado no menu de produção. Isso não autoriza misturar token live com endpoint Sandbox.

Referências oficiais:
- [Token de autenticação](https://developer.pagbank.com.br/docs/token-de-autenticacao)
- [Criar Checkout](https://developer.pagbank.com.br/reference/criar-checkout)
- [Validação de autenticidade dos webhooks](https://developer.pagbank.com.br/reference/validacao-de-autenticidade)
- [Crie sua conta e homologação](https://developer.pagbank.com.br/docs/crie-sua-conta-pagbank)

## Revisão técnica 17/11/2026

- Em 17/11/2026 foram identificados **dois nomes de segredo Sandbox** no Base44: `PAGBANK_SANDBOX_TOKEN` e `PAGBANK_SANDBOX_WEBHOOK_PUBLIC_KEY`. Isso não valida os valores, a origem das credenciais nem a conexão com a API. Credenciais anteriormente divulgadas em conversa devem ser substituídas.
- A interface do pedido consulta a confirmação assinada pelo back-end durante aproximadamente um minuto e oferece botão **Atualizar situação do pagamento**. O retorno ao site nunca confirma um pagamento por si só.
- A documentação oficial distingue eventos transacionais `PAID`, `WAITING`, `IN_ANALYSIS` e `DECLINED` e o evento de checkout `EXPIRED`. O webhook atual só considera `PAID` após verificar assinatura e consultar o Order. **Cancelamento por expiração, liberação de estoque e concorrência ainda não estão homologados**.
- Os segredos Sandbox estão cadastrados, mas **não foi realizada cobrança de teste ponta a ponta com o PagBank**. Não executar tentativas com token de produção exposto.
- **A trava de produção `LIVE_RELEASE_APPROVED=false` permanece ativa** e não foi alterada.

Referências: https://developer.pagbank.com.br/reference/webhooks-checkout e https://developer.pagbank.com.br/reference/validacao-de-autenticidade

## Auditoria de segurança e estoque — 17/11/2026

### Correções implementadas
- A nova versão `ledger_v2` registra uma reserva com validade e **não diminui fisicamente o campo de estoque antes do pagamento**; reservas expiradas deixam de contar no saldo, sem devoluções duplicadas.
- O catálogo mostra saldo calculado por capacidade menos pedidos pendentes válidos e pagos. A interface administrativa informa a **capacidade bruta** do lote.
- A lista de reservas tem limite de consulta com **falha fechada**: se a consulta trouxer dados truncados, a loja recusa novas encomendas em vez de supor estoque disponível.
- Após criar a reserva, o checkout refaz uma verificação de saldo, reduzindo disputas simples. **Isso não é uma operação atômica.**
- **Sandbox restrito a administrador autenticado:** GET sinaliza indisponível para visitantes e POST recusa visitantes com 403, evitando pedidos demonstrativos abusivos que ocupem o lote. Em produção futura essa restrição especial não se aplica, mas rate limiting e anti-bot são obrigatórios.
- Em erro antes de criar checkout remoto, o pedido provisório é cancelado sem restauração indevida de estoque.
- Se o checkout remoto for criado mas a persistência local falhar, a ocorrência é registrada para conciliação, sem cancelar silenciosamente o pedido que ainda poderia ser pago.
- Webhook de checkout expirado pode cancelar pedido pendente quando o PagBank confirma a expiração e não retorna pedidos vinculados. Um pagamento tardio efetivamente capturado pode reabrir pedido cancelado para revisão.
- Confirmação de pagamento é extraída para regra pura testada com valores divergentes, moeda incorreta, transações recusadas e IDs divergentes.
- **Defeito de assinatura corrigido:** a leitura do comprimento DER usava o índice anterior ao byte de comprimento, invalidando assinaturas ECDSA legítimas. Testes com chaves P-256 reais agora aprovam assinaturas válidas e rejeitam payload adulterado.
- Painel administrativo deixa de permitir avançar pedido PagBank não pago ou cancelá-lo sem inativação/estorno e conciliação no provedor.

### Evidências executadas
- `node --test tests/pagbank-*.test.mjs`: **17 testes aprovados** (cálculo do estoque, confirmações e assinatura criptográfica).
- `npm run build`: aprovado.
- `npm run lint`: aprovado.
- **Não foi testado** neste ciclo: chamada autenticada à API PagBank com a conta do comerciante, Pix/cartão reais no Sandbox, assinatura real do webhook e homologação de produção.

### Bloqueadores obrigatórios para a produção
1. **Concorrência:** implantar reserva de estoque transacional/atômica e testes de duas compras simultâneas da última unidade. O controle atual é deliberadamente incompleto.
2. **Reembolso, cancelamento e reconciliação:** criar processo confiável e idempotente para inativar checkout remoto, reembolso/estorno, chargeback, pedidos com pagamento posterior ao prazo, falha de persistência e atualização de capacidade após cancelamentos.
3. **Provedor:** provar que token e chave pública Sandbox pertencem ao mesmo ambiente; validar Pix pendente/pago, cartão aprovado/recusado/em análise, webhook original/duplicado/inválido, expiração e consulta de Order. Verificar rotação de chave.
4. **Segurança operacional:** antiautomação/reCAPTCHA, rate limiting persistente, observabilidade/alertas sem segredos, política de atendimento, dados comerciais reais, privacidade/LGPD e gestão de acesso ao painel.
5. **Aprovação externa:** enviar evidências de request/response sem credenciais para a homologação obrigatória e obter autorização do PagBank para o Checkout de produção. Conferir a ativação/allowlist da API de produção.
6. **Segredos:** revogar os tokens exibidos anteriormente em conversa; usar novos tokens separados por ambiente; nunca publicá-los no repositório.
7. **Lançamento:** somente com todos os itens anteriores validados, obter autorização explícita de ativação, cadastrar `PAGBANK_LIVE_TOKEN`, `PAGBANK_LIVE_WEBHOOK_PUBLIC_KEY`, configurar `PAGBANK_LIVE_ENABLED=true` e alterar `LIVE_RELEASE_APPROVED=false` mediante revisão auditada.

**Decisão atual: NÃO liberar cobranças reais.**

Documentação oficial: https://developer.pagbank.com.br/docs/solicitar-homologacao e https://developer.pagbank.com.br/reference/validacao-de-autenticidade

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

**Sem os segredos do ambiente selecionado, `GET /api/checkout` informa `habilitado=false` e `POST /api/checkout` devolve 503 antes de criar um pedido.** A presença dos segredos Sandbox habilita somente testes e não garante autenticação válida perante o PagBank.

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
- **Corrigir concorrência de estoque (bloqueador):** novos pedidos `ledger_v2` não alteram diretamente `Produto.estoque` antes do pagamento. O saldo considera pedidos pagos e reservas pendentes com expiração. Pedidos antigos permanecem no modelo legado. Contudo, a reserva ainda NÃO é atômica: duas requisições simultâneas podem comprometer a última unidade. É obrigatório implementar reserva transacional/compare-and-swap no backend e testar concorrência antes de qualquer venda real.
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

**A integração permanece em homologação. Há segredos Sandbox configurados e 17 testes automatizados aprovados, mas nenhuma validação ponta a ponta com a conta PagBank foi comprovada. Vendas reais continuam bloqueadas pelo código.**

## Compra fictícia para apresentação acadêmica

O site agora oferece o botão **Simular compra — sem pagamento**, com escolha entre Pix fictício e cartão fictício. O resumo é gerado localmente, identificado por `SIM-...`, sem transação PagBank, sem pedido no banco e sem reserva/baixa de estoque. O recurso é público apenas para demonstração didática e **NÃO representa homologação da API PagBank** nem pagamento Sandbox autenticado. Para comprovação da homologação, é indispensável executar requisições reais em Sandbox e guardar os respectivos requests/responses mascarados.

A interface de demonstração passou em mais 3 testes, totalizando **20 testes automatizados aprovados** no projeto; `npm run build` e `npm run lint` também aprovados.
