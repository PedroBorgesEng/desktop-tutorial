# Doce Ofício — versão Base44 (Pix e cartão)

**Versão publicada em 16/11/2026:** https://cupcake-gourmet-pite-ii-6e0cb87a.base44.app

## Estado atual

- Integração **Mercado Pago Checkout Pro** preparada para Pix e cartão;
- Cobranças e criação de novos pedidos bloqueadas enquanto não houver conta Mercado Pago configurada;
- Checkout hospedado no Mercado Pago, sem captura de dados de cartão pelo site;
- Processamento de valores e validação de pedidos no servidor;
- Webhook autenticado que consulta o pagamento diretamente no provedor;
- Catálogo, carrinho, estoque e prazo mínimo para encomendas;
- Alertas de homologação e remoção de contatos/endereço de demonstração;
- Integração Stripe anterior mantida apenas como legado para pedidos anteriores de teste.

## Ambiente

Front-end em React/TanStack Start e backend JavaScript com Base44 (entidades Produto, Pedido e User). Código-fonte nos diretórios `src/` e `base44/`.

A integração Mercado Pago exige credenciais de sua conta configuradas como **segredos privados** do Base44: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` e, apenas depois de completa homologação, `MERCADOPAGO_LIVE_ENABLED=true`.

**Nenhum token ou dado de cliente foi incluído neste repositório.** As alterações no Base44 precisam ser sincronizadas manualmente com o GitHub.

## Documentação

- [Preparação para vendas](./docs/PREPARACAO_PARA_VENDAS.md).
- [Plano de implantação Pix e cartão](../docs/INTEGRACAO_PIX_CARTAO_2026-11-16.md).
- [Código da implementação alternativa em Python](../README.md).
- [Relatório acadêmico em PDF](../docs/Documentacao_Versao_Base44_Situacao_2.pdf) — descreve versão anterior e não substitui os testes comerciais.

## Limitações para produção

Ainda não foram homologados pagamentos reais, confirmação/expiração de Pix, reembolsos, concorrência de estoque e recuperação de carrinhos abandonados. A operação depende de fotos e preços reais, dados do estabelecimento, políticas comerciais e validação jurídica/fiscal.
