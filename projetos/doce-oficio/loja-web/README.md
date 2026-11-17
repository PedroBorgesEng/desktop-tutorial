# Doce Ofício — Pix e cartão no Checkout PagBank

**Loja:** https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app

**Estado:** versão de homologação. Nenhuma cobrança real ativada.

## Tecnologias

- React, TanStack Start, CSS e JavaScript
- Back-end com funções servidor e rotas HTTP
- Persistência e autenticação por entidades Base44
- Checkout PagBank hospedado (Pix + cartão de crédito) — integração preparada

## Rotas e arquivos

- `GET /api/checkout`: retorna disponibilidade e ambiente PagBank.
- `POST /api/checkout`: cria pedido provisório e checkout, **bloqueado com 503 sem credenciais**.
- `POST /api/pagbank-webhook`: valida assinatura do corpo bruto com ECDSA SHA256, confirma Order com a API, verifica valor e referência, atualiza status.
- `src/lib/pagbank.server.js`: integração PagBank e escolha explícita do ambiente.
- `src/lib/pagbank-assinatura.js`: validação criptográfica ECDSA DER, testada.
- `src/lib/pagbank-regras.js`: regra pura de confirmação de pagamento (referência/BRL/valor).
- `src/lib/estoque-ledger.server.js`: cálculo de reservas pendentes e pagas sem baixa prematura de estoque.
- `src/lib/reservas.server.js`: preços e validações de estoque/prazo no servidor.
- `base44/entities/Pedido.jsonc`: campos de acompanhamento de pagamentos.
- `src/routes/_site/`: catálogo, carrinho e pedido.
- `src/routes/_authed/admin/`: painel administrativo.

## Requisitos para testes e implantação

Leia [docs/PAGBANK_SETUP.md](docs/PAGBANK_SETUP.md). Tokens e chave pública do webhook devem ser inseridos **somente nos segredos do Base44**, nunca no GitHub.

- Teste: `PAGBANK_SANDBOX_TOKEN` e `PAGBANK_SANDBOX_WEBHOOK_PUBLIC_KEY`.
- Produção: `PAGBANK_LIVE_TOKEN`, `PAGBANK_LIVE_WEBHOOK_PUBLIC_KEY` e `PAGBANK_LIVE_ENABLED=true` ainda não habilitam pagamentos, pois `LIVE_RELEASE_APPROVED=false`. Essa trava só poderá ser revista após homologação, correção da concorrência e autorização explícita do proprietário.
- Sem credenciais, a loja permanece pública para ver produtos, mas **não aceita pedidos nem pagamentos**.

**Importante:** novos pedidos usam `ledger_v2`, que não desconta estoque antes do pagamento e libera reservas expiradas do cálculo. Ainda falta reserva transacional para impedir concorrência sobre a última unidade; estornos/cancelamentos, testes ponta a ponta, mitigação de bots e homologação obrigatória também estão pendentes. **Não usar para cobrança real.**

**Verificações executadas:** `node --test tests/pagbank-*.test.mjs` (17/17 aprovados), `npm run build` e `npm run lint` (aprovados). Não houve teste autenticado com a conta PagBank. O app preserva arquivos de integrações anteriores Mercado Pago e Stripe para histórico/legado, mas o carrinho usa o PagBank.

## GitHub

A publicação entre Base44 e GitHub é **manual**. O código espelhado fica em `projetos/doce-oficio/loja-web/` do repositório PedroBorgesEng/desktop-tutorial.

## Referências técnicas oficiais

- https://developer.pagbank.com.br/docs/checkout
- https://developer.pagbank.com.br/reference/criar-checkout
- https://developer.pagbank.com.br/reference/webhooks-checkout
- https://developer.pagbank.com.br/reference/validacao-de-autenticidade

Não são armazenados segredos nem dados pessoais no repositório.
